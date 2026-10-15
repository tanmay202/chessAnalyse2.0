import os
import math
import chess
import chess.engine
from typing import Dict, List, Optional, Callable, Any, Tuple

from src.utils.config import config
from src.utils.logging_config import logger
from src.review.models import (
    MoveClassification, MoveAnalysis, PlayerStats,
    GameReviewResult, CLASSIFICATION_META
)
from src.review.accuracy import (
    score_to_win_prob, calculate_move_accuracy,
    calculate_game_accuracy, estimate_performance_rating
)
from src.review.openings import opening_book
from src.review.coach import generate_commentary
from src.review.pgn_parser import parse_pgn

PIECE_VALUES = {
    chess.PAWN: 1,
    chess.KNIGHT: 3,
    chess.BISHOP: 3,
    chess.ROOK: 5,
    chess.QUEEN: 9,
    chess.KING: 0,
}


class StockfishGameReviewer:
    """
    Complete Chess.com-style Game Review engine using Stockfish.
    Analyzes full games move-by-move, assigns badges, calculates CAPS2 accuracy,
    identifies openings, generates coach commentary, and records key moments.
    """

    def __init__(self, stockfish_path: Optional[str] = None):
        self.stockfish_path = stockfish_path or config.stockfish_path
        self.engine: Optional[chess.engine.SimpleEngine] = None
        self.is_running = False
        import threading
        self._lock = threading.Lock()

    def start(self):
        if self.engine is not None and self.is_running:
            try:
                if self.engine.transport and self.engine.transport.get_returncode() is None:
                    return
            except Exception:
                pass
            self.stop()

        if not self.is_running or self.engine is None:
            if not os.path.exists(self.stockfish_path):
                raise FileNotFoundError(f"Stockfish not found at {self.stockfish_path}")
            self.engine = chess.engine.SimpleEngine.popen_uci(self.stockfish_path)
            self.engine.configure({
                "Threads": max(1, config.engine_threads),
                "Hash": max(16, config.engine_hash),
            })
            self.is_running = True
            logger.info("Stockfish engine started for Game Review.")

    def stop(self):
        if self.engine is not None and self.is_running:
            try:
                self.engine.quit()
            except Exception:
                pass
            self.engine = None
            self.is_running = False
            logger.info("Stockfish engine stopped.")

    def _eval_to_pawn_score(self, score_obj: chess.engine.Score, pov_white: bool = True) -> Tuple[float, Optional[int]]:
        """Converts chess.engine.Score to (pawns, mate) from requested POV."""
        pov = chess.WHITE if pov_white else chess.BLACK
        pov_score = score_obj.pov(pov)
        mate = pov_score.mate()
        if mate is not None:
            return (100.0 if mate > 0 else -100.0), mate
        cp = pov_score.score()
        return (cp / 100.0) if cp is not None else 0.0, None

    def _detect_sacrifice(
        self,
        board_before: chess.Board,
        move: chess.Move,
        board_after: chess.Board,
    ) -> bool:
        """
        Detects if a move is a genuine piece sacrifice (Queen, Rook, or Minor).
        Criteria:
        1. A piece of value >= 3 is moved onto a square where it can be taken by a piece of lower value,
           OR
        2. Moving the piece leaves an already existing friendly piece of value >= 3 hanging to lower piece,
           OR
        3. A higher value piece captures a lower value piece while immediately exposed.
        """
        if board_after.is_checkmate():
            return False

        piece = board_before.piece_at(move.from_square)
        if piece is None or piece.piece_type == chess.PAWN or piece.piece_type == chess.KING:
            return False

        piece_val = PIECE_VALUES.get(piece.piece_type, 0)
        captured = board_before.piece_at(move.to_square)
        captured_val = PIECE_VALUES.get(captured.piece_type, 0) if captured else 0

        # Capturing equal or higher value piece is an exchange/win, not a sacrifice
        if captured_val >= piece_val:
            return False

        # Check if destination square is attacked by opponent
        opponent_color = not board_before.turn
        attackers = board_after.attackers(opponent_color, move.to_square)
        if attackers:
            min_attacker_val = 100
            for sq in attackers:
                p = board_after.piece_at(sq)
                if p:
                    min_attacker_val = min(min_attacker_val, PIECE_VALUES.get(p.piece_type, 10))

            # Attacked by a piece of strictly lower value (e.g. Queen attacked by pawn/minor/rook)
            if min_attacker_val < piece_val:
                return True

            # Attacked with no defenders (hanging piece left en prise)
            defenders = board_after.attackers(board_before.turn, move.to_square)
            if not defenders and piece_val > captured_val:
                return True

        return False

    def analyze_fen(
        self,
        fen: str,
        depth: Optional[int] = None,
        time_limit: Optional[float] = None,
        multipv: int = 5,
    ) -> Dict[str, Any]:
        """
        Analyzes a single FEN position using the native Stockfish executable.
        Returns candidate lines, best move, eval, and PV sequences.
        """
        depth = depth or config.engine_depth
        locked = self._lock.acquire(timeout=0.4)
        if not locked:
            return {
                "fen": fen,
                "busy": True,
                "turn": "white",
                "best_move_uci": "",
                "best_move_san": "",
                "eval": 0.0,
                "mate": None,
                "depth": depth,
                "lines": [],
            }
        try:
            self.start()
            board = chess.Board(fen)
            if not board.is_valid():
                raise ValueError(f"Invalid FEN: {fen}")

            legal_count = len(list(board.legal_moves))
            actual_multipv = min(multipv, legal_count) if legal_count > 0 else 1

            results = self.engine.analyse(
                board,
                chess.engine.Limit(depth=depth, time=time_limit or 0.35),
                multipv=actual_multipv,
            )

            lines = []
            best_move_uci = ""
            best_move_san = ""
            best_eval_pawns = 0.0
            best_mate = None

            for idx, res in enumerate(results):
                pv = res.get("pv", [])
                if not pv:
                    continue
                score_obj = res["score"].pov(chess.WHITE)
                mate_val = score_obj.mate()
                cp_val = score_obj.score()
                score_pawns = (cp_val / 100.0) if cp_val is not None else (100.0 if (mate_val or 0) > 0 else -100.0)

                pv_san_list = []
                temp_board = board.copy()
                for m in pv[:8]:
                    try:
                        pv_san_list.append(temp_board.san(m))
                        temp_board.push(m)
                    except Exception:
                        break

                move_uci = pv[0].uci()
                move_san = board.san(pv[0])

                if idx == 0:
                    best_move_uci = move_uci
                    best_move_san = move_san
                    best_eval_pawns = score_pawns
                    best_mate = mate_val

                lines.append({
                    "multipv": idx + 1,
                    "uci": move_uci,
                    "san": move_san,
                    "score": {"cp": int(score_pawns * 100), "mate": mate_val},
                    "eval": score_pawns,
                    "mate": mate_val,
                    "pv": [m.uci() for m in pv],
                    "pv_san": pv_san_list,
                })

            return {
                "fen": fen,
                "turn": "white" if board.turn == chess.WHITE else "black",
                "best_move_uci": best_move_uci,
                "best_move_san": best_move_san,
                "eval": best_eval_pawns,
                "mate": best_mate,
                "depth": depth,
                "lines": lines,
            }
        finally:
            self._lock.release()

    def review_game(
        self,
        pgn_text: str,
        depth: Optional[int] = None,
        time_per_move: Optional[float] = None,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
    ) -> GameReviewResult:
        """
        Reviews a game from PGN text and returns full analysis results.
        """
        with self._lock:
            self.start()
            headers, moves, starting_board = parse_pgn(pgn_text)
            analysis_depth = depth or max(10, min(14, config.engine_depth))
            time_limit = time_per_move or 0.15

            board = starting_board.copy()
            total_plies = len(moves)

            white_accuracies: List[float] = []
            black_accuracies: List[float] = []

            white_counts = {c.value: 0 for c in MoveClassification}
            black_counts = {c.value: 0 for c in MoveClassification}

            move_analyses: List[MoveAnalysis] = []
            key_moments: List[int] = []
            eval_history: List[Dict[str, Any]] = []

            uci_move_sequence: List[str] = []
            prev_was_blunder = False
            in_book = True

            for ply_idx, move in enumerate(moves):
                turn = "white" if board.turn == chess.WHITE else "black"
                is_white = board.turn == chess.WHITE
                move_number = (ply_idx // 2) + 1
                board_before = board.copy()
                fen_before = board_before.fen()
                san = board_before.san(move)
                uci = move.uci()
                uci_move_sequence.append(uci)

                if progress_callback:
                    progress_callback(ply_idx + 1, total_plies, f"Analyzing move {move_number}... {san}")

                # 1. Check for Forced move
                legal_moves_count = len(list(board_before.legal_moves))
                is_forced = (legal_moves_count == 1)

                # 2. Check for Book move
                is_book_move = False
                eco_code = "A00"
                opening_name = "Starting Position"
                if in_book:
                    is_book_move, eco_code, opening_name, _ = opening_book.lookup_sequence(uci_move_sequence)
                    if not is_book_move:
                        in_book = False

                # 3. Stockfish Engine Evaluation on board_before
                info = []
                try:
                    limit = chess.engine.Limit(depth=analysis_depth, time=time_limit)
                    info = self.engine.analyse(board_before, limit, multipv=3)
                except Exception as e:
                    logger.warning(f"Engine analyse error at ply {ply_idx}: {e}")
                    try:
                        self.close()
                        self.start()
                        limit = chess.engine.Limit(depth=max(6, analysis_depth - 4), time=0.1)
                        info = self.engine.analyse(board_before, limit, multipv=1)
                    except Exception:
                        info = []

                best_move = move
                best_eval_white = 0.0
                best_mate = None
                second_best_eval_player = -999.0
                pv_san_list: List[str] = []

                if info and len(info) > 0:
                    top_line = info[0]
                    if "pv" in top_line and top_line["pv"]:
                        best_move = top_line["pv"][0]
                        # Convert PV to SAN
                        pv_board = board_before.copy()
                        for pv_m in top_line["pv"][:4]:
                            if pv_board.is_legal(pv_m):
                                pv_san_list.append(pv_board.san(pv_m))
                                pv_board.push(pv_m)

                    if "score" in top_line:
                        best_eval_white, best_mate = self._eval_to_pawn_score(top_line["score"], pov_white=True)

                    if len(info) > 1 and "pv" in info[1] and "score" in info[1]:
                        score_2nd, _ = self._eval_to_pawn_score(info[1]["score"], pov_white=is_white)
                        second_best_eval_player = score_2nd

                # Evaluate player's POV for best move
                best_eval_player = best_eval_white if is_white else -best_eval_white

                # 4. Evaluate position after played move
                board_after = board_before.copy()
                board_after.push(move)
                fen_after = board_after.fen()

                # Find played move evaluation
                played_eval_white = best_eval_white
                played_mate = best_mate

                if move != best_move:
                    # Check if played move was in multipv lines
                    found_in_multipv = False
                    for line in info[1:]:
                        if "pv" in line and line["pv"] and line["pv"][0] == move and "score" in line:
                            played_eval_white, played_mate = self._eval_to_pawn_score(line["score"], pov_white=True)
                            found_in_multipv = True
                            break

                    if not found_in_multipv:
                        # Run quick depth analysis for board_after
                        try:
                            after_limit = chess.engine.Limit(depth=max(8, analysis_depth - 2), time=time_limit * 0.7)
                            after_info = self.engine.analyse(board_after, after_limit)
                            if "score" in after_info:
                                played_eval_white, played_mate = self._eval_to_pawn_score(after_info["score"], pov_white=True)
                        except Exception as e:
                            logger.warning(f"Engine analyse board_after error at ply {ply_idx}: {e}")
                            played_eval_white = best_eval_white
                            played_mate = best_mate

                played_eval_player = played_eval_white if is_white else -played_eval_white

                # Win probability before and after (from moving player's perspective)
                win_prob_before = score_to_win_prob(best_eval_player, best_mate if is_white else (-(best_mate or 0) if best_mate else None))
                win_prob_after = score_to_win_prob(played_eval_player, played_mate if is_white else (-(played_mate or 0) if played_mate else None))

                eval_drop = max(0.0, best_eval_player - played_eval_player)
                win_prob_drop = max(0.0, win_prob_before - win_prob_after)

                # Detect piece sacrifice
                is_sacrifice = self._detect_sacrifice(board_before, move, board_after)

                # 5. Move Classification Logic
                if is_forced:
                    classification = MoveClassification.FORCED
                elif is_book_move:
                    classification = MoveClassification.BOOK
                elif eval_drop <= 0.15 or (move == best_move):
                    if is_sacrifice and played_eval_player >= -0.5:
                        classification = MoveClassification.BRILLIANT
                    elif (
                        second_best_eval_player != -999.0
                        and (best_eval_player - second_best_eval_player >= 1.5)
                        and played_eval_player >= -0.5
                        and legal_moves_count > 3
                    ):
                        classification = MoveClassification.GREAT
                    else:
                        classification = MoveClassification.BEST
                elif eval_drop <= 0.35 or win_prob_drop <= 2.5:
                    classification = MoveClassification.EXCELLENT
                elif eval_drop <= 0.70 or win_prob_drop <= 6.0:
                    classification = MoveClassification.GOOD
                else:
                    # Suboptimal moves: Miss, Blunder, Mistake, Inaccuracy
                    if (win_prob_before >= 75.0 or prev_was_blunder) and (win_prob_drop >= 20.0 or eval_drop >= 2.0):
                        classification = MoveClassification.MISS
                    elif eval_drop >= 2.5 or win_prob_drop >= 22.0 or (played_mate is not None and played_mate < 0):
                        classification = MoveClassification.BLUNDER
                    elif eval_drop >= 1.3 or win_prob_drop >= 11.0:
                        classification = MoveClassification.MISTAKE
                    else:
                        classification = MoveClassification.INACCURACY

                # 6. Calculate Accuracy
                acc = calculate_move_accuracy(win_prob_before, win_prob_after, is_book=is_book_move, is_forced=is_forced)

                if is_white:
                    white_accuracies.append(acc)
                    white_counts[classification.value] += 1
                else:
                    black_accuracies.append(acc)
                    black_counts[classification.value] += 1

                # Best move in SAN
                try:
                    best_move_san = board_before.san(best_move)
                except Exception:
                    best_move_san = best_move.uci()

                # Coach Commentary
                commentary = generate_commentary(
                    classification=classification,
                    board_before=board_before,
                    move=move,
                    best_move=best_move,
                    best_move_san=best_move_san,
                    opening_name=opening_name,
                    pv_san=pv_san_list,
                    eval_diff=eval_drop,
                    is_sacrifice=is_sacrifice,
                )

                # Record MoveAnalysis
                analysis = MoveAnalysis(
                    ply=ply_idx + 1,
                    move_number=move_number,
                    turn=turn,
                    san=san,
                    uci=uci,
                    from_square=chess.square_name(move.from_square),
                    to_square=chess.square_name(move.to_square),
                    fen_before=fen_before,
                    fen_after=fen_after,
                    best_move_san=best_move_san,
                    best_move_uci=best_move.uci(),
                    best_eval=round(best_eval_white, 2),
                    eval_before=round(best_eval_white, 2),
                    eval_after=round(played_eval_white, 2),
                    mate_before=best_mate,
                    mate_after=played_mate,
                    eval_drop=round(eval_drop, 2),
                    win_prob_before=round(win_prob_before, 1),
                    win_prob_after=round(win_prob_after, 1),
                    win_prob_drop=round(win_prob_drop, 1),
                    accuracy=round(acc, 1),
                    classification=classification,
                    commentary=commentary,
                    pv=pv_san_list,
                    is_sacrifice=is_sacrifice,
                    is_capture=board_before.is_capture(move),
                    is_check=board_before.gives_check(move),
                )
                move_analyses.append(analysis)

                # Record key moment
                if classification in (
                    MoveClassification.BRILLIANT,
                    MoveClassification.GREAT,
                    MoveClassification.MISS,
                    MoveClassification.BLUNDER,
                    MoveClassification.MISTAKE,
                ):
                    key_moments.append(ply_idx + 1)

                # Eval history entry
                eval_history.append({
                    "ply": ply_idx + 1,
                    "san": san,
                    "score": round(played_eval_white, 2),
                    "mate": played_mate,
                    "win_prob": round(score_to_win_prob(played_eval_white, played_mate), 1),
                    "classification": classification.value,
                })

                prev_was_blunder = (classification in (MoveClassification.BLUNDER, MoveClassification.MISS))
                board.push(move)

            # 7. Final overall statistics
            white_overall_acc = calculate_game_accuracy(white_accuracies)
            black_overall_acc = calculate_game_accuracy(black_accuracies)

            white_rating_val = int(headers.get("WhiteElo", "0")) if headers.get("WhiteElo", "0").isdigit() else None
            black_rating_val = int(headers.get("BlackElo", "0")) if headers.get("BlackElo", "0").isdigit() else None

            white_elo = estimate_performance_rating(white_overall_acc, white_rating_val, black_rating_val)
            black_elo = estimate_performance_rating(black_overall_acc, black_rating_val, white_rating_val)

            white_stats = PlayerStats(
                name=headers.get("White", "White"),
                rating=headers.get("WhiteElo"),
                accuracy=white_overall_acc,
                estimated_elo=white_elo,
                counts=white_counts,
            )

            black_stats = PlayerStats(
                name=headers.get("Black", "Black"),
                rating=headers.get("BlackElo"),
                accuracy=black_overall_acc,
                estimated_elo=black_elo,
                counts=black_counts,
            )

            # Detect final opening identification
            _, final_eco, final_opening, _ = opening_book.lookup_sequence(uci_move_sequence)
            if headers.get("ECO"):
                final_eco = headers["ECO"]
            if headers.get("Opening"):
                final_opening = headers["Opening"]

            return GameReviewResult(
                headers=headers,
                opening_name=final_opening,
                eco_code=final_eco,
                white_stats=white_stats,
                black_stats=black_stats,
                moves=move_analyses,
                key_moments=key_moments,
                eval_history=eval_history,
            )

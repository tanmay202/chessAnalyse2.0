import io
import chess
import chess.pgn
from typing import Dict, List, Optional, Tuple


def parse_pgn(pgn_text: str) -> Tuple[Dict[str, str], List[chess.Move], chess.Board]:
    """
    Parses PGN text into headers, list of moves, and starting board.
    Supports standard PGN, raw move list, or FEN headers.
    """
    pgn_text = pgn_text.strip()
    if not pgn_text:
        raise ValueError("Empty PGN input provided.")

    stream = io.StringIO(pgn_text)
    game = chess.pgn.read_game(stream)

    if game is None:
        # Try wrapping bare moves in standard PGN format
        wrapped_pgn = f'[Event "Game Review"]\n[White "White"]\n[Black "Black"]\n\n{pgn_text}'
        stream = io.StringIO(wrapped_pgn)
        game = chess.pgn.read_game(stream)

    if game is None:
        raise ValueError("Could not parse PGN content.")

    headers = dict(game.headers)
    board = game.board()
    moves = list(game.mainline_moves())

    return headers, moves, board


def export_annotated_pgn(
    headers: Dict[str, str],
    moves: List[chess.Move],
    evaluations: List[dict],
    starting_board: Optional[chess.Board] = None,
) -> str:
    """
    Exports a reviewed game back to PGN format with Chess.com style NAGs and comments.
    """
    game = chess.pgn.Game()
    for k, v in headers.items():
        game.headers[k] = v

    if starting_board and starting_board.fen() != chess.STARTING_FEN:
        game.setup(starting_board)

    node = game
    temp_board = starting_board.copy() if starting_board else chess.Board()

    for i, move in enumerate(moves):
        node = node.add_variation(move)
        if i < len(evaluations):
            ev = evaluations[i]
            comment_parts = []
            if ev.get("symbol"):
                comment_parts.append(f"[{ev['symbol']} {ev.get('classification', '')}]")
            if ev.get("commentary"):
                comment_parts.append(ev["commentary"])
            if ev.get("best_eval") is not None:
                eval_str = f"M{ev['mate_after']}" if ev.get("mate_after") else f"{ev['eval_after']:+.2f}"
                comment_parts.append(f"[%eval {eval_str}]")
            
            node.comment = " ".join(comment_parts)
            
            # Add NAG if available
            nag = ev.get("nag")
            if nag and nag.startswith("$"):
                try:
                    node.nags.add(int(nag[1:]))
                except ValueError:
                    pass

        temp_board.push(move)

    exporter = chess.pgn.StringExporter(headers=True, variations=False, comments=True)
    return game.accept(exporter)

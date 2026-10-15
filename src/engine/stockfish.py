import chess
import chess.engine
import os
from src.utils.config import config
from src.utils.logging_config import logger


class StockfishEngine:
    """Persistent Stockfish engine wrapper. Start once, analyse many positions."""

    def __init__(self):
        self.engine_path = config.stockfish_path
        self.engine = None
        self.is_running = False

    def start(self):
        if not os.path.exists(self.engine_path):
            logger.error(f"Stockfish executable not found at {self.engine_path}")
            raise FileNotFoundError(f"Stockfish not found at {self.engine_path}")

        try:
            self.engine = chess.engine.SimpleEngine.popen_uci(self.engine_path)
            self.engine.configure({
                "Threads": config.engine_threads,
                "Hash": config.engine_hash,
            })
            self.is_running = True
            logger.info("Stockfish engine started successfully.")
        except Exception as e:
            logger.error(f"Failed to start Stockfish: {e}")
            raise

    def get_best_moves(self, fen):
        """Analyse a FEN and return a list of candidate moves with scores."""
        if not self.is_running or self.engine is None:
            logger.error("Attempted to analyze position but engine is not running.")
            return []

        try:
            board = chess.Board(fen)
            if not board.is_valid():
                logger.warning(f"Invalid FEN position provided: {fen}")
                return []

            results = self.engine.analyse(
                board,
                chess.engine.Limit(depth=config.engine_depth, time=config.engine_time),
                multipv=config.multipv,
            )

            output = []
            for result in results:
                if "pv" not in result or not result["pv"]:
                    continue

                score_obj = result["score"].pov(board.turn)
                mate_val = score_obj.mate()

                if score_obj.score() is not None:
                    score = score_obj.score() / 100.0
                elif mate_val is not None:
                    score = 100.0 if mate_val > 0 else -100.0
                else:
                    score = 0.0

                move = result["pv"][0]
                output.append({
                    "move": board.san(move),
                    "uci": move.uci(),
                    "score": score,
                    "mate": mate_val,
                })

            return output
        except Exception as e:
            logger.error(f"Error during engine analysis: {e}")
            return []

    def stop(self):
        if self.is_running and self.engine is not None:
            try:
                self.engine.quit()
            except Exception:
                pass
            self.is_running = False
            logger.info("Stockfish engine stopped.")


if __name__ == "__main__":
    # Quick self-test — does NOT overwrite config.yaml
    engine = StockfishEngine()
    engine.start()

    starting_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    results = engine.get_best_moves(starting_fen)

    for r in results:
        mate_str = f"M{r['mate']}" if r["mate"] else ""
        score_str = mate_str if mate_str else f"{r['score']:+.2f}"
        print(f"{r['move']} ({r['uci']}): {score_str}")

    engine.stop()
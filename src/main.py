import time
import cv2
from src.utils.config import config
from src.utils.logging_config import logger
from src.capture.screen_capture import capture_screen
from src.vision.board_detector import BoardDetector
from src.vision.board_tracker import BoardTracker
from src.vision.perspective import crop_board, normalize_board
from src.vision.square_mapper import split_board
from src.recognition.piece_recognizer import PieceRecognizer
from src.chess.fen import build_fen
from src.chess.move_tracker import MoveTracker
from src.engine.stockfish import StockfishEngine
from src.engine.evaluation import MoveEvaluator
from src.ui.analysis_panel import show_analysis_window, create_analysis_panel
from src.ui.board_overlay import (
    draw_board_rectangle, draw_grid, draw_square_labels,
    draw_piece_predictions, draw_analysis_arrow,
)


def main():
    logger.info("Starting Chess Vision AI...")

    # Initialize components
    board_detector = BoardDetector()
    board_tracker = BoardTracker(patience=5)
    move_tracker = MoveTracker(stability_threshold=3)
    evaluator = MoveEvaluator()

    # Try to load piece recognizer (will warn if model missing)
    try:
        piece_recognizer = PieceRecognizer()
    except Exception as e:
        logger.error(f"Failed to initialize piece recognizer: {e}")
        piece_recognizer = None

    # Start engine
    engine = StockfishEngine()
    try:
        engine.start()
    except Exception as e:
        logger.error(f"Failed to start engine: {e}")
        return

    last_results = []
    last_turn = "White"
    redetect_interval = 30  # Re-detect board every N frames
    frame_count = 0

    logger.info("Entering main loop. Press 'q' in any OpenCV window to stop.")
    try:
        while True:
            start_time = time.time()
            frame_count += 1

            # 1. Capture
            frame = capture_screen()
            if frame is None:
                time.sleep(config.capture_interval)
                continue

            # 2. Detect / Track board
            # Re-run full detection periodically or if board is lost
            if board_tracker.last_known_box is None or frame_count % redetect_interval == 0:
                detected = board_detector.detect(frame)
                board_box = board_tracker.update(detected)
            else:
                board_box = board_tracker.update(board_tracker.last_known_box)

            if board_box is None:
                if config.debug_mode:
                    cv2.imshow("Chess Vision AI", frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                time.sleep(config.capture_interval)
                continue

            # 3. Crop
            board_image = crop_board(frame, board_box)
            if board_image is None:
                continue

            # 4. Normalize
            board_image = normalize_board(board_image)

            # 5. Split into 64 squares
            try:
                squares = split_board(board_image)
            except ValueError as e:
                logger.error(f"Error splitting board: {e}")
                continue

            # 6. Recognize pieces
            if piece_recognizer is not None and piece_recognizer.model is not None:
                try:
                    predictions = piece_recognizer.predict_board(squares)
                except Exception as e:
                    logger.error(f"Piece recognition failed: {e}")
                    continue

                # 7. Build FEN
                board_fen = build_fen(predictions)

                # 8. Stability tracking
                if move_tracker.process_frame(board_fen):
                    logger.info(f"Analyzing position: {board_fen}")
                    last_results = engine.get_best_moves(board_fen)
                    last_turn = "White" if " w " in board_fen else "Black"

                    if last_results:
                        best_score = last_results[0]["score"]
                        for i, r in enumerate(last_results):
                            quality = evaluator.classify_move(best_score, r["score"])
                            mate_str = f"M{r['mate']}" if r['mate'] else ""
                            score_str = mate_str if mate_str else f"{r['score']:+.2f}"
                            logger.info(
                                f"  {i+1}. {r['move']} ({r['uci']}): "
                                f"{score_str} [{quality.value}]"
                            )
            else:
                predictions = None

            # 9. Debug / UI display
            if config.debug_mode:
                display = draw_board_rectangle(frame, board_box)

                debug_board = draw_grid(board_image)
                debug_board = draw_square_labels(debug_board)
                if predictions is not None:
                    debug_board = draw_piece_predictions(debug_board, predictions)

                # Draw best move arrow if available
                if last_results:
                    debug_board = draw_analysis_arrow(
                        debug_board, last_results[0]["uci"], (0, 200, 0), 3
                    )

                cv2.imshow("Chess Vision AI", display)
                cv2.imshow("Board Debug", debug_board)

            # Show analysis panel
            if last_results:
                show_analysis_window(last_results, evaluator, last_turn)

            # Check for quit
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

            # Throttle
            elapsed = time.time() - start_time
            sleep_time = max(0, config.capture_interval - elapsed)
            time.sleep(sleep_time)

    except KeyboardInterrupt:
        logger.info("Interrupted by user.")
    finally:
        engine.stop()
        cv2.destroyAllWindows()
        logger.info("Shutdown complete.")


if __name__ == "__main__":
    main()
import cv2
import numpy as np
from src.engine.evaluation import MoveQuality


# Colors for each quality label (BGR)
QUALITY_COLORS = {
    MoveQuality.BEST:       (0, 200, 0),
    MoveQuality.BETTER:     (0, 180, 80),
    MoveQuality.GOOD:       (0, 160, 160),
    MoveQuality.INACCURACY: (0, 200, 255),
    MoveQuality.MISTAKE:    (0, 100, 255),
    MoveQuality.BLUNDER:    (0, 0, 255),
    MoveQuality.UNKNOWN:    (180, 180, 180),
}


def create_analysis_panel(results, evaluator, turn="White", panel_width=320, panel_height=400):
    """
    Create an OpenCV image showing the analysis panel.

    Args:
        results: list of dicts from StockfishEngine.get_best_moves()
        evaluator: MoveEvaluator instance
        turn: "White" or "Black"
        panel_width: pixel width
        panel_height: pixel height

    Returns:
        numpy array (BGR image)
    """
    panel = np.zeros((panel_height, panel_width, 3), dtype=np.uint8)
    panel[:] = (30, 30, 30)  # dark background

    y = 10
    font = cv2.FONT_HERSHEY_SIMPLEX

    # Title
    cv2.putText(panel, "CHESS ANALYZER", (10, y + 20), font, 0.7, (255, 255, 255), 2)
    y += 40

    # Turn
    cv2.putText(panel, f"Position: {turn} to move", (10, y + 15), font, 0.45, (200, 200, 200), 1)
    y += 30

    if not results:
        cv2.putText(panel, "No analysis available", (10, y + 15), font, 0.45, (100, 100, 255), 1)
        return panel

    # Overall evaluation
    top_score = results[0]["score"]
    mate = results[0]["mate"]
    if mate is not None:
        eval_str = f"Evaluation: M{mate}"
    else:
        eval_str = f"Evaluation: {top_score:+.2f}"
    cv2.putText(panel, eval_str, (10, y + 15), font, 0.5, (255, 255, 255), 1)
    y += 35

    # Separator
    cv2.line(panel, (10, y), (panel_width - 10, y), (80, 80, 80), 1)
    y += 15

    # Candidate moves
    best_score = results[0]["score"]
    for i, r in enumerate(results):
        quality = evaluator.classify_move(best_score, r["score"])
        color = QUALITY_COLORS.get(quality, (200, 200, 200))

        # Quality label
        cv2.putText(panel, quality.value, (10, y + 15), font, 0.45, color, 1)

        # Move name
        cv2.putText(panel, r["move"], (120, y + 15), font, 0.5, (255, 255, 255), 1)

        # Score
        if r["mate"] is not None:
            score_str = f"M{r['mate']}"
        else:
            score_str = f"{r['score']:+.2f}"
        cv2.putText(panel, score_str, (230, y + 15), font, 0.45, (200, 200, 200), 1)

        y += 30

        if y + 30 > panel_height - 40:
            break

    # Footer with depth info
    y = panel_height - 25
    cv2.line(panel, (10, y - 5), (panel_width - 10, y - 5), (80, 80, 80), 1)
    from src.utils.config import config
    cv2.putText(panel, f"Engine depth: {config.engine_depth}", (10, y + 12), font, 0.4, (150, 150, 150), 1)

    return panel


def show_analysis_window(results, evaluator, turn="White"):
    """Display the analysis panel in an OpenCV window."""
    panel = create_analysis_panel(results, evaluator, turn)
    cv2.imshow("Chess Analysis", panel)
    cv2.waitKey(1)

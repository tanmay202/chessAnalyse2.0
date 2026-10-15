from src.utils.logging_config import logger
from src.chess.position import is_valid_position


class MoveTracker:
    """
    Tracks position stability across video frames.
    A new position is accepted only after it has been seen unchanged
    for `stability_threshold` consecutive frames.
    """

    def __init__(self, stability_threshold=3):
        self.stability_threshold = stability_threshold
        self.current_stable_fen = None
        self.candidate_fen = None
        self.candidate_count = 0

    def process_frame(self, fen):
        """
        Process a FEN from a single frame.
        Returns True if a new stable position (move) is detected.
        """
        if not is_valid_position(fen):
            return False

        if fen == self.current_stable_fen:
            self.candidate_fen = None
            self.candidate_count = 0
            return False

        if fen == self.candidate_fen:
            self.candidate_count += 1
            if self.candidate_count >= self.stability_threshold:
                logger.info(f"New stable position detected: {fen}")
                self.current_stable_fen = fen
                self.candidate_fen = None
                self.candidate_count = 0
                return True
        else:
            self.candidate_fen = fen
            self.candidate_count = 1

        return False

    def reset(self):
        """Reset tracker state."""
        self.current_stable_fen = None
        self.candidate_fen = None
        self.candidate_count = 0

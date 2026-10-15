from enum import Enum


class MoveQuality(Enum):
    BRILLIANT = "BRILLIANT"
    GREAT = "GREAT"
    BEST = "BEST"
    EXCELLENT = "EXCELLENT"
    BETTER = "BETTER"
    GOOD = "GOOD"
    BOOK = "BOOK"
    INACCURACY = "INACCURACY"
    MISTAKE = "MISTAKE"
    MISS = "MISS"
    BLUNDER = "BLUNDER"
    FORCED = "FORCED"
    UNKNOWN = "UNKNOWN"


class MoveEvaluator:
    def __init__(self):
        # Thresholds in pawns
        self.inaccuracy_threshold = 0.5
        self.mistake_threshold = 1.0
        self.blunder_threshold = 2.0

    def classify_move(self, best_score, move_score):
        """
        Classifies a move based on centipawn drop compared to the best score.
        Scores should be evaluated from the perspective of the player making the move.
        Preserves backward compatibility with existing components and tests.
        """
        if best_score is None or move_score is None:
            return MoveQuality.UNKNOWN

        eval_drop = best_score - move_score

        if eval_drop <= 0.05:
            return MoveQuality.BEST
        elif eval_drop <= 0.2:
            return MoveQuality.BETTER
        elif eval_drop <= self.inaccuracy_threshold:
            return MoveQuality.GOOD
        elif eval_drop <= self.mistake_threshold:
            return MoveQuality.INACCURACY
        elif eval_drop <= self.blunder_threshold:
            return MoveQuality.MISTAKE
        else:
            return MoveQuality.BLUNDER

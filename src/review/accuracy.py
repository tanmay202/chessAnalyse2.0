import math
from typing import List, Optional


def score_to_win_prob(score_pawns: float, mate: Optional[int] = None) -> float:
    """
    Converts Stockfish evaluation into expected winning probability (0% to 100%).
    Uses Chess.com's logistic sigmoid model:
        P(win) = 50 + 50 * (2 / (1 + exp(-0.00368208 * cp)) - 1)
    """
    if mate is not None:
        if mate > 0:
            return 100.0
        elif mate < 0:
            return 0.0
        return 50.0

    cp = score_pawns * 100.0
    # Guard against overflow
    clamped_cp = max(-2000.0, min(2000.0, cp))
    k = -0.00368208
    exp_val = math.exp(k * clamped_cp)
    prob = 50.0 + 50.0 * (2.0 / (1.0 + exp_val) - 1.0)
    return max(0.0, min(100.0, prob))


def calculate_move_accuracy(
    win_prob_before: float,
    win_prob_after: float,
    is_book: bool = False,
    is_forced: bool = False,
) -> float:
    """
    Calculates accuracy percentage (0.0% to 100.0%) for a single move using CAPS2.
    Formula:
        win_prob_loss = max(0, win_prob_before - win_prob_after)
        acc = 103.1668 * exp(-0.04354 * win_prob_loss) - 3.1669
    """
    if is_book or is_forced:
        return 100.0

    win_prob_loss = max(0.0, win_prob_before - win_prob_after)
    if win_prob_loss <= 0.001:
        return 100.0

    acc = 103.1668 * math.exp(-0.04354 * win_prob_loss) - 3.1669
    return max(0.0, min(100.0, acc))


def calculate_game_accuracy(accuracies: List[float]) -> float:
    """
    Computes player's overall game accuracy from individual move accuracies.
    """
    if not accuracies:
        return 100.0
    avg = sum(accuracies) / len(accuracies)
    return round(max(0.0, min(100.0, avg)), 1)


def estimate_performance_rating(
    accuracy: float,
    base_rating: Optional[int] = None,
    opponent_rating: Optional[int] = None,
) -> int:
    """
    Estimates performance Elo rating based on game accuracy score.
    Maps 50% -> ~700, 75% -> ~1400, 85% -> ~1900, 95% -> ~2600, 99% -> 2900+.
    """
    # Base sigmoid model
    elo = 3100.0 / (1.0 + math.exp(-0.065 * (accuracy - 78.0)))
    elo = max(400.0, min(3100.0, elo))

    # Blend with known player rating or opponent rating if provided
    if base_rating is not None and base_rating > 0:
        elo = 0.65 * elo + 0.35 * base_rating
    elif opponent_rating is not None and opponent_rating > 0:
        elo = 0.70 * elo + 0.30 * opponent_rating

    # Round to nearest 50 or 25
    return int(round(elo / 25.0) * 25)

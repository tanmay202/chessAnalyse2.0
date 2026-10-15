import chess
from typing import Optional, List
from src.review.models import MoveClassification


PIECE_NAMES = {
    chess.PAWN: "pawn",
    chess.KNIGHT: "knight",
    chess.BISHOP: "bishop",
    chess.ROOK: "rook",
    chess.QUEEN: "queen",
    chess.KING: "king",
}


def generate_commentary(
    classification: MoveClassification,
    board_before: chess.Board,
    move: chess.Move,
    best_move: chess.Move,
    best_move_san: str,
    opening_name: str = "",
    pv_san: Optional[List[str]] = None,
    eval_diff: float = 0.0,
    is_sacrifice: bool = False,
) -> str:
    """
    Generates intelligent Chess.com style Coach commentary for a played move.
    """
    moving_piece = board_before.piece_at(move.from_square)
    moving_piece_name = PIECE_NAMES.get(moving_piece.piece_type, "piece") if moving_piece else "piece"
    captured_piece = board_before.piece_at(move.to_square)
    to_sq_name = chess.square_name(move.to_square)
    from_sq_name = chess.square_name(move.from_square)
    san = board_before.san(move)
    is_check = board_before.gives_check(move)

    if classification == MoveClassification.BOOK:
        if opening_name:
            return f"Book move! This follows standard opening theory in the {opening_name}."
        return "Book move! You are following well-established opening principles."

    if classification == MoveClassification.FORCED:
        return f"Forced move. {san} was the only legal move available to escape the threat."

    if classification == MoveClassification.BRILLIANT:
        if is_sacrifice:
            return (
                f"Brilliant!! A stunning {moving_piece_name} sacrifice on {to_sq_name} "
                f"that completely breaks open the position and gives you a decisive advantage!"
            )
        return (
            f"Brilliant!! You found a genius tactical strike with {san}. "
            f"Stockfish confirms this move creates unstoppable winning threats."
        )

    if classification == MoveClassification.GREAT:
        return (
            f"Great find! {san} was the only move that maintains the advantage in this sharp position. "
            f"Any other alternative would have compromised your position."
        )

    if classification == MoveClassification.BEST:
        if captured_piece:
            captured_name = PIECE_NAMES.get(captured_piece.piece_type, "piece")
            return f"Best move! Capturing the {captured_name} on {to_sq_name} was the cleanest and most accurate continuation."
        elif is_check:
            return f"Best move! Checking with {san} puts heavy pressure on the opponent's king."
        return f"Best move! You found the optimal choice, improving the activity of your {moving_piece_name}."

    if classification == MoveClassification.EXCELLENT:
        if best_move_san and best_move_san != san:
            return f"Excellent! A very sharp and active move. The computer slightly favored {best_move_san}, but this keeps all the pressure."
        return "Excellent! A strong, sound move that keeps a firm grip on the position."

    if classification == MoveClassification.GOOD:
        if best_move_san and best_move_san != san:
            return f"Good move. {san} is completely playable, though {best_move_san} was a touch more accurate."
        return "Good move. You keep the position solid and balanced."

    if classification == MoveClassification.INACCURACY:
        continuation = f" (followed by {' '.join(pv_san[:3])})" if pv_san and len(pv_san) >= 2 else ""
        if best_move_san:
            return (
                f"Inaccuracy. {san} slightly concedes initiative. "
                f"Better was {best_move_san}{continuation} to keep maximum control."
            )
        return f"Inaccuracy. This slightly weakens your structure or active piece play."

    if classification == MoveClassification.MISTAKE:
        continuation = f" with the idea of {' '.join(pv_san[:3])}" if pv_san and len(pv_san) >= 2 else ""
        if best_move_san:
            return (
                f"Mistake. {san} relinquishes a significant advantage. "
                f"You should have played {best_move_san}{continuation}."
            )
        return f"Mistake. This hands the advantage back to your opponent."

    if classification == MoveClassification.MISS:
        if best_move_san:
            continuation = f" ({' '.join(pv_san[:3])})" if pv_san and len(pv_san) >= 2 else ""
            return (
                f"Miss! You missed a golden opportunity to seize control or win material. "
                f"Playing {best_move_san}{continuation} would have punished your opponent!"
            )
        return "Miss! You missed a tactical strike that would have changed the game."

    if classification == MoveClassification.BLUNDER:
        if best_move_san:
            continuation = f" (e.g. {' '.join(pv_san[:3])})" if pv_san and len(pv_san) >= 2 else ""
            return (
                f"Blunder?? {san} costs you serious material or positional integrity. "
                f"Finding {best_move_san}{continuation} was critical here."
            )
        return f"Blunder?? A critical mistake that drastically changes the outcome of the game."

    return f"Move {san} played."

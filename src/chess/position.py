import chess
from src.utils.logging_config import logger

def is_valid_position(fen):
    """
    Validates if a given FEN string represents a legal chess position.
    """
    try:
        board = chess.Board(fen)
        return board.is_valid()
    except ValueError as e:
        logger.warning(f"Invalid FEN string: {fen} ({e})")
        return False
        
def get_legal_moves(fen):
    """
    Returns a list of legal moves (UCI strings) for a given FEN.
    """
    try:
        board = chess.Board(fen)
        return [move.uci() for move in board.legal_moves]
    except ValueError:
        return []

def apply_move(fen, uci_move):
    """
    Applies a move to a FEN and returns the new FEN.
    """
    try:
        board = chess.Board(fen)
        move = chess.Move.from_uci(uci_move)
        if move in board.legal_moves:
            board.push(move)
            return board.fen()
        else:
            logger.warning(f"Illegal move {uci_move} for position {fen}")
            return None
    except ValueError:
        return None

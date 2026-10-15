# Mapping from piece names to FEN characters
PIECE_TO_FEN = {
    "empty": ".",
    "white_pawn": "P", "white_knight": "N", "white_bishop": "B", 
    "white_rook": "R", "white_queen": "Q", "white_king": "K",
    "black_pawn": "p", "black_knight": "n", "black_bishop": "b", 
    "black_rook": "r", "black_queen": "q", "black_king": "k"
}

def row_to_fen(row_preds):
    result = ""
    empty_count = 0

    for pred in row_preds:
        piece_name = pred.get("piece", "empty")
        fen_char = PIECE_TO_FEN.get(piece_name, ".")

        if fen_char == ".":
            empty_count += 1
        else:
            if empty_count > 0:
                result += str(empty_count)
                empty_count = 0
            result += fen_char

    if empty_count > 0:
        result += str(empty_count)

    return result

def build_fen(predictions, turn="w", castling="-", en_passant="-", halfmove="0", fullmove="1"):
    """
    Converts 8x8 list of predictions into a full FEN string.
    predictions: 8x8 list of dicts {"piece": "...", "confidence": ...}
    """
    if len(predictions) != 8:
        raise ValueError("Board must contain 8 rows.")

    if any(len(row) != 8 for row in predictions):
        raise ValueError("Every board row must contain 8 columns.")

    board_part = "/".join(row_to_fen(row) for row in predictions)
    
    return f"{board_part} {turn} {castling} {en_passant} {halfmove} {fullmove}"
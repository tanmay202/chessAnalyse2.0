import cv2
import os

FILES = "abcdefgh"
RANKS = "87654321"

def split_board(board):
    """
    Splits the 8x8 square board image into a 2D list of 64 square images.
    Returns: list of lists [row][col] where row 0 is rank 8, col 0 is file a.
    """
    height, width = board.shape[:2]

    # Allow a small tolerance for rounding issues
    if abs(height - width) > 2:
        raise ValueError(
            f"Board must be square. Received {width}x{height}"
        )

    square_size = width / 8
    squares = []

    for row in range(8):
        row_squares = []
        for col in range(8):
            x1 = int(col * square_size)
            y1 = int(row * square_size)
            x2 = int((col + 1) * square_size)
            y2 = int((row + 1) * square_size)

            # Ensure we don't go out of bounds
            x2 = min(x2, width)
            y2 = min(y2, height)

            square = board[y1:y2, x1:x2]
            row_squares.append(square)

        squares.append(row_squares)

    return squares

def get_square_name(row, col):
    """
    Converts (row, col) to algebraic notation.
    (0, 0) -> a8
    (7, 7) -> h1
    """
    if 0 <= row < 8 and 0 <= col < 8:
        return f"{FILES[col]}{RANKS[row]}"
    raise ValueError(f"Invalid coordinates: ({row}, {col})")

def get_coordinates(square_name):
    """
    Converts algebraic notation to (row, col).
    a8 -> (0, 0)
    h1 -> (7, 7)
    """
    if len(square_name) != 2:
        raise ValueError(f"Invalid square name: {square_name}")
        
    f, r = square_name[0].lower(), square_name[1]
    if f in FILES and r in RANKS:
        return RANKS.index(r), FILES.index(f)
    raise ValueError(f"Invalid square name: {square_name}")

if __name__ == "__main__":
    assert get_square_name(0, 0) == "a8"
    assert get_square_name(7, 7) == "h1"
    assert get_coordinates("a8") == (0, 0)
    assert get_coordinates("h1") == (7, 7)
    print("Coordinate mapping tests passed.")
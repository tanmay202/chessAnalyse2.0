import cv2
from src.vision.square_mapper import get_square_name

FILES = "abcdefgh"


def draw_debug_labels(board_image):
    """
    Draws algebraic square labels (a8, b8, ..., h1) over the board image.
    Returns a copy with labels drawn.
    """
    board = board_image.copy()
    height, width = board.shape[:2]

    cell_w = width / 8
    cell_h = height / 8

    for row in range(8):
        for col in range(8):
            x = int(col * cell_w)
            y = int(row * cell_h)

            label = get_square_name(row, col)

            # Draw background rectangle for readability
            text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)[0]
            cv2.rectangle(
                board,
                (x + 2, y + 2),
                (x + text_size[0] + 6, y + text_size[1] + 6),
                (0, 0, 0),
                -1,
            )
            cv2.putText(
                board,
                label,
                (x + 4, y + text_size[1] + 4),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.4,
                (0, 255, 0),
                1,
            )

    return board


def draw_grid(board_image):
    """Draws 8x8 grid lines on the board image. Returns a copy."""
    board = board_image.copy()
    height, width = board.shape[:2]

    for i in range(1, 8):
        x = int(i * width / 8)
        y = int(i * height / 8)
        cv2.line(board, (x, 0), (x, height), (0, 255, 0), 1)
        cv2.line(board, (0, y), (width, y), (0, 255, 0), 1)

    return board


if __name__ == "__main__":
    board = cv2.imread("data/boards/test_board.png")

    if board is None:
        raise FileNotFoundError("Board image not found at data/boards/test_board.png")

    debug = draw_grid(board)
    debug = draw_debug_labels(debug)

    cv2.imshow("Debug Board", debug)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
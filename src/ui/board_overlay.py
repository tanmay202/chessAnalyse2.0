import cv2
import numpy as np
from src.vision.square_mapper import get_square_name


def draw_board_rectangle(frame, box, color=(0, 255, 0), thickness=2):
    """Draw a rectangle around the detected board on the full frame."""
    if box is None:
        return frame
    out = frame.copy()
    x, y, w, h = box
    cv2.rectangle(out, (x, y), (x + w, y + h), color, thickness)
    return out


def draw_grid(board_image):
    """Draw 8x8 grid lines on a board image. Returns a copy."""
    out = board_image.copy()
    h, w = out.shape[:2]
    for i in range(1, 8):
        x = int(i * w / 8)
        y = int(i * h / 8)
        cv2.line(out, (x, 0), (x, h), (0, 255, 0), 1)
        cv2.line(out, (0, y), (w, y), (0, 255, 0), 1)
    return out


def draw_square_labels(board_image):
    """Draw algebraic labels (a8..h1) on each square. Returns a copy."""
    out = board_image.copy()
    h, w = out.shape[:2]
    cell_w = w / 8
    cell_h = h / 8

    for row in range(8):
        for col in range(8):
            x = int(col * cell_w)
            y = int(row * cell_h)
            label = get_square_name(row, col)
            ts = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.35, 1)[0]
            cv2.rectangle(out, (x + 1, y + 1), (x + ts[0] + 5, y + ts[1] + 5), (0, 0, 0), -1)
            cv2.putText(out, label, (x + 3, y + ts[1] + 3),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 0), 1)
    return out


def draw_piece_predictions(board_image, predictions):
    """Draw piece prediction labels on each square. Returns a copy."""
    out = board_image.copy()
    h, w = out.shape[:2]
    cell_w = w / 8
    cell_h = h / 8

    for row in range(8):
        for col in range(8):
            pred = predictions[row][col]
            piece = pred.get("piece", "?")
            conf = pred.get("confidence", 0)
            if piece == "empty":
                continue

            x = int(col * cell_w)
            y = int(row * cell_h) + int(cell_h * 0.6)
            label = f"{piece.split('_')[-1][:3]} {conf:.0%}"
            cv2.putText(out, label, (x + 2, y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.3, (255, 255, 0), 1)
    return out


def draw_analysis_arrow(board_image, uci_move, color=(0, 0, 255), thickness=2):
    """
    Draw an arrow for a move (e.g. 'e2e4') on the board image.
    Returns a copy.
    """
    if len(uci_move) < 4:
        return board_image

    out = board_image.copy()
    h, w = out.shape[:2]
    cell_w = w / 8
    cell_h = h / 8

    files = "abcdefgh"
    ranks = "87654321"

    try:
        from_col = files.index(uci_move[0])
        from_row = ranks.index(uci_move[1])
        to_col = files.index(uci_move[2])
        to_row = ranks.index(uci_move[3])
    except ValueError:
        return out

    x1 = int((from_col + 0.5) * cell_w)
    y1 = int((from_row + 0.5) * cell_h)
    x2 = int((to_col + 0.5) * cell_w)
    y2 = int((to_row + 0.5) * cell_h)

    cv2.arrowedLine(out, (x1, y1), (x2, y2), color, thickness, tipLength=0.3)
    return out

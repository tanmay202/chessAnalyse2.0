import cv2
import numpy as np


def preprocess_square(square_image, target_size=(64, 64)):
    """
    Preprocesses a single square image for model input.
    - Resizes to target_size
    - Converts to RGB if needed
    - Normalizes pixel values to [0, 1]
    Returns: numpy array of shape (target_size[0], target_size[1], 3)
    """
    if square_image is None or square_image.size == 0:
        return np.zeros((*target_size, 3), dtype=np.float32)

    resized = cv2.resize(square_image, target_size, interpolation=cv2.INTER_AREA)

    if len(resized.shape) == 2:
        resized = cv2.cvtColor(resized, cv2.COLOR_GRAY2BGR)

    normalized = resized.astype(np.float32) / 255.0
    return normalized


def center_crop_square(image, margin_ratio=0.1):
    """
    Crops the center of a square image, removing a margin on each side.
    Useful for removing board grid lines from square edges.
    """
    h, w = image.shape[:2]
    mx = int(w * margin_ratio)
    my = int(h * margin_ratio)
    return image[my:h - my, mx:w - mx]

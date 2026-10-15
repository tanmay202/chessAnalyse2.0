import cv2
import numpy as np

def crop_board(image, box):
    """
    Crops the image using the bounding box (x, y, w, h).
    """
    if box is None:
        return None
        
    x, y, w, h = box
    
    # Check boundaries
    height, width = image.shape[:2]
    x = max(0, x)
    y = max(0, y)
    w = min(w, width - x)
    h = min(h, height - y)
    
    return image[y:y+h, x:x+w]

def normalize_board(board_image):
    """
    Resizes the board image to a standard square size (e.g., 400x400).
    Corrects perspective if 4 points were provided, but for now we assume
    it's already a square crop.
    """
    if board_image is None:
        return None
        
    # Resize to standard size for uniform processing
    target_size = 400
    return cv2.resize(board_image, (target_size, target_size))
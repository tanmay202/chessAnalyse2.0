import cv2
import numpy as np
from src.utils.logging_config import logger

class BoardDetector:
    def __init__(self):
        pass

    def detect(self, frame):
        """
        Detects a chessboard in the given frame.
        Returns the bounding box (x, y, w, h) of the board, or None if not found.
        """
        if frame is None:
            return None
            
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply slight blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Canny edge detection
        edges = cv2.Canny(blurred, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        best_box = None
        max_area = 0
        
        for contour in contours:
            area = cv2.contourArea(contour)
            # Minimum size threshold to ignore small artifacts
            if area < 10000:
                continue
                
            # Approximate the contour to a polygon
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
            
            # Check if it has 4 vertices (square/rectangle)
            if len(approx) == 4:
                x, y, w, h = cv2.boundingRect(approx)
                
                # Check if it's roughly a square
                aspect_ratio = float(w) / h
                if 0.9 <= aspect_ratio <= 1.1:
                    if area > max_area:
                        max_area = area
                        best_box = (x, y, w, h)
        
        if best_box is not None:
            logger.debug(f"Detected board at {best_box} with area {max_area}")
            return best_box
            
        logger.warning("No board detected in the frame.")
        return None

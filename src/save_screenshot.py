import cv2
import os
import sys

# Allow running from project root: python src/save_screenshot.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.capture.screen_capture import capture_screen


def main():
    os.makedirs("data/screenshots", exist_ok=True)

    frame = capture_screen()

    path = "data/screenshots/test_screen.png"

    success = cv2.imwrite(path, frame)

    if success:
        print(f"Saved: {path}")
    else:
        print("Failed to save screenshot.")


if __name__ == "__main__":
    main()
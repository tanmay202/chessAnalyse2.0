import cv2
import mss
import numpy as np


def capture_screen():
    """
    Capture the primary monitor and return it as a BGR OpenCV image.
    """
    with mss.mss() as sct:
        monitor = sct.monitors[1]
        screenshot = sct.grab(monitor)

        frame = np.array(screenshot)

        # MSS gives BGRA. OpenCV normally uses BGR.
        frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)

        return frame


def main():
    frame = capture_screen()

    cv2.imshow("Screen Capture", frame)

    print("Press any key inside the image window to exit.")
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
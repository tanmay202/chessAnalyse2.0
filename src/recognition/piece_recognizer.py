import os
import cv2
import numpy as np
from src.utils.config import config
from src.utils.logging_config import logger


class PieceRecognizer:
    """
    Classifies chess pieces on individual board squares.

    MODEL REQUIRED: This class needs a trained classification model.
    Supported format: ONNX (loaded via cv2.dnn.readNetFromONNX).

    Place your model at the path specified in config.yaml MODEL_PATH
    (default: models/chess_piece_model.onnx).

    The model must output a 13-class softmax over the labels listed below.
    """

    LABELS = [
        "empty",
        "white_pawn", "white_knight", "white_bishop",
        "white_rook", "white_queen", "white_king",
        "black_pawn", "black_knight", "black_bishop",
        "black_rook", "black_queen", "black_king",
    ]

    INPUT_SIZE = (64, 64)  # Expected model input dimensions

    def __init__(self):
        self.model_path = config.model_path
        self.model = None
        self._load_model()

    def _load_model(self):
        if not self.model_path or not os.path.exists(self.model_path):
            logger.error(
                f"MODEL REQUIRED: Trained piece recognition model not found "
                f"at '{self.model_path}'. Place a trained ONNX model there "
                f"and restart."
            )
            return

        try:
            self.model = cv2.dnn.readNetFromONNX(self.model_path)
            logger.info(f"Piece recognition model loaded from {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to load model from {self.model_path}: {e}")
            self.model = None

    def predict_square(self, square_image):
        """
        Predict the piece on a single square image.
        Returns: {"piece": str, "confidence": float}
        """
        if self.model is None:
            raise NotImplementedError(
                "MODEL REQUIRED: Cannot predict without a loaded model."
            )

        blob = cv2.dnn.blobFromImage(
            square_image, 1.0 / 255.0, self.INPUT_SIZE,
            swapRB=True, crop=False,
        )
        self.model.setInput(blob)
        preds = self.model.forward().flatten()

        class_id = int(np.argmax(preds))
        confidence = float(preds[class_id])

        if confidence < config.min_confidence:
            logger.debug(
                f"Low confidence {confidence:.2f} for predicted "
                f"{self.LABELS[class_id]}, defaulting to empty"
            )
            return {"piece": "empty", "confidence": confidence}

        return {"piece": self.LABELS[class_id], "confidence": confidence}

    def predict_board(self, squares):
        """
        Predict pieces for all 64 squares.
        squares: 8x8 list of square images.
        Returns: 8x8 list of {"piece": str, "confidence": float}.
        """
        if self.model is None:
            raise NotImplementedError(
                "MODEL REQUIRED: Cannot predict without a loaded model."
            )

        predictions = []
        for row in range(8):
            row_preds = []
            for col in range(8):
                pred = self.predict_square(squares[row][col])
                row_preds.append(pred)
            predictions.append(row_preds)

        return predictions

import logging
import sys
import os

def setup_logger(name="chess_vision_ai"):
    logger = logging.getLogger(name)

    if not logger.handlers:
        logger.setLevel(logging.DEBUG)

        # Console handler
        ch = logging.StreamHandler(sys.stdout)
        ch.setLevel(logging.INFO)

        # File handler - place log in project root
        from src.utils.config import PROJECT_ROOT
        log_path = os.path.join(PROJECT_ROOT, "app.log")
        fh = logging.FileHandler(log_path)
        fh.setLevel(logging.DEBUG)

        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

        ch.setFormatter(formatter)
        fh.setFormatter(formatter)

        logger.addHandler(ch)
        logger.addHandler(fh)

    return logger

logger = setup_logger()

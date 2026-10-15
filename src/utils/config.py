import yaml
import os
import sys

def _find_project_root():
    """Find the project root by looking for config.yaml starting from the script's directory."""
    # Try the directory containing this file first, then walk up
    current = os.path.dirname(os.path.abspath(__file__))
    for _ in range(5):
        candidate = os.path.join(current, "config.yaml")
        if os.path.exists(candidate):
            return current
        parent = os.path.dirname(current)
        if parent == current:
            break
        current = parent
    # Fallback to CWD
    return os.getcwd()

PROJECT_ROOT = _find_project_root()

class Config:
    def __init__(self, config_path=None):
        if config_path is None:
            config_path = os.path.join(PROJECT_ROOT, "config.yaml")
        self.config_path = config_path
        self._config = {}
        self.load()

    def load(self):
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(f"Configuration file {self.config_path} not found.")

        with open(self.config_path, "r") as f:
            self._config = yaml.safe_load(f) or {}

    def _resolve_path(self, path):
        """Resolve a relative path against the project root."""
        if path and not os.path.isabs(path):
            return os.path.join(PROJECT_ROOT, path)
        return path

    @property
    def stockfish_path(self):
        return self._resolve_path(self._config.get("STOCKFISH_PATH", "stockfish"))

    @property
    def model_path(self):
        return self._resolve_path(self._config.get("MODEL_PATH", ""))

    @property
    def screen_number(self):
        return self._config.get("SCREEN_NUMBER", 1)

    @property
    def capture_interval(self):
        return self._config.get("CAPTURE_INTERVAL", 0.5)

    @property
    def engine_depth(self):
        return self._config.get("ENGINE_DEPTH", 15)

    @property
    def engine_time(self):
        return self._config.get("ENGINE_TIME", 1.0)

    @property
    def engine_threads(self):
        return self._config.get("ENGINE_THREADS", 2)

    @property
    def engine_hash(self):
        return self._config.get("ENGINE_HASH", 128)

    @property
    def multipv(self):
        return self._config.get("MULTIPV", 3)

    @property
    def min_confidence(self):
        return self._config.get("MIN_CONFIDENCE", 0.75)

    @property
    def debug_mode(self):
        return self._config.get("DEBUG_MODE", False)

config = Config()

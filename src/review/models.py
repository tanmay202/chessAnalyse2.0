from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any


class MoveClassification(Enum):
    BRILLIANT = "brilliant"      # !! Stunning piece sacrifice that maintains advantage
    GREAT = "great"              # ! Critical only move in a difficult position
    BEST = "best"                # ★ Stockfish's #1 move
    EXCELLENT = "excellent"      # ✓✓ Near-optimal move, tiny eval drop
    GOOD = "good"                # ✓ Solid move, minor eval drop
    BOOK = "book"                # 📖 Known opening theory
    INACCURACY = "inaccuracy"    # ?! Suboptimal move
    MISTAKE = "mistake"          # ? Notable eval loss
    MISS = "miss"                # ❌ Missed tactical win or missed punishing blunder
    BLUNDER = "blunder"          # ?? Critical mistake or hanging piece/mate
    FORCED = "forced"            # ⇥ Only legal move in position


# Visual metadata matching Chess.com's exact badges and colors
CLASSIFICATION_META = {
    MoveClassification.BRILLIANT: {
        "name": "Brilliant",
        "symbol": "!!",
        "badge": "💎",
        "color": "#1baaa0",
        "bg_color": "rgba(27, 170, 160, 0.2)",
        "icon_class": "badge-brilliant",
        "description": "A stunning piece sacrifice that is the best or near-best move.",
        "nag": "$3"
    },
    MoveClassification.GREAT: {
        "name": "Great Find",
        "symbol": "!",
        "badge": "🎯",
        "color": "#5c8bb0",
        "bg_color": "rgba(92, 139, 176, 0.2)",
        "icon_class": "badge-great",
        "description": "The only good move in a difficult position.",
        "nag": "$1"
    },
    MoveClassification.BEST: {
        "name": "Best",
        "symbol": "★",
        "badge": "★",
        "color": "#81b64c",
        "bg_color": "rgba(129, 182, 76, 0.2)",
        "icon_class": "badge-best",
        "description": "Stockfish's top recommendation.",
        "nag": "$1"
    },
    MoveClassification.EXCELLENT: {
        "name": "Excellent",
        "symbol": "✓✓",
        "badge": "⚡",
        "color": "#81b64c",
        "bg_color": "rgba(129, 182, 76, 0.15)",
        "icon_class": "badge-excellent",
        "description": "Nearly as strong as the best move.",
        "nag": ""
    },
    MoveClassification.GOOD: {
        "name": "Good",
        "symbol": "✓",
        "badge": "✓",
        "color": "#96bc76",
        "bg_color": "rgba(150, 188, 118, 0.15)",
        "icon_class": "badge-good",
        "description": "A solid, playable move.",
        "nag": ""
    },
    MoveClassification.BOOK: {
        "name": "Book",
        "symbol": "📖",
        "badge": "📖",
        "color": "#b08850",
        "bg_color": "rgba(176, 136, 80, 0.2)",
        "icon_class": "badge-book",
        "description": "Standard opening book theory.",
        "nag": ""
    },
    MoveClassification.INACCURACY: {
        "name": "Inaccuracy",
        "symbol": "?!",
        "badge": "?!",
        "color": "#f7c631",
        "bg_color": "rgba(247, 198, 49, 0.2)",
        "icon_class": "badge-inaccuracy",
        "description": "Suboptimal move that slightly weakens the position.",
        "nag": "$6"
    },
    MoveClassification.MISTAKE: {
        "name": "Mistake",
        "symbol": "?",
        "badge": "?",
        "color": "#e58f2a",
        "bg_color": "rgba(229, 143, 42, 0.2)",
        "icon_class": "badge-mistake",
        "description": "A bad move that relinquishes a major advantage.",
        "nag": "$2"
    },
    MoveClassification.MISS: {
        "name": "Miss",
        "symbol": "❌",
        "badge": "❌",
        "color": "#ff5252",
        "bg_color": "rgba(255, 82, 82, 0.2)",
        "icon_class": "badge-miss",
        "description": "Missed a tactical strike or missed punishing an opponent blunder.",
        "nag": "$2"
    },
    MoveClassification.BLUNDER: {
        "name": "Blunder",
        "symbol": "??",
        "badge": "??",
        "color": "#fa412d",
        "bg_color": "rgba(250, 65, 45, 0.2)",
        "icon_class": "badge-blunder",
        "description": "A severe mistake that damages your position or hangs material.",
        "nag": "$4"
    },
    MoveClassification.FORCED: {
        "name": "Forced",
        "symbol": "⇥",
        "badge": "⇥",
        "color": "#9e9e9e",
        "bg_color": "rgba(158, 158, 158, 0.2)",
        "icon_class": "badge-forced",
        "description": "The only legal move on the board.",
        "nag": ""
    },
}


@dataclass
class MoveAnalysis:
    ply: int
    move_number: int
    turn: str                       # 'white' or 'black'
    san: str                        # Standard Algebraic Notation e.g. "Nf3"
    uci: str                        # UCI notation e.g. "g1f3"
    from_square: str                # e.g. "g1"
    to_square: str                  # e.g. "f3"
    fen_before: str
    fen_after: str
    
    # Engine evaluation
    best_move_san: str
    best_move_uci: str
    best_eval: float                # Centipawns/100 from White POV
    eval_before: float              # Centipawns/100 from White POV
    eval_after: float               # Centipawns/100 from White POV
    mate_before: Optional[int] = None
    mate_after: Optional[int] = None
    
    # Player perspective scores
    eval_drop: float = 0.0          # Positive value = loss for player
    win_prob_before: float = 50.0   # 0 to 100%
    win_prob_after: float = 50.0    # 0 to 100%
    win_prob_drop: float = 0.0      # max(0, win_prob_before - win_prob_after)
    accuracy: float = 100.0         # CAPS2 accuracy 0 to 100%
    
    classification: MoveClassification = MoveClassification.BEST
    commentary: str = ""
    pv: List[str] = field(default_factory=list)  # Stockfish continuation line
    
    # Tactical context
    is_sacrifice: bool = False
    is_capture: bool = False
    is_check: bool = False

    def to_dict(self) -> Dict[str, Any]:
        meta = CLASSIFICATION_META.get(self.classification, {})
        return {
            "ply": self.ply,
            "move_number": self.move_number,
            "turn": self.turn,
            "san": self.san,
            "uci": self.uci,
            "from_square": self.from_square,
            "to_square": self.to_square,
            "fen_before": self.fen_before,
            "fen_after": self.fen_after,
            "best_move_san": self.best_move_san,
            "best_move_uci": self.best_move_uci,
            "best_eval": self.best_eval,
            "eval_before": self.eval_before,
            "eval_after": self.eval_after,
            "mate_before": self.mate_before,
            "mate_after": self.mate_after,
            "eval_drop": round(self.eval_drop, 2),
            "win_prob_before": round(self.win_prob_before, 1),
            "win_prob_after": round(self.win_prob_after, 1),
            "win_prob_drop": round(self.win_prob_drop, 1),
            "accuracy": round(self.accuracy, 1),
            "classification": self.classification.value,
            "classification_name": meta.get("name", self.classification.value),
            "symbol": meta.get("symbol", ""),
            "badge": meta.get("badge", ""),
            "color": meta.get("color", "#ffffff"),
            "bg_color": meta.get("bg_color", "rgba(255,255,255,0.1)"),
            "commentary": self.commentary,
            "pv": self.pv,
            "is_sacrifice": self.is_sacrifice,
            "is_capture": self.is_capture,
            "is_check": self.is_check,
        }


@dataclass
class PlayerStats:
    name: str = "Player"
    rating: Optional[str] = None
    accuracy: float = 0.0
    estimated_elo: int = 1500
    counts: Dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "rating": self.rating or "Unrated",
            "accuracy": round(self.accuracy, 1),
            "estimated_elo": self.estimated_elo,
            "counts": self.counts,
        }


@dataclass
class GameReviewResult:
    headers: Dict[str, str] = field(default_factory=dict)
    opening_name: str = "Standard Opening"
    eco_code: str = "A00"
    white_stats: PlayerStats = field(default_factory=PlayerStats)
    black_stats: PlayerStats = field(default_factory=PlayerStats)
    moves: List[MoveAnalysis] = field(default_factory=list)
    key_moments: List[int] = field(default_factory=list)
    eval_history: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "headers": self.headers,
            "opening_name": self.opening_name,
            "eco_code": self.eco_code,
            "white": self.white_stats.to_dict(),
            "black": self.black_stats.to_dict(),
            "moves": [m.to_dict() for m in self.moves],
            "key_moments": self.key_moments,
            "eval_history": self.eval_history,
        }

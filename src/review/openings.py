from typing import Dict, List, Optional, Tuple


class OpeningNode:
    def __init__(self, name: str = "", eco: str = ""):
        self.name = name
        self.eco = eco
        self.children: Dict[str, "OpeningNode"] = {}


# Core ECO opening book table
# Format: (eco, name, [uci_move_sequence])
OPENINGS_DATA = [
    # Open Games (1. e4 e5)
    ("C20", "King's Pawn Game", ["e2e4", "e7e5"]),
    ("C23", "Bishop's Opening", ["e2e4", "e7e5", "f1c4"]),
    ("C25", "Vienna Game", ["e2e4", "e7e5", "b1c3"]),
    ("C26", "Vienna Game: Falkbeer Variation", ["e2e4", "e7e5", "b1c3", "g8f6"]),
    ("C28", "Vienna Game: Vienna Gambit", ["e2e4", "e7e5", "b1c3", "g8f6", "f2f4"]),
    ("C30", "King's Gambit", ["e2e4", "e7e5", "f2f4"]),
    ("C33", "King's Gambit Accepted", ["e2e4", "e7e5", "f2f4", "e5f4"]),
    ("C34", "King's Gambit Accepted: King's Knight Gambit", ["e2e4", "e7e5", "f2f4", "e5f4", "g1f3"]),
    ("C40", "King's Knight Opening", ["e2e4", "e7e5", "g1f3"]),
    ("C41", "Philidor Defense", ["e2e4", "e7e5", "g1f3", "d7d6"]),
    ("C42", "Petrov's Defense", ["e2e4", "e7e5", "g1f3", "g8f6"]),
    ("C44", "Scotch Game", ["e2e4", "e7e5", "g1f3", "b8c6", "d2d4"]),
    ("C45", "Scotch Game: Classical Variation", ["e2e4", "e7e5", "g1f3", "b8c6", "d2d4", "e5d4", "f3d4"]),
    ("C46", "Three Knights Opening", ["e2e4", "e7e5", "g1f3", "b8c6", "b1c3"]),
    ("C47", "Four Knights Game", ["e2e4", "e7e5", "g1f3", "b8c6", "b1c3", "g8f6"]),
    ("C48", "Four Knights Game: Spanish Variation", ["e2e4", "e7e5", "g1f3", "b8c6", "b1c3", "g8f6", "f1b5"]),
    ("C50", "Italian Game", ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4"]),
    ("C50", "Italian Game: Hungarian Defense", ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8e7"]),
    ("C51", "Evans Gambit", ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5", "b2b4"]),
    ("C53", "Italian Game: Classical Variation", ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5", "c2c3"]),
    ("C54", "Italian Game: Giuoco Pianissimo", ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5", "c2c3", "g8f6", "d2d3"]),
    ("C55", "Two Knights Defense", ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6"]),
    ("C57", "Two Knights Defense: Fried Liver Attack", ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6", "f3g5", "d7d5", "e4d5", "f6d5", "g5f7"]),
    ("C60", "Ruy Lopez", ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"]),
    ("C65", "Ruy Lopez: Berlin Defense", ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "g8f6"]),
    ("C68", "Ruy Lopez: Exchange Variation", ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5c6"]),
    ("C70", "Ruy Lopez: Morphy Defense", ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "f1a4"]),
    ("C78", "Ruy Lopez: Archangelsk Variation", ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "f1a4", "g8f6", "e1g1", "b7b5", "a4b3", "c8b7"]),
    ("C80", "Ruy Lopez: Open Variation", ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "f1a4", "g8f6", "e1g1", "f6e4"]),
    ("C88", "Ruy Lopez: Closed Variation", ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "f1a4", "g8f6", "e1g1", "f8e7", "f1e1", "b7b5", "a4b3", "d7d6", "c2c3", "e1g1"]),

    # Semi-Open Games
    ("B01", "Scandinavian Defense", ["e2e4", "d7d5"]),
    ("B01", "Scandinavian Defense: Mieses-Kotroc Variation", ["e2e4", "d7d5", "e4d5", "d8d5"]),
    ("B02", "Alekhine's Defense", ["e2e4", "g8f6"]),
    ("B06", "Modern Defense", ["e2e4", "g7g6"]),
    ("B07", "Pirc Defense", ["e2e4", "d7d6", "d2d4", "g8f6", "b1c3", "g7g6"]),
    ("B09", "Pirc Defense: Austrian Attack", ["e2e4", "d7d6", "d2d4", "g8f6", "b1c3", "g7g6", "f2f4"]),
    ("B10", "Caro-Kann Defense", ["e2e4", "c7c6"]),
    ("B12", "Caro-Kann Defense: Advance Variation", ["e2e4", "c7c6", "d2d4", "d7d5", "e4e5"]),
    ("B13", "Caro-Kann Defense: Exchange Variation", ["e2e4", "c7c6", "d2d4", "d7d5", "e4d5", "c6d5"]),
    ("B18", "Caro-Kann Defense: Classical Variation", ["e2e4", "c7c6", "d2d4", "d7d5", "b1c3", "d5e4", "c3e4", "c8f5"]),
    ("C00", "French Defense", ["e2e4", "e7e6"]),
    ("C02", "French Defense: Advance Variation", ["e2e4", "e7e6", "d2d4", "d7d5", "e4e5"]),
    ("C03", "French Defense: Tarrasch Variation", ["e2e4", "e7e6", "d2d4", "d7d5", "b1d2"]),
    ("C10", "French Defense: Winawer Variation", ["e2e4", "e7e6", "d2d4", "d7d5", "b1c3", "f8b4"]),

    # Sicilian Defense
    ("B20", "Sicilian Defense", ["e2e4", "c7c5"]),
    ("B21", "Sicilian Defense: Smith-Morra Gambit", ["e2e4", "c7c5", "d2d4", "c5d4", "c2c3"]),
    ("B22", "Sicilian Defense: Alapin Variation", ["e2e4", "c7c5", "c2c3"]),
    ("B23", "Sicilian Defense: Closed", ["e2e4", "c7c5", "b1c3"]),
    ("B27", "Sicilian Defense: Open", ["e2e4", "c7c5", "g1f3"]),
    ("B30", "Sicilian Defense: Old Sicilian", ["e2e4", "c7c5", "g1f3", "b8c6"]),
    ("B33", "Sicilian Defense: Sveshnikov Variation", ["e2e4", "c7c5", "g1f3", "b8c6", "d2d4", "c5d4", "f3d4", "g8f6", "b1c3", "e7e5"]),
    ("B40", "Sicilian Defense: French Variation", ["e2e4", "c7c5", "g1f3", "e7e6"]),
    ("B50", "Sicilian Defense: Modern Variation", ["e2e4", "c7c5", "g1f3", "d7d6"]),
    ("B52", "Sicilian Defense: Canal Attack (Moscow)", ["e2e4", "c7c5", "g1f3", "d7d6", "f1b5"]),
    ("B70", "Sicilian Defense: Dragon Variation", ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4", "f3d4", "g8f6", "b1c3", "g7g6"]),
    ("B75", "Sicilian Defense: Yugoslav Attack", ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4", "f3d4", "g8f6", "b1c3", "g7g6", "c1e3", "f8g7", "f2f3"]),
    ("B90", "Sicilian Defense: Najdorf Variation", ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4", "f3d4", "g8f6", "b1c3", "a7a6"]),
    ("B92", "Sicilian Defense: Najdorf (Opocensky)", ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4", "f3d4", "g8f6", "b1c3", "a7a6", "f1e2"]),

    # Closed Games (1. d4 d5)
    ("D00", "Queen's Pawn Game", ["d2d4", "d7d5"]),
    ("D00", "London System", ["d2d4", "d7d5", "c1f4"]),
    ("D02", "London System: Main Line", ["d2d4", "d7d5", "g1f3", "g8f6", "c1f4"]),
    ("D05", "Colle System", ["d2d4", "d7d5", "g1f3", "g8f6", "e2e3", "e7e6", "f1d3", "c7c5", "c2c3"]),
    ("D06", "Queen's Gambit", ["d2d4", "d7d5", "c2c4"]),
    ("D10", "Slav Defense", ["d2d4", "d7d5", "c2c4", "c7c6"]),
    ("D15", "Slav Defense: Modern Line", ["d2d4", "d7d5", "c2c4", "c7c6", "g1f3", "g8f6", "b1c3"]),
    ("D20", "Queen's Gambit Accepted", ["d2d4", "d7d5", "c2c4", "d5c4"]),
    ("D30", "Queen's Gambit Declined", ["d2d4", "d7d5", "c2c4", "e7e6"]),
    ("D35", "Queen's Gambit Declined: Exchange Variation", ["d2d4", "d7d5", "c2c4", "e7e6", "b1c3", "g8f6", "c4d5", "e6d5"]),
    ("D50", "Queen's Gambit Declined: 4. Bg5", ["d2d4", "d7d5", "c2c4", "e7e6", "b1c3", "g8f6", "c1g5"]),
    ("D80", "Grünfeld Defense", ["d2d4", "g8f6", "c2c4", "g7g6", "b1c3", "d7d5"]),

    # Indian Defenses (1. d4 Nf6)
    ("A45", "Trompowsky Attack", ["d2d4", "g8f6", "c1g5"]),
    ("E00", "Catalan Opening", ["d2d4", "g8f6", "c2c4", "e7e6", "g2g3"]),
    ("E12", "Queen's Indian Defense", ["d2d4", "g8f6", "c2c4", "e7e6", "g1f3", "b7b6"]),
    ("E20", "Nimzo-Indian Defense", ["d2d4", "g8f6", "c2c4", "e7e6", "b1c3", "f8b4"]),
    ("E60", "King's Indian Defense", ["d2d4", "g8f6", "c2c4", "g7g6"]),
    ("E70", "King's Indian Defense: Classical Variation", ["d2d4", "g8f6", "c2c4", "g7g6", "b1c3", "f8g7", "e2e4", "d7d6", "g1f3", "e1g1"]),
    ("A56", "Benoni Defense", ["d2d4", "g8f6", "c2c4", "c7c5"]),
    ("A80", "Dutch Defense", ["d2d4", "f7f5"]),

    # Flank Openings
    ("A10", "English Opening", ["c2c4"]),
    ("A20", "English Opening: King's English", ["c2c4", "e7e5"]),
    ("A30", "English Opening: Symmetrical", ["c2c4", "c7c5"]),
    ("A04", "Reti Opening", ["g1f3"]),
    ("A07", "King's Indian Attack", ["g1f3", "d7d5", "g2g3"]),
    ("B00", "Nimzowitsch Defense", ["e2e4", "b8c6"]),
]


class OpeningNode:
    def __init__(self):
        self.name: Optional[str] = None
        self.eco: Optional[str] = None
        self.children: Dict[str, "OpeningNode"] = {}


class OpeningBook:
    def __init__(self):
        self.root = OpeningNode()
        self.root.name = "Starting Position"
        self.root.eco = "A00"
        self._build_tree()

    def _build_tree(self):
        # Sort by sequence length so base lines are built first, then variations
        sorted_data = sorted(OPENINGS_DATA, key=lambda x: len(x[2]))
        for eco, name, sequence in sorted_data:
            curr = self.root
            for move in sequence:
                if move not in curr.children:
                    curr.children[move] = OpeningNode()
                curr = curr.children[move]
            curr.name = name
            curr.eco = eco

    def lookup_sequence(self, uci_moves: List[str]) -> Tuple[bool, str, str, int]:
        """
        Walks the move sequence as far as it is in the book.
        Returns:
            (is_current_move_book, eco, opening_name, book_depth)
        """
        curr = self.root
        last_name = "Starting Position"
        last_eco = "A00"
        depth = 0

        for move in uci_moves:
            if move in curr.children:
                curr = curr.children[move]
                depth += 1
                if curr.name and curr.eco:
                    last_name = curr.name
                    last_eco = curr.eco
            else:
                break

        is_in_book = (depth == len(uci_moves)) and (len(uci_moves) > 0)
        return is_in_book, last_eco, last_name, depth


# Global singleton instance
opening_book = OpeningBook()


import unittest
import numpy as np

from src.vision.square_mapper import get_square_name, get_coordinates, split_board
from src.vision.perspective import crop_board, normalize_board
from src.vision.board_tracker import BoardTracker
from src.chess.fen import build_fen, PIECE_TO_FEN
from src.chess.position import is_valid_position, get_legal_moves, apply_move
from src.chess.move_tracker import MoveTracker
from src.engine.evaluation import MoveEvaluator, MoveQuality
from src.recognition.preprocessing import preprocess_square, center_crop_square


# ---------------------------------------------------------------------------
# Coordinate mapping
# ---------------------------------------------------------------------------
class TestCoordinateMapping(unittest.TestCase):
    def test_corners(self):
        self.assertEqual(get_square_name(0, 0), "a8")
        self.assertEqual(get_square_name(0, 7), "h8")
        self.assertEqual(get_square_name(7, 0), "a1")
        self.assertEqual(get_square_name(7, 7), "h1")

    def test_middle(self):
        self.assertEqual(get_square_name(3, 4), "e5")
        self.assertEqual(get_square_name(4, 3), "d4")

    def test_inverse(self):
        for r in range(8):
            for c in range(8):
                name = get_square_name(r, c)
                self.assertEqual(get_coordinates(name), (r, c))

    def test_invalid(self):
        with self.assertRaises(ValueError):
            get_square_name(-1, 0)
        with self.assertRaises(ValueError):
            get_square_name(8, 0)
        with self.assertRaises(ValueError):
            get_coordinates("z9")


# ---------------------------------------------------------------------------
# Board splitting
# ---------------------------------------------------------------------------
class TestBoardSplitting(unittest.TestCase):
    def test_split_400(self):
        board = np.zeros((400, 400, 3), dtype=np.uint8)
        squares = split_board(board)
        self.assertEqual(len(squares), 8)
        self.assertEqual(len(squares[0]), 8)
        self.assertEqual(squares[0][0].shape, (50, 50, 3))

    def test_split_800(self):
        board = np.zeros((800, 800, 3), dtype=np.uint8)
        squares = split_board(board)
        self.assertEqual(len(squares), 8)
        self.assertEqual(squares[3][3].shape, (100, 100, 3))

    def test_non_square_rejected(self):
        board = np.zeros((400, 300, 3), dtype=np.uint8)
        with self.assertRaises(ValueError):
            split_board(board)

    def test_total_count(self):
        board = np.zeros((400, 400, 3), dtype=np.uint8)
        squares = split_board(board)
        total = sum(len(row) for row in squares)
        self.assertEqual(total, 64)


# ---------------------------------------------------------------------------
# Perspective / cropping
# ---------------------------------------------------------------------------
class TestPerspective(unittest.TestCase):
    def test_crop_board(self):
        img = np.zeros((1000, 1000, 3), dtype=np.uint8)
        cropped = crop_board(img, (100, 100, 400, 400))
        self.assertEqual(cropped.shape, (400, 400, 3))

    def test_crop_none_box(self):
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        self.assertIsNone(crop_board(img, None))

    def test_normalize(self):
        img = np.zeros((800, 800, 3), dtype=np.uint8)
        norm = normalize_board(img)
        self.assertEqual(norm.shape, (400, 400, 3))

    def test_normalize_none(self):
        self.assertIsNone(normalize_board(None))


# ---------------------------------------------------------------------------
# FEN generation
# ---------------------------------------------------------------------------
class TestFEN(unittest.TestCase):
    def test_empty_board(self):
        board = [[{"piece": "empty"} for _ in range(8)] for _ in range(8)]
        fen = build_fen(board)
        self.assertTrue(fen.startswith("8/8/8/8/8/8/8/8"))

    def test_starting_position(self):
        board = [
            [{"piece": "black_rook"}, {"piece": "black_knight"}, {"piece": "black_bishop"},
             {"piece": "black_queen"}, {"piece": "black_king"}, {"piece": "black_bishop"},
             {"piece": "black_knight"}, {"piece": "black_rook"}],
            [{"piece": "black_pawn"}] * 8,
            [{"piece": "empty"}] * 8,
            [{"piece": "empty"}] * 8,
            [{"piece": "empty"}] * 8,
            [{"piece": "empty"}] * 8,
            [{"piece": "white_pawn"}] * 8,
            [{"piece": "white_rook"}, {"piece": "white_knight"}, {"piece": "white_bishop"},
             {"piece": "white_queen"}, {"piece": "white_king"}, {"piece": "white_bishop"},
             {"piece": "white_knight"}, {"piece": "white_rook"}],
        ]
        fen = build_fen(board, turn="w", castling="KQkq")
        self.assertTrue(fen.startswith("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"))
        self.assertTrue(is_valid_position(fen))

    def test_wrong_rows(self):
        board = [[{"piece": "empty"}] * 8 for _ in range(7)]
        with self.assertRaises(ValueError):
            build_fen(board)

    def test_wrong_cols(self):
        board = [[{"piece": "empty"}] * 8 for _ in range(8)]
        board[3] = [{"piece": "empty"}] * 7
        with self.assertRaises(ValueError):
            build_fen(board)

    def test_piece_to_fen_mapping(self):
        self.assertEqual(PIECE_TO_FEN["white_king"], "K")
        self.assertEqual(PIECE_TO_FEN["black_queen"], "q")
        self.assertEqual(PIECE_TO_FEN["empty"], ".")


# ---------------------------------------------------------------------------
# Position validation
# ---------------------------------------------------------------------------
class TestPositionValidation(unittest.TestCase):
    def test_valid_starting(self):
        self.assertTrue(is_valid_position(
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        ))

    def test_invalid_string(self):
        self.assertFalse(is_valid_position("not_a_fen"))

    def test_nine_rows(self):
        self.assertFalse(is_valid_position("8/8/8/8/8/8/8/8/8 w KQkq - 0 1"))

    def test_legal_moves_starting(self):
        moves = get_legal_moves("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
        self.assertIn("e2e4", moves)
        self.assertIn("g1f3", moves)
        self.assertEqual(len(moves), 20)

    def test_apply_legal_move(self):
        fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        new_fen = apply_move(fen, "e2e4")
        self.assertIsNotNone(new_fen)
        self.assertIn("4P3", new_fen.split()[0])

    def test_apply_illegal_move(self):
        fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        self.assertIsNone(apply_move(fen, "e1e5"))


# ---------------------------------------------------------------------------
# Move tracker (stability)
# ---------------------------------------------------------------------------
class TestMoveTracker(unittest.TestCase):
    def test_stability_threshold(self):
        tracker = MoveTracker(stability_threshold=3)
        fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

        self.assertFalse(tracker.process_frame(fen))  # 1
        self.assertFalse(tracker.process_frame(fen))  # 2
        self.assertTrue(tracker.process_frame(fen))   # 3 -> stable

        # Same position: no new trigger
        self.assertFalse(tracker.process_frame(fen))

    def test_position_change(self):
        tracker = MoveTracker(stability_threshold=3)
        fen1 = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        fen2 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"

        for _ in range(2):
            tracker.process_frame(fen1)
        tracker.process_frame(fen1)  # stable

        self.assertFalse(tracker.process_frame(fen2))  # 1
        self.assertFalse(tracker.process_frame(fen2))  # 2
        self.assertTrue(tracker.process_frame(fen2))   # 3 -> new stable

    def test_noise_rejected(self):
        tracker = MoveTracker(stability_threshold=3)
        fen1 = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        fen2 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"

        for _ in range(3):
            tracker.process_frame(fen1)

        # Noisy single frame should not trigger
        self.assertFalse(tracker.process_frame(fen2))
        self.assertFalse(tracker.process_frame(fen1))  # resets candidate

    def test_invalid_fen_rejected(self):
        tracker = MoveTracker(stability_threshold=3)
        self.assertFalse(tracker.process_frame("garbage"))

    def test_reset(self):
        tracker = MoveTracker(stability_threshold=3)
        fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        for _ in range(3):
            tracker.process_frame(fen)
        tracker.reset()
        self.assertIsNone(tracker.current_stable_fen)


# ---------------------------------------------------------------------------
# Board tracker
# ---------------------------------------------------------------------------
class TestBoardTracker(unittest.TestCase):
    def test_normal_tracking(self):
        tracker = BoardTracker(patience=3)
        box = (10, 10, 400, 400)
        self.assertEqual(tracker.update(box), box)
        self.assertEqual(tracker.update(None), box)   # patience 1
        self.assertEqual(tracker.update(None), box)   # patience 2
        self.assertEqual(tracker.update(None), box)   # patience 3
        self.assertIsNone(tracker.update(None))        # lost

    def test_recovery(self):
        tracker = BoardTracker(patience=2)
        box = (10, 10, 400, 400)
        tracker.update(box)
        tracker.update(None)
        new_box = (20, 20, 400, 400)
        self.assertEqual(tracker.update(new_box), new_box)


# ---------------------------------------------------------------------------
# Move evaluator
# ---------------------------------------------------------------------------
class TestMoveEvaluator(unittest.TestCase):
    def test_best(self):
        ev = MoveEvaluator()
        self.assertEqual(ev.classify_move(1.0, 1.0), MoveQuality.BEST)

    def test_better(self):
        ev = MoveEvaluator()
        self.assertEqual(ev.classify_move(1.0, 0.85), MoveQuality.BETTER)

    def test_good(self):
        ev = MoveEvaluator()
        self.assertEqual(ev.classify_move(1.0, 0.6), MoveQuality.GOOD)

    def test_inaccuracy(self):
        ev = MoveEvaluator()
        self.assertEqual(ev.classify_move(1.0, 0.3), MoveQuality.INACCURACY)

    def test_mistake(self):
        ev = MoveEvaluator()
        self.assertEqual(ev.classify_move(1.0, -0.5), MoveQuality.MISTAKE)

    def test_blunder(self):
        ev = MoveEvaluator()
        self.assertEqual(ev.classify_move(1.0, -2.0), MoveQuality.BLUNDER)

    def test_none_score(self):
        ev = MoveEvaluator()
        self.assertEqual(ev.classify_move(None, 1.0), MoveQuality.UNKNOWN)


# ---------------------------------------------------------------------------
# Preprocessing
# ---------------------------------------------------------------------------
class TestPreprocessing(unittest.TestCase):
    def test_preprocess_square(self):
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        result = preprocess_square(img, target_size=(64, 64))
        self.assertEqual(result.shape, (64, 64, 3))
        self.assertEqual(result.dtype, np.float32)

    def test_preprocess_grayscale(self):
        img = np.zeros((50, 50), dtype=np.uint8)
        result = preprocess_square(img, target_size=(64, 64))
        self.assertEqual(result.shape, (64, 64, 3))

    def test_center_crop(self):
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        cropped = center_crop_square(img, margin_ratio=0.1)
        self.assertEqual(cropped.shape, (80, 80, 3))


if __name__ == "__main__":
    unittest.main()

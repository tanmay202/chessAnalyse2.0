import unittest
import chess

from src.review.accuracy import (
    score_to_win_prob,
    calculate_move_accuracy,
    calculate_game_accuracy,
    estimate_performance_rating,
)
from src.review.openings import opening_book
from src.review.pgn_parser import parse_pgn, export_annotated_pgn
from src.review.reviewer import StockfishGameReviewer
from src.review.models import MoveClassification
from src.web.app import app


class TestAccuracyFormulas(unittest.TestCase):
    def test_win_probability_symmetry(self):
        # 0 cp should equal 50%
        self.assertAlmostEqual(score_to_win_prob(0.0), 50.0, places=1)
        # Positive and negative symmetry
        w_plus = score_to_win_prob(1.5)
        w_minus = score_to_win_prob(-1.5)
        self.assertAlmostEqual(w_plus + w_minus, 100.0, places=1)

    def test_win_probability_mate(self):
        self.assertEqual(score_to_win_prob(0.0, mate=1), 100.0)
        self.assertEqual(score_to_win_prob(0.0, mate=-2), 0.0)

    def test_move_accuracy_perfect(self):
        # Zero loss should be 100%
        acc = calculate_move_accuracy(65.0, 65.0)
        self.assertAlmostEqual(acc, 100.0, places=1)

    def test_move_accuracy_book_forced(self):
        self.assertEqual(calculate_move_accuracy(50.0, 20.0, is_book=True), 100.0)
        self.assertEqual(calculate_move_accuracy(50.0, 20.0, is_forced=True), 100.0)

    def test_move_accuracy_drop(self):
        # 10% win prob drop should give ~60-70% accuracy
        acc = calculate_move_accuracy(70.0, 60.0)
        self.assertTrue(60.0 <= acc <= 70.0)

    def test_game_accuracy(self):
        accs = [100.0, 95.0, 90.0]
        self.assertEqual(calculate_game_accuracy(accs), 95.0)

    def test_estimated_elo_bounds(self):
        elo_high = estimate_performance_rating(98.0)
        elo_mid = estimate_performance_rating(78.0)
        elo_low = estimate_performance_rating(50.0)
        self.assertGreater(elo_high, elo_mid)
        self.assertGreater(elo_mid, elo_low)
        self.assertTrue(400 <= elo_low <= 3200)


class TestOpeningBook(unittest.TestCase):
    def test_italian_game(self):
        is_book, eco, name, depth = opening_book.lookup_sequence(["e2e4", "e7e5", "g1f3", "b8c6", "f1c4"])
        self.assertTrue(is_book)
        self.assertEqual(eco, "C50")
        self.assertIn("Italian", name)

    def test_ruy_lopez(self):
        is_book, eco, name, depth = opening_book.lookup_sequence(["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"])
        self.assertTrue(is_book)
        self.assertEqual(eco, "C60")
        self.assertIn("Ruy Lopez", name)

    def test_out_of_book(self):
        is_book, eco, name, depth = opening_book.lookup_sequence(["h2h4", "h7h5"])
        self.assertFalse(is_book)


class TestPgnParser(unittest.TestCase):
    def test_parse_pgn(self):
        pgn = '[Event "Test"]\n[White "Alice"]\n[Black "Bob"]\n\n1. e4 e5 2. Nf3 Nc6 *'
        headers, moves, board = parse_pgn(pgn)
        self.assertEqual(headers["White"], "Alice")
        self.assertEqual(headers["Black"], "Bob")
        self.assertEqual(len(moves), 4)

    def test_export_annotated_pgn(self):
        pgn = '[White "W"]\n[Black "B"]\n\n1. e4 e5 *'
        headers, moves, board = parse_pgn(pgn)
        evals = [{"symbol": "★", "classification": "best", "commentary": "Best move"}]
        exported = export_annotated_pgn(headers, moves, evals, board)
        self.assertIn("Best move", exported)


class TestReviewEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.reviewer = StockfishGameReviewer()
        cls.reviewer.start()

    @classmethod
    def tearDownClass(cls):
        cls.reviewer.stop()

    def test_review_short_game(self):
        pgn = """[Event "Casual"]
[White "P1"]
[Black "P2"]

1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0"""
        result = self.reviewer.review_game(pgn, depth=10)
        self.assertIsNotNone(result)
        self.assertEqual(len(result.moves), 7)
        self.assertGreater(result.white_stats.accuracy, 80.0)
        self.assertIn("C20", result.eco_code)
        # Check that blunder was caught on move 3... Nf6
        blunder_move = result.moves[5]
        self.assertEqual(blunder_move.san, "Nf6")
        self.assertEqual(blunder_move.classification, MoveClassification.BLUNDER)


class TestWebAPI(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_index_page(self):
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"Chess", resp.data)

    def test_sample_games_api(self):
        resp = self.client.get("/api/sample-games")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("games", data)
        self.assertGreater(len(data["games"]), 0)

    def test_check_retry_move_api(self):
        resp = self.client.post("/api/check-retry-move", json={
            "fen_before": "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
            "played_uci": "g1f3",
            "expected_best_uci": "g1f3",
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data["is_best"])


if __name__ == "__main__":
    unittest.main()

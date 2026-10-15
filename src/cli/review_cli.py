import argparse
import os
import sys
from typing import Optional

from src.review.reviewer import StockfishGameReviewer
from src.review.models import MoveClassification, CLASSIFICATION_META
from src.review.pgn_parser import export_annotated_pgn


# ANSI Color Codes for terminal
RESET = "\033[0m"
BOLD = "\033[1m"
GREEN = "\033[32m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
RED = "\033[31m"
MAGENTA = "\033[35m"
GRAY = "\033[90m"
WHITE_BG = "\033[47m\033[30m"


def print_banner():
    print(f"{BOLD}{GREEN}======================================================================{RESET}")
    print(f"{BOLD}{GREEN}                   CHESS.COM GAME REVIEW CLONE                        {RESET}")
    print(f"{BOLD}{GREEN}                     Powered by Stockfish 18                          {RESET}")
    print(f"{BOLD}{GREEN}======================================================================{RESET}\n")


def print_review_summary(result):
    headers = result.headers
    white_name = headers.get("White", "White")
    black_name = headers.get("Black", "Black")
    event = headers.get("Event", "Game Review")
    date = headers.get("Date", "")
    result_str = headers.get("Result", "*")

    print(f"{BOLD}Event:{RESET} {event} | {BOLD}Date:{RESET} {date} | {BOLD}Result:{RESET} {result_str}")
    print(f"{BOLD}Opening:{RESET} {result.eco_code} - {result.opening_name}\n")

    print(f"{BOLD}{'PLAYER ACCURACY & ESTIMATED RATING':^70}{RESET}")
    print("-" * 70)
    w_acc = f"{result.white_stats.accuracy:.1f}%"
    b_acc = f"{result.black_stats.accuracy:.1f}%"
    w_elo = f"~{result.white_stats.estimated_elo} Elo"
    b_elo = f"~{result.black_stats.estimated_elo} Elo"

    print(f"  {BOLD}White:{RESET} {white_name:<20} Accuracy: {BOLD}{GREEN}{w_acc:<8}{RESET} Perf: {CYAN}{w_elo}{RESET}")
    print(f"  {BOLD}Black:{RESET} {black_name:<20} Accuracy: {BOLD}{GREEN}{b_acc:<8}{RESET} Perf: {CYAN}{b_elo}{RESET}")
    print("-" * 70)
    print()

    print(f"{BOLD}{'MOVE CLASSIFICATION BREAKDOWN':^70}{RESET}")
    print(f"{'Classification':<20} | {'White':^12} | {'Black':^12}")
    print("-" * 70)

    for cls in MoveClassification:
        meta = CLASSIFICATION_META[cls]
        w_cnt = result.white_stats.counts.get(cls.value, 0)
        b_cnt = result.black_stats.counts.get(cls.value, 0)
        symbol = meta["symbol"]
        name_str = f"[{symbol}] {meta['name']}"
        print(f"{name_str:<20} | {w_cnt:^12} | {b_cnt:^12}")

    print("-" * 70)
    print()


def print_move_details(result, show_all: bool = False):
    print(f"{BOLD}{'KEY MOMENTS & COACH COMMENTARY':^70}{RESET}")
    print("-" * 70)

    for m in result.moves:
        is_key = m.classification in (
            MoveClassification.BRILLIANT,
            MoveClassification.GREAT,
            MoveClassification.MISS,
            MoveClassification.BLUNDER,
            MoveClassification.MISTAKE,
        )

        if not show_all and not is_key:
            continue

        meta = CLASSIFICATION_META[m.classification]
        ply_tag = f"{m.move_number}.{'..' if m.turn == 'black' else ''}"
        score_tag = f"[{m.eval_after:+.2f}]" if m.mate_after is None else f"[M{m.mate_after}]"
        badge_tag = f"[{meta['symbol']} {meta['name'].upper()}]"

        color = GREEN
        if m.classification in (MoveClassification.BRILLIANT, MoveClassification.GREAT):
            color = CYAN
        elif m.classification in (MoveClassification.INACCURACY, MoveClassification.MISTAKE):
            color = YELLOW
        elif m.classification in (MoveClassification.MISS, MoveClassification.BLUNDER):
            color = RED

        print(f"{BOLD}{ply_tag:<5} {m.san:<7}{RESET} {color}{badge_tag:<18}{RESET} {GRAY}{score_tag:<8}{RESET}")
        print(f"      {BOLD}Coach:{RESET} {m.commentary}")
        if m.best_move_san and m.san != m.best_move_san:
            print(f"      {GRAY}Engine best was {m.best_move_san} ({m.best_eval:+.2f}){RESET}")
        print()

    print("-" * 70)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    parser = argparse.ArgumentParser(description="Chess.com Game Review System using Stockfish")
    parser.add_argument("pgn_file", help="Path to PGN file to review")
    parser.add_argument("--depth", type=int, default=12, help="Stockfish search depth (default: 12)")
    parser.add_argument("--all", action="store_true", help="Print commentary for every move (default: key moments only)")
    parser.add_argument("--export", type=str, default="", help="Export annotated PGN to destination file")

    args = parser.parse_args()

    if not os.path.exists(args.pgn_file):
        print(f"Error: PGN file not found at {args.pgn_file}")
        sys.exit(1)

    with open(args.pgn_file, "r", encoding="utf-8") as f:
        pgn_text = f.read()

    print_banner()
    print(f"Analyzing {os.path.basename(args.pgn_file)} with Stockfish (depth {args.depth})...\n")

    reviewer = StockfishGameReviewer()
    try:
        def on_progress(curr, total, msg):
            pct = int((curr / total) * 100)
            sys.stdout.write(f"\rProgress: [{pct:>3}%] {msg:<40}")
            sys.stdout.flush()

        result = reviewer.review_game(pgn_text, depth=args.depth, progress_callback=on_progress)
        print("\n\nAnalysis complete!\n")
        print_review_summary(result)
        print_move_details(result, show_all=args.all)

        if args.export:
            headers, moves, starting_board = parse_pgn(pgn_text)
            evals = [m.to_dict() for m in result.moves]
            annotated = export_annotated_pgn(headers, moves, evals, starting_board)
            with open(args.export, "w", encoding="utf-8") as out:
                out.write(annotated)
            print(f"Annotated PGN exported to {args.export}\n")

    finally:
        reviewer.stop()


if __name__ == "__main__":
    main()

import os
import json
import chess
from flask import Flask, render_template, request, jsonify, send_file, Response

from src.review.reviewer import StockfishGameReviewer
from src.review.pgn_parser import parse_pgn, export_annotated_pgn
from src.review.accuracy import score_to_win_prob
from src.utils.config import config
from src.utils.logging_config import logger

dist_dir = os.path.join(os.path.dirname(__file__), "dist")

if os.path.exists(dist_dir):
    app = Flask(__name__, static_folder=dist_dir)
else:
    app = Flask(
        __name__,
        template_folder=os.path.join(os.path.dirname(__file__), "templates"),
        static_folder=os.path.join(os.path.dirname(__file__), "static"),
    )

reviewer_instance = StockfishGameReviewer()


@app.route("/")
def index():
    if os.path.exists(os.path.join(dist_dir, "index.html")):
        return send_file(os.path.join(dist_dir, "index.html"))
    return render_template("index.html")


@app.route("/assets/<path:path>")
def serve_assets(path):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(os.path.join(assets_dir, path)):
        return send_file(os.path.join(assets_dir, path))
    return jsonify({"error": "Asset not found"}), 404


@app.route("/<path:filename>")
def serve_root_file(filename):
    file_path = os.path.join(dist_dir, filename)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        mimetype = None
        if filename.endswith(".wasm"):
            mimetype = "application/wasm"
        elif filename.endswith(".js"):
            mimetype = "application/javascript"
        elif filename.endswith(".png"):
            mimetype = "image/png"
        elif filename.endswith(".svg"):
            mimetype = "image/svg+xml"
        return send_file(file_path, mimetype=mimetype)
    return jsonify({"error": "File not found"}), 404


@app.route("/api/sample-games", methods=["GET"])
def get_sample_games():
    sample_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "sample_games")
    games = []
    if os.path.exists(sample_dir):
        for fname in os.listdir(sample_dir):
            if fname.endswith(".pgn"):
                fpath = os.path.join(sample_dir, fname)
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()
                try:
                    headers, _, _ = parse_pgn(content)
                    games.append({
                        "filename": fname,
                        "title": f"{headers.get('White', 'White')} vs {headers.get('Black', 'Black')} ({headers.get('Date', '')})",
                        "event": headers.get("Event", "Game"),
                        "result": headers.get("Result", "*"),
                        "eco": headers.get("ECO", ""),
                        "opening": headers.get("Opening", ""),
                    })
                except Exception:
                    games.append({
                        "filename": fname,
                        "title": fname,
                        "event": "Chess Game",
                        "result": "*",
                    })
    return jsonify({"games": games})


@app.route("/api/load-sample/<filename>", methods=["GET"])
def load_sample_game(filename):
    sample_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "sample_games")
    safe_name = os.path.basename(filename)
    fpath = os.path.join(sample_dir, safe_name)
    if not os.path.exists(fpath):
        return jsonify({"error": "Sample game not found"}), 404

    with open(fpath, "r", encoding="utf-8") as f:
        pgn_text = f.read()

    return jsonify({"pgn": pgn_text, "filename": safe_name})


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response


@app.route("/api/review", methods=["POST", "OPTIONS"])
def review_game_endpoint():
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json(silent=True) or {}
    pgn_text = data.get("pgn", "")
    depth = int(data.get("depth", 12))

    if not pgn_text.strip():
        return jsonify({"error": "No PGN provided"}), 400

    try:
        result = reviewer_instance.review_game(pgn_text, depth=depth)
        return jsonify(result.to_dict())
    except Exception as e:
        logger.error(f"Review error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/analyze-fen", methods=["POST", "OPTIONS"])
def analyze_fen_endpoint():
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json(silent=True) or {}
    fen = data.get("fen", "")
    depth = int(data.get("depth", 12))
    multipv = int(data.get("multipv", 5))

    if not fen.strip():
        return jsonify({"error": "No FEN provided"}), 400

    try:
        result = reviewer_instance.analyze_fen(fen.strip(), depth=depth, time_limit=0.4, multipv=multipv)
        return jsonify(result)
    except Exception as e:
        logger.error(f"FEN analysis error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/engine-status", methods=["GET"])
def engine_status_endpoint():
    stockfish_path = config.stockfish_path
    exists = os.path.exists(stockfish_path)
    return jsonify({
        "status": "ready" if exists else "missing_binary",
        "backend_engine": "Stockfish 18 (.exe)",
        "binary_path": stockfish_path,
        "exists": exists,
        "threads": config.engine_threads,
        "default_depth": config.engine_depth,
    })


@app.route("/api/check-retry-move", methods=["POST"])
def check_retry_move():
    """
    Validates a player's move during 'Retry Mistake' mode.
    """
    data = request.get_json() or {}
    fen_before = data.get("fen_before", "")
    played_uci = data.get("played_uci", "")
    expected_best_uci = data.get("expected_best_uci", "")

    if not fen_before or not played_uci:
        return jsonify({"error": "Missing parameters"}), 400

    try:
        board = chess.Board(fen_before)
        move = chess.Move.from_uci(played_uci)
        if move not in board.legal_moves:
            return jsonify({"is_legal": False, "is_best": False, "message": "Illegal move!"})

        is_best = (played_uci == expected_best_uci)

        if is_best:
            return jsonify({
                "is_legal": True,
                "is_best": True,
                "message": "Correct! That's the engine's best move! Well played!",
            })
        else:
            san_played = board.san(move)
            return jsonify({
                "is_legal": True,
                "is_best": False,
                "message": f"{san_played} is not the best move. Try again!",
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/export-pgn", methods=["POST"])
def export_pgn_endpoint():
    data = request.get_json() or {}
    review_data = data.get("review", {})
    pgn_original = data.get("pgn", "")

    if not pgn_original or not review_data:
        return jsonify({"error": "Missing data"}), 400

    try:
        headers, moves, starting_board = parse_pgn(pgn_original)
        evaluations = review_data.get("moves", [])
        annotated = export_annotated_pgn(headers, moves, evaluations, starting_board)
        return jsonify({"annotated_pgn": annotated})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def run_server(port=5000, debug=False):
    print(f"Starting Chess.com Game Review server on http://localhost:{port}")
    app.run(host="127.0.0.1", port=port, debug=debug)


if __name__ == "__main__":
    run_server(port=5000)

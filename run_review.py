import sys
import webbrowser
import threading
import time
from src.web.app import app

def open_browser(port):
    time.sleep(1.2)
    url = f"http://localhost:{port}"
    print(f"\nOpening Chess.com Game Review in your browser: {url}\n")
    try:
        webbrowser.open(url)
    except Exception:
        pass

def main():
    port = 5000
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])

    threading.Thread(target=open_browser, args=(port,), daemon=True).start()
    print("=" * 65)
    print("      CHESS.COM GAME REVIEW SYSTEM - LOCAL SERVER      ")
    print("                Powered by Stockfish 18                ")
    print(f"      Access the Game Review UI at: http://localhost:{port}     ")
    print("=" * 65)
    app.run(host="127.0.0.1", port=port, debug=False)

if __name__ == "__main__":
    main()

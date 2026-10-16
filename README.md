# Chess.com Game Review System & Chess Vision AI

A complete, faithful local clone of the **Chess.com Game Review** system powered by **Stockfish 18**, featuring real-time move evaluations, CAPS2 accuracy scoring, opening theory detection, coach commentary, an interactive **React.js + Tailwind CSS** review web app with multiple themes, and command-line review tools.

---

## 1. Features

- **React.js & Tailwind CSS Interface (Pure JavaScript)**:
  - Built with modern **React.js (pure JavaScript `.jsx`)** and **Tailwind CSS**.
  - Modern, responsive, high-framerate interface matching modern Chess.com.
  - Interactive evaluation bar with smooth animations and floating advantage numbers.
  - 8x8 interactive board with crisp vector SVG chess pieces (zero external dependencies).
  - Floating badges pinned on destination squares.
  - Stockfish best-move green arrows and played-move red blunder arrows.
  - Side-by-side Move Classification breakdown table (White vs Black counts).
  - HTML5 Canvas interactive evaluation advantage graph.
  - Move list with badge chips.
  - "Retry Mistake" interactive puzzle mode with live move validation!
  - Export annotated PGN with Chess.com NAGs (`$1`, `$2`, `$3`, `$4`, `$6`) and comments.

- **Multiple Visual Themes & Design**:
  - **7 Chessboard Themes**:
    - 🌿 **Classic Green**: Standard Chess.com buff & green (`#ebecd0` / `#779556`)
    - 🪵 **Royal Walnut**: Natural birch & deep walnut wood (`#f0d9b5` / `#b58863`)
    - 🌊 **Championship Blue**: FIDE ice cloud & championship navy (`#eae9d2` / `#4b7399`)
    - 🔮 **Cyber Neon**: Neon violet & deep dark indigo (`#2e2954` / `#14112e`)
    - 🖤 **Midnight Mono**: Pitch black & soft zinc OLED (`#d4d4d8` / `#27272a`)
    - 🍷 **Velvet Ruby**: Pale rose & deep velvet wine (`#ffe4e6` / `#881337`)
    - 🌲 **Forest Pine**: Sage cream & deep pine emerald (`#dcfce7` / `#14532d`)
  - **5 Application Interface Themes**:
    - Dark Charcoal, OLED Pitch Black, Deep Space Navy, Espresso Lounge, and Neon Void.

- **Web Audio API Sound Effects**:
  - Zero-latency synthesized sound effects for piece moves, tactical captures, king checks, blunders, and celestial harp fanfare + confetti on brilliant moves!
  - Mute/Unmute sound toggle button with saved preferences.

- **Exact Move Classifications (Ditto Chess.com Badges & Criteria)**:
  - 💎 **Brilliant (`!!`)**: True tactical piece sacrifices that maintain or expand winning advantage.
  - 🎯 **Great Find (`!`)**: The critical only winning/saving move in a complex position.
  - ★ **Best (`★`)**: Stockfish's top recommendation.
  - ⚡ **Excellent (`✓✓`)**: Nearly as strong as the best move (< 0.20 pawn drop).
  - ✓ **Good (`✓`)**: Solid and playable move (< 0.50 pawn drop).
  - 📖 **Book (`📖`)**: Standard opening theory (ECO database A00–E99).
  - ?! **Inaccuracy (`?!`)**: Suboptimal move giving away slight advantage.
  - ? **Mistake (`?`)**: Notable mistake (1.0 – 2.0 pawn loss).
  - ❌ **Miss (`❌`)**: Missed winning tactic, free piece, or opponent blunder.
  - ?? **Blunder (`??`)**: Decisive mistake, hanging mate, or losing piece (> 2.5 pawn loss).
  - ⇥ **Forced (`⇥`)**: The single legal move available.

- **CAPS2 Accuracy Calculation**:
  - Full implementation of Chess.com's CAPS2 (Computer Aggregated Precision Score) sigmoid win probability model:
    $$\text{Acc} = 103.1668 \times e^{-0.04354 \times \Delta W} - 3.1669$$
  - Overall game accuracy percentages for both White and Black.

- **Performance Elo Rating**:
  - Calibrated performance rating estimations for White and Black based on accuracy and opponent strength.

- **Opening Theory & ECO Code**:
  - Recognizes over 100+ master openings and variations (Italian, Ruy Lopez, Sicilian Najdorf/Dragon/Alapin, Caro-Kann, French, Queen's Gambit, King's Indian, etc.) with ECO codes.

- **Coach Commentary (Danny Rensch style)**:
  - Generates natural, context-aware commentary explaining *why* a move is brilliant, best, missed win, or blunder, including tactical piece references and emotions.

---

## 2. Quick Start

### 1. Launch the React Web Game Review
To start the review server and automatically open the UI in your browser:
```bash
.venv\Scripts\python.exe run_review.py
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

### 2. Frontend Development Mode (Optional)
If you want to edit the React frontend with Vite hot-reloading:
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (automatically proxies API requests to Flask on port 5000).

To build the frontend for production:
```bash
cd frontend
npm run build
```

### 3. Run Game Review from the Command Line (CLI)
To analyze any PGN file and print an instant terminal report card:
```bash
.venv\Scripts\python.exe -m src.cli.review_cli sample_games/opera_game.pgn --depth 12
```

To export an annotated PGN with Chess.com comments:
```bash
.venv\Scripts\python.exe -m src.cli.review_cli sample_games/opera_game.pgn --export reviewed_opera.pgn
```

---

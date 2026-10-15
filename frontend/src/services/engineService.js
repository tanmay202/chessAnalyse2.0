// Browser-based Stockfish.js Web Worker Adapter using WebAssembly
import { Chess } from 'chess.js';

class BrowserStockfishService {
  constructor() {
    this.worker = null;
    this.isReady = false;
    this.isAnalyzing = false;
    this.currentPositionId = 0;
    this.status = 'uninitialized'; // 'uninitialized' | 'ready' | 'analyzing' | 'error'
    this.activeCallbacks = new Map();
    this.onInfoCallback = null;
    this.onBestMoveCallback = null;
  }

  async initialize() {
    if (this.isReady && this.worker) return true;

    const tryInitWorker = (workerPath) => {
      return new Promise((resolve, reject) => {
        try {
          const worker = new Worker(workerPath);
          let ready = false;
          let pingInterval = null;

          const initTimeout = setTimeout(() => {
            if (pingInterval) clearInterval(pingInterval);
            if (!ready) {
              worker.terminate();
              reject(new Error(`Worker ${workerPath} initialization timed out.`));
            }
          }, 12000);

          worker.onmessage = (event) => {
            const line = typeof event.data === 'string' ? event.data : '';
            this.handleUciLine(line);

            if (line.includes('uciok')) {
              try {
                worker.postMessage('setoption name Threads value 1');
                worker.postMessage('setoption name Hash value 16');
                worker.postMessage('isready');
              } catch (_) {}
            } else if (line.includes('readyok')) {
              if (pingInterval) clearInterval(pingInterval);
              clearTimeout(initTimeout);
              ready = true;
              this.worker = worker;
              this.isReady = true;
              this.status = 'ready';
              resolve(true);
            }
          };

          worker.onerror = (err) => {
            if (pingInterval) clearInterval(pingInterval);
            clearTimeout(initTimeout);
            const errMsg = err?.message || (err?.filename ? `${err.message} (${err.filename}:${err.lineno})` : 'Worker failed to load script');
            console.warn(`Stockfish worker failed on ${workerPath}:`, errMsg);
            worker.terminate();
            reject(new Error(errMsg));
          };

          // Send uci commands periodically until worker has initialized
          worker.postMessage('uci');
          pingInterval = setInterval(() => {
            if (ready) {
              clearInterval(pingInterval);
            } else {
              try {
                worker.postMessage('uci');
                worker.postMessage('isready');
              } catch (_) {}
            }
          }, 500);
        } catch (err) {
          reject(err);
        }
      });
    };

    this.status = 'initializing';

    // 1. Try stockfish.wasm.js first
    try {
      const wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
      if (wasmSupported) {
        await tryInitWorker('/stockfish.wasm.js');
        return true;
      }
    } catch (wasmErr) {
      console.warn("Stockfish WASM initialization failed, trying asm.js fallback:", wasmErr?.message);
    }

    // 2. Fallback to /stockfish.js (pure JS / asm.js build)
    try {
      await tryInitWorker('/stockfish.js');
      return true;
    } catch (fallbackErr) {
      console.warn("Browser worker offline, switching to native Stockfish backend API:", fallbackErr?.message);
      this.fallbackToBackend = true;
      this.status = 'ready';
      return false;
    }
  }

  handleUciLine(line) {
    if (!line) return;

    // Handle info lines with depth, score, nodes, nps, pv, multipv
    if (line.startsWith('info ') && line.includes('score ')) {
      const parsed = this.parseInfoLine(line);
      if (this.onInfoCallback && parsed) {
        this.onInfoCallback(parsed);
      }
    } else if (line.startsWith('bestmove ')) {
      this.isAnalyzing = false;
      this.status = 'ready';
      const parts = line.split(' ');
      const bestMoveUci = parts[1] || '';
      const ponderUci = parts[3] || null;

      if (this.onBestMoveCallback) {
        this.onBestMoveCallback({
          bestMoveUci,
          ponderUci,
        });
      }
    }
  }

  parseInfoLine(line) {
    const tokens = line.split(' ');
    const data = {
      depth: 0,
      seldepth: 0,
      multipv: 1,
      score: { cp: 0, mate: null },
      nodes: 0,
      nps: 0,
      time: 0,
      pv: [],
    };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token === 'depth' && tokens[i + 1]) data.depth = parseInt(tokens[i + 1], 10);
      else if (token === 'multipv' && tokens[i + 1]) data.multipv = parseInt(tokens[i + 1], 10);
      else if (token === 'nodes' && tokens[i + 1]) data.nodes = parseInt(tokens[i + 1], 10);
      else if (token === 'nps' && tokens[i + 1]) data.nps = parseInt(tokens[i + 1], 10);
      else if (token === 'time' && tokens[i + 1]) data.time = parseInt(tokens[i + 1], 10);
      else if (token === 'score') {
        const type = tokens[i + 1];
        const val = parseInt(tokens[i + 2], 10);
        if (type === 'cp') {
          data.score.cp = val;
        } else if (type === 'mate') {
          data.score.mate = val;
          data.score.cp = val > 0 ? 10000 : -10000;
        }
      } else if (token === 'pv') {
        data.pv = tokens.slice(i + 1);
        break;
      }
    }

    return data;
  }

  stopAnalysis() {
    if (this.worker && this.isAnalyzing) {
      this.worker.postMessage('stop');
      this.isAnalyzing = false;
      this.status = 'ready';
    }
  }

  /**
   * Analyzes a single FEN position
   * Returns a promise resolving with best move and evaluation details
   */
  async analyzePosition(fen, { depth = 16, timeLimit = 3000, multiPv = 3 } = {}, onStreamInfo = null) {
    if (!this.worker || this.fallbackToBackend) {
      try {
        const resp = await fetch('/api/analyze-fen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fen, depth, multipv: multiPv }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (!data.busy && data.lines) {
            const top = data.lines[0];
            return {
              bestMoveUci: data.best_move_uci || (top?.uci || ''),
              bestMoveSan: data.best_move_san || (top?.san || ''),
              lines: data.lines,
              evalCp: top ? (top.score?.cp || Math.round(data.eval * 100)) : 0,
              mate: data.mate,
              depth: data.depth || depth,
              nodes: 1000000,
              nps: 2000000,
              pv: top ? top.pv : [],
            };
          }
        }
      } catch (err) {
        console.warn("Backend FEN analysis fallback error:", err?.message);
      }
    }

    await this.initialize();
    if (!this.worker) return { lines: [], bestMoveUci: '', evalCp: 0 };
    this.stopAnalysis();

    const positionId = ++this.currentPositionId;
    this.isAnalyzing = true;
    this.status = 'analyzing';

    const multiPvLines = new Map();

    return new Promise((resolve) => {
      this.onInfoCallback = (info) => {
        if (positionId !== this.currentPositionId) return; // Stale position check

        multiPvLines.set(info.multipv, info);

        if (onStreamInfo) {
          onStreamInfo({
            currentLine: info,
            allLines: Array.from(multiPvLines.values()),
          });
        }
      };

      this.onBestMoveCallback = ({ bestMoveUci, ponderUci }) => {
        if (positionId !== this.currentPositionId) return;

        const sortedLines = Array.from(multiPvLines.values()).sort((a, b) => a.multipv - b.multipv);
        const top = sortedLines[0] || null;

        resolve({
          bestMoveUci,
          ponderUci,
          lines: sortedLines,
          evalCp: top ? top.score.cp : 0,
          mate: top ? top.score.mate : null,
          depth: top ? top.depth : depth,
          nodes: top ? top.nodes : 0,
          nps: top ? top.nps : 0,
          pv: top ? top.pv : [],
        });
      };

      this.worker.postMessage(`setoption name MultiPV value ${multiPv}`);
      this.worker.postMessage(`position fen ${fen}`);
      if (timeLimit > 0) {
        this.worker.postMessage(`go depth ${depth} movetime ${timeLimit}`);
      } else {
        this.worker.postMessage(`go depth ${depth}`);
      }
    });
  }

  /**
   * Analyzes an entire PGN game move-by-move in the browser
   */
  async analyzeGame(pgnText, { depth = 12, timePerMove = 400, onProgress = null } = {}) {
    if (!this.worker || this.fallbackToBackend) {
      if (onProgress) onProgress(10, 100, "Reviewing game with native Stockfish...");
      try {
        const resp = await fetch('/api/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pgn: pgnText, depth }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (!data.error) return data;
        }
      } catch (err) {
        console.warn("Backend review fallback error:", err?.message);
      }
    }

    await this.initialize();
    this.stopAnalysis();

    const chess = new Chess();
    const loaded = chess.loadPgn(pgnText);
    if (!loaded) {
      throw new Error("Invalid PGN string provided.");
    }

    const history = chess.history({ verbose: true });
    const totalMoves = history.length;
    const movesAnalysis = [];
    const keyMoments = [];

    // Reset chess to replay
    const replayChess = new Chess();

    let whiteWinProbLossTotal = 0;
    let whiteMovesCount = 0;
    let blackWinProbLossTotal = 0;
    let blackMovesCount = 0;

    const whiteCounts = { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0, forced: 0 };
    const blackCounts = { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0, forced: 0 };

    for (let i = 0; i < totalMoves; i++) {
      if (this.currentPositionId === -1) {
        throw new Error("Analysis stopped by user.");
      }

      const move = history[i];
      const isWhite = replayChess.turn() === 'w';
      const moveNum = Math.floor(i / 2) + 1;
      const fenBefore = replayChess.fen();
      const legalCount = replayChess.moves().length;

      if (onProgress) {
        onProgress(i + 1, totalMoves, `Analyzing ${moveNum}.${isWhite ? '' : '..'} ${move.san}`);
      }

      // Analyze position before the move
      const analysisBefore = await this.analyzePosition(fenBefore, { depth, timeLimit: timePerMove, multiPv: 3 });

      // Played move
      const playedUci = move.from + move.to + (move.promotion || '');
      replayChess.move(move);
      const fenAfter = replayChess.fen();

      // Convert best move UCI to SAN
      let bestMoveSan = move.san;
      try {
        const tempChess = new Chess(fenBefore);
        const bestMoveObj = tempChess.move({
          from: analysisBefore.bestMoveUci.slice(0, 2),
          to: analysisBefore.bestMoveUci.slice(2, 4),
          promotion: analysisBefore.bestMoveUci.slice(4) || undefined,
        });
        if (bestMoveObj) bestMoveSan = bestMoveObj.san;
      } catch (_) {}

      // Calculate pawn eval from White POV
      const evalPawns = analysisBefore.evalCp / 100.0;
      const mate = analysisBefore.mate;

      // Evaluation drop calculation
      let playedLine = analysisBefore.lines.find(l => l.pv && l.pv[0] === playedUci);
      let playedCp = playedLine ? playedLine.score.cp : analysisBefore.evalCp - 40;
      let evalDrop = Math.max(0, (analysisBefore.evalCp - playedCp) / 100.0);

      // Winning probability calculation
      const winProb = (cp) => {
        const clamped = Math.max(-2000, Math.min(2000, cp));
        return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * clamped)) - 1);
      };

      const winBefore = winProb(isWhite ? analysisBefore.evalCp : -analysisBefore.evalCp);
      const winAfter = winProb(isWhite ? playedCp : -playedCp);
      const winLoss = Math.max(0, winBefore - winAfter);

      // CAPS2 accuracy formula
      let acc = 103.1668 * Math.exp(-0.04354 * winLoss) - 3.1669;
      acc = Math.max(0, Math.min(100, acc));

      // Classify move
      let classification = 'best';
      let classificationName = 'Best';
      let symbol = '★';
      let badge = '★';
      let color = '#81b64c';

      const isForced = legalCount === 1;
      const isBook = i < 8; // Opening book heuristic

      if (isForced) {
        classification = 'forced';
        classificationName = 'Forced';
        symbol = '⇥';
        badge = '⇥';
        color = '#9e9e9e';
        acc = 100;
      } else if (isBook) {
        classification = 'book';
        classificationName = 'Book';
        symbol = '📖';
        badge = '📖';
        color = '#b08850';
        acc = 100;
      } else if (evalDrop <= 0.15 || playedUci === analysisBefore.bestMoveUci) {
        // Check for piece sacrifice
        const isSacrifice = ['n', 'b', 'r', 'q'].includes(move.piece) && (move.captured ? false : true);
        if (isSacrifice && evalPawns >= -0.5) {
          classification = 'brilliant';
          classificationName = 'Brilliant';
          symbol = '!!';
          badge = '💎';
          color = '#1baaa0';
        } else {
          classification = 'best';
          classificationName = 'Best';
          symbol = '★';
          badge = '★';
          color = '#81b64c';
        }
      } else if (evalDrop <= 0.35 || winLoss <= 3) {
        classification = 'excellent';
        classificationName = 'Excellent';
        symbol = '✓✓';
        badge = '⚡';
        color = '#81b64c';
      } else if (evalDrop <= 0.70 || winLoss <= 7) {
        classification = 'good';
        classificationName = 'Good';
        symbol = '✓';
        badge = '✓';
        color = '#96bc76';
      } else if (winBefore >= 75 && winLoss >= 20) {
        classification = 'miss';
        classificationName = 'Miss';
        symbol = '❌';
        badge = '❌';
        color = '#ff5252';
      } else if (evalDrop >= 2.5 || winLoss >= 22) {
        classification = 'blunder';
        classificationName = 'Blunder';
        symbol = '??';
        badge = '??';
        color = '#fa412d';
      } else if (evalDrop >= 1.2 || winLoss >= 11) {
        classification = 'mistake';
        classificationName = 'Mistake';
        symbol = '?';
        badge = '?';
        color = '#e58f2a';
      } else {
        classification = 'inaccuracy';
        classificationName = 'Inaccuracy';
        symbol = '?!';
        badge = '?!';
        color = '#f7c631';
      }

      // Record count
      const countsObj = isWhite ? whiteCounts : blackCounts;
      countsObj[classification] = (countsObj[classification] || 0) + 1;

      if (isWhite) {
        whiteWinProbLossTotal += acc;
        whiteMovesCount++;
      } else {
        blackWinProbLossTotal += acc;
        blackMovesCount++;
      }

      if (['brilliant', 'great', 'blunder', 'miss', 'mistake'].includes(classification)) {
        keyMoments.push(i + 1);
      }

      // Generate commentary
      let commentary = `Move ${move.san} was played.`;
      if (classification === 'book') commentary = "Standard opening theory move.";
      else if (classification === 'brilliant') commentary = `Brilliant!! A piece sacrifice with ${move.san} that keeps decisive control!`;
      else if (classification === 'best') commentary = `Best move! ${move.san} finds the engine's top choice.`;
      else if (classification === 'excellent') commentary = `Excellent! A very sharp move maintaining strong pressure.`;
      else if (classification === 'good') commentary = `Good move. Keeps the position solid and playable.`;
      else if (classification === 'inaccuracy') commentary = `Inaccuracy. ${bestMoveSan} was slightly sharper.`;
      else if (classification === 'mistake') commentary = `Mistake. This relinquishes control. Better was ${bestMoveSan}.`;
      else if (classification === 'miss') commentary = `Miss! You missed an opportunity to play ${bestMoveSan}.`;
      else if (classification === 'blunder') commentary = `Blunder?? ${move.san} costs serious material or advantage. ${bestMoveSan} was required.`;
      else if (classification === 'forced') commentary = "This was the only legal move.";

      movesAnalysis.push({
        ply: i + 1,
        move_number: moveNum,
        turn: isWhite ? 'white' : 'black',
        san: move.san,
        uci: playedUci,
        from_square: move.from,
        to_square: move.to,
        fen_before: fenBefore,
        fen_after: fenAfter,
        best_move_san: bestMoveSan,
        best_move_uci: analysisBefore.bestMoveUci,
        eval_before: evalPawns,
        eval_after: evalPawns,
        mate_after: mate,
        eval_drop: evalDrop,
        win_prob_after: winAfter,
        accuracy: acc,
        classification,
        classification_name: classificationName,
        symbol,
        badge,
        color,
        commentary,
        pv: analysisBefore.pv,
        is_capture: Boolean(move.captured),
        is_check: replayChess.inCheck(),
      });
    }

    const whiteAvgAcc = whiteMovesCount > 0 ? whiteWinProbLossTotal / whiteMovesCount : 90;
    const blackAvgAcc = blackMovesCount > 0 ? blackWinProbLossTotal / blackMovesCount : 90;

    const estimateElo = (acc) => Math.round(Math.max(600, Math.min(2900, 3100 / (1 + Math.exp(-0.065 * (acc - 78))))));

    const headers = chess.header();

    return {
      headers,
      opening_name: headers.Opening || "Classical Game",
      eco_code: headers.ECO || "C50",
      white: {
        name: headers.White || "White",
        rating: headers.WhiteElo || "1500",
        accuracy: Number(whiteAvgAcc.toFixed(1)),
        estimated_elo: estimateElo(whiteAvgAcc),
        counts: whiteCounts,
      },
      black: {
        name: headers.Black || "Black",
        rating: headers.BlackElo || "1500",
        accuracy: Number(blackAvgAcc.toFixed(1)),
        estimated_elo: estimateElo(blackAvgAcc),
        counts: blackCounts,
      },
      moves: movesAnalysis,
      key_moments: keyMoments,
    };
  }

  dispose() {
    this.stopAnalysis();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.status = 'uninitialized';
    }
  }
}

export const browserEngine = new BrowserStockfishService();

// Native Backend Engine (Stockfish 18 .exe via Python Flask API)
export async function analyzeFenBackend(fen, depth = 14, multipv = 5) {
  const resp = await fetch('/api/analyze-fen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fen, depth, multipv }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Backend server error (${resp.status})`);
  }
  return await resp.json();
}

export async function checkBackendEngineStatus() {
  try {
    const resp = await fetch('/api/engine-status');
    if (!resp.ok) return { status: 'offline' };
    return await resp.json();
  } catch (_) {
    return { status: 'offline' };
  }
}

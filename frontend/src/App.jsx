import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Chess } from 'chess.js';

import Navbar from './components/Navbar.jsx';
import PositionInputPanel from './components/PositionInputPanel.jsx';
import ChessBoardPanel from './components/ChessBoardPanel.jsx';
import GameAnalysisPanel from './components/GameAnalysisPanel.jsx';
import Footer from './components/Footer.jsx';

import AuthModal from './components/AuthModal.jsx';
import SavedAnalysesModal from './components/SavedAnalysesModal.jsx';
import SaveAnalysisModal from './components/SaveAnalysisModal.jsx';
import ThemeSelectorModal from './components/ThemeSelectorModal.jsx';

import { browserEngine, analyzeFenBackend, checkBackendEngineStatus } from './services/engineService.js';
import { getCurrentUser, signOut } from './services/supabase.js';
import { generateInsights } from './utils/insights.js';
import { BOARD_THEMES, APP_THEMES } from './utils/themes.js';
import { sounds } from './utils/sound.js';

const DEFAULT_PGN = `[Event "Italian Game"]
[Site "ChessAnalyzer"]
[Date "2026.05.21"]
[White "Tanmay"]
[Black "Stockfish"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. O-O Be7 5. d3 d6 6. c3 O-O 7. Bb3 h6 8. Nbd2 Re8 *`;

const DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function App() {
  // Navigation & Board State
  const [reviewData, setReviewData] = useState(null);
  const [currentPly, setCurrentPly] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Input & Configuration State
  const [mobileTab, setMobileTab] = useState('moves'); // 'moves' | 'analysis' | 'input'
  const [inputMode, setInputMode] = useState('pgn'); // 'pgn' | 'fen'
  const [inputText, setInputText] = useState(DEFAULT_PGN);
  const [engineDepth, setEngineDepth] = useState(14);
  const [analysisTime, setAnalysisTime] = useState(3000);
  const [engineType, setEngineType] = useState('backend'); // 'backend' (.exe) | 'browser' (WASM/JS)
  const [validationError, setValidationError] = useState(false);

  // Feature Toggles (from reference image)
  const [showEvalGraph, setShowEvalGraph] = useState(true);
  const [showBestArrows, setShowBestArrows] = useState(true);
  const [showInsights, setShowInsights] = useState(true);

  // Engine Analysis Runtime State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(null);
  const [topLines, setTopLines] = useState([]);

  // Auth & Cloud State
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isThemesOpen, setIsThemesOpen] = useState(false);

  // Themes state
  const [boardTheme, setBoardTheme] = useState(() => {
    const saved = localStorage.getItem('chess_board_theme');
    return BOARD_THEMES.find((t) => t.id === saved) || BOARD_THEMES[0];
  });
  const [appTheme, setAppTheme] = useState(() => {
    const saved = localStorage.getItem('chess_app_theme');
    return APP_THEMES.find((t) => t.id === saved) || APP_THEMES[0];
  });

  // Retry Mistake Puzzle state
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);

  // Check auth user on mount
  useEffect(() => {
    getCurrentUser()
      .then((u) => setUser(u))
      .catch(() => {});
  }, []);

  // Sync theme CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-main', appTheme.bgMain);
    root.style.setProperty('--bg-panel', appTheme.bgPanel);
    root.style.setProperty('--bg-card', appTheme.bgCard);
    root.style.setProperty('--border-color', appTheme.border);
    root.style.setProperty('--accent-color', appTheme.accent);
    root.style.setProperty('--text-muted', appTheme.textMuted);
    localStorage.setItem('chess_app_theme', appTheme.id);
  }, [appTheme]);

  useEffect(() => {
    localStorage.setItem('chess_board_theme', boardTheme.id);
  }, [boardTheme]);

  // Initial load: analyze default game
  useEffect(() => {
    handleAnalyze();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowLeft') {
        goToPly(currentPly - 1);
      } else if (e.key === 'ArrowRight') {
        goToPly(currentPly + 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key.toLowerCase() === 'f') {
        setIsFlipped((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPly, reviewData, isPlaying]);

  // Autoplay interval
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (!reviewData || currentPly >= reviewData.moves.length) {
        setIsPlaying(false);
        return;
      }
      goToPly(currentPly + 1);
    }, 1200);
    return () => clearInterval(interval);
  }, [isPlaying, currentPly, reviewData]);

  // Move navigation logic
  const goToPly = (ply) => {
    if (!reviewData || !reviewData.moves) return;
    const maxPly = reviewData.moves.length;
    const targetPly = Math.max(0, Math.min(maxPly, ply));
    setCurrentPly(targetPly);
    setIsRetryMode(false);
    setSelectedSquare(null);

    // Audio cues & effects
    if (targetPly > 0) {
      const move = reviewData.moves[targetPly - 1];
      if (move.classification === 'brilliant') {
        sounds.playBrilliant();
        confetti({ particleCount: 65, spread: 55, origin: { y: 0.7 } });
      } else if (move.classification === 'blunder') {
        sounds.playBlunder();
      } else if (move.is_check) {
        sounds.playCheck();
      } else if (move.is_capture) {
        sounds.playCapture();
      } else {
        sounds.playMove();
      }
    }
  };

  // Run live analysis on current position using Native Backend (.exe) or Web Worker
  useEffect(() => {
    let active = true;
    const moves = reviewData?.moves || [];
    let fenToAnalyze = DEFAULT_FEN;

    if (currentPly > 0 && currentPly <= moves.length) {
      fenToAnalyze = moves[currentPly - 1].fen_after;
    } else if (inputMode === 'fen' && inputText.trim()) {
      fenToAnalyze = inputText.trim();
    }

    if (!isAnalyzing && fenToAnalyze) {
      if (engineType === 'backend') {
        analyzeFenBackend(fenToAnalyze, Math.min(engineDepth, 14), 5)
          .then((res) => {
            if (active && res.lines) {
              setTopLines(res.lines);
            }
          })
          .catch(() => {
            // Automatic graceful fallback to browser engine if backend server is not running
            browserEngine
              .analyzePosition(fenToAnalyze, { depth: Math.min(engineDepth, 14), timeLimit: 1000, multiPv: 4 })
              .then((result) => {
                if (active && result.lines) setTopLines(result.lines);
              })
              .catch(() => {});
          });
      } else {
        browserEngine
          .analyzePosition(
            fenToAnalyze,
            { depth: Math.min(engineDepth, 16), timeLimit: 1200, multiPv: 4 },
            (stream) => {
              if (active && stream.allLines) {
                setTopLines(stream.allLines);
              }
            }
          )
          .then((result) => {
            if (active && result.lines) {
              setTopLines(result.lines);
            }
          })
          .catch(() => {});
      }
    }

    return () => {
      active = false;
    };
  }, [currentPly, reviewData, inputMode, isAnalyzing, engineType]);

  // Analysis dispatcher
  const handleAnalyze = async () => {
    setValidationError(false);
    setIsAnalyzing(true);
    setAnalysisProgress({ current: 0, total: 100, text: 'Initializing engine...' });

    try {
      if (inputMode === 'pgn') {
        const text = inputText.trim();
        if (!text) {
          throw new Error('Please enter a PGN game to analyze.');
        }

        // Validate PGN syntax
        const testChess = new Chess();
        try {
          testChess.loadPgn(text);
        } catch (e) {
          setValidationError(true);
          throw new Error('Invalid PGN format. Please check move notation.');
        }

        if (engineType === 'browser') {
          // 100% Client-Side Stockfish.js Web Worker Analysis!
          const result = await browserEngine.analyzeGame(text, {
            depth: engineDepth,
            timePerMove: Math.min(analysisTime, 1200),
            onProgress: (current, total, infoText) => {
              setAnalysisProgress({ current, total, text: infoText });
            },
          });
          setReviewData(result);
          setCurrentPly(1);
        } else {
          // Backend Stockfish 18 UCI engine (.exe)
          const response = await fetch('/api/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pgn: text, depth: engineDepth }),
          });

          if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
          }
          const data = await response.json();
          if (data.error) throw new Error(data.error);

          setReviewData(data);
          setCurrentPly(1);
        }
      } else {
        // FEN Mode
        const fen = inputText.trim();
        const testChess = new Chess();
        try {
          testChess.load(fen);
        } catch (e) {
          setValidationError(true);
          throw new Error('Invalid FEN position string.');
        }

        let bestMoveUci = '';
        let bestMoveSan = '';
        let evalPawns = 0.0;
        let mate = null;
        let pvLines = [];

        if (engineType === 'backend') {
          const fenResult = await analyzeFenBackend(fen, engineDepth, 5);
          bestMoveUci = fenResult.best_move_uci;
          bestMoveSan = fenResult.best_move_san;
          evalPawns = fenResult.eval;
          mate = fenResult.mate;
          pvLines = fenResult.lines || [];
          setTopLines(pvLines);
        } else {
          const fenResult = await browserEngine.analyzePosition(fen, {
            depth: engineDepth,
            timeLimit: analysisTime,
            multiPv: 5,
          });
          bestMoveUci = fenResult.bestMoveUci;
          bestMoveSan = fenResult.bestMoveUci;
          evalPawns = fenResult.evalCp / 100;
          mate = fenResult.mate;
          pvLines = fenResult.lines || [];
          setTopLines(pvLines);
        }

        // Wrap FEN as a single-position review object
        setReviewData({
          headers: { White: 'Custom Position', Black: 'Analysis' },
          opening_name: 'Custom FEN Position',
          eco_code: 'FEN',
          white: { name: 'White', rating: '-', accuracy: 100 },
          black: { name: 'Black', rating: '-', accuracy: 100 },
          moves: [
            {
              ply: 1,
              move_number: 1,
              turn: testChess.turn() === 'w' ? 'white' : 'black',
              san: bestMoveSan || bestMoveUci,
              uci: bestMoveUci,
              from_square: bestMoveUci.slice(0, 2),
              to_square: bestMoveUci.slice(2, 4),
              fen_before: fen,
              fen_after: fen,
              best_move_san: bestMoveSan || bestMoveUci,
              best_move_uci: bestMoveUci,
              eval_after: evalPawns,
              mate_after: mate,
              classification: 'best',
              classification_name: 'Best',
              symbol: '★',
              badge: '★',
              color: '#81b64c',
              commentary: 'Top engine recommendation for this position.',
              pv: pvLines[0]?.pv || [],
            },
          ],
        });
        setCurrentPly(1);
      }
    } catch (err) {
      if (engineType === 'backend') {
        // Automatically fallback to browser engine if backend server is not running
        alert(
          `Local backend server not reachable: ${err.message}. Automatically switching to browser Stockfish WASM!`
        );
        setEngineType('browser');
        setIsAnalyzing(false);
        setTimeout(() => handleAnalyze(), 200);
        return;
      } else {
        alert(err.message || 'Failed to analyze position.');
      }
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(null);
    }
  };

  const handleStopAnalysis = () => {
    browserEngine.stopAnalysis();
    setIsAnalyzing(false);
    setAnalysisProgress(null);
  };

  const handleClear = () => {
    setInputText('');
    setReviewData(null);
    setCurrentPly(0);
    setTopLines([]);
  };

  const handleLoadExample = () => {
    if (inputMode === 'pgn') {
      setInputText(DEFAULT_PGN);
    } else {
      setInputText(DEFAULT_FEN);
    }
  };

  const handleExportPgn = () => {
    const textToExport = inputText || DEFAULT_PGN;
    const blob = new Blob([textToExport], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'chess_analysis.pgn';
    a.click();
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  // Interactive square click on board (allows trying moves)
  const handleSquareClick = (sqName) => {
    if (!selectedSquare) {
      setSelectedSquare(sqName);
    } else {
      const fromSq = selectedSquare;
      const toSq = sqName;
      setSelectedSquare(null);

      // Attempt move in active position
      const moves = reviewData?.moves || [];
      const currentFen =
        currentPly > 0 && currentPly <= moves.length
          ? moves[currentPly - 1].fen_after
          : DEFAULT_FEN;

      try {
        const testChess = new Chess(currentFen);
        const move = testChess.move({ from: fromSq, to: toSq, promotion: 'q' });
        if (move) {
          sounds.playMove();
          // Analyze resulting position immediately
          browserEngine.analyzePosition(testChess.fen(), { depth: 14, timeLimit: 1000 });
        }
      } catch (_) {}
    }
  };

  // Active Move & Position computation
  const moves = reviewData?.moves || [];
  let currentFen = DEFAULT_FEN;
  let activeMove = null;

  if (currentPly > 0 && currentPly <= moves.length) {
    activeMove = moves[currentPly - 1];
    currentFen = isRetryMode ? activeMove.fen_before : activeMove.fen_after;
  } else if (inputMode === 'fen' && inputText.trim()) {
    currentFen = inputText.trim();
  }

  // Active turn calculation
  let activeTurn = 'White';
  try {
    const c = new Chess(currentFen);
    activeTurn = c.turn() === 'w' ? 'White' : 'Black';
  } catch (_) {}

  // Active evaluation
  const activeEval = activeMove ? activeMove.eval_after || 0.0 : 0.2;
  const activeMate = activeMove ? activeMove.mate_after : null;

  // Real-time Tactical & Positional Insights
  const insightsList = showInsights
    ? generateInsights(currentFen, activeEval, activeMove ? activeMove.move_number : 1)
    : [];

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen overflow-x-hidden lg:overflow-hidden flex flex-col bg-[#0b1017] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-white">
      {/* Top Header Navbar */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
        onOpenSaved={() => setIsSavedOpen(true)}
        onOpenThemes={() => setIsThemesOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(sounds.toggleSound())}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Workspace - Responsive Layout: 3 Columns on Desktop, Board-first + Tabs on Mobile/Tablet */}
      <main className="flex-1 min-h-0 w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-1.5 flex flex-col lg:flex-row gap-3 lg:gap-4 items-center lg:items-stretch lg:justify-between overflow-y-auto lg:overflow-hidden">
        {/* Left Column: Position Input (Visible on Desktop, anchored to the left) */}
        <div className="hidden lg:flex shrink-0 h-full w-[260px] xl:w-[295px] 2xl:w-[320px]">
          <PositionInputPanel
            inputMode={inputMode}
            setInputMode={setInputMode}
            inputText={inputText}
            setInputText={setInputText}
            onAnalyze={handleAnalyze}
            onStopAnalysis={handleStopAnalysis}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress}
            engineDepth={engineDepth}
            setEngineDepth={setEngineDepth}
            analysisTime={analysisTime}
            setAnalysisTime={setAnalysisTime}
            engineType={engineType}
            setEngineType={setEngineType}
            showEvalGraph={showEvalGraph}
            setShowEvalGraph={setShowEvalGraph}
            showBestArrows={showBestArrows}
            setShowBestArrows={setShowBestArrows}
            showInsights={showInsights}
            setShowInsights={setShowInsights}
            onClear={handleClear}
            onSaveAnalysis={() => setIsSaveModalOpen(true)}
            onExportPgn={handleExportPgn}
            onLoadExample={handleLoadExample}
            validationError={validationError}
          />
        </div>

        {/* Center Column: Chessboard & Move Panel */}
        <div className="w-full max-w-[580px] xl:max-w-[620px] 2xl:max-w-[660px] lg:flex-1 lg:min-w-0 lg:h-full flex flex-col items-center">
          <ChessBoardPanel
            fen={currentFen}
            activeMove={activeMove}
            isFlipped={isFlipped}
            onFlipBoard={() => setIsFlipped(!isFlipped)}
            boardTheme={boardTheme}
            showBestArrow={showBestArrows}
            isRetryMode={isRetryMode}
            selectedSquare={selectedSquare}
            onSquareClick={handleSquareClick}
            moves={moves}
            currentPly={currentPly}
            onSeekPly={goToPly}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onPrevPly={() => goToPly(currentPly - 1)}
            onNextPly={() => goToPly(currentPly + 1)}
            onFirstPly={() => goToPly(0)}
            onLastPly={() => goToPly(moves.length)}
            topLines={topLines}
            insights={insightsList}
            mobileTab={mobileTab}
            onSelectMobileTab={setMobileTab}
            whitePlayer={reviewData?.white}
            blackPlayer={reviewData?.black}
          />

          {/* Mobile Only: Game Analysis Panel when 'analysis' tab is selected */}
          {mobileTab === 'analysis' && (
            <div className="lg:hidden w-full mt-1.5 pb-3">
              <GameAnalysisPanel
                activeMove={activeMove}
                currentPly={currentPly}
                totalPlies={moves.length}
                moves={moves}
                turn={activeTurn}
                evalScore={activeEval}
                mateScore={activeMate}
                depth={engineDepth}
                nodes={isAnalyzing ? '2.1M' : '4.2M'}
                engineName={engineType === 'browser' ? 'Stockfish 16 (WASM)' : 'Stockfish 18 (Local)'}
                topMoves={topLines}
                insights={insightsList}
                onSeekPly={goToPly}
                whitePlayer={reviewData?.white}
                blackPlayer={reviewData?.black}
                onCopyPv={(pv) => {
                  navigator.clipboard?.writeText(pv);
                  sounds.playMove();
                }}
              />
            </div>
          )}

          {/* Mobile Only: Position Input Panel when 'input' tab is selected */}
          {mobileTab === 'input' && (
            <div className="lg:hidden w-full mt-1.5 pb-3">
              <PositionInputPanel
                inputMode={inputMode}
                setInputMode={setInputMode}
                inputText={inputText}
                setInputText={setInputText}
                onAnalyze={() => {
                  handleAnalyze();
                  setMobileTab('moves');
                }}
                onStopAnalysis={handleStopAnalysis}
                isAnalyzing={isAnalyzing}
                analysisProgress={analysisProgress}
                engineDepth={engineDepth}
                setEngineDepth={setEngineDepth}
                analysisTime={analysisTime}
                setAnalysisTime={setAnalysisTime}
                engineType={engineType}
                setEngineType={setEngineType}
                showEvalGraph={showEvalGraph}
                setShowEvalGraph={setShowEvalGraph}
                showBestArrows={showBestArrows}
                setShowBestArrows={setShowBestArrows}
                showInsights={showInsights}
                setShowInsights={setShowInsights}
                onClear={handleClear}
                onSaveAnalysis={() => setIsSaveModalOpen(true)}
                onExportPgn={handleExportPgn}
                onLoadExample={handleLoadExample}
                validationError={validationError}
              />
            </div>
          )}
        </div>

        {/* Right Column: Game Analysis (Visible on Desktop, anchored to the right) */}
        <div className="hidden lg:flex shrink-0 h-full w-[270px] xl:w-[310px] 2xl:w-[335px]">
          <GameAnalysisPanel
            activeMove={activeMove}
            currentPly={currentPly}
            totalPlies={moves.length}
            moves={moves}
            turn={activeTurn}
            evalScore={activeEval}
            mateScore={activeMate}
            depth={engineDepth}
            nodes={isAnalyzing ? '2.1M' : '4.2M'}
            engineName={engineType === 'browser' ? 'Stockfish 16 (WASM)' : 'Stockfish 18 (Local)'}
            topMoves={topLines}
            insights={insightsList}
            onSeekPly={goToPly}
            whitePlayer={reviewData?.white}
            blackPlayer={reviewData?.black}
            onCopyPv={(pv) => {
              navigator.clipboard?.writeText(pv);
              sounds.playMove();
            }}
          />
        </div>
      </main>

      {/* Sleek Bottom Status Bar */}
      <footer className="h-6 shrink-0 bg-[#080c12] border-t border-slate-800/80 px-2 sm:px-3 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 select-none">
        <div className="flex items-center gap-1.5 sm:gap-2 truncate max-w-[210px] sm:max-w-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="font-semibold text-slate-300 shrink-0">ChessLab Pro</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 truncate">
            {engineType === 'backend' ? 'Stockfish 18 (.exe)' : 'Stockfish 16 (WASM)'}
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 text-slate-400">
          <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">Space</kbd> Play/Pause</span>
          <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">← / →</kbd> Move</span>
          <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">F</kbd> Flip</span>
        </div>
        <div className="text-emerald-400 font-bold shrink-0 text-[10px] sm:text-xs">
          Free & Open-Source
        </div>
      </footer>

      {/* Supabase & Cloud Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
      />

      <SavedAnalysesModal
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        onSelectAnalysis={(item) => {
          if (item.pgn) {
            setInputMode('pgn');
            setInputText(item.pgn);
          } else if (item.fen) {
            setInputMode('fen');
            setInputText(item.fen);
          }
          if (item.result_data) {
            setReviewData(item.result_data);
            setCurrentPly(1);
          } else {
            handleAnalyze();
          }
        }}
      />

      <SaveAnalysisModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        currentAnalysis={{
          inputType: inputMode,
          pgn: inputMode === 'pgn' ? inputText : null,
          fen: inputMode === 'fen' ? inputText : currentFen,
          headers: reviewData?.headers,
          settings: { engineDepth, analysisTime, engineType },
          result: reviewData,
        }}
        onSaveComplete={() => {}}
      />

      <ThemeSelectorModal
        isOpen={isThemesOpen}
        onClose={() => setIsThemesOpen(false)}
        currentBoardTheme={boardTheme}
        onSelectBoardTheme={(t) => setBoardTheme(t)}
        currentAppTheme={appTheme}
        onSelectAppTheme={(t) => setAppTheme(t)}
      />
    </div>
  );
}

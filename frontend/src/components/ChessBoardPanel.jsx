import React, { useState, useEffect, useRef } from 'react';
import { 
  Maximize2, 
  RotateCcw, 
  Undo2, 
  Redo2, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Award,
  Layers,
  Activity,
  Flame,
  HelpCircle
} from 'lucide-react';
import ChessBoard from './ChessBoard.jsx';

export default function ChessBoardPanel({
  fen,
  activeMove,
  isFlipped,
  onFlipBoard,
  boardTheme,
  showBestArrow,
  isRetryMode,
  selectedSquare,
  onSquareClick,
  moves = [],
  currentPly = 0,
  onSeekPly,
  isPlaying,
  onTogglePlay,
  onPrevPly,
  onNextPly,
  onFirstPly,
  onLastPly,
  topLines = [],
  insights = [],
  mobileTab = 'moves',
  onSelectMobileTab,
  whitePlayer,
  blackPlayer,
}) {
  const [activeSubTab, setActiveSubTab] = useState('moves'); // 'moves' | 'lines' | 'insights' | 'pressure' | 'activity' | 'themes'
  const activeRowRef = useRef(null);

  // Auto-scroll active move into view in the move list
  useEffect(() => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentPly]);

  // Pair moves into 1 row per turn (White + Black)
  const pairedMoves = React.useMemo(() => {
    const pairs = [];
    for (let i = 0; i < moves.length; i += 2) {
      const whiteMove = moves[i];
      const blackMove = moves[i + 1] || null;
      pairs.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: whiteMove,
        black: blackMove,
      });
    }
    return pairs;
  }, [moves]);

  // Format evaluation score into readable format
  const formatEval = (move) => {
    if (!move) return '-';
    if (move.mate_after !== null && move.mate_after !== undefined) {
      return `M${move.mate_after}`;
    }
    const score = move.eval_after || 0;
    return score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2);
  };

  // Render move quality badge
  const renderQualityBadge = (move) => {
    if (!move || !move.classification) {
      return (
        <span className="text-slate-600 font-mono text-[11px]">-</span>
      );
    }

    const { classification, classification_name, badge, color } = move;
    return (
      <div 
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
        style={{ backgroundColor: color || '#81b64c' }}
        title={classification_name}
      >
        <span>{badge}</span>
        <span className="capitalize">{classification_name}</span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[580px] xl:max-w-[620px] 2xl:max-w-[660px] flex flex-col items-center justify-between gap-1 select-none lg:flex-1 lg:min-h-0 lg:h-full lg:overflow-hidden mx-auto">
      {/* Top Toolbar above board */}
      <div className="w-full flex items-center justify-between px-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const elem = document.documentElement;
              if (!document.fullscreenElement) elem.requestFullscreen?.();
              else document.exitFullscreen?.();
            }}
            className="p-1 rounded-md bg-[#141d28] hover:bg-[#1c2938] border border-slate-700/60 text-slate-300 hover:text-white transition-all text-xs"
            title="Toggle Fullscreen"
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={onPrevPly}
            disabled={currentPly <= 0}
            className="p-1 rounded-md bg-[#141d28] hover:bg-[#1c2938] border border-slate-700/60 text-slate-300 hover:text-white transition-all text-xs disabled:opacity-40"
            title="Undo move"
          >
            <Undo2 size={13} />
          </button>
          <button
            onClick={onNextPly}
            disabled={currentPly >= moves.length}
            className="p-1 rounded-md bg-[#141d28] hover:bg-[#1c2938] border border-slate-700/60 text-slate-300 hover:text-white transition-all text-xs disabled:opacity-40"
            title="Redo move"
          >
            <Redo2 size={13} />
          </button>
        </div>

        <button
          onClick={onFlipBoard}
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#141d28] hover:bg-[#1c2938] border border-slate-700/60 text-slate-200 text-[11px] font-semibold transition-all hover:text-white"
        >
          <RotateCcw size={12} className="text-emerald-400" />
          <span>Flip Board</span>
        </button>
      </div>

      {/* Responsive ChessBoard */}
      <div className="w-full flex items-center justify-center lg:flex-1 lg:min-h-0 overflow-hidden py-0.5">
        <ChessBoard
          fen={fen}
          activeMove={activeMove}
          isFlipped={isFlipped}
          boardTheme={boardTheme}
          showBestArrow={showBestArrow}
          isRetryMode={isRetryMode}
          selectedSquare={selectedSquare}
          onSquareClick={onSquareClick}
        />
      </div>

      {/* Playback Controls Bar */}
      <div className="w-full flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#101721] border border-slate-800 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={onFirstPly}
            disabled={currentPly <= 0}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30"
            title="First move"
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={onPrevPly}
            disabled={currentPly <= 0}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30"
            title="Previous move"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
          </button>
          <span className="text-[11px] font-bold text-slate-300 font-mono">
            {currentPly} / {moves.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onNextPly}
            disabled={currentPly >= moves.length}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30"
            title="Next move"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={onLastPly}
            disabled={currentPly >= moves.length}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30"
            title="Last move"
          >
            <SkipForward size={14} />
          </button>
        </div>
      </div>

      {/* Mobile View Switcher Tab Bar (Visible on mobile & tablet only) */}
      <div className="lg:hidden w-full grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#101721] border border-slate-800 text-xs font-bold shrink-0 mt-0.5">
        <button
          type="button"
          onClick={() => onSelectMobileTab?.('moves')}
          className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
            mobileTab === 'moves'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>♟️ Moves</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectMobileTab?.('analysis')}
          className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
            mobileTab === 'analysis'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>⚡ Analysis</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectMobileTab?.('input')}
          className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
            mobileTab === 'input'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>⚙️ Input</span>
        </button>
      </div>

      {/* Sub-board Tabs & Move Table Card */}
      <div className={`w-full ${
        mobileTab === 'moves' ? 'flex' : 'hidden lg:flex'
      } h-[300px] sm:h-[360px] lg:h-[155px] xl:h-[175px] shrink-0 rounded-xl bg-[#101721]/95 border border-[#1b2636] p-2 flex-col overflow-hidden shadow-xl mt-0.5`}>
        {/* Mobile-only Player Accuracy summary banner */}
        {whitePlayer && blackPlayer && (
          <div className="lg:hidden grid grid-cols-2 gap-1.5 pb-1.5 mb-1 border-b border-slate-800 text-[10px]">
            <div className="flex items-center justify-between px-2 py-1 rounded bg-[#0a0f16] border border-slate-800">
              <span className="font-bold text-white truncate max-w-[80px]">{whitePlayer.name || 'White'}</span>
              <span className="font-mono font-bold text-emerald-400">{whitePlayer.accuracy || 85.4}%</span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 rounded bg-[#0a0f16] border border-slate-800">
              <span className="font-bold text-white truncate max-w-[80px]">{blackPlayer.name || 'Black'}</span>
              <span className="font-mono font-bold text-emerald-400">{blackPlayer.accuracy || 82.1}%</span>
            </div>
          </div>
        )}

        {/* Sub-board Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-800 text-[11px] shrink-0 scrollbar-none">
          {[
            { id: 'moves', label: 'Moves' },
            { id: 'lines', label: 'Best Lines' },
            { id: 'insights', label: 'Insights' },
            { id: 'pressure', label: 'Pressure' },
            { id: 'activity', label: 'Piece Activity' },
            { id: 'themes', label: 'Themes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-2.5 py-1 rounded-md font-bold text-[11px] whitespace-nowrap transition-all ${
                activeSubTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Panel 1: Moves Table */}
        {activeSubTab === 'moves' && (
          <div className="mt-1 flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded border border-slate-850 scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0a0f16] text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="py-1.5 sm:py-2 px-1.5 sm:px-2 text-center w-7 sm:w-8">#</th>
                  <th className="py-1.5 sm:py-2 px-1.5 sm:px-2.5">White</th>
                  <th className="py-1.5 sm:py-2 px-1.5 sm:px-2.5">Black</th>
                  <th className="py-1.5 sm:py-2 px-1.5 sm:px-2 text-center">Eval</th>
                  <th className="py-1.5 sm:py-2 px-1.5 sm:px-2.5">Best Move</th>
                  <th className="py-1.5 sm:py-2 px-1.5 sm:px-2 text-right">Move Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {pairedMoves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                      No moves loaded yet. Paste a PGN on the left and click "Analyze Game"!
                    </td>
                  </tr>
                ) : (
                  pairedMoves.map((turn) => {
                    const isWhiteActive = turn.white && turn.white.ply === currentPly;
                    const isBlackActive = turn.black && turn.black.ply === currentPly;
                    const isRowActive = isWhiteActive || isBlackActive;

                    const activeTurnMove = isBlackActive ? turn.black : turn.white;

                    return (
                      <tr
                        key={turn.moveNumber}
                        ref={isRowActive ? activeRowRef : null}
                        className={`transition-colors ${
                          isRowActive
                            ? 'bg-emerald-500/15 border-l-2 border-emerald-500'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-1.5 px-2 text-center font-bold text-slate-500 text-[11px]">
                          {turn.moveNumber}
                        </td>

                        {/* White move */}
                        <td className="py-1.5 px-2.5 font-mono">
                          {turn.white ? (
                            <button
                              onClick={() => onSeekPly(turn.white.ply)}
                              className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                                isWhiteActive
                                  ? 'bg-emerald-400 text-black'
                                  : 'text-slate-200 hover:text-emerald-400 hover:bg-slate-800'
                              }`}
                            >
                              {turn.white.san}
                            </button>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Black move */}
                        <td className="py-1.5 px-2.5 font-mono">
                          {turn.black ? (
                            <button
                              onClick={() => onSeekPly(turn.black.ply)}
                              className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                                isBlackActive
                                  ? 'bg-emerald-400 text-black'
                                  : 'text-slate-200 hover:text-emerald-400 hover:bg-slate-800'
                              }`}
                            >
                              {turn.black.san}
                            </button>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Eval */}
                        <td className="py-1.5 px-2 text-center font-mono text-[11px] font-semibold text-slate-300">
                          {formatEval(activeTurnMove)}
                        </td>

                        {/* Best move */}
                        <td className="py-1.5 px-2.5 font-mono text-[11px] text-emerald-400 font-semibold">
                          {activeTurnMove?.best_move_san || '-'}
                        </td>

                        {/* Move Quality */}
                        <td className="py-1.5 px-2 text-right">
                          {renderQualityBadge(activeTurnMove)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Content Panel 2: Best Lines */}
        {activeSubTab === 'lines' && (
          <div className="mt-2 space-y-2 p-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-400" />
              <span>Stockfish Candidate Variations</span>
            </h4>
            {topLines.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">Running engine analysis on current position...</p>
            ) : (
              topLines.map((line, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-[#0a0f16] border border-slate-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-800 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-mono text-slate-200">{line.pv?.slice(0, 5).join(' ') || '-'}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">
                    {line.score?.cp !== undefined ? `${line.score.cp >= 0 ? '+' : ''}${(line.score.cp / 100).toFixed(2)}` : '0.00'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Content Panel 3: Insights */}
        {activeSubTab === 'insights' && (
          <div className="mt-2 space-y-2 p-2 text-xs">
            {insights.map((item) => (
              <div key={item.id} className="p-2 rounded-lg bg-[#0a0f16] border border-slate-800 flex items-start gap-2.5">
                <span className="text-emerald-400 mt-0.5">●</span>
                <div>
                  <h5 className="font-bold text-slate-200">{item.title}</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content Panel 4: Pressure & Tactics */}
        {activeSubTab === 'pressure' && (
          <div className="mt-2 p-3 rounded-lg bg-[#0a0f16] border border-slate-800 text-xs space-y-2">
            <h5 className="font-bold text-white flex items-center gap-1.5">
              <Flame size={14} className="text-amber-400" />
              <span>Board Tension & Key Outposts</span>
            </h5>
            <p className="text-slate-400 text-[11px]">
              Central squares (e4, d4, e5, d5) contain major tactical pawn levers. Key outpost knight squares are actively monitored.
            </p>
          </div>
        )}

        {/* Content Panel 5: Piece Activity */}
        {activeSubTab === 'activity' && (
          <div className="mt-2 p-3 rounded-lg bg-[#0a0f16] border border-slate-800 text-xs space-y-2">
            <h5 className="font-bold text-white flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-400" />
              <span>Piece Mobility Breakdown</span>
            </h5>
            <p className="text-slate-400 text-[11px]">
              White knights and light-squared bishops control long diagonals. Black rook coordination is ready along open central files.
            </p>
          </div>
        )}

        {/* Content Panel 6: Themes */}
        {activeSubTab === 'themes' && (
          <div className="mt-2 p-3 rounded-lg bg-[#0a0f16] border border-slate-800 text-xs space-y-2">
            <h5 className="font-bold text-white flex items-center gap-1.5">
              <Layers size={14} className="text-sky-400" />
              <span>Opening & Strategic Motifs</span>
            </h5>
            <p className="text-slate-400 text-[11px]">
              Giuoco Piano / Italian Game structure with classical kingside castling and piece development.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

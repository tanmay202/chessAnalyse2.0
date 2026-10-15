import React, { useState } from 'react';
import { 
  FileText, 
  TrendingUp, 
  Star, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  BookOpen, 
  Target, 
  Activity, 
  Shield, 
  Sparkles
} from 'lucide-react';

export default function GameAnalysisPanel({
  activeMove,
  currentPly,
  totalPlies,
  moves = [],
  turn = 'White',
  evalScore = 0.32,
  mateScore = null,
  depth = 20,
  nodes = '4.2M',
  engineName = 'Stockfish 18',
  topMoves = [],
  insights = [],
  onSeekPly,
  whitePlayer,
  blackPlayer,
  onCopyPv,
}) {
  const [pvExpanded, setPvExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [graphPerspective, setGraphPerspective] = useState('white'); // 'white' | 'black'

  // Format evaluation display
  const isMate = mateScore !== null && mateScore !== undefined;
  const evalDisplay = isMate
    ? `M${mateScore}`
    : `${evalScore >= 0 ? '+' : ''}${evalScore.toFixed(2)}`;

  // Evaluation verbal summary
  const getEvalSummary = (score, mate) => {
    if (mate !== null && mate !== undefined) {
      return mate > 0 ? `Mate in ${mate} (White)` : `Mate in ${Math.abs(mate)} (Black)`;
    }
    if (score > 3.0) return "Decisive advantage (+White)";
    if (score > 1.2) return "Clear advantage (+White)";
    if (score > 0.3) return "Slight advantage (+White)";
    if (score >= -0.3) return "Equal position";
    if (score >= -1.2) return "Slight advantage (+Black)";
    if (score >= -3.0) return "Clear advantage (+Black)";
    return "Decisive advantage (+Black)";
  };

  // Best move SAN and UCI
  const bestMoveText = activeMove?.best_move_san 
    ? `${activeMove.turn === 'white' ? Math.ceil(currentPly / 2) + '.' : Math.ceil(currentPly / 2) + '...'} ${activeMove.best_move_san}`
    : (topMoves[0]?.san || 'd3');

  // Explanation
  const explanation = activeMove?.commentary || "Develops the piece and maintains central control.";
  const pvList = activeMove?.pv || topMoves[0]?.pv || ['d3', 'd6', 'c3', 'Nf6'];

  const handleCopy = () => {
    if (onCopyPv) {
      onCopyPv(pvList.join(' '));
    } else {
      navigator.clipboard?.writeText(pvList.join(' '));
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="w-full lg:w-[270px] xl:w-[310px] 2xl:w-[335px] shrink-0 min-h-0 lg:h-full flex flex-col gap-2 overflow-y-auto pr-1 select-none text-xs scrollbar-thin">
      {/* Top Header Card */}
      <div className="p-2.5 rounded-xl bg-[#101721]/95 border border-[#1b2636] shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileText size={13} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-tight">Game Analysis</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#0a0f16] border border-slate-800 text-[10px] font-semibold text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{activeMove ? `Move ${activeMove.move_number}` : 'Position'}</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400">{turn}</span>
        </div>
      </div>

      {/* Accuracy Banner if game review available */}
      {whitePlayer && blackPlayer && (
        <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-[#101721]/95 border border-[#1b2636] shadow-xl text-xs">
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#0a0f16] border border-slate-800">
            <div className="truncate pr-1">
              <span className="font-bold text-white block truncate text-[11px]">{whitePlayer.name || 'White'}</span>
              <span className="text-[9px] text-slate-400">Accuracy</span>
            </div>
            <span className="text-xs font-extrabold text-emerald-400 font-mono">
              {whitePlayer.accuracy || 85.4}%
            </span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#0a0f16] border border-slate-800">
            <div className="truncate pr-1">
              <span className="font-bold text-white block truncate text-[11px]">{blackPlayer.name || 'Black'}</span>
              <span className="text-[9px] text-slate-400">Accuracy</span>
            </div>
            <span className="text-xs font-extrabold text-emerald-400 font-mono">
              {blackPlayer.accuracy || 82.1}%
            </span>
          </div>
        </div>
      )}

      {/* Evaluation Score Badge & Engine Info Card */}
      <div className="p-2.5 rounded-xl bg-[#101721]/95 border border-[#1b2636] shadow-xl flex items-center justify-between gap-2.5">
        {/* White Pill with score */}
        <div className="px-3 py-1.5 rounded-lg bg-white text-black font-black text-base tracking-tight shadow-md shrink-0 font-mono">
          {evalDisplay}
        </div>

        {/* Evaluation verbal status and bar */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-200 truncate">
            {getEvalSummary(evalScore, mateScore)}
          </p>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1">
            <div 
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{
                width: `${Math.max(5, Math.min(95, 50 + (evalScore * 10)))}%`
              }}
            />
          </div>
        </div>

        {/* Engine status pill */}
        <div className="text-right shrink-0 text-[10px] text-slate-400 leading-tight">
          <p>D: <span className="font-bold text-slate-200">{depth}</span></p>
          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-[#0a0f16] border border-slate-800 text-[9px] font-bold text-emerald-400">
            {engineName}
          </span>
        </div>
      </div>

      {/* Compact Evaluation Graph Card */}
      <div className="p-2.5 rounded-xl bg-[#101721]/95 border border-[#1b2636] shadow-xl">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-white">
            <TrendingUp size={12} className="text-emerald-400" />
            <span>Eval Graph</span>
          </div>
          <select
            value={graphPerspective}
            onChange={(e) => setGraphPerspective(e.target.value)}
            className="px-1.5 py-0.5 rounded bg-[#0a0f16] border border-slate-800 text-[10px] font-semibold text-slate-300 outline-none"
          >
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </div>

        {/* SVG Interactive Curve */}
        <div className="relative w-full h-20 bg-[#0a0f16] rounded-lg border border-slate-850 p-1 overflow-hidden">
          <div className="absolute inset-x-2 top-1/2 h-[1px] bg-slate-800 pointer-events-none" />
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
            {moves.length > 0 && (() => {
              const pts = moves.map((m, idx) => {
                const x = (idx / Math.max(1, moves.length - 1)) * 96 + 2;
                const score = graphPerspective === 'white' ? (m.eval_after || 0) : -(m.eval_after || 0);
                const clamped = Math.max(-3, Math.min(3, score));
                const y = 25 - (clamped / 3) * 22;
                return `${x},${y}`;
              });
              const pathD = `M ${pts.join(' L ')}`;
              const currentIdx = Math.max(0, Math.min(moves.length - 1, currentPly - 1));
              const scrubX = moves.length > 0 ? (currentIdx / Math.max(1, moves.length - 1)) * 96 + 2 : 50;

              return (
                <>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <line
                    x1={scrubX}
                    y1="2"
                    x2={scrubX}
                    y2="48"
                    stroke="#22c55e"
                    strokeWidth="1.2"
                  />
                  <circle
                    cx={scrubX}
                    cy={moves[currentIdx] ? 25 - (Math.max(-3, Math.min(3, moves[currentIdx].eval_after || 0)) / 3) * 22 : 25}
                    r="2"
                    fill="#4ade80"
                    stroke="#fff"
                    strokeWidth="1"
                  />
                </>
              );
            })()}
          </svg>

          {/* Scrub handler */}
          <div
            className="absolute inset-0 cursor-crosshair"
            onClick={(e) => {
              if (moves.length === 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const targetPly = Math.round(ratio * moves.length);
              onSeekPly(Math.max(1, Math.min(moves.length, targetPly)));
            }}
          />
        </div>
      </div>

      {/* Best Move & PV Box */}
      <div className="p-2.5 rounded-xl bg-[#101721]/95 border border-[#1b2636] shadow-xl flex flex-col gap-1.5">
        <div className="p-2 rounded-lg bg-[#0a0f16] border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Star size={10} fill="currentColor" />
              </div>
              <h4 className="text-[11px] font-bold text-white truncate">
                Best: {bestMoveText}
              </h4>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-400 font-mono">
              {evalDisplay}
            </span>
          </div>

          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {explanation}
          </p>

          <div className="mt-1.5 pt-1 border-t border-slate-850 flex items-center justify-between text-[10px]">
            <span className="font-mono text-emerald-400 truncate max-w-[190px]">
              {pvList.slice(0, 4).join(' ')}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 rounded text-slate-400 hover:text-white"
              title="Copy PV"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            </button>
          </div>
        </div>

        {/* Top Candidate Moves */}
        <div className="p-2 rounded-lg bg-[#0a0f16] border border-slate-800">
          <h4 className="text-[10px] font-bold text-slate-300 mb-1 flex items-center gap-1">
            <Sparkles size={11} className="text-emerald-400" />
            <span>Top Candidate Lines</span>
          </h4>

          <div className="space-y-0.5">
            {(topMoves.length > 0 ? topMoves.slice(0, 4) : [
              { num: 1, san: 'd3', eval: '+0.32' },
              { num: 2, san: 'Nc3', eval: '+0.28' },
              { num: 3, san: 'd4', eval: '+0.21' },
            ]).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-0.5 px-1 rounded hover:bg-slate-800/40 text-[10px] font-mono"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-bold w-3">{item.num || idx + 1}.</span>
                  <span className="font-bold text-slate-200">{item.san || item.pv?.[0] || 'Nf3'}</span>
                </div>
                <span className="font-bold text-emerald-400">
                  {item.eval || (item.score?.cp !== undefined ? `${item.score.cp >= 0 ? '+' : ''}${(item.score.cp / 100).toFixed(2)}` : '+0.20')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="p-2.5 rounded-xl bg-[#101721]/95 border border-[#1b2636] shadow-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
            <Lightbulb size={13} className="text-amber-400" />
            <span>Key Insights</span>
          </div>

          <div className="space-y-1">
            {insights.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className="p-1.5 rounded-lg bg-[#0a0f16] border border-slate-800/80 flex items-start gap-1.5"
              >
                <div className="w-5 h-5 rounded bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  {item.icon === 'book' && <BookOpen size={11} />}
                  {item.icon === 'target' && <Target size={11} />}
                  {item.icon === 'knight' && <Activity size={11} />}
                  {item.icon === 'shield' && <Shield size={11} />}
                  {!['book', 'target', 'knight', 'shield'].includes(item.icon) && <Sparkles size={11} />}
                </div>
                <div className="min-w-0">
                  <h5 className="text-[10px] font-bold text-slate-200 truncate">{item.title}</h5>
                  <p className="text-[9px] text-slate-400 mt-0.2 leading-tight">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

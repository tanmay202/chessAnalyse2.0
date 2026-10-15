import React from 'react';
import { Sparkles, Target, RotateCcw, AlertTriangle } from 'lucide-react';

export default function CoachCard({ activeMove, isRetryMode, onStartRetry }) {
  if (!activeMove) {
    return (
      <div 
        className="p-4 rounded-xl border flex items-start gap-3.5 shadow-md"
        style={{
          backgroundColor: 'var(--bg-panel)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="w-11 h-11 rounded-full bg-emerald-900/60 border-2 border-emerald-500/80 flex items-center justify-center text-xl shadow-inner shrink-0">
          👨‍🏫
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white mb-1">Coach Danny</div>
          <p className="text-xs text-stone-300 leading-relaxed">
            Welcome to Game Review! Click next or use your arrow keys to review moves with Stockfish 18 evaluation.
          </p>
        </div>
      </div>
    );
  }

  const { classification, classification_name, badge, color, san, move_number, turn, commentary, eval_after, mate_after } = activeMove;
  const isError = ['inaccuracy', 'mistake', 'miss', 'blunder'].includes(classification);
  const isBrilliant = classification === 'brilliant';
  const isGreat = classification === 'great';

  let coachEmoji = "👨‍🏫";
  if (isBrilliant) coachEmoji = "🤩";
  else if (isGreat) coachEmoji = "🎯";
  else if (classification === 'blunder') coachEmoji = "😱";
  else if (classification === 'miss') coachEmoji = "🤦‍♂️";
  else if (classification === 'mistake') coachEmoji = "😕";
  else if (classification === 'best') coachEmoji = "😎";

  const scoreStr = mate_after ? `M${mate_after}` : (eval_after >= 0 ? "+" : "") + eval_after.toFixed(2);

  return (
    <div 
      className={`p-4 rounded-xl border flex items-start gap-3.5 shadow-lg transition-all ${
        isBrilliant ? 'border-cyan-500/50 shadow-cyan-950/40 bg-gradient-to-r from-cyan-950/20 to-transparent' : ''
      }`}
      style={{
        backgroundColor: 'var(--bg-panel)',
        borderColor: isBrilliant ? '#1baaa0' : 'var(--border-color)',
      }}
    >
      {/* Coach Avatar */}
      <div 
        className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl shadow-inner shrink-0 transition-transform hover:scale-105"
        style={{ 
          borderColor: color || '#81b64c',
          backgroundColor: 'rgba(255, 255, 255, 0.05)'
        }}
      >
        {coachEmoji}
      </div>

      {/* Coach Commentary Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span 
              className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1 shadow-sm"
              style={{ backgroundColor: color || '#81b64c' }}
            >
              <span>{badge}</span>
              <span>{classification_name}</span>
            </span>

            <span className="font-extrabold text-sm text-white">
              {move_number}.{turn === 'black' ? '..' : ''} {san}
            </span>

            <span className="text-xs font-mono text-stone-400 font-bold">
              [{scoreStr}]
            </span>
          </div>

          {/* Retry Button on Blunder/Mistake */}
          {isError && (
            <button
              onClick={onStartRetry}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all flex items-center gap-1.5 shadow-md shadow-rose-950/40 active:scale-95"
            >
              <RotateCcw size={12} strokeWidth={2.5} />
              <span>Retry Mistake</span>
            </button>
          )}
        </div>

        <p className="text-xs text-stone-200 leading-relaxed font-medium">
          {commentary}
        </p>

        {isRetryMode && (
          <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-medium">
            <AlertTriangle size={14} className="shrink-0" />
            <span>Retry Mode Active: Click a piece on the board and make the correct move!</span>
          </div>
        )}
      </div>
    </div>
  );
}

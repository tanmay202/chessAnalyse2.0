import React from 'react';

export default function EvalBar({ evalScore, mate, isFlipped }) {
  let percent = 50;
  let labelText = "0.0";

  if (mate !== null && mate !== undefined) {
    percent = mate > 0 ? 100 : 0;
    labelText = `M${Math.abs(mate)}`;
  } else {
    const score = evalScore || 0;
    percent = 50 + (score / 8.0) * 50;
    percent = Math.max(3, Math.min(97, percent));
    labelText = (score >= 0 ? "+" : "") + score.toFixed(1);
  }

  // If board is flipped (Black perspective), flip bar visually
  const displayPercent = isFlipped ? 100 - percent : percent;
  const isWhiteAdvantage = (evalScore || 0) >= 0;

  return (
    <div className="w-8 h-[560px] bg-neutral-900 rounded-lg overflow-hidden flex flex-col-reverse relative shadow-2xl border border-neutral-800 select-none">
      {/* White portion fill */}
      <div 
        className="w-full bg-white transition-all duration-300 ease-out"
        style={{ height: `${displayPercent}%` }}
      />

      {/* Floating Score Label */}
      <div 
        className={`absolute left-0 right-0 text-center text-[11px] font-black tracking-tight transition-all duration-300 ${
          displayPercent > 50 ? 'bottom-2 text-neutral-900' : 'top-2 text-white'
        }`}
      >
        {labelText}
      </div>
    </div>
  );
}

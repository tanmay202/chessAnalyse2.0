import React, { useEffect, useRef } from 'react';

export default function MoveList({ moves, currentPly, onSeekPly }) {
  const containerRef = useRef(null);

  // Auto-scroll active move into view
  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector('.move-active');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentPly]);

  if (!moves || moves.length === 0) return null;

  // Group moves into pairs (White & Black)
  const rows = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({
      turnNum: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1] || null,
    });
  }

  return (
    <div 
      ref={containerRef}
      className="p-2 rounded-xl border max-h-[380px] overflow-y-auto space-y-0.5 shadow-md"
      style={{
        backgroundColor: 'var(--bg-panel)',
        borderColor: 'var(--border-color)',
      }}
    >
      {rows.map((row) => (
        <div 
          key={row.turnNum}
          className="grid grid-cols-[36px_1fr_1fr] items-center px-2 py-1 rounded-md text-xs hover:bg-white/5 transition-colors"
        >
          {/* Turn Number */}
          <span className="font-bold text-stone-500">{row.turnNum}.</span>

          {/* White Move */}
          <button
            onClick={() => onSeekPly(row.white.ply)}
            className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-all ${
              currentPly === row.white.ply ? 'move-active bg-emerald-500/25 text-white font-bold ring-1 ring-emerald-500/40' : 'text-stone-200 hover:bg-white/5'
            }`}
          >
            <span className="font-semibold">{row.white.san}</span>
            <span 
              className="text-[9px] font-black px-1.5 py-0.2 rounded-full text-white ml-1.5 shadow-sm"
              style={{ backgroundColor: row.white.color || '#81b64c' }}
            >
              {row.white.symbol}
            </span>
          </button>

          {/* Black Move */}
          {row.black ? (
            <button
              onClick={() => onSeekPly(row.black.ply)}
              className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-all ${
                currentPly === row.black.ply ? 'move-active bg-emerald-500/25 text-white font-bold ring-1 ring-emerald-500/40' : 'text-stone-200 hover:bg-white/5'
              }`}
            >
              <span className="font-semibold">{row.black.san}</span>
              <span 
                className="text-[9px] font-black px-1.5 py-0.2 rounded-full text-white ml-1.5 shadow-sm"
                style={{ backgroundColor: row.black.color || '#81b64c' }}
              >
                {row.black.symbol}
              </span>
            </button>
          ) : (
            <div />
          )}
        </div>
      ))}
    </div>
  );
}

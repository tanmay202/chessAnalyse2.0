import React from 'react';

const CATEGORIES = [
  { key: "brilliant", name: "Brilliant", sym: "!!", color: "#1baaa0" },
  { key: "great", name: "Great Find", sym: "!", color: "#5c8bb0" },
  { key: "best", name: "Best", sym: "★", color: "#81b64c" },
  { key: "excellent", name: "Excellent", sym: "✓✓", color: "#81b64c" },
  { key: "good", name: "Good", sym: "✓", color: "#96bc76" },
  { key: "book", name: "Book", sym: "📖", color: "#b08850" },
  { key: "inaccuracy", name: "Inaccuracy", sym: "?!", color: "#f7c631" },
  { key: "mistake", name: "Mistake", sym: "?", color: "#e58f2a" },
  { key: "miss", name: "Miss", sym: "❌", color: "#ff5252" },
  { key: "blunder", name: "Blunder", sym: "??", color: "#fa412d" },
  { key: "forced", name: "Forced", sym: "⇥", color: "#9e9e9e" },
];

export default function BreakdownTable({ whiteCounts, blackCounts }) {
  if (!whiteCounts || !blackCounts) return null;

  return (
    <div 
      className="p-3.5 rounded-xl border shadow-md"
      style={{
        backgroundColor: 'var(--bg-panel)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Header */}
      <div 
        className="grid grid-cols-[140px_1fr_1fr] pb-2 mb-1.5 border-b text-[11px] font-bold uppercase tracking-wider text-stone-400"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <span>Move Quality</span>
        <span className="text-center">White</span>
        <span className="text-center">Black</span>
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {CATEGORIES.map((cat) => {
          const wVal = whiteCounts[cat.key] || 0;
          const bVal = blackCounts[cat.key] || 0;
          const total = Math.max(1, wVal + bVal);
          const wPercent = (wVal / total) * 100;
          const bPercent = (bVal / total) * 100;

          return (
            <div 
              key={cat.key}
              className="grid grid-cols-[140px_1fr_1fr] items-center px-2 py-1 rounded-lg hover:bg-white/5 transition-colors text-xs"
            >
              {/* Category Badge & Name */}
              <div className="flex items-center gap-2">
                <span 
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.sym}
                </span>
                <span className="font-semibold text-stone-200">{cat.name}</span>
              </div>

              {/* White Count & Progress */}
              <div className="flex items-center justify-center gap-2">
                <span 
                  className={`font-black text-xs min-w-[20px] text-center ${
                    wVal > 0 ? 'text-white' : 'text-stone-600'
                  }`}
                >
                  {wVal}
                </span>
              </div>

              {/* Black Count & Progress */}
              <div className="flex items-center justify-center gap-2">
                <span 
                  className={`font-black text-xs min-w-[20px] text-center ${
                    bVal > 0 ? 'text-white' : 'text-stone-600'
                  }`}
                >
                  {bVal}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

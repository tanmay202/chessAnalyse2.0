import React from 'react';

function AccuracyCircle({ accuracy }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (accuracy / 100) * circumference;

  let color = "#81b64c"; // green
  if (accuracy < 65) color = "#fa412d"; // red
  else if (accuracy < 75) color = "#f7c631"; // yellow
  else if (accuracy < 85) color = "#96bc76"; // light green

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="4"
        />
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-black tracking-tight" style={{ color }}>
          {accuracy.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export default function PlayerCards({ white, black }) {
  if (!white || !black) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* White Player */}
      <div 
        className="p-3.5 rounded-xl border flex items-center justify-between shadow-md transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-neutral-900 font-extrabold flex items-center justify-center text-sm shadow-md">
            W
          </div>
          <div>
            <div className="font-bold text-sm text-white truncate max-w-[120px]">{white.name}</div>
            <div className="text-[11px] text-stone-400 font-medium">Rating: {white.rating || 'Unrated'}</div>
            <div className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/25">
              ~{white.estimated_elo} Elo
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <AccuracyCircle accuracy={white.accuracy} />
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">Accuracy</span>
        </div>
      </div>

      {/* Black Player */}
      <div 
        className="p-3.5 rounded-xl border flex items-center justify-between shadow-md transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-900 border-2 border-neutral-700 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
            B
          </div>
          <div>
            <div className="font-bold text-sm text-white truncate max-w-[120px]">{black.name}</div>
            <div className="text-[11px] text-stone-400 font-medium">Rating: {black.rating || 'Unrated'}</div>
            <div className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/25">
              ~{black.estimated_elo} Elo
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <AccuracyCircle accuracy={black.accuracy} />
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">Accuracy</span>
        </div>
      </div>
    </div>
  );
}

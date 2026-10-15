import React from 'react';
import { Crown, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#1b2636] bg-[#0c1219]/90 py-4 px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 select-none">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <Crown size={12} />
        </div>
        <span className="font-bold text-slate-300">ChessAnalyzer</span>
        <span className="text-slate-600">•</span>
        <span className="text-[11px] text-slate-400">Deep Analysis. Clear Insights.</span>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-slate-400">
        <span>Powered by Stockfish 16 WASM & Chess.js</span>
        <span className="text-slate-600">|</span>
        <span>Built for the Chess Community</span>
        <span className="text-slate-600">|</span>
        <span className="text-emerald-400 font-mono font-semibold">v1.0</span>
      </div>
    </footer>
  );
}

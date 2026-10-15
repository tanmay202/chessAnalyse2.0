import React, { useEffect, useState } from 'react';
import { X, Trophy, Play } from 'lucide-react';

export default function SampleGamesModal({ isOpen, onClose, onSelectGame }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/sample-games')
      .then((r) => r.json())
      .then((data) => {
        setGames(data.games || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-xl rounded-2xl border p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
        style={{
          backgroundColor: 'var(--bg-panel)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400" size={20} />
            <h2 className="text-base font-bold text-white">Select Famous Master Game</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Games List */}
        <div className="overflow-y-auto space-y-2 flex-1 pr-1">
          {loading ? (
            <div className="text-center py-8 text-xs text-stone-400">Loading sample games...</div>
          ) : (
            games.map((g) => (
              <div
                key={g.filename}
                onClick={() => onSelectGame(g.filename)}
                className="p-3 rounded-xl border cursor-pointer hover:border-emerald-500/50 hover:bg-white/5 transition-all flex items-center justify-between group"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div>
                  <div className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                    {g.title}
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {g.event} • <span className="text-emerald-400 font-semibold">{g.eco}</span> {g.opening}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/40 text-stone-300">
                    {g.result}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={14} fill="currentColor" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t flex justify-end shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-300 hover:bg-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

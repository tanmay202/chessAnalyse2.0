import React from 'react';
import { X, Check, Palette, Sparkles } from 'lucide-react';
import { BOARD_THEMES, APP_THEMES } from '../utils/themes.js';

export default function ThemeSelectorModal({
  isOpen,
  onClose,
  currentBoardTheme,
  onSelectBoardTheme,
  currentAppTheme,
  onSelectAppTheme,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-xl rounded-2xl border p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-panel)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <Palette className="text-amber-400" size={20} />
            <h2 className="text-base font-bold text-white">Visual Themes & Design</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section 1: Chessboard Themes */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300 mb-3 flex items-center gap-2">
            <span>Chessboard Square Styles</span>
            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10">
              7 Themes
            </span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {BOARD_THEMES.map((theme) => {
              const isSelected = currentBoardTheme.id === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => onSelectBoardTheme(theme)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 relative ${
                    isSelected ? 'ring-2 ring-emerald-400 border-transparent shadow-lg shadow-emerald-950/40' : 'hover:border-stone-500 hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: isSelected ? 'var(--accent-color)' : 'var(--border-color)',
                  }}
                >
                  {/* Mini 4-square board preview */}
                  <div className="w-full h-12 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 border border-black/20">
                    <div style={{ backgroundColor: theme.lightSq }} />
                    <div style={{ backgroundColor: theme.darkSq }} />
                    <div style={{ backgroundColor: theme.darkSq }} />
                    <div style={{ backgroundColor: theme.lightSq }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{theme.name}</span>
                    {isSelected && <Check size={14} className="text-emerald-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Application UI Themes */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300 mb-3 flex items-center gap-2">
            <span>Application Interface Style</span>
            <span className="text-[10px] text-sky-400 font-semibold px-2 py-0.5 rounded-full bg-sky-500/10">
              5 Themes
            </span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {APP_THEMES.map((theme) => {
              const isSelected = currentAppTheme.id === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => onSelectAppTheme(theme)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected ? 'ring-2 ring-emerald-400 border-transparent shadow-lg shadow-emerald-950/40' : 'hover:border-stone-500 hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: theme.bgCard,
                    borderColor: isSelected ? 'var(--accent-color)' : 'var(--border-color)',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-4 h-4 rounded-full border border-white/20 shrink-0" 
                      style={{ backgroundColor: theme.accent }} 
                    />
                    <span className="text-xs font-bold text-white">{theme.name}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-emerald-400" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t flex justify-end" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-bold text-white transition-all shadow-md hover:brightness-110"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

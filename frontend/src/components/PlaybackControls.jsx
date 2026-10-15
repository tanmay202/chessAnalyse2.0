import React from 'react';
import { 
  SkipBack, 
  ChevronLeft, 
  Play, 
  Pause, 
  ChevronRight, 
  SkipForward, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Zap, 
  FastForward 
} from 'lucide-react';

export default function PlaybackControls({
  onFirst,
  onPrev,
  onTogglePlay,
  isPlaying,
  onNext,
  onLast,
  onPrevKey,
  onNextKey,
  onFlip,
  showBestArrow,
  onToggleBestArrow,
}) {
  return (
    <div 
      className="p-3 rounded-xl border flex items-center justify-between shadow-lg"
      style={{
        backgroundColor: 'var(--bg-panel)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Primary Navigation Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onFirst}
          className="p-2 rounded-lg border text-stone-300 hover:text-white transition-all hover:bg-white/5 active:scale-95"
          style={{ 
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)' 
          }}
          title="First Move (Home)"
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={onPrev}
          className="p-2 rounded-lg border text-stone-300 hover:text-white transition-all hover:bg-white/5 active:scale-95"
          style={{ 
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)' 
          }}
          title="Previous Move (Left Arrow)"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          onClick={onTogglePlay}
          className="px-4 py-2 rounded-lg font-bold text-white transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/40 hover:brightness-110 active:scale-95"
          style={{ backgroundColor: 'var(--accent-color)' }}
          title="Autoplay (Spacebar)"
        >
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          <span className="text-xs font-semibold">{isPlaying ? "Pause" : "Play"}</span>
        </button>

        <button
          onClick={onNext}
          className="p-2 rounded-lg border text-stone-300 hover:text-white transition-all hover:bg-white/5 active:scale-95"
          style={{ 
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)' 
          }}
          title="Next Move (Right Arrow)"
        >
          <ChevronRight size={18} />
        </button>

        <button
          onClick={onLast}
          className="p-2 rounded-lg border text-stone-300 hover:text-white transition-all hover:bg-white/5 active:scale-95"
          style={{ 
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)' 
          }}
          title="Last Move (End)"
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* Auxiliary Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevKey}
          className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold text-stone-300 hover:text-white transition-all hover:bg-white/5 flex items-center gap-1"
          style={{ 
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)' 
          }}
          title="Previous Blunder / Key Moment"
        >
          <Zap size={14} className="text-amber-400" />
          <span>⏮ Key</span>
        </button>

        <button
          onClick={onNextKey}
          className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold text-stone-300 hover:text-white transition-all hover:bg-white/5 flex items-center gap-1"
          style={{ 
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)' 
          }}
          title="Next Blunder / Key Moment"
        >
          <span>Key ⏭</span>
          <Zap size={14} className="text-amber-400" />
        </button>

        <button
          onClick={onToggleBestArrow}
          className="p-2 rounded-lg border text-stone-300 hover:text-white transition-all hover:bg-white/5"
          style={{ 
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)' 
          }}
          title={showBestArrow ? "Hide Engine Arrow" : "Show Best Move Arrow"}
        >
          {showBestArrow ? <Eye size={16} className="text-emerald-400" /> : <EyeOff size={16} className="text-stone-500" />}
        </button>

        <button
          onClick={onFlip}
          className="p-2 rounded-lg border text-stone-300 hover:text-white transition-all hover:bg-white/5"
          style={{ 
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)' 
          }}
          title="Flip Board"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}

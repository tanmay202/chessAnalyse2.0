import React, { useState } from 'react';
import { X, Upload, Play, Cpu } from 'lucide-react';

export default function NewReviewModal({ isOpen, onClose, onStartReview, isLoading }) {
  const [pgnText, setPgnText] = useState('');
  const [depth, setDepth] = useState(12);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPgnText(event.target?.result || '');
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pgnText.trim()) return;
    onStartReview(pgnText.trim(), depth);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-xl rounded-2xl border p-6 shadow-2xl space-y-4"
        style={{
          backgroundColor: 'var(--bg-panel)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ♟
            </div>
            <h2 className="text-base font-bold text-white">Review New Game</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Paste PGN (Standard Algebraic Notation):
            </label>
            <textarea
              value={pgnText}
              onChange={(e) => setPgnText(e.target.value)}
              placeholder="1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5..."
              rows={6}
              className="w-full p-3 rounded-xl border bg-black/40 text-stone-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y"
              style={{ borderColor: 'var(--border-color)' }}
            />
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Depth selector */}
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-emerald-400" />
              <span className="text-xs font-medium text-stone-300">Engine Depth:</span>
              <select
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg border bg-black/40 text-white text-xs font-semibold focus:outline-none"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <option value={10}>Fast (Depth 10)</option>
                <option value={12}>Standard (Depth 12)</option>
                <option value={14}>Deep (Depth 14)</option>
                <option value={18}>Master (Depth 18)</option>
              </select>
            </div>

            {/* File upload */}
            <label className="px-3 py-1.5 rounded-lg border text-xs font-semibold text-stone-300 hover:text-white cursor-pointer hover:bg-white/5 flex items-center gap-1.5"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <Upload size={14} className="text-sky-400" />
              <span>Upload .pgn</span>
              <input type="file" accept=".pgn,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !pgnText.trim()}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40 hover:brightness-110 disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-color)' }}
            >
              <Play size={14} fill="currentColor" />
              <span>{isLoading ? "Analyzing Game..." : "Start Review"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

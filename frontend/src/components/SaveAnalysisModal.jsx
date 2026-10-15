import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle2 } from 'lucide-react';
import { saveAnalysis } from '../services/supabase.js';

export default function SaveAnalysisModal({ isOpen, onClose, currentAnalysis, onSaveComplete }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && currentAnalysis) {
      const defaultTitle = currentAnalysis.headers?.White && currentAnalysis.headers?.Black
        ? `${currentAnalysis.headers.White} vs ${currentAnalysis.headers.Black}`
        : (currentAnalysis.inputType === 'fen' ? 'Custom FEN Position' : 'Chess Game Analysis');
      setTitle(defaultTitle);
      setErrorMsg('');
      setSuccess(false);
    }
  }, [isOpen, currentAnalysis]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentAnalysis) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const result = await saveAnalysis({
        title: title.trim(),
        inputType: currentAnalysis.inputType || 'pgn',
        pgn: currentAnalysis.pgn || null,
        fen: currentAnalysis.fen || null,
        settings: currentAnalysis.settings || {},
        result: currentAnalysis.result || {},
      });
      setSuccess(true);
      if (onSaveComplete) onSaveComplete(result);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || "Failed to save analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[#141b24] p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Save className="text-emerald-400" size={18} />
            <h2 className="text-base font-bold text-white">Save Analysis to Cloud</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Analysis successfully saved!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Analysis Title:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Opera Game Review"
              className="w-full p-2.5 rounded-xl border border-neutral-700 bg-neutral-900/60 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Analysis"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

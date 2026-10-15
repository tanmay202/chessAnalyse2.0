import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Trash2, Edit2, Play, Calendar, Check } from 'lucide-react';
import { fetchSavedAnalyses, deleteSavedAnalysis, updateSavedAnalysisTitle } from '../services/supabase.js';

export default function SavedAnalysesModal({ isOpen, onClose, onSelectAnalysis }) {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchSavedAnalyses();
      setAnalyses(data || []);
    } catch (err) {
      console.error("Failed to load saved analyses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Delete this saved analysis?")) return;
    try {
      await deleteSavedAnalysis(id);
      setAnalyses(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert("Failed to delete analysis: " + err.message);
    }
  };

  const handleStartEdit = (e, item) => {
    e.stopPropagation();
    setEditingId(item.id);
    setNewTitle(item.title);
  };

  const handleSaveTitle = async (e, id) => {
    e.stopPropagation();
    try {
      await updateSavedAnalysisTitle(id, newTitle);
      setAnalyses(prev => prev.map(a => a.id === id ? { ...a, title: newTitle } : a));
      setEditingId(null);
    } catch (err) {
      alert("Failed to rename: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-[#141b24] p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="text-emerald-400" size={20} />
            <h2 className="text-base font-bold text-white">Saved Analyses & History</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content List */}
        <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
          {loading ? (
            <div className="text-center py-12 text-xs text-neutral-400">Loading saved analyses...</div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-12 text-xs text-neutral-400 space-y-2">
              <p>No saved analyses found yet.</p>
              <p className="text-neutral-500">Analyze any game or position and click "Save Analysis" to store it!</p>
            </div>
          ) : (
            analyses.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectAnalysis(item);
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/60 hover:border-emerald-500/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="min-w-0 flex-1 pr-4">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className="px-2 py-1 rounded bg-black/50 border border-neutral-700 text-white text-xs font-bold"
                        autoFocus
                      />
                      <button 
                        onClick={e => handleSaveTitle(e, item.id)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-emerald-400 truncate">
                        {item.title}
                      </span>
                      <button 
                        onClick={e => handleStartEdit(e, item)}
                        className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-neutral-300 transition-opacity p-0.5"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-1">
                    <span className="uppercase font-extrabold text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-emerald-400">
                      {item.input_type}
                    </span>
                    <span className="flex items-center gap-1 text-neutral-500">
                      <Calendar size={11} />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    {item.is_local && (
                      <span className="text-[10px] text-amber-400 font-semibold">(Local guest)</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete saved analysis"
                  >
                    <Trash2 size={15} />
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={14} fill="currentColor" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-neutral-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

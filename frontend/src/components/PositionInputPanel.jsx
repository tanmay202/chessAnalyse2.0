import React from 'react';
import { 
  Clock, 
  BarChart2, 
  Trash2, 
  Save, 
  Download, 
  Loader2, 
  Square, 
  Sparkles, 
  AlertTriangle 
} from 'lucide-react';

export default function PositionInputPanel({
  inputMode, // 'pgn' | 'fen'
  setInputMode,
  inputText,
  setInputText,
  onAnalyze,
  onStopAnalysis,
  isAnalyzing,
  analysisProgress, // { current, total, text }
  engineDepth,
  setEngineDepth,
  analysisTime,
  setAnalysisTime,
  engineType, // 'browser' | 'backend'
  setEngineType,
  showEvalGraph,
  setShowEvalGraph,
  showBestArrows,
  setShowBestArrows,
  showInsights,
  setShowInsights,
  onClear,
  onSaveAnalysis,
  onExportPgn,
  onLoadExample,
  validationError,
}) {
  return (
    <div className="w-full lg:w-[260px] xl:w-[295px] 2xl:w-[320px] shrink-0 min-h-0 lg:h-full flex flex-col justify-between rounded-xl bg-[#101721]/95 border border-[#1b2636] p-2.5 shadow-xl select-none text-xs overflow-y-auto scrollbar-thin">
      {/* Top Group: Header & Inputs */}
      <div className="flex flex-col gap-2">
        {/* Panel Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Clock size={13} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-tight">Position Input</h2>
            </div>
          </div>

          {/* Mode Tabs: PGN vs FEN */}
          <div className="flex p-0.5 rounded-lg bg-[#0a0f16] border border-slate-800">
            <button
              onClick={() => setInputMode('pgn')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                inputMode === 'pgn'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PGN
            </button>
            <button
              onClick={() => setInputMode('fen')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                inputMode === 'fen'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              FEN
            </button>
          </div>
        </div>

        {/* Input Textarea */}
        <div className="flex flex-col gap-1">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={2}
              placeholder={
                inputMode === 'pgn'
                  ? "Paste PGN game here..."
                  : "Paste FEN position here..."
              }
              className="w-full h-14 p-2 rounded-lg bg-[#0a0f16] border border-slate-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 text-slate-200 text-[11px] font-mono resize-none outline-none placeholder:text-slate-600 transition-all leading-snug"
            />
            {inputText && (
              <button
                onClick={() => setInputText('')}
                className="absolute top-1.5 right-1.5 p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800/80 transition-colors"
                title="Clear text"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] px-0.5">
            <button
              onClick={onLoadExample}
              className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline flex items-center gap-1"
            >
              <Sparkles size={11} />
              <span>Load Example</span>
            </button>
            {validationError && (
              <span className="text-rose-400 font-medium flex items-center gap-1">
                <AlertTriangle size={11} />
                <span>Invalid syntax</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Button: Analyze / Stop */}
        {isAnalyzing ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
              <span className="flex items-center gap-1">
                <Loader2 size={12} className="animate-spin text-emerald-400" />
                <span className="truncate max-w-[170px]">{analysisProgress?.text || "Analyzing..."}</span>
              </span>
              <span className="font-bold text-emerald-400 text-[10px]">
                {analysisProgress?.total
                  ? `${Math.round((analysisProgress.current / analysisProgress.total) * 100)}%`
                  : ''}
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{
                  width: analysisProgress?.total
                    ? `${(analysisProgress.current / analysisProgress.total) * 100}%`
                    : '60%',
                }}
              />
            </div>

            <button
              onClick={onStopAnalysis}
              className="w-full py-1.5 rounded-lg font-bold text-[11px] text-rose-300 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              <Square size={11} fill="currentColor" />
              <span>Stop Analysis</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onAnalyze}
            className="w-full py-2 rounded-lg font-extrabold text-xs text-black bg-emerald-500 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <BarChart2 size={14} className="text-black" />
            <span>Analyze Game</span>
          </button>
        )}

        {/* Engine Configuration Selectors */}
        <div className="space-y-1.5 pt-0.5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Depth</span>
            <select
              value={engineDepth}
              onChange={(e) => setEngineDepth(Number(e.target.value))}
              className="px-2 py-0.5 rounded bg-[#0a0f16] border border-slate-800 text-slate-200 text-[11px] font-semibold outline-none focus:border-emerald-500"
            >
              <option value={10}>10 (Fast)</option>
              <option value={12}>12 (Balanced)</option>
              <option value={14}>14 (Standard)</option>
              <option value={16}>16 (Deep)</option>
              <option value={18}>18 (Master)</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Time Limit</span>
            <select
              value={analysisTime}
              onChange={(e) => setAnalysisTime(Number(e.target.value))}
              className="px-2 py-0.5 rounded bg-[#0a0f16] border border-slate-800 text-slate-200 text-[11px] font-semibold outline-none focus:border-emerald-500"
            >
              <option value={1000}>1 sec</option>
              <option value={2000}>2 sec</option>
              <option value={3000}>3 sec</option>
              <option value={5000}>5 sec</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Engine</span>
            <select
              value={engineType}
              onChange={(e) => setEngineType(e.target.value)}
              className="px-1.5 py-0.5 rounded bg-[#0a0f16] border border-slate-800 text-slate-200 text-[11px] font-semibold outline-none focus:border-emerald-500 max-w-[140px] truncate"
            >
              <option value="backend">Stockfish 18 (.exe)</option>
              <option value="browser">Stockfish 16 (WASM)</option>
            </select>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[11px] text-slate-300">Eval Graph</span>
            <button
              type="button"
              onClick={() => setShowEvalGraph(!showEvalGraph)}
              className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors ${
                showEvalGraph ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                  showEvalGraph ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[11px] text-slate-300">Best Move Arrow</span>
            <button
              type="button"
              onClick={() => setShowBestArrows(!showBestArrows)}
              className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors ${
                showBestArrows ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                  showBestArrows ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[11px] text-slate-300">Coach Insights</span>
            <button
              type="button"
              onClick={() => setShowInsights(!showInsights)}
              className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors ${
                showInsights ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                  showInsights ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Bottom Actions: Clear / Save / Export */}
      <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-800/80">
        <button
          onClick={onClear}
          className="py-1 rounded-lg bg-[#0a0f16] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-all flex items-center justify-center gap-1"
          title="Clear board"
        >
          <Trash2 size={11} className="text-slate-400" />
          <span>Clear</span>
        </button>

        <button
          onClick={onSaveAnalysis}
          className="py-1 rounded-lg bg-[#0a0f16] border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 text-[11px] font-semibold transition-all flex items-center justify-center gap-1"
          title="Save analysis"
        >
          <Save size={11} className="text-emerald-400" />
          <span>Save</span>
        </button>

        <button
          onClick={onExportPgn}
          className="py-1 rounded-lg bg-[#0a0f16] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-all flex items-center justify-center gap-1"
          title="Export PGN"
        >
          <Download size={11} className="text-sky-400" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}

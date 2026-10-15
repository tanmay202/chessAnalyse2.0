import React, { useState } from 'react';
import { 
  Crown, 
  Moon, 
  Sun, 
  FolderOpen, 
  Volume2, 
  VolumeX, 
  Palette, 
  ChevronDown, 
  User, 
  LogIn, 
  LogOut,
  Sparkles
} from 'lucide-react';

export default function Navbar({
  user,
  onOpenAuth,
  onSignOut,
  onOpenSaved,
  onOpenThemes,
  soundEnabled,
  onToggleSound,
  isDarkMode = true,
  onToggleDarkMode,
}) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || "Tanmay";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="h-11 px-2 sm:px-4 md:px-5 border-b border-[#1b2636] bg-[#0c1219]/95 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 select-none shrink-0 w-full">
      {/* Brand: ChessAnalyzer */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white shrink-0">
          <Crown size={15} className="text-white fill-white/20" />
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white">
            ChessAnalyzer
          </span>
          <span className="text-[8px] sm:text-[9px] font-extrabold tracking-wider px-1 sm:px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            PRO
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-all text-xs"
          title={soundEnabled ? "Mute sound" : "Enable sound"}
        >
          {soundEnabled ? <Volume2 size={16} className="text-emerald-400" /> : <VolumeX size={16} />}
        </button>

        {/* Board & UI Themes */}
        <button
          onClick={onOpenThemes}
          className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-all text-xs"
          title="Board & UI Themes"
        >
          <Palette size={16} className="text-amber-400" />
        </button>

        {/* Dark / Light Mode Pill */}
        <button
          onClick={onToggleDarkMode}
          className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 px-2 sm:px-2.5 rounded-full bg-[#141d28] border border-slate-700/50 text-slate-300 hover:text-white transition-all text-xs"
          title="Toggle Light/Dark Theme"
        >
          <Moon size={13} className={isDarkMode ? "text-emerald-400" : "text-slate-500"} />
          <div className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all ${isDarkMode ? "bg-emerald-400" : "bg-slate-600"}`} />
          <Sun size={13} className={!isDarkMode ? "text-amber-400" : "text-slate-500"} />
        </button>

        {/* Saved Analyses */}
        <button
          onClick={onOpenSaved}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141d28] hover:bg-[#1a2533] border border-slate-700/60 text-slate-200 text-xs font-semibold transition-all shadow-sm"
        >
          <FolderOpen size={15} className="text-emerald-400" />
          <span>Saved</span>
        </button>

        {/* User Pill & Dropdown */}
        <div className="relative">
          {user ? (
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-2 sm:pr-3 py-0.5 sm:py-1 rounded-full bg-[#141d28] hover:bg-[#1b2636] border border-slate-700/60 transition-all"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center shadow-sm">
                {initials}
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-200 max-w-[70px] sm:max-w-none truncate">{displayName}</span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-bold transition-all shadow-md shadow-emerald-950/40"
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          )}

          {/* Dropdown Menu */}
          {userDropdownOpen && user && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#141d28] border border-slate-700/80 shadow-2xl py-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-750 text-slate-400">
                <p className="text-[10px] uppercase font-bold text-slate-500">Signed in as</p>
                <p className="font-semibold text-white truncate">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  onOpenSaved();
                }}
                className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <FolderOpen size={14} className="text-emerald-400" />
                <span>Saved Analyses</span>
              </button>
              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  onSignOut();
                }}
                className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 border-t border-slate-750"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

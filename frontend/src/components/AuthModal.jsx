import React, { useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signIn, signUp, resetPassword, isSupabaseConfigured } from '../services/supabase.js';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const data = await signIn(email, password);
        onAuthSuccess(data.user);
        onClose();
      } else if (mode === 'signup') {
        const data = await signUp(email, password, displayName);
        setSuccessMsg("Account created! Check your email to confirm registration or sign in directly.");
        setTimeout(() => setMode('signin'), 2500);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg("Password reset email sent! Check your inbox.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed.");
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
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              👑
            </div>
            <h2 className="text-base font-bold text-white">
              {mode === 'signin' && 'Sign in to ChessAnalyzer'}
              {mode === 'signup' && 'Create Free Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Supabase status warning if not yet configured */}
        {!isSupabaseConfigured && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Supabase Keys Not Configured</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Add <code className="bg-black/30 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="bg-black/30 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> to your <code className="bg-black/30 px-1 py-0.5 rounded">.env</code> file. Guests can still analyze any game and save to local storage for free!
              </p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Display Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-3 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Tanmay"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-700 bg-neutral-900/60 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-3 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-700 bg-neutral-900/60 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-300">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-3 text-neutral-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-700 bg-neutral-900/60 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
          >
            {loading ? "Processing..." : (
              mode === 'signin' ? "Sign In" : (mode === 'signup' ? "Create Account" : "Send Reset Email")
            )}
          </button>
        </form>

        {/* Switch mode */}
        <div className="pt-2 border-t border-neutral-800 text-center text-xs text-neutral-400">
          {mode === 'signin' ? (
            <p>
              Don't have an account?{" "}
              <button onClick={() => setMode('signup')} className="font-bold text-emerald-400 hover:underline">
                Create one for free
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button onClick={() => setMode('signin')} className="font-bold text-emerald-400 hover:underline">
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

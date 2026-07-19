import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, CheckCircle2, ArrowLeft, Zap } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'forgot';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMsg(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthenticated();
      } else if (mode === 'signup') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg('Account created! Check your email to confirm, then sign in.');
        setMode('signin');
        resetForm();
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMsg('Password reset link sent! Check your inbox.');
        setMode('signin');
      }
    } catch (err: any) {
      const msg = err?.message || 'An error occurred. Please try again.';
      if (msg.includes('Invalid login credentials')) {
        setError('Incorrect email or password.');
      } else if (msg.includes('User already registered')) {
        setError('An account with this email already exists. Try signing in.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-zinc-950 dark:via-indigo-950/20 dark:to-zinc-950 flex flex-col items-center justify-center px-6 py-12">
      {/* Logo / Brand */}
      <div className="mb-10 flex flex-col items-center gap-3 select-none">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/25">
          <Zap size={32} className="text-white" fill="white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-800 dark:text-zinc-50 tracking-tight">FlowTodo</h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 mt-0.5 tracking-wide">
            Your tasks, everywhere
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl shadow-slate-200/60 dark:shadow-black/30 border border-slate-100 dark:border-zinc-800/80 p-7 flex flex-col gap-5">

        {/* Mode Tabs */}
        {mode !== 'forgot' && (
          <div className="flex rounded-2xl bg-slate-50 dark:bg-zinc-800/60 p-1 gap-1">
            {(['signin', 'signup'] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); resetForm(); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                  mode === m
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
        )}

        {/* Back button for forgot */}
        {mode === 'forgot' && (
          <button
            onClick={() => { setMode('signin'); resetForm(); }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-zinc-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors self-start"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        )}

        {/* Header */}
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-zinc-100 tracking-tight">
            {mode === 'signin' ? 'Welcome back!' : mode === 'signup' ? 'Create your account' : 'Reset password'}
          </h2>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5 font-medium">
            {mode === 'signin'
              ? 'Sign in to sync your tasks across all devices.'
              : mode === 'signup'
              ? 'Join to keep your tasks synced everywhere you go.'
              : 'Enter your email and we\'ll send you a reset link.'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-start gap-2 leading-relaxed">
            <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" /> {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 ml-1">
              Email address
            </label>
            <div className="relative flex items-center">
              <Mail size={15} className="absolute left-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 dark:text-zinc-100 placeholder-slate-300 dark:placeholder-zinc-600 outline-none focus:border-indigo-400 dark:focus:border-indigo-600 transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          {mode !== 'forgot' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); resetForm(); }}
                    className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock size={15} className="absolute left-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 rounded-2xl pl-10 pr-11 py-3 text-sm font-semibold text-slate-800 dark:text-zinc-100 placeholder-slate-300 dark:placeholder-zinc-600 outline-none focus:border-indigo-400 dark:focus:border-indigo-600 transition-colors disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password */}
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 ml-1">
                Confirm password
              </label>
              <div className="relative flex items-center">
                <Lock size={15} className="absolute left-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 rounded-2xl pl-10 pr-11 py-3 text-sm font-semibold text-slate-800 dark:text-zinc-100 placeholder-slate-300 dark:placeholder-zinc-600 outline-none focus:border-indigo-400 dark:focus:border-indigo-600 transition-colors disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wider uppercase transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'signin' ? (
              <><LogIn size={15} /> Sign In</>
            ) : mode === 'signup' ? (
              <><UserPlus size={15} /> Create Account</>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      </div>

      {/* Footer note */}
      <p className="mt-6 text-[10px] text-slate-400 dark:text-zinc-600 text-center font-medium">
        Your data is securely synced across all your devices.
      </p>
    </div>
  );
};

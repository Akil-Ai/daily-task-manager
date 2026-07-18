import React, { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { getFirebaseInstance } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, HelpCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { auth, isConfigured } = getFirebaseInstance();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isConfigured || !auth) {
      setError('Firebase is not configured yet. Please configure it in Settings first.');
      return;
    }

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (mode !== 'forgot' && !password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMessage('Successfully signed in!');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1000);
      } else if (mode === 'signup') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMessage('Account created and logged in!');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1000);
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMessage('Password reset email sent! Check your inbox.');
        setMode('signin');
      }
    } catch (err: any) {
      console.error('Auth action failed:', err);
      let errMsg = 'An unexpected error occurred.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = 'Incorrect email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = 'An account with this email already exists.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Password should be at least 6 characters.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError(null);
    setSuccessMessage(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  const getTitle = () => {
    switch (mode) {
      case 'signin':
        return 'Welcome Back';
      case 'signup':
        return 'Create Account';
      case 'forgot':
        return 'Reset Password';
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <div className="flex flex-col gap-4 max-w-sm mx-auto py-2">
        {!isConfigured ? (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs flex flex-col gap-2">
            <span className="font-bold flex items-center gap-1.5">
              <HelpCircle size={16} /> Firebase Not Configured
            </span>
            <p>
              To sync your tasks across devices, please open the Settings tab and add your Firebase credentials first.
            </p>
          </div>
        ) : (
          <div className="text-center mb-1">
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              {mode === 'signin'
                ? 'Sign in to sync your tasks dynamically with the cloud.'
                : mode === 'signup'
                ? 'Join to sync across multiple platforms in real time.'
                : 'Enter your email to receive a password reset link.'}
            </p>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/25 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all duration-200">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all duration-200">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4 mt-2">
          {}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 ml-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-3 text-slate-400 dark:text-zinc-500" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-indigo-500 dark:focus:border-indigo-600 transition-colors"
                required
              />
            </div>
          </div>

          {}
          {mode !== 'forgot' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3 text-slate-400 dark:text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/80 rounded-2xl pl-10 pr-10 py-3 text-sm font-semibold text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-indigo-500 dark:focus:border-indigo-600 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {}
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 ml-1">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3 text-slate-400 dark:text-zinc-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/80 rounded-2xl pl-10 pr-10 py-3 text-sm font-semibold text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-indigo-500 dark:focus:border-indigo-600 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {}
          <button
            type="submit"
            disabled={loading || !isConfigured}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wider uppercase transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 shadow-lg shadow-indigo-600/10 dark:shadow-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'signin' ? (
              <>
                <LogIn size={16} /> Sign In
              </>
            ) : mode === 'signup' ? (
              <>
                <UserPlus size={16} /> Create Account
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="mt-2 text-center">
          {mode === 'forgot' ? (
            <button
              onClick={() => setMode('signin')}
              className="text-xs text-slate-400 dark:text-zinc-500 hover:text-indigo-500 dark:hover:text-indigo-400 font-bold transition-colors"
            >
              Back to Sign In
            </button>
          ) : (
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={toggleMode}
                className="text-indigo-500 dark:text-indigo-400 font-bold hover:underline"
              >
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </span>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

import {
  AlertCircle,
  ArrowRight,
  Boxes,
  Eye,
  EyeOff,
  HelpCircle,
  Lock,
  Mail,
  Shield,
  Sparkles,
  Warehouse,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../context';

type RoleTab = 'ADMIN' | 'STAFF';

interface FormErrorState {
  email?: string;
  password?: string;
  form?: string;
}

export default function Login() {
  const { login } = useApp();
  const [activeRole, setActiveRole] = useState<RoleTab>('ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [errors, setErrors] = useState<FormErrorState>({});

  const isAdmin = activeRole === 'ADMIN';

  const handleRoleChange = (role: RoleTab) => {
    if (role === activeRole) return;
    setActiveRole(role);
    setErrors({});
  };

  function triggerShake() {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  }

  function validate() {
    const errs: FormErrorState = {};
    const trimmed = email.trim();
    if (!trimmed) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      triggerShake();
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const result = await login(email.trim(), password);
      if (!result.ok) {
        triggerShake();
        setErrors({
          form: result.message || 'Invalid email or password. Please try again.',
        });
      }
    } catch {
      triggerShake();
      setErrors({
        form: 'Unable to connect to the authentication server. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen ambient-mesh-bg flex flex-col justify-between items-center px-4 py-8 md:py-12 relative overflow-hidden font-sans">
      {/* 4 Large Ambient Background Lighting Orbs */}
      <div
        className="fixed -top-20 left-[10%] w-[32rem] h-[32rem] rounded-full pointer-events-none animate-pulse-glow"
        style={{
          backgroundColor: '#818CF8',
          filter: 'blur(140px)',
          opacity: 0.2,
        }}
      />
      <div
        className="fixed -bottom-24 right-[10%] w-[36rem] h-[36rem] rounded-full pointer-events-none animate-pulse-glow"
        style={{
          backgroundColor: '#C084FC',
          filter: 'blur(150px)',
          opacity: 0.2,
          animationDelay: '2.5s',
        }}
      />
      <div
        className="fixed top-[30%] right-[20%] w-[26rem] h-[26rem] rounded-full pointer-events-none"
        style={{
          backgroundColor: '#60A5FA',
          filter: 'blur(130px)',
          opacity: 0.16,
        }}
      />

      {/* Top Header */}
      <header className="w-full max-w-md flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25 border border-white/30">
            <Warehouse size={20} className="text-white" />
          </div>
          <div>
            <span className="font-black text-base text-slate-900 tracking-[-0.025em]">StockFlow</span>
            <p className="text-[11px] text-slate-500 font-medium">Operations Terminal</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 border border-white/60 hover:bg-white/80 transition-all shadow-2xs cursor-pointer backdrop-blur-xs"
        >
          <HelpCircle size={14} />
          <span>Need help?</span>
        </button>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full max-w-md z-10">
        <div
          className={`glass-card rounded-[24px] border border-white/60 shadow-[0_16px_40px_rgba(0,0,0,0.06)] p-7 md:p-9 transition-all duration-300 ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {/* Role Tab Switcher with Sliding Pill Animation */}
          <div className="mb-6">
            <div className="relative bg-white/50 p-1.5 rounded-2xl border border-white/60 flex select-none backdrop-blur-xs">
              {/* Sliding Pill Indicator */}
              <div
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-white border border-white/80 shadow-xs transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isAdmin ? 'left-1.5' : 'left-[calc(50%+3px)]'
                }`}
              />

              {/* Admin Tab Button */}
              <button
                type="button"
                onClick={() => handleRoleChange('ADMIN')}
                className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer ${
                  isAdmin ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Shield size={14} className={isAdmin ? 'text-indigo-600' : 'text-slate-400'} />
                <span>Admin Console</span>
              </button>

              {/* Staff Tab Button */}
              <button
                type="button"
                onClick={() => handleRoleChange('STAFF')}
                className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer ${
                  !isAdmin ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Boxes size={14} className={!isAdmin ? 'text-emerald-600' : 'text-slate-400'} />
                <span>Staff Terminal</span>
              </button>
            </div>
          </div>

          {/* Heading */}
          <div key={activeRole} className="mb-5 animate-fade-slide">
            <h1 className="text-xl font-black text-slate-900 tracking-[-0.025em]">
              {isAdmin ? 'Admin Sign-In' : 'Staff Sign-In'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isAdmin
                ? 'Sign in with your enterprise administrator credentials.'
                : 'Sign in to access inventory movement operations.'}
            </p>
          </div>

          {/* Error Banner */}
          {errors.form && (
            <div
              className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-200/60 text-rose-700 text-xs flex items-start gap-2.5 animate-shake backdrop-blur-xs"
              role="alert"
            >
              <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{errors.form}</div>
              <button
                type="button"
                onClick={() => setErrors((e) => ({ ...e, form: undefined }))}
                className="text-rose-400 hover:text-rose-600 cursor-pointer"
                aria-label="Dismiss error"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    if (errors.form) setErrors((prev) => ({ ...prev, form: undefined }));
                  }}
                  placeholder={isAdmin ? 'admin@stockflow.com' : 'staff@stockflow.com'}
                  autoComplete="email"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                    errors.email
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                      : 'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    if (errors.form) setErrors((prev) => ({ ...prev, form: undefined }));
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                    errors.password
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                      : 'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className={`w-4 h-4 rounded border-slate-300 cursor-pointer ${
                    isAdmin ? 'text-indigo-600 accent-indigo-600' : 'text-emerald-600 accent-emerald-600'
                  }`}
                />
                <span className="text-xs text-slate-600 font-medium">Remember terminal session</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 text-white text-xs font-bold rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer ${
                isAdmin
                  ? 'gradient-btn-primary hover:scale-[1.01] active:scale-[0.99]'
                  : 'gradient-btn-success hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {isAdmin ? 'Administrator' : 'Operations Staff'}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mt-6 text-center z-10">
        <p className="text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} StockFlow. All rights reserved.
        </p>
      </footer>

      {/* Forgot Password Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-slide">
          <div
            className="glass-modal rounded-[24px] border border-white/70 shadow-[0_24px_60px_rgba(0,0,0,0.08)] max-w-sm w-full p-6 relative"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-500/15 text-indigo-600 border border-indigo-200/50 rounded-2xl flex items-center justify-center shadow-xs">
                <HelpCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 tracking-[-0.025em]">Reset Credentials</h3>
                <p className="text-xs text-slate-500">Need help signing in?</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              StockFlow accounts are managed by your enterprise system administrator. Please contact your internal IT administrator to provision or reset your security credentials.
            </p>

            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

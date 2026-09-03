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
    <div className="min-h-screen login-mesh-bg flex flex-col justify-between items-center px-4 py-8 md:py-12 relative overflow-x-hidden">
      {/* Subtle ambient lighting glows */}
      <div
        className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
          isAdmin ? 'bg-blue-500/10' : 'bg-emerald-500/10'
        }`}
      />
      <div
        className={`absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
          isAdmin ? 'bg-indigo-500/10' : 'bg-teal-500/10'
        }`}
      />

      {/* Top Header */}
      <header className="w-full max-w-md flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-md shadow-slate-900/10">
            <Warehouse size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 tracking-tight">StockFlow</span>
            <p className="text-[11px] text-slate-500">Inventory Management</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
        >
          <HelpCircle size={14} />
          <span>Need help?</span>
        </button>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full max-w-md z-10">
        <div
          className={`bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 md:p-8 transition-all duration-300 ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {/* Role Tab Switcher with Sliding Pill Animation */}
          <div className="mb-6">
            <div className="relative bg-slate-100 p-1 rounded-xl border border-slate-200 flex select-none">
              {/* Sliding Pill Indicator */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white border border-slate-200/80 shadow-xs transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isAdmin ? 'left-1' : 'left-[calc(50%+2px)]'
                }`}
              />

              {/* Admin Tab Button */}
              <button
                type="button"
                onClick={() => handleRoleChange('ADMIN')}
                className={`relative z-10 flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer ${
                  isAdmin ? 'text-blue-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield size={14} className={isAdmin ? 'text-blue-600' : 'text-slate-400'} />
                <span>Admin Console</span>
              </button>

              {/* Staff Tab Button */}
              <button
                type="button"
                onClick={() => handleRoleChange('STAFF')}
                className={`relative z-10 flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer ${
                  !isAdmin ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes size={14} className={!isAdmin ? 'text-emerald-600' : 'text-slate-400'} />
                <span>Staff Terminal</span>
              </button>
            </div>
          </div>

          {/* Heading */}
          <div key={activeRole} className="mb-5 animate-fade-slide">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isAdmin ? 'Admin Sign-In' : 'Staff Sign-In'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isAdmin
                ? 'Sign in with your administrator credentials.'
                : 'Sign in to access inventory operations.'}
            </p>
          </div>

          {/* Error Banner */}
          {errors.form && (
            <div
              className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-shake"
              role="alert"
            >
              <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errors.form}</div>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
                  className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-rose-400 focus:ring-rose-100 focus:border-rose-500'
                      : isAdmin
                      ? 'border-slate-300 focus:ring-blue-100 focus:border-blue-600'
                      : 'border-slate-300 focus:ring-emerald-100 focus:border-emerald-600'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
                  className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-rose-400 focus:ring-rose-100 focus:border-rose-500'
                      : isAdmin
                      ? 'border-slate-300 focus:ring-blue-100 focus:border-blue-600'
                      : 'border-slate-300 focus:ring-emerald-100 focus:border-emerald-600'
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
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
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
                    isAdmin ? 'text-blue-600 accent-blue-600' : 'text-emerald-600 accent-emerald-600'
                  }`}
                />
                <span className="text-xs text-slate-600 font-medium">Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer ${
                isAdmin
                  ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {isAdmin ? 'Administrator' : 'Staff'}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Clean Subtle Footer */}
      <footer className="w-full max-w-md mt-6 text-center z-10">
        <p className="text-xs text-slate-400">
          &copy; {new Date().getFullYear()} StockFlow. All rights reserved.
        </p>
      </footer>

      {/* Forgot Password Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-slide">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 relative"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <HelpCircle size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900">Reset Password</h3>
                <p className="text-xs text-slate-500">Need help signing in?</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              StockFlow accounts are managed by your organization. If you need a password reset or access assistance, please contact your system administrator.
            </p>

            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

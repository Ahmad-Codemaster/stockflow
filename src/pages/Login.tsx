import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  UserCheck,
  Warehouse,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useApp } from '../context';

type RoleTab = 'ADMIN' | 'STAFF';

interface FormErrorState {
  email?: string;
  password?: string;
  title?: string;
  form?: string;
  code?: string;
}

export default function Login() {
  const { login } = useApp();
  const [activeRole, setActiveRole] = useState<RoleTab>('ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrorState>({});

  // Tab change
  const handleRoleChange = (newRole: RoleTab) => {
    if (newRole === activeRole) return;
    setActiveRole(newRole);
    setErrors({});
  };

  // Detect Caps Lock state
  const handleKeyActivity = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  function validate() {
    const errs: FormErrorState = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errs.email = 'Corporate email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid corporate email address (e.g. name@company.com).';
    }
    if (!password) {
      errs.password = 'Security password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters long.';
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

        switch (result.code) {
          case 'INVALID_CREDENTIALS':
            setErrors({
              code: 'INVALID_CREDENTIALS',
              title: 'Authentication Failed',
              form: 'Invalid corporate email or password. Please verify your credentials and try again.',
            });
            break;

          case 'ACCOUNT_INACTIVE':
            setErrors({
              code: 'ACCOUNT_INACTIVE',
              title: 'Access Prohibited: Account Deactivated',
              form:
                'This operator account has been deactivated by a system administrator. Active login sessions are suspended. Please contact IT Security.',
            });
            break;

          case 'NOT_FOUND':
            setErrors({
              code: 'NOT_FOUND',
              title: 'User Not Found',
              form: `No operator account registered with email "${email}". Please verify spelling or contact an administrator to provision access.`,
            });
            break;

          case 'VALIDATION_ERROR':
            setErrors({
              code: 'VALIDATION_ERROR',
              title: 'Validation Error',
              form: result.message || 'The entered credentials do not meet system format requirements.',
            });
            break;

          case 'NETWORK_ERROR':
            setErrors({
              code: 'NETWORK_ERROR',
              title: 'Authentication Service Unreachable',
              form:
                'Unable to establish a secure connection to the StockFlow backend. Ensure the server is online and try again.',
            });
            break;

          default:
            setErrors({
              code: result.code || 'AUTH_ERROR',
              title: 'Authentication Error',
              form: result.message || 'An unexpected error occurred during authentication. Please retry.',
            });
            break;
        }
      }
    } catch {
      setErrors({
        code: 'NETWORK_ERROR',
        title: 'Connection Failure',
        form: 'The authentication server did not respond. Please verify your network connection.',
      });
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  function triggerShake() {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  }

  // Handle ESC key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && helpModalOpen) {
        setHelpModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [helpModalOpen]);

  const isAdmin = activeRole === 'ADMIN';

  return (
    <div className="min-h-full login-mesh-bg flex flex-col justify-between items-center px-4 py-8 md:py-12 relative overflow-x-hidden">
      {/* Subtle ambient lighting orbs */}
      <div
        className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
          isAdmin ? 'bg-blue-500/10' : 'bg-emerald-500/10'
        } animate-pulse-glow`}
      />
      <div
        className={`absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
          isAdmin ? 'bg-indigo-500/10' : 'bg-teal-500/10'
        } animate-pulse-glow`}
      />

      {/* Top Brand Nav */}
      <header className="w-full max-w-md flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-md shadow-slate-900/10 border border-slate-800">
            <Warehouse size={20} className="text-primary-50" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">StockFlow</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 border border-slate-300/60">
                v2.4 Core
              </span>
            </div>
            <p className="text-xs text-muted">Inventory & Operations Infrastructure</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setHelpModalOpen(true)}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
        >
          <HelpCircle size={14} />
          <span>Access Help</span>
        </button>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full max-w-md z-10">
        <div
          className={`bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/60 p-6 md:p-8 transition-all duration-300 ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {/* Animated Segmented Role Switcher */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Select Sign-in Terminal
              </span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-all duration-300 ${
                  isAdmin
                    ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                }`}
              >
                {isAdmin ? 'RBAC: Full Authority' : 'RBAC: Floor Terminal'}
              </span>
            </div>

            <div className="relative bg-slate-100/90 p-1.5 rounded-xl border border-slate-200 flex select-none">
              {/* Sliding Pill Indicator */}
              <div
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-lg bg-white border border-slate-200/80 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isAdmin ? 'left-1.5' : 'left-[calc(50%+3px)]'
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

          {/* Dynamic Context Header with animation key */}
          <div key={activeRole} className="mb-5 animate-fade-slide">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {isAdmin ? 'Administrator Sign-In' : 'Staff Operations Portal'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isAdmin
                ? 'Sign in to access catalog configuration, system settings, and user provisioning.'
                : 'Sign in to manage warehouse receiving, inventory movements, and stock dispatches.'}
            </p>
          </div>

          {/* Alert Message Banner */}
          {errors.form && (
            <div
              className={`mb-4 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-shake ${
                errors.code === 'ACCOUNT_INACTIVE'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-rose-50/90 border-rose-200 text-rose-800'
              }`}
              role="alert"
            >
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                {errors.title && (
                  <h4 className="text-xs font-bold mb-0.5 tracking-tight">{errors.title}</h4>
                )}
                <p className="text-xs leading-relaxed opacity-90">{errors.form}</p>
                {errors.code === 'INVALID_CREDENTIALS' && (
                  <p className="text-[11px] text-rose-700/80 mt-1 font-medium">
                    Tip: Passwords are case-sensitive. Check Caps Lock status.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setErrors((e) => ({ ...e, form: undefined, title: undefined }))}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                aria-label="Dismiss error"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Corporate Email</label>
              </div>
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
                  placeholder="operator@company.com"
                  className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                      : isAdmin
                      ? 'border-slate-300 focus:ring-blue-100 focus:border-blue-600'
                      : 'border-slate-300 focus:ring-emerald-100 focus:border-emerald-600'
                  }`}
                  autoComplete="email"
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
                <label className="block text-xs font-semibold text-slate-700">Security Password</label>
                <button
                  type="button"
                  onClick={() => setHelpModalOpen(true)}
                  className="text-xs text-primary hover:text-primary-dark font-medium transition-colors hover:underline cursor-pointer"
                >
                  Forgot?
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
                  onKeyDown={handleKeyActivity}
                  onKeyUp={handleKeyActivity}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                      : isAdmin
                      ? 'border-slate-300 focus:ring-blue-100 focus:border-blue-600'
                      : 'border-slate-300 focus:ring-emerald-100 focus:border-emerald-600'
                  }`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
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

              {/* Caps Lock Detector Warning */}
              {capsLockActive && (
                <div className="mt-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-1.5 animate-fade-slide">
                  <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                  <span>Caps Lock is enabled. Ensure case matches accurately.</span>
                </div>
              )}
            </div>

            {/* Remember Me & Session Security */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 accent-primary cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">Keep me signed in</span>
              </label>

              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>Encrypted Session</span>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer ${
                isAdmin
                  ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
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

      {/* Enterprise Security Trust Footer */}
      <footer className="w-full max-w-md mt-6 text-center z-10">
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500 mb-2">
          <span className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-slate-400" />
            <span>256-Bit TLS</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <KeyRound size={14} className="text-slate-400" />
            <span>Bcrypt Hashed</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <UserCheck size={14} className="text-slate-400" />
            <span>RBAC Guarded</span>
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          StockFlow Enterprise Inventory &copy; {new Date().getFullYear()}. All operations logged and audited.
        </p>
      </footer>

      {/* Forgot Password / Access Help Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-slide">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setHelpModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Account Recovery & Credential Info</h3>
                <p className="text-xs text-slate-500">Security protocol for StockFlow accounts</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 mb-6 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="font-semibold text-slate-900 mb-1">Corporate Access Credentials:</p>
                <p className="text-slate-600 text-xs">
                  Sign in using your assigned corporate email address and security password.
                </p>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-900">
                <p className="font-semibold mb-1">Account Provisioning:</p>
                <p>
                  New operator profiles are created and managed by an Administrator through the <strong>User Access Management</strong> console.
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <p className="font-semibold mb-1">Password Resets & Role Elevation:</p>
                <p>
                  If you have forgotten your password or require permissions adjustments, please contact your organization&apos;s system administrator.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

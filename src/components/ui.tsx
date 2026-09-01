import { AlertTriangle, Package, Plus } from 'lucide-react';
import React from 'react';
import type { StockStatus, ToastType, TransactionType, UserStatus } from '../types';

// --- Badge ---
type BadgeVariant = StockStatus | TransactionType | UserStatus | 'Admin' | 'Staff';

const badgeStyles: Record<string, string> = {
  'In Stock': 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shadow-2xs',
  'Low Stock': 'bg-amber-500/10 text-amber-700 border border-amber-500/25 shadow-2xs',
  'Out of Stock': 'bg-rose-500/10 text-rose-700 border border-rose-500/25 shadow-2xs',
  'Stock In': 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shadow-2xs',
  'Stock Out': 'bg-blue-500/10 text-blue-700 border border-blue-500/20 shadow-2xs',
  'Adjustment': 'bg-amber-500/10 text-amber-700 border border-amber-500/25 shadow-2xs',
  'Active': 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shadow-2xs',
  'Inactive': 'bg-slate-500/10 text-slate-600 border border-slate-300 shadow-2xs',
  'Admin': 'bg-gradient-to-r from-blue-500/15 to-indigo-500/15 text-blue-700 border border-blue-400/30 shadow-2xs',
  'Staff': 'bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs',
};

export function Badge({ variant, label }: { variant: BadgeVariant; label?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-tight transition-all ${
        badgeStyles[variant] ?? 'bg-slate-100 text-slate-600 border border-slate-200'
      }`}
    >
      {label ?? variant}
    </span>
  );
}

// --- KPI Card ---
interface KPICardProps {
  label: string;
  value: number | string;
  sub?: string;
  variant?: 'default' | 'warning' | 'danger' | 'success';
  icon?: React.ReactNode;
  sparkline?: React.ReactNode;
}

const kpiTopStripe = {
  default: 'from-blue-500 to-indigo-500',
  warning: 'from-amber-400 to-amber-600',
  danger: 'from-rose-500 to-red-600',
  success: 'from-emerald-400 to-teal-500',
};

const kpiIconTints = {
  default: 'bg-blue-50 text-blue-600 border-blue-200/60',
  warning: 'bg-amber-50 text-amber-600 border-amber-200/60',
  danger: 'bg-rose-50 text-rose-600 border-rose-200/60',
  success: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
};

export function KPICard({ label, value, sub, variant = 'default', icon, sparkline }: KPICardProps) {
  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
      {/* Subtle Top Gradient Accent Strip */}
      <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${kpiTopStripe[variant]}`} />

      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {icon && (
          <div className={`p-2 rounded-xl border flex items-center justify-center shadow-2xs ${kpiIconTints[variant]}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
          {sub && <p className="text-xs text-slate-400 font-medium mt-1">{sub}</p>}
        </div>
        {sparkline && <div className="shrink-0 mb-1">{sparkline}</div>}
      </div>
    </div>
  );
}

// --- EmptyState ---
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-16 px-6 text-center border-dashed border-2 border-slate-200">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center mb-4 shadow-sm text-blue-600">
        <Package size={26} />
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-500 mb-5 max-w-sm leading-relaxed">{description}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 gradient-btn-primary text-white text-xs font-semibold rounded-xl"
        >
          <Plus size={14} />
          {action.label}
        </button>
      )}
    </div>
  );
}

// --- Skeleton ---
export function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-slate-200/60 rounded-md animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-5 animate-pulse">
      <div className="h-3.5 bg-slate-200/70 rounded w-24 mb-4" />
      <div className="h-8 bg-slate-200/70 rounded w-20 mb-2" />
      <div className="h-3 bg-slate-200/50 rounded w-32" />
    </div>
  );
}

// --- Confirm Modal ---
interface ConfirmProps {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export function Confirm({
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmProps) {
  const btnClass =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onCancel} />
      <div className="relative w-full max-w-sm glass-modal rounded-2xl p-6 animate-fade-slide">
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-xl shadow-md transition-all ${btnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Form Helpers ---
export function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}

export const inputClass =
  'w-full px-3.5 py-2 text-xs md:text-sm rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none transition-all';
export const selectClass = `${inputClass} cursor-pointer`;

// --- Pagination ---
interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}

export function Pagination({ page, totalPages, total, pageSize, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
      <span>
        Showing <span className="font-semibold text-slate-800">{start}</span>–
        <span className="font-semibold text-slate-800">{end}</span> of{' '}
        <span className="font-semibold text-slate-800">{total}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
              p === page
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// --- Section Header ---
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// --- Status Indicator Dot ---
export function StatusDot({ status }: { status: 'In Stock' | 'Low Stock' | 'Out of Stock' }) {
  const colors = {
    'In Stock': 'bg-emerald-500 ring-emerald-300/40',
    'Low Stock': 'bg-amber-500 ring-amber-300/40',
    'Out of Stock': 'bg-rose-500 ring-rose-300/40',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ring-2 ${colors[status]}`} />;
}

// --- Toast Type Color Mapping for Notifications ---
export const notifColors: Record<string, string> = {
  warning: 'text-amber-600',
  error: 'text-rose-600',
  success: 'text-emerald-600',
  info: 'text-blue-600',
};

// --- Toast Variant Icon Labels (for reuse) ---
export const toastVariantLabels: Record<ToastType, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

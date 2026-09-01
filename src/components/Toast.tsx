import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useApp } from '../context';
import type { Toast as ToastType } from '../types';

const configs = {
  success: { icon: CheckCircle, bg: 'bg-success-bg border-success/30', text: 'text-success', iconColor: 'text-success' },
  error: { icon: XCircle, bg: 'bg-danger-bg border-danger/30', text: 'text-danger', iconColor: 'text-danger' },
  warning: { icon: AlertTriangle, bg: 'bg-warning-bg border-warning/30', text: 'text-warning', iconColor: 'text-warning' },
  info: { icon: Info, bg: 'bg-info-bg border-info/30', text: 'text-info', iconColor: 'text-info' },
};

function ToastItem({ toast }: { toast: ToastType }) {
  const { dismissToast } = useApp();
  const cfg = configs[toast.type];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm ${cfg.bg}`}>
      <Icon size={16} className={`mt-0.5 shrink-0 ${cfg.iconColor}`} />
      <p className={`text-sm font-medium flex-1 ${cfg.text}`}>{toast.message}</p>
      <button onClick={() => dismissToast(toast.id)} className={`shrink-0 ${cfg.iconColor} opacity-70 hover:opacity-100`}>
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useApp();
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}

import { X } from 'lucide-react';
import React, { useEffect } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ title, onClose, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Click-catcher backdrop without dark overlay or blur */}
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`relative w-full ${widths[size]} max-h-[90vh] flex flex-col bg-white rounded-[20px] border border-slate-200/90 shadow-[0_25px_70px_rgba(15,23,42,0.22)] overflow-hidden animate-fade-slide`}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-slate-50/90 border-b border-slate-200/80 shrink-0">
          <h2 className="text-sm font-bold text-slate-900 tracking-[-0.025em]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-4 sm:py-5 overflow-y-auto bg-white text-slate-900">{children}</div>
      </div>
    </div>
  );
}

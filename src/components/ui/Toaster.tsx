import React, { useEffect } from 'react';
import { useUIStore, Toast } from '../../store/useUIStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const { removeToast } = useUIStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration || 4000); // Default 4 seconds

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />
  };

  const borders = {
    success: 'border-green-500/20 bg-green-500/5',
    error: 'border-red-500/20 bg-red-500/5',
    info: 'border-blue-500/20 bg-blue-500/5'
  };

  return (
    <div 
      className={`
        pointer-events-auto w-full max-w-sm rounded-lg border shadow-lg backdrop-blur-md
        p-4 flex gap-3 items-start transition-all duration-300 animate-in slide-in-from-right-full fade-in
        ${borders[toast.type]} bg-slate-900/95
      `}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[toast.type]}
      </div>
      <div className="flex-1 pt-0.5">
        {toast.title && <h4 className="text-sm font-bold text-white mb-1">{toast.title}</h4>}
        <p className="text-sm text-slate-300 leading-relaxed">{toast.message}</p>
      </div>
      <button 
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 text-slate-500 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const Toaster: React.FC = () => {
  const { toasts } = useUIStore();

  return (
    <div className="fixed bottom-0 right-0 p-6 flex flex-col gap-4 z-[9999] pointer-events-none max-w-[100vw] overflow-hidden">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
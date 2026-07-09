import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Toast } from '../hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="toast-container">
      <AnimatePresence initial={false}>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className={`toast ${toast.type === 'success' ? 'toast-success' : toast.type === 'error' ? 'toast-error' : 'toast-info'}`}
          >
            <div className={`flex-shrink-0 ${toast.type === 'success' ? 'text-emerald-500' : toast.type === 'error' ? 'text-rose-500' : 'text-sky-500'}`}>
              {toast.type === 'success' && <CheckCircle size={18} />}
              {toast.type === 'error'   && <AlertCircle size={18} />}
              {toast.type === 'info'    && <Info size={18} />}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              className="btn-icon flex-shrink-0 w-7 h-7"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

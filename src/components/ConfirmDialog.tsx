import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

export default function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmText = 'Hapus', cancelText = 'Batal', variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3 mb-5">
        <div className={`icon-box icon-box-md flex-shrink-0 mt-0.5 ${variant === 'danger' ? 'icon-box-rose' : 'icon-box-amber'}`}>
          <AlertTriangle size={18} />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
      </div>
      <div className="flex gap-2.5">
        <button onClick={onClose} className="btn-secondary flex-1 text-sm">
          {cancelText}
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`flex-1 text-sm inline-flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-all duration-150 active:scale-95 ${
            variant === 'danger'
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

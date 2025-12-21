
import React from 'react';
import { CloseIcon } from '../../constants';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  confirmButtonClass?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, children, confirmText = 'Confirm', confirmButtonClass = 'bg-red-600 hover:bg-red-700' }) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await Haptics.impact({ style: ImpactStyle.Medium });
    onConfirm();
  };

  const handleClose = async () => {
    await Haptics.impact({ style: ImpactStyle.Light });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[200]" onClick={handleClose}>
      <div className="bg-surface rounded-3xl p-8 shadow-2xl w-full max-w-md animate-fadeIn border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-text-primary tracking-tight">{title}</h2>
          <button onClick={handleClose} className="p-3 text-text-muted hover:text-text-primary bg-surface-muted rounded-2xl transition-all active:scale-90">
              <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="text-text-secondary mb-8 text-sm font-medium leading-relaxed">
          {children}
        </div>
        <div className="flex justify-end gap-4">
          <button onClick={handleClose} className="flex-1 py-4 bg-surface-muted text-text-secondary rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 font-black uppercase tracking-widest text-xs transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} className={`flex-[1.5] py-4 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-[0.98] ${confirmButtonClass}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

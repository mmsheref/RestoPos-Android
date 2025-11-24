
import React from 'react';
import { CloseIcon } from '../../constants';

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-lg p-6 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
              <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="text-text-secondary mb-6">
          {children}
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 bg-surface-muted text-text-secondary rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold">
            Cancel
          </button>
          <button onClick={onConfirm} className={`px-6 py-2 text-white font-semibold rounded-lg shadow-md transition-colors ${confirmButtonClass}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
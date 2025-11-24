
import React from 'react';
import { BackupData } from '../../types';

interface ConfirmImportModalProps {
  isOpen: boolean;
  data: BackupData | null;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmImportModal: React.FC<ConfirmImportModalProps> = ({ isOpen, data, onClose, onConfirm }) => {
  if (!isOpen || !data) return null;

  const backupDate = new Date(data.timestamp);
  const formattedDate = backupDate.toLocaleDateString();
  const formattedTime = backupDate.toLocaleTimeString();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-lg p-6 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/50 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Restore Data?</h2>
            <p className="text-sm text-text-secondary mt-2">
                This action will <span className="font-bold text-red-500">overwrite</span> all your current sales, items, and settings. This cannot be undone.
            </p>
        </div>

        <div className="bg-surface-muted rounded-lg p-4 border border-border mb-6">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Backup Details</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-text-secondary">Date:</span>
                    <span className="font-medium text-text-primary">{formattedDate} at {formattedTime}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-text-secondary">Store Name:</span>
                    <span className="font-medium text-text-primary">{data.settings?.storeName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-text-secondary">Items:</span>
                    <span className="font-medium text-text-primary">{data.items?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-text-secondary">Receipts:</span>
                    <span className="font-medium text-text-primary">{data.receipts?.length || 0}</span>
                </div>
            </div>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={onClose} 
                className="flex-1 py-3 bg-surface text-text-primary border border-border rounded-lg font-semibold hover:bg-surface-muted transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={onConfirm} 
                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 shadow-md transition-colors"
            >
                Yes, Restore
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmImportModal;
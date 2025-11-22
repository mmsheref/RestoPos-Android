
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
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/50 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Restore Data?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                This action will <span className="font-bold text-red-500">overwrite</span> all your current sales, items, and settings. This cannot be undone.
            </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Backup Details</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Date:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{formattedDate} at {formattedTime}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Store Name:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{data.settings?.storeName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Items:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{data.items?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Receipts:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{data.receipts?.length || 0}</span>
                </div>
            </div>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={onClose} 
                className="flex-1 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
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


import React from 'react';
import { Item } from '../../types';

interface ConfirmCsvImportModalProps {
  isOpen: boolean;
  items: Item[];
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmCsvImportModal: React.FC<ConfirmCsvImportModalProps> = ({ isOpen, items, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-lg p-6 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Confirm CSV Import</h2>
            <p className="text-sm text-text-secondary mt-2">
                This will <span className="font-bold text-red-500">replace all existing items</span> with the content from your file. This cannot be undone.
            </p>
        </div>

        <div className="bg-surface-muted rounded-lg p-4 border border-border mb-6">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Import Summary</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-text-secondary">Items to be imported:</span>
                    <span className="font-medium text-text-primary">{items.length}</span>
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
                className="flex-1 py-3 bg-primary text-primary-content rounded-lg font-semibold hover:bg-primary-hover shadow-md transition-colors"
            >
                Confirm & Replace Items
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCsvImportModal;
import React from 'react';
import { Item } from '../../types';

interface ConfirmCsvImportModalProps {
  isOpen: boolean;
  items: Item[];
  categories: string[];
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmCsvImportModal: React.FC<ConfirmCsvImportModalProps> = ({ isOpen, items, categories, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Confirm CSV Import</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                This will <span className="font-bold text-red-500">replace all existing items</span> with the content from your file. This cannot be undone.
            </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Import Summary</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Items to be imported:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{items.length}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">New Categories found:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{categories.length}</span>
                </div>
                 <div className="text-xs text-slate-400 dark:text-slate-500 pt-2">
                     Note: New categories will be added, existing ones will be kept.
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
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-md transition-colors"
            >
                Confirm & Replace Items
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCsvImportModal;

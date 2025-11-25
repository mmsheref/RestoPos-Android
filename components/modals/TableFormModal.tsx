import React, { useState, useEffect } from 'react';
import { Table } from '../../types';

interface TableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  initialData: Table | null;
}

const TableFormModal: React.FC<TableFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-lg p-6 shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-text-primary">
          {initialData ? 'Edit Table' : 'Add New Table'}
        </h2>
        <label htmlFor="table-name" className="block text-sm font-medium text-text-secondary mb-1">Table Name</label>
        <input
          id="table-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Table 5 or Takeout"
          className="w-full p-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-primary"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
        <div className="flex justify-end items-center pt-6 mt-2 border-t border-border gap-2">
          <button onClick={onClose} className="px-6 py-2 bg-surface-muted text-text-secondary rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="px-6 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary-hover disabled:bg-gray-300 disabled:dark:bg-gray-500">
            {initialData ? 'Save Changes' : 'Add Table'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableFormModal;
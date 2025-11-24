
import React, { useState } from 'react';

interface AddGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

const AddGridModal: React.FC<AddGridModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName(''); // Reset for next time
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-lg p-6 shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-text-primary">Add New Grid</h2>
        <label htmlFor="grid-name" className="block text-sm font-medium text-text-secondary mb-1">Grid Name</label>
        <input
          id="grid-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Breakfast Menu"
          className="w-full p-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-primary"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
        <div className="flex justify-end items-center pt-6 mt-2 border-t border-border gap-2">
          <button onClick={onClose} className="px-6 py-2 bg-surface-muted text-text-secondary rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="px-6 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary-hover disabled:bg-gray-300 disabled:dark:bg-gray-500">
            Save Grid
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGridModal;
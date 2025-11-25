import React, { useState } from 'react';
import type { SavedTicket } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface SaveTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  editingTicket: SavedTicket | null;
}

const SaveTicketModal: React.FC<SaveTicketModalProps> = ({ isOpen, onClose, onSave, editingTicket }) => {
  const { tables } = useAppContext();
  const [name, setName] = useState(editingTicket?.name || '');
  
  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  const isUpdating = !!editingTicket;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-lg p-6 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-text-primary">{isUpdating ? 'Update Ticket' : 'Save Ticket'}</h2>
        
        {tables.length > 0 && (
          <>
            <p className="text-sm font-medium text-text-secondary mb-2">Quick Select</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
                {tables.map(table => (
                    <button key={table.id} onClick={() => onSave(table.name)} className="p-3 bg-surface-muted rounded-md text-text-secondary font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                        {table.name}
                    </button>
                ))}
            </div>
            
            <div className="flex items-center gap-4 my-4">
                <hr className="flex-grow border-border"/> <span className="text-text-muted text-sm">OR</span> <hr className="flex-grow border-border"/>
            </div>
          </>
        )}
        
        <label htmlFor="ticket-name" className="block text-sm font-medium text-text-secondary mb-1">Custom Ticket Name</label>
        <input
          id="ticket-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Party of 4"
          className="w-full p-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-primary"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
        
        <div className="flex justify-end items-center pt-6 mt-2 border-t border-border gap-2">
            <button onClick={onClose} className="px-6 py-2 bg-surface-muted text-text-secondary rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
            <button onClick={handleSave} disabled={!name.trim()} className="px-6 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary-hover disabled:bg-gray-300 disabled:dark:bg-gray-500">
                {isUpdating ? 'Update Ticket' : 'Save Ticket'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SaveTicketModal;
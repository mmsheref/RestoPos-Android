import React, { useState } from 'react';
import type { SavedTicket } from '../../types';

const QUICK_TICKET_NAMES = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Takeout #1', 'Takeout #2', 'Delivery'];

interface SaveTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  editingTicket: SavedTicket | null;
}

const SaveTicketModal: React.FC<SaveTicketModalProps> = ({ isOpen, onClose, onSave, editingTicket }) => {
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
      <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-slate-800">{isUpdating ? 'Update Ticket' : 'Save Ticket'}</h2>
        
        <p className="text-sm font-medium text-slate-700 mb-2">Quick Select</p>
        <div className="grid grid-cols-4 gap-2 mb-4">
            {QUICK_TICKET_NAMES.map(qName => (
                <button key={qName} onClick={() => onSave(qName)} className="p-3 bg-slate-100 rounded-md text-slate-700 font-semibold hover:bg-indigo-100 hover:text-indigo-700 transition-colors">
                    {qName}
                </button>
            ))}
        </div>
        
        <div className="flex items-center gap-4 my-4">
            <hr className="flex-grow"/> <span className="text-slate-500 text-sm">OR</span> <hr className="flex-grow"/>
        </div>
        
        <label htmlFor="ticket-name" className="block text-sm font-medium text-slate-700 mb-1">Custom Ticket Name</label>
        <input
          id="ticket-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Party of 4"
          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
        
        <div className="flex justify-end items-center pt-6 mt-2 border-t border-slate-200 gap-2">
            <button onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Cancel</button>
            <button onClick={handleSave} disabled={!name.trim()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300">
                {isUpdating ? 'Update Ticket' : 'Save Ticket'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SaveTicketModal;

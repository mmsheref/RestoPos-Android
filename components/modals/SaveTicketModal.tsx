
import React, { useState, useEffect } from 'react';
import type { SavedTicket } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface SaveTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  editingTicket: SavedTicket | null;
}

const SaveTicketModal: React.FC<SaveTicketModalProps> = ({ isOpen, onClose, onSave, editingTicket }) => {
  const { tables } = useAppContext();
  const [name, setName] = useState('');

  useEffect(() => {
    if(isOpen) {
      setName(editingTicket?.name || '');
    }
  }, [isOpen, editingTicket]);
  
  const handleSave = async () => {
    if (name.trim()) {
      await Haptics.impact({ style: ImpactStyle.Medium });
      onSave(name.trim());
    }
  };

  const handleTableSelect = async (tableName: string) => {
    // IMPACT: User selects table, we save immediately.
    await Haptics.impact({ style: ImpactStyle.Heavy });
    onSave(tableName);
  };

  const handleCancel = async () => {
    await Haptics.impact({ style: ImpactStyle.Light });
    onClose();
  };

  const isUpdating = !!editingTicket;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={handleCancel}>
      <div className="bg-surface rounded-2xl p-6 shadow-2xl w-full max-w-lg animate-fadeIn" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-text-primary">{isUpdating ? 'Update Ticket' : 'Save Ticket'}</h2>
        
        {tables.length > 0 && (
          <>
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">Quick Select Table (Completes Action)</p>
            <div className="grid grid-cols-2 gap-3 mb-6 max-h-60 overflow-y-auto pr-1">
                {tables.map(table => (
                    <button 
                      key={table.id} 
                      onClick={() => handleTableSelect(table.name)} 
                      className="text-left p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-800 dark:text-emerald-200 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border border-emerald-100 dark:border-emerald-800/50 active:scale-95"
                    >
                        {table.name}
                    </button>
                ))}
            </div>
            
            <div className="flex items-center gap-4 my-4">
                <hr className="flex-grow border-border"/> <span className="text-text-muted text-xs font-bold uppercase">OR USE CUSTOM NAME</span> <hr className="flex-grow border-border"/>
            </div>
          </>
        )}
        
        <div className="space-y-4">
            <div>
                <label htmlFor="ticket-name" className="block text-sm font-bold text-text-secondary mb-1">Custom Ticket Name</label>
                <input
                    id="ticket-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Party of 4"
                    className="w-full p-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-primary text-lg"
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    autoFocus
                />
            </div>
            
            <div className="flex justify-end items-center pt-4 border-t border-border gap-3">
                <button onClick={handleCancel} className="px-6 py-3 bg-surface-muted text-text-secondary rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={!name.trim()} className="px-8 py-3 bg-primary text-primary-content rounded-xl font-bold hover:bg-primary-hover disabled:bg-gray-300 disabled:dark:bg-gray-500 shadow-lg shadow-primary/20 transition-all">
                    {isUpdating ? 'Update Name' : 'Save with Name'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SaveTicketModal;

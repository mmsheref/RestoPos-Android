

import React from 'react';
import type { OrderItem, SavedTicket } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface OpenTicketsModalProps {
    isOpen: boolean;
    tickets: SavedTicket[];
    onClose: () => void;
    onLoadTicket: (ticket: SavedTicket) => void;
    onDeleteTicket: (id: string) => void;
}

const OpenTicketsModal: React.FC<OpenTicketsModalProps> = ({ isOpen, tickets, onClose, onLoadTicket, onDeleteTicket }) => {
    const { settings } = useAppContext();

    const calculateTotal = (items: OrderItem[]) => {
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const taxMultiplier = settings.taxEnabled ? (1 + settings.taxRate / 100) : 1;
        return subtotal * taxMultiplier;
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl w-full max-w-2xl flex flex-col" style={{maxHeight: '80vh'}} onClick={e => e.stopPropagation()}>
            <div className="flex-shrink-0 flex justify-between items-center mb-4 pb-4 border-b dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Open Tickets</h2>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-3xl font-light" aria-label="Close">&times;</button>
            </div>
            
            <div className="flex-grow overflow-y-auto -mx-6 px-6">
              {tickets.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">No tickets saved.</p>
              ) : (
                <ul className="space-y-3">
                  {tickets.map(ticket => (
                    <li key={ticket.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between transition-colors hover:bg-slate-100 dark:hover:bg-slate-700">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{ticket.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{ticket.items.length} items &bull; Total: {calculateTotal(ticket.items).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onDeleteTicket(ticket.id)} className="h-9 w-9 flex items-center justify-center text-red-500 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-500/20" aria-label={`Delete ticket ${ticket.name}`}>&times;</button>
                        <button onClick={() => onLoadTicket(ticket)} className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700">Load</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex-shrink-0 flex justify-end pt-4 mt-4 border-t dark:border-slate-700">
                 <button onClick={onClose} className="px-6 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500">Close</button>
            </div>
          </div>
        </div>
      );
}

export default OpenTicketsModal;

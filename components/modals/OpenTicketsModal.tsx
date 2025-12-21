
import React, { useState } from 'react';
import type { OrderItem, SavedTicket } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { CheckIcon, TrashIcon, SalesIcon, CloseIcon } from '../../constants';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface OpenTicketsModalProps {
    isOpen: boolean;
    tickets: SavedTicket[];
    onClose: () => void;
    onLoadTicket: (ticket: SavedTicket) => void;
    onDeleteTicket: (id: string) => void;
}

const OpenTicketsModal: React.FC<OpenTicketsModalProps> = ({ isOpen, tickets, onClose, onLoadTicket, onDeleteTicket }) => {
    const { settings, mergeTickets } = useAppContext();
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());

    const calculateTotal = (items: OrderItem[]) => {
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const taxMultiplier = settings.taxEnabled ? (1 + settings.taxRate / 100) : 1;
        return subtotal * taxMultiplier;
    };

    const toggleSelection = async (id: string) => {
        await Haptics.impact({ style: ImpactStyle.Light });
        const newSet = new Set(selectedTicketIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedTicketIds(newSet);
    };

    const handleMerge = async () => {
        if (selectedTicketIds.size < 2) return;
        
        const ids = Array.from(selectedTicketIds) as string[];
        const firstTicket = tickets.find(t => t.id === ids[0]);
        const defaultName = firstTicket ? `${firstTicket.name} + ${ids.length - 1}` : 'Merged Ticket';
        
        const newName = prompt("Enter a name for the merged ticket:", defaultName);
        if (newName) {
            await Haptics.impact({ style: ImpactStyle.Medium });
            mergeTickets(ids, newName);
            setIsSelectionMode(false);
            setSelectedTicketIds(new Set());
        }
    };

    const toggleMode = async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
        setIsSelectionMode(!isSelectionMode);
        setSelectedTicketIds(new Set());
    };

    const handleLoad = async (ticket: SavedTicket) => {
        await Haptics.impact({ style: ImpactStyle.Medium });
        onLoadTicket(ticket);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await Haptics.notification({ type: ImpactStyle.Heavy });
        onDeleteTicket(id);
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-fadeIn" style={{maxHeight: '85vh'}} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex-shrink-0 flex justify-between items-center px-6 py-5 border-b border-border bg-surface">
              <div>
                <h2 className="text-2xl font-black text-text-primary tracking-tight">
                    {isSelectionMode ? `Select Tickets` : 'Open Tickets'}
                </h2>
                <p className="text-xs text-text-muted font-bold uppercase tracking-wider mt-0.5">
                    {tickets.length} Active {tickets.length === 1 ? 'Order' : 'Orders'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                 {tickets.length > 1 && (
                     <button 
                        onClick={toggleMode} 
                        className={`px-4 py-2 text-xs font-bold rounded-xl uppercase tracking-widest transition-all ${isSelectionMode ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-surface-muted text-text-secondary hover:text-primary hover:bg-primary/10'}`}
                     >
                         {isSelectionMode ? 'Cancel' : 'Merge'}
                     </button>
                 )}
                 <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary bg-surface-muted rounded-full transition-colors" aria-label="Close">
                    <CloseIcon className="h-5 w-5" />
                 </button>
              </div>
            </div>
            
            {/* Ticket List Body */}
            <div className="flex-grow overflow-y-auto px-6 py-4 bg-background/30">
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-surface-muted p-6 rounded-full mb-4">
                        <SalesIcon className="h-12 w-12 text-text-muted opacity-30" />
                    </div>
                    <p className="text-lg font-bold text-text-primary">No saved tickets</p>
                    <p className="text-sm text-text-muted max-w-[200px] mt-1">Orders you save on the sales screen will appear here.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {tickets.map(ticket => {
                    const isSelected = selectedTicketIds.has(ticket.id);
                    const total = calculateTotal(ticket.items);
                    
                    return (
                        <li 
                            key={ticket.id} 
                            onClick={() => isSelectionMode ? toggleSelection(ticket.id) : handleLoad(ticket)}
                            className={`group relative p-4 rounded-2xl flex items-center justify-between transition-all border-2 cursor-pointer active:scale-[0.99] ${
                                isSelectionMode 
                                    ? (isSelected ? 'bg-primary/5 border-primary shadow-lg shadow-primary/5' : 'bg-surface border-border hover:border-text-muted/30')
                                    : 'bg-surface border-border hover:border-primary/40 hover:shadow-md'
                            }`}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                              {isSelectionMode && (
                                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white scale-110' : 'border-border bg-background'}`}>
                                      {isSelected && <CheckIcon className="h-3.5 w-3.5 stroke-[4px]" />}
                                  </div>
                              )}
                              
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-black text-text-primary text-lg truncate leading-none">{ticket.name}</p>
                                    <span className="flex-shrink-0 px-2 py-0.5 bg-surface-muted text-text-secondary text-[10px] font-black uppercase rounded-md tracking-wider">
                                        {ticket.items.length} {ticket.items.length === 1 ? 'Item' : 'Items'}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <p className="text-primary font-mono font-bold text-sm">₹{total.toFixed(2)}</p>
                                    {ticket.lastModified && (
                                        <span className="text-[11px] text-text-muted flex items-center gap-1">
                                            <span className="w-1 h-1 bg-text-muted/30 rounded-full"></span>
                                            {new Date(ticket.lastModified).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    )}
                                </div>
                              </div>
                          </div>
                          
                          {!isSelectionMode && (
                              <div className="flex items-center gap-2">
                                <button 
                                    onClick={(e) => handleDelete(e, ticket.id)} 
                                    className="p-3 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" 
                                    aria-label="Delete ticket"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                                <div className="px-4 py-2 bg-primary text-primary-content text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 group-hover:bg-primary-hover transition-all">
                                    Load
                                </div>
                              </div>
                          )}
                        </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-border bg-surface">
                 <div className="flex-1">
                    {isSelectionMode && selectedTicketIds.size > 0 && (
                        <p className="text-sm font-bold text-primary animate-fadeIn">
                             {selectedTicketIds.size} {selectedTicketIds.size === 1 ? 'ticket' : 'tickets'} selected
                        </p>
                    )}
                 </div>
                 <div className="flex gap-3">
                    {isSelectionMode && (
                        <button 
                            onClick={handleMerge} 
                            disabled={selectedTicketIds.size < 2}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                        >
                            <SalesIcon className="h-4 w-4" />
                            Merge Selected
                        </button>
                    )}
                    <button 
                        onClick={onClose} 
                        className="px-8 py-3 bg-surface-muted text-text-secondary rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Close
                    </button>
                 </div>
            </div>
          </div>
        </div>
      );
}

export default OpenTicketsModal;

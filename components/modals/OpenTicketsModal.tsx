
import React, { useState } from 'react';
import type { OrderItem, SavedTicket } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { CheckIcon, TrashIcon, SalesIcon, CloseIcon, ArrowLeftIcon } from '../../constants';
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
    const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null);

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
        setDeletingTicketId(null);
    };

    const handleLoad = async (ticket: SavedTicket) => {
        if (deletingTicketId) return;
        await Haptics.impact({ style: ImpactStyle.Medium });
        onLoadTicket(ticket);
    };

    const requestDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await Haptics.impact({ style: ImpactStyle.Medium });
        setDeletingTicketId(id);
    };

    const confirmDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await Haptics.notification({ type: ImpactStyle.Heavy });
        onDeleteTicket(id);
        setDeletingTicketId(null);
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingTicketId(null);
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={onClose}>
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-fadeIn border border-white/10" style={{maxHeight: '85vh'}} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex-shrink-0 flex justify-between items-center px-8 py-6 border-b border-border bg-surface/50">
              <div>
                <h2 className="text-2xl font-black text-text-primary tracking-tight">
                    {isSelectionMode ? `Select Tickets` : 'Open Tickets'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <p className="text-xs text-text-muted font-bold uppercase tracking-widest">
                        {tickets.length} Active {tickets.length === 1 ? 'Order' : 'Orders'}
                    </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                 {tickets.length > 1 && (
                     <button 
                        onClick={toggleMode} 
                        className={`px-5 py-2.5 text-xs font-black rounded-2xl uppercase tracking-widest transition-all ${isSelectionMode ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-surface-muted text-text-secondary hover:text-primary hover:bg-primary/10'}`}
                     >
                         {isSelectionMode ? 'Cancel' : 'Merge'}
                     </button>
                 )}
                 <button onClick={onClose} className="p-3 text-text-muted hover:text-text-primary bg-surface-muted rounded-2xl transition-all active:scale-90" aria-label="Close">
                    <CloseIcon className="h-5 w-5" />
                 </button>
              </div>
            </div>
            
            {/* List Body */}
            <div className="flex-grow overflow-y-auto px-6 py-6 bg-background/20 space-y-4">
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <div className="bg-surface-muted p-8 rounded-full mb-6">
                        <SalesIcon className="h-16 w-16 text-text-muted" />
                    </div>
                    <p className="text-xl font-black text-text-primary uppercase tracking-tighter">No Active Tickets</p>
                    <p className="text-sm text-text-muted mt-2 max-w-[240px]">All cleared! New orders you save will appear here for management.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {tickets.map(ticket => {
                    const isSelected = selectedTicketIds.has(ticket.id);
                    const isDeleting = deletingTicketId === ticket.id;
                    const total = calculateTotal(ticket.items);
                    
                    return (
                        <div 
                            key={ticket.id} 
                            onClick={() => isSelectionMode ? toggleSelection(ticket.id) : handleLoad(ticket)}
                            className={`group relative overflow-hidden rounded-2xl transition-all duration-300 border-2 active:bg-surface-muted ${
                                isSelectionMode 
                                    ? (isSelected ? 'bg-primary/10 border-primary shadow-xl shadow-primary/10' : 'bg-surface border-border hover:border-text-muted/30 opacity-60 grayscale-[0.5]')
                                    : (isDeleting ? 'bg-red-50 border-red-500 dark:bg-red-900/10 shadow-none' : 'bg-surface border-border hover:border-primary/40 hover:shadow-xl')
                            } cursor-pointer`}
                        >
                          <div className="p-5 flex items-center justify-between min-h-[90px]">
                              <div className="flex items-center gap-4 min-w-0">
                                  {isSelectionMode && (
                                      <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-primary border-primary text-white scale-110' : 'border-border bg-background'}`}>
                                          {isSelected && <CheckIcon className="h-4 w-4 stroke-[4px]" />}
                                      </div>
                                  )}
                                  
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <p className="font-black text-text-primary text-xl truncate leading-none tracking-tight">{ticket.name}</p>
                                        <span className="flex-shrink-0 px-2.5 py-1 bg-surface-muted text-text-secondary text-[10px] font-black uppercase rounded-lg tracking-widest border border-border/50">
                                            {ticket.items.length} {ticket.items.length === 1 ? 'Item' : 'Items'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <p className="text-primary font-mono font-black text-base">₹{total.toFixed(2)}</p>
                                        {ticket.lastModified && (
                                            <span className="text-[11px] text-text-muted font-bold flex items-center gap-1 uppercase tracking-tighter opacity-60">
                                                <span className="w-1 h-1 bg-text-muted rounded-full"></span>
                                                {new Date(ticket.lastModified).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        )}
                                    </div>
                                  </div>
                              </div>
                              
                              {!isSelectionMode && !isDeleting && (
                                  <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => requestDelete(e, ticket.id)} 
                                        className="p-3 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl transition-all active:scale-90" 
                                        aria-label="Delete ticket"
                                    >
                                        <TrashIcon className="h-6 w-6" />
                                    </button>
                                    <div className="ml-2 px-6 py-3 bg-primary text-primary-content text-xs font-black uppercase tracking-[0.15em] rounded-2xl shadow-lg shadow-primary/30 group-hover:bg-primary-hover transition-all">
                                        Load
                                    </div>
                                  </div>
                              )}
                          </div>

                          {/* Inline Delete Confirmation Overlay */}
                          {isDeleting && (
                              <div className="absolute inset-0 bg-red-600 flex items-center justify-between px-6 animate-fadeIn z-10">
                                  <div className="flex items-center gap-3 text-white">
                                      <TrashIcon className="h-6 w-6 animate-bounce" />
                                      <span className="font-black text-sm uppercase tracking-widest">Delete this ticket?</span>
                                  </div>
                                  <div className="flex gap-2">
                                      <button 
                                          onClick={cancelDelete} 
                                          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black uppercase transition-all"
                                      >
                                          Cancel
                                      </button>
                                      <button 
                                          onClick={(e) => confirmDelete(e, ticket.id)} 
                                          className="px-6 py-2 bg-white text-red-600 rounded-xl text-xs font-black uppercase shadow-xl hover:bg-gray-100 transition-all active:scale-95"
                                      >
                                          Confirm
                                      </button>
                                  </div>
                              </div>
                          )}
                        </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex items-center justify-between px-8 py-8 border-t border-border bg-surface">
                 <div className="flex-1">
                    {isSelectionMode && selectedTicketIds.size > 0 && (
                        <p className="text-sm font-black text-primary uppercase tracking-widest animate-fadeIn">
                             {selectedTicketIds.size} {selectedTicketIds.size === 1 ? 'ticket' : 'tickets'} selected
                        </p>
                    )}
                 </div>
                 <div className="flex gap-4">
                    {isSelectionMode && (
                        <button 
                            onClick={handleMerge} 
                            disabled={selectedTicketIds.size < 2}
                            className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-emerald-600/30 flex items-center gap-3"
                        >
                            <SalesIcon className="h-5 w-5" />
                            Merge
                        </button>
                    )}
                    <button 
                        onClick={onClose} 
                        className="px-10 py-4 bg-surface-muted text-text-secondary rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-border/50"
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

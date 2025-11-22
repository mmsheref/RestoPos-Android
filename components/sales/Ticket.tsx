

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderItem, SavedTicket } from '../../types';
import { ThreeDotsIcon, TrashIcon, ArrowLeftIcon } from '../../constants';
import { printReceipt } from '../../utils/printerHelper';

// Define a leaner item type for what addToOrder expects from the grid
type SimpleItem = { id: string; name: string; price: number };

interface TicketProps {
    className?: string;
    onClose?: () => void;
    // Data
    currentOrder: OrderItem[];
    editingTicket: SavedTicket | null;
    savedTickets: SavedTicket[];
    settings: { taxEnabled: boolean; taxRate: number };
    total: number;
    subtotal: number;
    tax: number;
    printers: any[];

    // State & Handlers for Quantity
    editingQuantityItemId: string | null;
    tempQuantity: string;
    setEditingQuantityItemId: (id: string | null) => void;
    setTempQuantity: (qty: string) => void;
    removeFromOrder: (id: string) => void;
    addToOrder: (item: SimpleItem) => void;
    deleteLineItem: (id: string) => void;
    handleQuantityClick: (item: OrderItem) => void;
    handleQuantityChangeCommit: () => void;
    handleQuantityInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleQuantityInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;

    // Main Actions
    handlePrimarySaveAction: () => void;
    handleCharge: () => void;
    onOpenTickets: () => void;
    onSaveTicket: () => void;
}

const Ticket: React.FC<TicketProps> = (props) => {
  const {
    className, onClose,
    currentOrder, editingTicket, savedTickets, settings, total, subtotal, tax, printers,
    editingQuantityItemId, tempQuantity, removeFromOrder, addToOrder, deleteLineItem,
    handleQuantityClick, handleQuantityChangeCommit, handleQuantityInputChange, handleQuantityInputKeyDown,
    handlePrimarySaveAction, handleCharge, onOpenTickets, onSaveTicket
  } = props;
  
  const [isTicketMenuOpen, setTicketMenuOpen] = useState(false);
  const ticketMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (ticketMenuRef.current && !ticketMenuRef.current.contains(event.target as Node)) {
            setTicketMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTicketAction = async (action: string) => {
    setTicketMenuOpen(false);
    switch (action) {
      case 'clear':
        if (currentOrder.length === 0 && !editingTicket) return;
        if (window.confirm("Are you sure you want to clear the current order? All unsaved items will be lost.")) {
          // This should be handled in parent, but for now we clear inputs
          props.setEditingQuantityItemId(null);
        }
        break;
      
      case 'print':
        if (currentOrder.length === 0) {
           alert("Ticket is empty. Nothing to print.");
           return;
        }
        try {
          const printer = printers.find(p => p.interfaceType === 'Bluetooth') || printers[0];
          await printReceipt(currentOrder, total, printer);
        } catch (e) {
          console.error("An unexpected error occurred while trying to print:", e);
          let errorMessage = "Could not print the ticket due to an unexpected error.";
          if (e instanceof Error) errorMessage += `\nDetails: ${e.message}`;
          alert(errorMessage);
        }
        break;

      case 'edit':
        if (currentOrder.length === 0 && !editingTicket) {
           alert("No ticket to edit.");
           return;
        }
        onSaveTicket();
        break;
      default:
        alert(`Feature '${action}' is coming soon!`);
        break;
    }
  };

  const renderActionButtons = () => {
    if (currentOrder.length > 0) {
      return (
        <button 
          onClick={handlePrimarySaveAction}
          className="w-full bg-indigo-500 text-white font-bold py-4 rounded-lg transition-colors text-lg shadow-md hover:bg-indigo-600"
        >
          {editingTicket ? 'Update' : 'Save'}
        </button>
      );
    }
    if (savedTickets.length > 0) {
      return (
        <button 
          onClick={onOpenTickets}
          className="w-full bg-amber-500 text-white font-bold py-4 rounded-lg transition-colors text-lg shadow-md hover:bg-amber-600"
        >
          Open Tickets ({savedTickets.length})
        </button>
      );
    }
    return (
      <button 
        disabled
        className="w-full bg-slate-300 dark:bg-slate-600 text-white dark:text-slate-400 font-bold py-4 rounded-lg text-lg cursor-not-allowed shadow-none"
      >
        Save
      </button>
    );
  };
  
  const ticketHeaderTitle = useMemo(() => {
    if (editingTicket) return `Ticket: ${editingTicket.name}`;
    if (currentOrder.length > 0) return 'Current Order';
    return 'New Order';
  }, [editingTicket, currentOrder.length]);

  return (
    <section className={`${className} bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700`}>
      <header className="bg-white dark:bg-slate-800 shadow-sm w-full z-30 flex-shrink-0 h-16 flex items-center justify-between px-4 border-b dark:border-slate-700">
        <div className="flex items-center gap-2">
            {onClose && (
                <button onClick={onClose} className="md:hidden p-2 -ml-2 text-gray-600 dark:text-slate-300">
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
            )}
            <h1 className="text-xl font-semibold text-gray-800 dark:text-slate-100">{ticketHeaderTitle}</h1>
        </div>
        <div className="relative" ref={ticketMenuRef}>
            <button onClick={() => setTicketMenuOpen(prev => !prev)} className="p-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white" aria-label="Ticket options">
              <ThreeDotsIcon className="h-5 w-5" />
            </button>
            <AnimatePresence>
                {isTicketMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-white/10 z-20"
                    >
                        <div className="py-1">
                            <button onClick={() => handleTicketAction('clear')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600">Clear Ticket</button>
                            <button onClick={() => handleTicketAction('print')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600">Print Bill</button>
                            <button onClick={() => handleTicketAction('edit')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600">Edit Ticket Details</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
          {currentOrder.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="dark:text-slate-600"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h6" /><path d="M12 14v-4" /></svg>
              <p className="mt-4 font-medium text-slate-500">Your order is empty</p>
            </div>
          ) : (
            <ul className="space-y-4 overflow-x-hidden">
              <AnimatePresence initial={false} mode="popLayout">
              {currentOrder.map(item => (
                <motion.li layout key={item.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.2 }} className="relative group">
                  <div className="absolute inset-0 bg-red-500 rounded-lg flex items-center justify-end pr-4 z-0 mb-2"><TrashIcon className="h-5 w-5 text-white" /></div>
                  <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.5, right: 0.05 }} onDragEnd={(e, { offset }) => { if (offset.x < -150) deleteLineItem(item.id); }} style={{ touchAction: 'pan-y' }} className="relative z-10 bg-white dark:bg-slate-800 flex items-center text-sm p-2 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex-grow">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                        <p className="text-slate-500 dark:text-slate-400">₹{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 mx-4">
                        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => removeFromOrder(item.id)} className="h-7 w-7 bg-slate-200 dark:bg-slate-700 text-lg rounded-full text-slate-600 dark:text-slate-300 hover:bg-red-200 dark:hover:bg-red-500/50 hover:text-red-700 transition-colors" aria-label={`Remove one ${item.name}`}>-</button>
                        {editingQuantityItemId === item.id ? (
                            <input type="tel" value={tempQuantity} onChange={handleQuantityInputChange} onBlur={handleQuantityChangeCommit} onKeyDown={handleQuantityInputKeyDown} onPointerDown={(e) => e.stopPropagation()} className="font-mono w-10 text-center text-base text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-indigo-400 rounded-md ring-1 ring-indigo-400 dark:border-indigo-500" autoFocus onFocus={(e) => e.target.select()} />
                        ) : (
                            <span onClick={() => handleQuantityClick(item)} onPointerDown={(e) => e.stopPropagation()} className="font-mono w-10 text-center text-base text-slate-900 dark:text-slate-200 cursor-pointer rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 p-1" aria-label="Edit quantity" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleQuantityClick(item)}}>{item.quantity}</span>
                        )}
                        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => addToOrder(item)} className="h-7 w-7 bg-slate-200 dark:bg-slate-700 text-lg rounded-full text-slate-600 dark:text-slate-300 hover:bg-green-200 dark:hover:bg-green-500/50 hover:text-green-700 transition-colors" aria-label={`Add one ${item.name}`}>+</button>
                    </div>
                    <p className="w-16 font-semibold text-slate-800 dark:text-slate-200 text-right">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </motion.div>
                </motion.li>
              ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-auto">
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            {settings.taxEnabled && (<div className="flex justify-between text-slate-600 dark:text-slate-400"><span>GST ({settings.taxRate}%)</span><span>₹{tax.toFixed(2)}</span></div>)}
            <div className="flex justify-between font-bold text-xl text-slate-800 dark:text-slate-100 pt-2 border-t mt-2 border-slate-200 dark:border-slate-700"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
          </div>
          <div className="flex items-center gap-4">
            {renderActionButtons()}
            <button onClick={handleCharge} disabled={currentOrder.length === 0} className="w-full bg-emerald-500 text-white font-bold py-4 rounded-lg transition-colors text-lg shadow-md hover:bg-emerald-600 disabled:bg-slate-300 disabled:dark:bg-slate-600 disabled:dark:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none flex justify-between items-center px-4">
              <span>Charge</span><span className="font-mono">₹{total.toFixed(2)}</span>
            </button>
          </div>
        </div>
    </section>
  );
};

export default Ticket;
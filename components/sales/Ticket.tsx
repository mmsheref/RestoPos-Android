
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { OrderItem, SavedTicket } from '../../types';
import { ThreeDotsIcon, TrashIcon, ArrowLeftIcon } from '../../constants';

// --- Helper Component: Swipeable Item Row ---
interface SwipeableOrderItemProps {
    item: OrderItem;
    editingQuantityItemId: string | null;
    tempQuantity: string;
    onQuantityClick: (item: OrderItem) => void;
    onQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onQuantityCommit: () => void;
    onQuantityKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onIncrement: (id: string, qty: number) => void;
    onDecrement: (id: string) => void;
    onDelete: (id: string) => void;
}

const SwipeableOrderItem: React.FC<SwipeableOrderItemProps> = ({
    item, editingQuantityItemId, tempQuantity,
    onQuantityClick, onQuantityChange, onQuantityCommit, onQuantityKeyDown,
    onIncrement, onDecrement, onDelete
}) => {
    const [offset, setOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const startX = useRef(0);
    const currentOffset = useRef(0);
    const isOpen = offset < -60; // Threshold to consider "open"

    // Handlers for Touch
    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        // Don't start swipe if editing quantity
        if (editingQuantityItemId === item.lineItemId) return;
        
        setIsSwiping(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        startX.current = clientX;
        currentOffset.current = offset;
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isSwiping) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const diff = clientX - startX.current;
        
        let newOffset = currentOffset.current + diff;
        if (newOffset > 0) newOffset = 0; 
        if (newOffset < -100) newOffset = -100; 

        setOffset(newOffset);
    };

    const handleTouchEnd = () => {
        setIsSwiping(false);
        // Snap logic
        if (offset < -40) {
            setOffset(-80); // Snap open (reveal width)
        } else {
            setOffset(0); // Snap closed
        }
    };

    const handleContentClick = () => {
        if (isOpen) setOffset(0);
    };

    return (
        <li className="relative border-b border-gray-200 dark:border-gray-800 overflow-hidden select-none transform translate-z-0 last:border-0">
            {/* Background Action Layer (Delete) */}
            <div className="absolute inset-0 flex justify-end bg-red-600">
                <button
                    onClick={() => onDelete(item.lineItemId)}
                    className="w-[80px] h-full flex flex-col items-center justify-center text-white active:bg-red-700 transition-colors"
                >
                    <TrashIcon className="h-6 w-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Delete</span>
                </button>
            </div>

            {/* Foreground Content Layer */}
            <div 
                className="relative bg-surface flex items-center justify-between px-4 h-24 transition-transform duration-200 ease-out"
                style={{ transform: `translateX(${offset}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onClick={handleContentClick}
            >
                {/* Left Side: Item Name */}
                <div className="flex-grow min-w-0 pr-4 pointer-events-none">
                    <p className="font-semibold text-text-primary text-base truncate">{item.name}</p>
                </div>

                {/* Right Side: Controls and Price */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                        <button 
                            onClick={() => onDecrement(item.lineItemId)} 
                            className="h-8 w-8 flex items-center justify-center bg-surface border border-border rounded-full text-text-secondary hover:bg-surface-muted hover:border-red-300 active:bg-red-100 active:text-red-600 transition-all focus:outline-none" 
                            aria-label="Decrease quantity"
                        >
                            <span className="text-xl leading-none -mt-1">-</span>
                        </button>
                        
                        {editingQuantityItemId === item.lineItemId ? (
                            <input 
                                type="tel" 
                                value={tempQuantity} 
                                onChange={onQuantityChange} 
                                onBlur={onQuantityCommit} 
                                onKeyDown={onQuantityKeyDown} 
                                className="font-mono w-12 text-center text-lg font-bold text-text-primary bg-background border border-primary rounded-lg ring-2 ring-primary/20 py-1" 
                                autoFocus 
                                onFocus={(e) => e.target.select()} 
                            />
                        ) : (
                            <button
                                onClick={() => onQuantityClick(item)} 
                                className="font-mono min-w-[32px] text-center text-lg font-bold text-text-primary cursor-pointer active:scale-95 transition-transform py-1 rounded hover:bg-surface-muted"
                            >
                                {item.quantity}
                            </button>
                        )}
                        
                        <button 
                            onClick={() => onIncrement(item.lineItemId, item.quantity + 1)} 
                            className="h-8 w-8 flex items-center justify-center bg-primary text-primary-content rounded-full shadow-sm hover:bg-primary-hover active:scale-95 transition-all focus:outline-none" 
                            aria-label="Increase quantity"
                        >
                             <span className="text-xl leading-none -mt-0.5">+</span>
                        </button>
                    </div>

                    {/* Total Price */}
                    <div className="w-20 text-right pointer-events-none">
                        <p className="font-bold text-text-primary text-lg">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </li>
    );
};


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

    // State & Handlers
    editingQuantityItemId: string | null;
    tempQuantity: string;
    setEditingQuantityItemId: (id: string | null) => void;
    setTempQuantity: (qty: string) => void;
    removeFromOrder: (lineItemId: string) => void;
    deleteLineItem: (lineItemId: string) => void;
    updateOrderItemQuantity: (lineItemId: string, newQuantity: number) => void;
    handleQuantityClick: (item: OrderItem) => void;
    handleQuantityChangeCommit: () => void;
    handleQuantityInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleQuantityInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;

    // Main Actions
    handlePrimarySaveAction: () => void;
    onCharge: () => void;
    onOpenTickets: () => void;
    onSaveTicket: () => void;
    onClearTicket: () => void;
    onPrintRequest: () => void;
}

const Ticket: React.FC<TicketProps> = (props) => {
  const {
    className, onClose,
    currentOrder, editingTicket, savedTickets, settings, total, subtotal, tax, printers,
    editingQuantityItemId, tempQuantity, setEditingQuantityItemId, setTempQuantity, 
    removeFromOrder, deleteLineItem, updateOrderItemQuantity,
    handleQuantityClick, handleQuantityChangeCommit, handleQuantityInputChange, handleQuantityInputKeyDown,
    handlePrimarySaveAction, onCharge, onOpenTickets, onSaveTicket, onClearTicket, onPrintRequest
  } = props;
  
  const [isTicketMenuOpen, setTicketMenuOpen] = useState(false);
  const [isClearConfirmVisible, setIsClearConfirmVisible] = useState(false);
  const ticketMenuRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  
  // Also trigger when order length changes (item added)
  useEffect(() => {
     if (listContainerRef.current) {
         requestAnimationFrame(() => {
             listContainerRef.current?.scrollTo({ top: listContainerRef.current.scrollHeight, behavior: 'smooth' });
         });
     }
  }, [currentOrder.length]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (ticketMenuRef.current && !ticketMenuRef.current.contains(event.target as Node)) {
            setTicketMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  useEffect(() => {
    if (isClearConfirmVisible) {
        setTicketMenuOpen(false);
    }
  }, [isClearConfirmVisible]);


  const handleTicketAction = async (action: string) => {
    setTicketMenuOpen(false);
    switch (action) {
      case 'clear':
        if (currentOrder.length === 0 && !editingTicket) return;
        setIsClearConfirmVisible(true);
        break;
      
      case 'print':
        if (currentOrder.length === 0) {
           alert("Ticket is empty. Nothing to print.");
           return;
        }
        onPrintRequest();
        break;

      case 'edit':
        if (currentOrder.length === 0 && !editingTicket) {
           alert("No ticket to edit.");
           return;
        }
        onSaveTicket();
        break;
      default:
        break;
    }
  };
  
  const handleConfirmClear = () => {
    onClearTicket();
    setIsClearConfirmVisible(false);
  };

  const renderActionButtons = () => {
    if (currentOrder.length > 0) {
      return (
        <button 
          onClick={handlePrimarySaveAction}
          className="flex-1 bg-surface border-2 border-primary text-primary font-bold py-3.5 rounded-xl transition-all text-base shadow-sm hover:bg-primary/5 active:scale-[0.98] active:bg-primary/10"
        >
          {editingTicket ? 'Update Order' : 'Save Order'}
        </button>
      );
    }
    if (savedTickets.length > 0) {
      return (
        <button 
          onClick={onOpenTickets}
          className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl transition-all text-base shadow-md hover:bg-amber-600 active:scale-[0.98] whitespace-nowrap"
        >
          Open Tickets ({savedTickets.length})
        </button>
      );
    }
    return (
      <button 
        disabled
        className="flex-1 bg-surface-muted text-text-muted font-bold py-3.5 rounded-xl text-base cursor-not-allowed border border-transparent"
      >
        Save Order
      </button>
    );
  };
  
  const ticketHeaderTitle = useMemo(() => {
    if (editingTicket) return editingTicket.name;
    if (currentOrder.length > 0) return 'Current Order';
    return 'New Order';
  }, [editingTicket, currentOrder.length]);

  return (
    <section className={`${className} bg-surface border-l border-border h-full flex flex-col pt-safe-top`}>
      <header className="bg-surface shadow-sm w-full z-30 flex-shrink-0 h-16 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
            {onClose && (
                <button 
                  onClick={onClose} 
                  className="md:hidden p-2 -ml-2 text-text-secondary active:text-text-primary rounded-full hover:bg-surface-muted transition-colors"
                >
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
            )}
            <div className="flex flex-col min-w-0">
                <h1 className="text-lg font-bold text-text-primary truncate leading-tight">{ticketHeaderTitle}</h1>
                {currentOrder.length > 0 && (
                    <span className="text-xs text-text-secondary">{currentOrder.reduce((acc, i) => acc + i.quantity, 0)} items</span>
                )}
            </div>
        </div>
        <div className="relative" ref={ticketMenuRef}>
            <button onClick={() => setTicketMenuOpen(prev => !prev)} className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-muted transition-colors" aria-label="Ticket options">
              <ThreeDotsIcon className="h-6 w-6" />
            </button>
            {isTicketMenuOpen && (
                <div
                    className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 dark:ring-white/10 z-50 overflow-hidden"
                >
                    <div className="py-1">
                        <button onClick={() => handleTicketAction('clear')} className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">Clear Ticket</button>
                        <button onClick={() => handleTicketAction('print')} className="w-full text-left px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-muted transition-colors">
                          Print Bill (Preview)
                        </button>
                        <button onClick={() => handleTicketAction('edit')} className="w-full text-left px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-muted transition-colors">Edit Ticket Details</button>
                    </div>
                </div>
            )}
          </div>
      </header>
      
      {/* Scrollable Area: Items + Sticky Totals */}
      <div 
        ref={listContainerRef} 
        className="flex-1 overflow-y-auto flex flex-col relative pb-4 min-h-0 bg-surface-muted/30"
        style={{ 
            WebkitOverflowScrolling: 'touch',
            transform: 'translateZ(0)', // Fix for painting glitches on iOS/Mobile when toggling display
            willChange: 'scroll-position'
        }}
      >
          {isClearConfirmVisible ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fadeIn">
              <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
                  <TrashIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Clear Current Order?</h3>
              <p className="text-sm text-text-secondary mb-8 max-w-[200px]">All items will be removed. This cannot be undone.</p>
              <div className="flex gap-3 w-full max-w-xs">
                  <button onClick={() => setIsClearConfirmVisible(false)} className="flex-1 py-3 bg-surface border border-border text-text-primary rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition-colors">
                      Cancel
                  </button>
                  <button onClick={handleConfirmClear} className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 shadow-md transition-colors">
                      Clear All
                  </button>
              </div>
            </div>
          ) : currentOrder.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-60">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 stroke-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
              <p className="font-medium text-lg">Your cart is empty</p>
              <p className="text-sm mt-1">Tap items to start an order</p>
            </div>
          ) : (
            <>
                <div className="bg-surface shadow-sm mb-auto">
                    <ul className="overflow-x-hidden">
                    {currentOrder.map(item => (
                        <SwipeableOrderItem
                            key={item.lineItemId}
                            item={item}
                            editingQuantityItemId={editingQuantityItemId}
                            tempQuantity={tempQuantity}
                            onQuantityClick={handleQuantityClick}
                            onQuantityChange={handleQuantityInputChange}
                            onQuantityCommit={handleQuantityChangeCommit}
                            onQuantityKeyDown={handleQuantityInputKeyDown}
                            onIncrement={updateOrderItemQuantity}
                            onDecrement={removeFromOrder}
                            onDelete={deleteLineItem}
                        />
                    ))}
                    </ul>
                </div>
            </>
          )}
      </div>
      
      {/* Sticky Bottom Area */}
      <div className="bg-surface border-t border-border z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {currentOrder.length > 0 && (
            <div className="px-5 py-3 space-y-2">
                {settings.taxEnabled && (
                    <div className="space-y-1 text-xs text-text-secondary">
                        <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>GST ({settings.taxRate}%)</span><span>₹{tax.toFixed(2)}</span></div>
                    </div>
                )}
                <div className="flex justify-between items-baseline pt-1">
                    <span className="text-sm font-semibold text-text-secondary">Total Payable</span>
                    <span className="text-2xl font-bold text-text-primary">₹{total.toFixed(2)}</span>
                </div>
            </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 pt-2 pb-safe-bottom">
            <div className={`flex items-stretch gap-3 ${isClearConfirmVisible ? 'opacity-0 pointer-events-none' : ''}`}>
                {renderActionButtons()}
                <button 
                    onClick={onCharge} 
                    disabled={currentOrder.length === 0} 
                    className="flex-[1.5] bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all text-lg shadow-md hover:bg-emerald-700 active:scale-[0.98] active:shadow-sm disabled:bg-gray-300 disabled:dark:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none flex justify-center items-center"
                >
                Charge
                </button>
            </div>
        </div>
      </div>
    </section>
  );
};

export default Ticket;

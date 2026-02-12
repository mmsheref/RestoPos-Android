
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { OrderItem, SavedTicket } from '../../types';
import { ThreeDotsIcon, TrashIcon, ArrowLeftIcon } from '../../constants';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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

const SwipeableOrderItem = React.memo<SwipeableOrderItemProps>(({
    item, editingQuantityItemId, tempQuantity,
    onQuantityClick, onQuantityChange, onQuantityCommit, onQuantityKeyDown,
    onIncrement, onDecrement, onDelete
}) => {
    const [offset, setOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const startX = useRef(0);
    const currentOffset = useRef(0);
    const isOpen = offset < -60;

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
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
        
        // Add resistance when swiping right (disabled direction)
        let newOffset = currentOffset.current + diff;
        if (newOffset > 0) newOffset = newOffset * 0.2; 
        
        // Limit max swipe left
        if (newOffset < -120) newOffset = -120; 
        
        setOffset(newOffset);
    };

    const handleTouchEnd = () => {
        setIsSwiping(false);
        if (offset < -50) {
            setOffset(-80); // Snap open
        } else {
            setOffset(0); // Snap close
        }
    };

    const handleContentClick = () => {
        if (isOpen) setOffset(0);
    };

    const handleDelete = async (id: string) => {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        onDelete(id);
    };

    // Calculate opacity for the red background to prevent tinting when idle
    // We only want it visible when offset is negative (swiping left)
    const deleteLayerOpacity = offset < 0 ? Math.min(1, Math.abs(offset) / 40) : 0;
    
    // Only render/paint the layer if it's actually visible
    const isLayerVisible = offset < -1;

    return (
        <li className="relative border-b border-white/10 overflow-hidden select-none transform translate-z-0 last:border-0 group">
            {/* Delete Action Layer */}
            <div 
                className="absolute inset-0 flex justify-end bg-red-500/90"
                style={{ 
                    opacity: deleteLayerOpacity,
                    visibility: isLayerVisible ? 'visible' : 'hidden',
                    transition: isSwiping ? 'none' : 'opacity 0.2s ease-out'
                }}
            >
                <button 
                    onClick={() => handleDelete(item.lineItemId)} 
                    className="w-[80px] h-full flex flex-col items-center justify-center text-white"
                    tabIndex={isOpen ? 0 : -1}
                >
                    <TrashIcon className="h-5 w-5 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Delete</span>
                </button>
            </div>

            {/* Foreground Content */}
            <div 
                className="relative bg-surface/70 backdrop-blur-md flex items-center justify-between pl-4 pr-4 py-3 transition-transform duration-200 ease-out hover:bg-surface/80"
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
                <div className="flex-grow min-w-0 pr-3 pointer-events-none">
                    <p className="font-medium text-text-primary text-sm leading-tight">{item.name}</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1 bg-surface/50 rounded-lg p-0.5 border border-white/20 shadow-sm" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                        <button onClick={() => onDecrement(item.lineItemId)} className="h-7 w-7 flex items-center justify-center text-text-secondary hover:bg-white/50 rounded transition-all">
                            <span className="text-lg leading-none mb-0.5">-</span>
                        </button>
                        
                        {editingQuantityItemId === item.lineItemId ? (
                            <input 
                                type="tel" value={tempQuantity} onChange={onQuantityChange} onBlur={onQuantityCommit} onKeyDown={onQuantityKeyDown} 
                                className="font-mono w-10 text-center text-base font-bold text-text-primary bg-transparent border-b-2 border-primary py-0.5 mx-0.5 focus:outline-none" autoFocus onFocus={(e) => e.target.select()} 
                            />
                        ) : (
                            <button onClick={() => onQuantityClick(item)} className="font-mono min-w-[28px] text-center text-base font-bold text-text-primary py-0.5 mx-0.5">{item.quantity}</button>
                        )}
                        
                        <button onClick={() => onIncrement(item.lineItemId, item.quantity + 1)} className="h-7 w-7 flex items-center justify-center text-text-secondary hover:bg-white/50 rounded transition-all">
                             <span className="text-lg leading-none mb-0.5">+</span>
                        </button>
                    </div>
                    <div className="w-[70px] text-right pointer-events-none">
                        <p className="font-bold text-text-primary text-base">₹{(item.price * item.quantity).toFixed(0)}</p>
                    </div>
                </div>
            </div>
        </li>
    );
});


interface TicketProps {
    className?: string;
    onClose?: () => void;
    currentOrder: OrderItem[];
    editingTicket: SavedTicket | null;
    savedTickets: SavedTicket[];
    settings: { taxEnabled: boolean; taxRate: number };
    total: number;
    subtotal: number;
    tax: number;
    printers: any[];
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
    handlePrimarySaveAction: () => void;
    onCharge: () => void;
    onOpenTickets: () => void;
    onSaveTicket: () => void;
    onClearTicket: () => void;
    onPrintRequest: () => void;
}

const Ticket: React.FC<TicketProps> = (props) => {
  const {
    className, onClose, currentOrder, editingTicket, savedTickets, settings, total, subtotal, tax,
    editingQuantityItemId, tempQuantity, setEditingQuantityItemId, setTempQuantity, 
    removeFromOrder, deleteLineItem, updateOrderItemQuantity,
    handleQuantityClick, handleQuantityChangeCommit, handleQuantityInputChange, handleQuantityInputKeyDown,
    handlePrimarySaveAction, onCharge, onOpenTickets, onSaveTicket, onClearTicket, onPrintRequest
  } = props;
  
  const [isTicketMenuOpen, setTicketMenuOpen] = useState(false);
  const [isClearConfirmVisible, setIsClearConfirmVisible] = useState(false);
  const ticketMenuRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
     if (listContainerRef.current) {
         requestAnimationFrame(() => {
             listContainerRef.current?.scrollTo({ top: listContainerRef.current.scrollHeight, behavior: 'auto' });
         });
     }
  }, [currentOrder.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        if (ticketMenuRef.current && !ticketMenuRef.current.contains(event.target as Node)) {
            setTicketMenuOpen(false);
        }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  
  useEffect(() => {
    if (isClearConfirmVisible) setTicketMenuOpen(false);
  }, [isClearConfirmVisible]);

  const handleTicketAction = async (action: string) => {
    setTicketMenuOpen(false);
    if (action === 'clear') { if (currentOrder.length > 0 || editingTicket) setIsClearConfirmVisible(true); }
    else if (action === 'print') { if (currentOrder.length > 0) onPrintRequest(); }
    else if (action === 'edit') { if (currentOrder.length > 0 || editingTicket) onSaveTicket(); }
  };
  
  const ticketHeaderTitle = useMemo(() => {
    if (editingTicket) return editingTicket.name;
    if (currentOrder.length > 0) return 'Current Order';
    return 'New Order';
  }, [editingTicket, currentOrder.length]);

  const renderActionButtons = () => {
    if (currentOrder.length > 0) {
      return (
        <button 
          onClick={() => { Haptics.impact({ style: ImpactStyle.Medium }); handlePrimarySaveAction(); }}
          className="flex-1 bg-white/50 dark:bg-black/20 backdrop-blur-md border border-primary text-primary font-bold py-3.5 rounded-2xl transition-all hover:bg-primary/10"
        >
          {editingTicket ? 'Update' : 'Save'}
        </button>
      );
    }
    if (savedTickets.length > 0) {
      return (
        <button 
          onClick={() => { Haptics.impact({ style: ImpactStyle.Light }); onOpenTickets(); }}
          className="flex-1 bg-amber-500/90 backdrop-blur-md text-white font-bold py-3 rounded-2xl shadow-glass flex flex-col justify-center items-center hover:bg-amber-600 transition-all"
        >
          <span>Open Tickets</span>
          <span className="text-xs opacity-90">({savedTickets.length})</span>
        </button>
      );
    }
    return <button disabled className="flex-1 bg-surface-muted/50 text-text-muted font-bold py-3.5 rounded-2xl cursor-not-allowed border border-border/50">Save</button>;
  };

  return (
    // GLASS PANEL CONTAINER
    <section className={`${className} glass-panel border-l-0 md:border-l border-white/20 h-full flex flex-col pt-safe-top relative transition-all duration-300`}>
      <header className="w-full z-30 flex-shrink-0 border-b border-white/10 bg-surface/30 backdrop-blur-md">
        <div className="h-16 flex items-center justify-between px-5">
            <div className="flex items-center gap-3 overflow-hidden">
                {onClose && (
                    <button onClick={onClose} className="md:hidden p-2 -ml-2 text-text-secondary rounded-full hover:bg-white/20 transition-colors">
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                )}
                <div className="flex flex-col min-w-0">
                    <h1 className="text-lg font-black text-text-primary truncate leading-tight tracking-tight">{ticketHeaderTitle}</h1>
                    {currentOrder.length > 0 && <span className="text-xs text-text-secondary font-medium">{currentOrder.reduce((acc, i) => acc + i.quantity, 0)} items</span>}
                </div>
            </div>
            <div className="relative" ref={ticketMenuRef}>
                <button onClick={(e) => { e.stopPropagation(); setTicketMenuOpen(prev => !prev); }} className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-white/20 transition-colors">
                    <ThreeDotsIcon className="h-6 w-6" />
                </button>
                {isTicketMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl shadow-glass z-50 overflow-hidden">
                        <div className="py-1">
                            <button onClick={() => handleTicketAction('clear')} className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50/50 transition-colors">Clear Ticket</button>
                            <button onClick={() => handleTicketAction('print')} className="w-full text-left px-4 py-3 text-sm font-medium text-text-primary hover:bg-white/20 transition-colors">Print Bill</button>
                            <button onClick={() => handleTicketAction('edit')} className="w-full text-left px-4 py-3 text-sm font-medium text-text-primary hover:bg-white/20 transition-colors">Edit Details</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </header>
      
      {/* Scrollable Items */}
      <div 
        ref={listContainerRef} 
        className="flex-1 overflow-y-auto flex flex-col relative min-h-0 bg-transparent"
        style={{ WebkitOverflowScrolling: 'touch', transform: 'translateZ(0)' }}
      >
          {currentOrder.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted/60">
              <div className="w-20 h-20 border-4 border-dashed border-current rounded-full flex items-center justify-center mb-4 opacity-50">
                  <span className="text-4xl">+</span>
              </div>
              <p className="font-bold text-lg">Empty Cart</p>
              <p className="text-sm mt-1">Select items to begin</p>
            </div>
          ) : (
            <div className="pb-4">
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
          )}
          
          {/* Sticky Totals within Scroll View */}
          {currentOrder.length > 0 && (
            <div className="sticky bottom-0 z-20 mt-auto">
                <div className="glass-card mx-3 mb-3 p-4 rounded-2xl border border-white/40 shadow-sm">
                    {settings.taxEnabled && (
                        <div className="space-y-1 text-xs text-text-secondary mb-2 font-medium">
                            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Tax ({settings.taxRate}%)</span><span>₹{tax.toFixed(2)}</span></div>
                        </div>
                    )}
                    <div className="flex justify-between items-baseline pt-1 border-t border-white/10">
                        <span className="text-sm font-bold text-text-secondary uppercase tracking-wide">Total</span>
                        <span className="text-3xl font-black text-text-primary tracking-tight">₹{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
          )}
      </div>

      {isClearConfirmVisible && (
        <div className="absolute inset-0 z-40 glass-panel flex flex-col items-center justify-center p-6 animate-fadeIn backdrop-blur-xl">
            <h3 className="text-xl font-bold text-text-primary mb-2">Clear Order?</h3>
            <div className="flex gap-3 w-full max-w-xs mt-6">
                <button onClick={() => setIsClearConfirmVisible(false)} className="flex-1 py-3 bg-surface border border-border text-text-primary rounded-xl font-bold">Cancel</button>
                <button onClick={() => { onClearTicket(); setIsClearConfirmVisible(false); }} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg">Clear</button>
            </div>
        </div>
      )}
      
      {/* Footer Buttons */}
      <div className="bg-surface/30 backdrop-blur-md border-t border-white/20 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="p-4 pt-3 pb-safe-bottom">
            <div className={`flex items-stretch gap-3 ${isClearConfirmVisible ? 'opacity-0 pointer-events-none' : ''}`}>
                {renderActionButtons()}
                <button 
                    onClick={() => { Haptics.impact({ style: ImpactStyle.Medium }); onCharge(); }} 
                    disabled={currentOrder.length === 0} 
                    className="flex-[1.5] bg-primary/90 text-primary-content font-black py-4 rounded-2xl text-lg shadow-glow hover:bg-primary transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed backdrop-blur-sm"
                >
                CHARGE
                </button>
            </div>
        </div>
      </div>
    </section>
  );
};

export default Ticket;


import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { OrderItem, SavedTicket, Item, CustomGrid, SplitPaymentDetail, Receipt } from '../types';
import { useAppContext } from '../context/AppContext';
import { useDebounce } from '../hooks/useDebounce';
import { printBill } from '../utils/printerHelper';

// Modals and Child Components
import SaveTicketModal from '../components/modals/SaveTicketModal';
import OpenTicketsModal from '../components/modals/OpenTicketsModal';
import ManageGridsModal from '../components/modals/ManageGridsModal';
import SelectItemModal from '../components/modals/SelectItemModal';
import AddGridModal from '../components/modals/AddGridModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import PriceInputModal from '../components/modals/PriceInputModal';
import SalesHeader from '../components/sales/SalesHeader';
import ItemGrid from '../components/sales/ItemGrid';
import CategoryTabs from '../components/sales/CategoryTabs';
import Ticket from '../components/sales/Ticket';
import ChargeScreen from '../components/sales/ChargeScreen';
import { ItemsIcon, SalesIcon } from '../constants';

type SalesView = 'grid' | 'payment';

// UUID Generator Fallback
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : `G${Date.now()}`;

// --- SEARCH WORKER CODE ---
const SEARCH_WORKER_CODE = `
self.onmessage = function(e) {
    const { items, query } = e.data;
    
    if (!query || !query.trim()) {
        self.postMessage([]);
        return;
    }

    const lowerQuery = query.trim().toLowerCase();
    
    // Perform filtering off-main-thread
    const results = items.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(lowerQuery);
        const categoryMatch = item.category ? item.category.toLowerCase().includes(lowerQuery) : false;
        return nameMatch || categoryMatch;
    });

    self.postMessage(results);
};
`;

const SalesScreen: React.FC = () => {
  const { 
      openDrawer, settings, printers, addReceipt, 
      items, customGrids, addCustomGrid, updateCustomGrid, setCustomGrids,
      savedTickets, saveTicket, removeTicket,
      // Global Ticket State
      currentOrder, addToOrder, removeFromOrder, deleteLineItem, 
      updateOrderItemQuantity, clearOrder, loadOrder,
      // Global View State
      activeGridId, setActiveGridId
  } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === '/sales';

  // --- 1. DEVICE & LAYOUT DETECTION ---
  // If Tablet/Desktop: 5 cols * 4 rows = 20
  // If Mobile: 3 cols * 5 rows = 15
  const getGridSize = () => window.innerWidth < 768 ? 15 : 20;
  const [gridSize, setGridSize] = useState(getGridSize());

  useEffect(() => {
      const handleResize = () => setGridSize(getGridSize());
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main screen view state
  const [salesView, setSalesView] = useState<SalesView>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Search Results from Worker
  const [workerSearchResults, setWorkerSearchResults] = useState<Item[]>([]);
  const searchWorkerRef = useRef<Worker | null>(null);
  
  // Ticket management state
  const [editingTicket, setEditingTicket] = useState<SavedTicket | null>(null);
  const [editingQuantityItemId, setEditingQuantityItemId] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>('');
  
  // State to track if we should print after a successful save
  const [pendingPrintAction, setPendingPrintAction] = useState(false);
  
  // Grid Editing State
  const [isGridEditing, setIsGridEditing] = useState(false);
  
  // Payment state
  const [paymentResult, setPaymentResult] = useState<{ method: string, change: number, receiptId: string, date: Date } | null>(null);

  // Pagination & Scroll State
  const [displayLimit, setDisplayLimit] = useState(40);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [isManageGridsModalOpen, setIsManageGridsModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isOpenTicketsModalOpen, setIsOpenTicketsModalOpen] = useState(false);
  const [isSelectItemModalOpen, setIsSelectItemModalOpen] = useState(false);
  const [isAddGridModalOpen, setIsAddGridModalOpen] = useState(false);
  const [assigningSlot, setAssigningSlot] = useState<{gridId: string, slotIndex: number} | null>(null);
  
  // Variable Price State
  const [variablePriceItem, setVariablePriceItem] = useState<Item | null>(null);
  
  const [confirmModalState, setConfirmModalState] = useState<{
      isOpen: boolean;
      title: string;
      message: React.ReactNode;
      onConfirm: () => void;
      confirmText?: string;
      confirmButtonClass?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  const [isTicketVisible, setIsTicketVisible] = useState(false);

  // Initialize Search Worker
  useEffect(() => {
      const blob = new Blob([SEARCH_WORKER_CODE], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      searchWorkerRef.current = worker;

      worker.onmessage = (e) => {
          setWorkerSearchResults(e.data);
      };

      return () => {
          worker.terminate();
      };
  }, []);

  // Post messages to worker when query or items change
  useEffect(() => {
      if (searchWorkerRef.current && debouncedSearchQuery.trim()) {
          searchWorkerRef.current.postMessage({
              items: items,
              query: debouncedSearchQuery
          });
      } else {
          setWorkerSearchResults([]);
      }
  }, [debouncedSearchQuery, items]);

  // Force scroll container reflow
  useEffect(() => {
    if (isActive && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
    }
  }, [isActive]);
  
  // Reset pagination when category changes
  useEffect(() => {
    setDisplayLimit(40);
    setIsGridEditing(false);
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeGridId, debouncedSearchQuery]);

  // --- ITEM CLICK HANDLER ---
  const handleItemClick = useCallback((item: Item) => {
      if (item.price === 0) {
          // Open Modal for variable price
          setVariablePriceItem(item);
      } else {
          // Normal add
          addToOrder(item);
      }
  }, [addToOrder]);

  const handleVariablePriceConfirm = (price: number) => {
      if (variablePriceItem) {
          // Create a temporary item copy with the new price
          // We DO NOT change the global item definition, only for this cart add
          const tempItem = { ...variablePriceItem, price: price };
          addToOrder(tempItem);
          setVariablePriceItem(null);
      }
  };

  const handleQuantityClick = useCallback((item: OrderItem) => {
    setEditingQuantityItemId(item.lineItemId);
    setTempQuantity(item.quantity.toString());
  }, []);

  const handleQuantityChangeCommit = useCallback(() => {
    if (!editingQuantityItemId) return;
    const newQuantity = parseInt(tempQuantity, 10);
    updateOrderItemQuantity(editingQuantityItemId, newQuantity);
    setEditingQuantityItemId(null);
  }, [editingQuantityItemId, tempQuantity, updateOrderItemQuantity]);

  const handleQuantityInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (/^\d*$/.test(e.target.value)) {
          setTempQuantity(e.target.value);
      }
  }, []);

  const handleQuantityInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleQuantityChangeCommit(); 
      else if (e.key === 'Escape') setEditingQuantityItemId(null);
  }, [handleQuantityChangeCommit]);

  const handleTicketClose = useCallback(() => setIsTicketVisible(false), []);
  const handleChargeClick = useCallback(() => setSalesView('payment'), []);
  const handleOpenTicketsClick = useCallback(() => setIsOpenTicketsModalOpen(true), []);
  
  const handleSaveTicketClick = useCallback(() => {
      setPendingPrintAction(false); 
      setIsSaveModalOpen(true);
  }, []);

  const subtotal = useMemo(() => currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0), [currentOrder]);
  const tax = useMemo(() => settings.taxEnabled ? subtotal * (settings.taxRate / 100) : 0, [subtotal, settings]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);
  
  const handleProcessPayment = useCallback((method: string, tendered: number, splitDetails?: SplitPaymentDetail[]) => {
    if (editingTicket) removeTicket(editingTicket.id);
    const receiptId = `R${Date.now()}`;
    const receiptDate = new Date();
    
    const optimizedItems = currentOrder.map(item => ({
        ...item,
        imageUrl: '' // Strip base64 string
    }));

    const newReceipt: Receipt = { 
        id: receiptId, 
        date: receiptDate, 
        items: optimizedItems, 
        total, 
        paymentMethod: method 
    };

    if (splitDetails && splitDetails.length > 0) {
        newReceipt.splitDetails = splitDetails;
    }

    addReceipt(newReceipt);
    setPaymentResult({ method, change: tendered - total, receiptId, date: receiptDate });
  }, [addReceipt, currentOrder, editingTicket, removeTicket, total]);
  
  const handleNewSale = useCallback(() => {
    setSalesView('grid'); 
    setPaymentResult(null); 
    clearOrder(); 
    setEditingTicket(null);
  }, [clearOrder]);
  
  const itemsForDisplay = useMemo<(Item | null)[]>(() => {
    if (debouncedSearchQuery.trim()) return workerSearchResults;
    if (activeGridId === 'All') return items;
    
    const grid = customGrids.find(g => g.id === activeGridId);
    if (grid) {
        const sourceIds = Array.isArray(grid.itemIds) ? grid.itemIds : [];
        const finalItemIds = new Array(gridSize).fill(null);
        for(let i = 0; i < Math.min(sourceIds.length, gridSize); i++) {
            finalItemIds[i] = sourceIds[i];
        }
        return finalItemIds.map(itemId => items.find(i => i.id === itemId) || null);
    }
    return new Array(gridSize).fill(null);
  }, [activeGridId, items, customGrids, debouncedSearchQuery, workerSearchResults, gridSize]);

  const paginatedItems = useMemo(() => {
      if (activeGridId !== 'All' && !debouncedSearchQuery.trim()) return itemsForDisplay;
      return itemsForDisplay.slice(0, displayLimit);
  }, [itemsForDisplay, displayLimit, activeGridId, debouncedSearchQuery]);

  useEffect(() => {
    if ((activeGridId !== 'All' && !debouncedSearchQuery.trim()) || paginatedItems.length >= itemsForDisplay.length) return; 

    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                setDisplayLimit((prev) => prev + 20);
            }
        },
        { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [paginatedItems.length, itemsForDisplay.length, activeGridId, debouncedSearchQuery]);


  const handleAddNewGrid = useCallback(() => setIsAddGridModalOpen(true), []);
  const handleSaveNewGrid = useCallback((name: string) => {
      addCustomGrid({ id: generateId(), name, itemIds: new Array(gridSize).fill(null) });
      setIsAddGridModalOpen(false);
  }, [addCustomGrid, gridSize]);

  const handleSaveGrids = useCallback((newGrids: CustomGrid[]) => {
      setCustomGrids(newGrids);
      setIsManageGridsModalOpen(false);
      if (activeGridId !== 'All' && !newGrids.some(g => g.id === activeGridId)) {
          setActiveGridId('All');
      }
  }, [activeGridId, setCustomGrids, setActiveGridId]);

  const handleOpenSelectItemModal = useCallback((slotIndex: number) => {
      if (activeGridId === 'All') return;
      setAssigningSlot({ gridId: activeGridId, slotIndex });
      setIsSelectItemModalOpen(true);
  }, [activeGridId]);

  const handleSelectItem = useCallback((item: Item) => {
      if (!assigningSlot) return;
      const gridToUpdate = customGrids.find(g => g.id === assigningSlot.gridId);
      if (gridToUpdate) {
          const sourceIds = Array.isArray(gridToUpdate.itemIds) ? gridToUpdate.itemIds : [];
          // Ensure array is large enough for current view
          const newItemIds = [...sourceIds];
          // Pad if necessary
          while (newItemIds.length < gridSize) newItemIds.push(null);
          
          newItemIds[assigningSlot.slotIndex] = item.id;
          updateCustomGrid({ ...gridToUpdate, itemIds: newItemIds });
      }
      setIsSelectItemModalOpen(false);
      setAssigningSlot(null);
  }, [assigningSlot, customGrids, updateCustomGrid, gridSize]);

  const handleRemoveItemFromGrid = useCallback((slotIndex: number) => {
    if (activeGridId === 'All') return;
    const gridToUpdate = customGrids.find(g => g.id === activeGridId);
    if (gridToUpdate) {
        const sourceIds = Array.isArray(gridToUpdate.itemIds) ? gridToUpdate.itemIds : [];
        const newItemIds = [...sourceIds];
        while (newItemIds.length < gridSize) newItemIds.push(null);
        
        newItemIds[slotIndex] = null;
        updateCustomGrid({ ...gridToUpdate, itemIds: newItemIds });
    }
  }, [activeGridId, customGrids, updateCustomGrid, gridSize]);

  const handleClearTicket = useCallback(() => {
    clearOrder();
    setEditingTicket(null);
    setEditingQuantityItemId(null);
  }, [clearOrder]);

  const handleLoadTicket = (ticket: SavedTicket) => {
      const loadAction = () => {
          loadOrder(ticket.items);
          setEditingTicket(ticket);
          setIsOpenTicketsModalOpen(false);
          if (window.innerWidth < 768) {
              setIsTicketVisible(true);
          }
      };
      if (currentOrder.length > 0) {
          setConfirmModalState({
              isOpen: true,
              title: 'Replace Current Order?',
              message: 'Loading a saved ticket will replace your current unsaved order. Are you sure?',
              onConfirm: loadAction,
              confirmText: 'Yes, Load Ticket',
              confirmButtonClass: 'bg-amber-500 hover:bg-amber-600'
          });
      } else {
          loadAction();
      }
  };

  const handleDeleteTicket = (ticketId: string) => {
      setConfirmModalState({
          isOpen: true,
          title: 'Delete Ticket?',
          message: 'Are you sure you want to permanently delete this ticket? This cannot be undone.',
          onConfirm: () => removeTicket(ticketId),
          confirmText: 'Delete',
          confirmButtonClass: 'bg-red-600 hover:bg-red-700'
      });
  };

  const performPrint = async (ticketItems: OrderItem[], ticketName: string) => {
      const pSubtotal = ticketItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const pTax = settings.taxEnabled ? pSubtotal * (settings.taxRate / 100) : 0;
      const pTotal = pSubtotal + pTax;
      
      const printer = printers.find(p => p.interfaceType === 'Bluetooth') || printers[0];
      const result = await printBill({
          items: ticketItems,
          total: pTotal, subtotal: pSubtotal, tax: pTax,
          ticketName: ticketName,
          settings, printer,
      });
      if (!result.success) {
          alert(`Print Failed: ${result.message}`);
      }
  };

  const handlePrintRequest = useCallback(() => {
      if (editingTicket) {
          performPrint(currentOrder, editingTicket.name);
      } else {
          setPendingPrintAction(true);
          setIsSaveModalOpen(true);
      }
  }, [editingTicket, currentOrder, settings, printers]);

  const handleSaveTicketComplete = (name: string) => {
      const itemsToSave = [...currentOrder];
      saveTicket({ id: `T${Date.now()}`, name, items: itemsToSave }); 
      clearOrder(); 
      setEditingTicket(null); 
      setIsSaveModalOpen(false); 
      if (pendingPrintAction) {
          performPrint(itemsToSave, name);
          setPendingPrintAction(false); 
      }
  };
  
  const handlePrimarySaveAction = useCallback(() => {
      if (editingTicket) {
          saveTicket({ ...editingTicket, items: currentOrder });
          clearOrder();
          setEditingTicket(null);
          setIsTicketVisible(false);
      } else {
          setPendingPrintAction(false);
          setIsSaveModalOpen(true);
      }
  }, [editingTicket, currentOrder, saveTicket, clearOrder]);

  if (salesView === 'payment') {
    return <ChargeScreen total={total} tax={tax} subtotal={subtotal} onBack={() => setSalesView('grid')} onProcessPayment={handleProcessPayment} onNewSale={handleNewSale} paymentResult={paymentResult} orderItems={currentOrder} />;
  }

  const isViewingAll = activeGridId === 'All' || debouncedSearchQuery.trim().length > 0;

  return (
    <div className="flex h-full w-full bg-background font-sans relative overflow-hidden">
      
      {/* 
        LAYOUT STRATEGY:
        Mobile: 
          - Grid Area is flexible middle (Layer 0).
          - Tabs are fixed bottom (Layer 1).
          - Floating Cart is positioned absolute at the bottom of the LEFT SECTION to float over tabs/grid.
          - Ticket is separate Overlay (Layer 3).
        Tablet/Desktop:
          - Grid is Left Column.
          - Ticket is Right Column.
      */}

      {/* --- LEFT SECTION (Grid + Tabs) --- */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <SalesHeader 
            openDrawer={openDrawer} 
            onSearchChange={setSearchQuery} 
            searchQuery={searchQuery} 
            storeName={settings.storeName}
        />
        
        {/* Grid Container (Takes remaining space) */}
        <div className="flex-1 relative overflow-hidden">
            <div 
              ref={scrollContainerRef} 
              className="absolute inset-0 overflow-y-auto overflow-x-hidden p-2 md:p-4 scroll-smooth"
              style={{ WebkitOverflowScrolling: 'touch', transform: 'translateZ(0)' }}
            >
              {items.length === 0 && !debouncedSearchQuery.trim() ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary p-4">
                  <div className="max-w-md">
                    <ItemsIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" />
                    <h2 className="mt-4 text-xl font-semibold text-text-primary">Your Menu is Empty</h2>
                    <button
                      onClick={() => navigate('/items')}
                      className="mt-6 px-6 py-3 bg-primary text-primary-content font-bold rounded-lg hover:bg-primary-hover shadow-md"
                    >
                      Add Items
                    </button>
                  </div>
                </div>
              ) : (
                // Tablet Fix: Use h-full to allow grid to fill the screen space exactly without scroll when in fixed grid mode.
                <div className={`pb-24 md:pb-0 ${!isViewingAll ? 'md:h-full' : 'md:pb-4'}`}>
                    <ItemGrid
                    itemsForDisplay={paginatedItems}
                    mode={isViewingAll ? 'all' : 'grid'}
                    onAddItemToOrder={handleItemClick}
                    onAssignItem={handleOpenSelectItemModal}
                    onRemoveItem={handleRemoveItemFromGrid}
                    isEditing={!isViewingAll && isGridEditing}
                    loadMoreRef={isViewingAll ? loadMoreRef : undefined}
                    />
                </div>
              )}
            </div>
        </div>

        {/* Floating Mobile Cart Button (Moved outside overflow container to float strictly above Tabs) */}
        {currentOrder.length > 0 && (
            <div className="md:hidden absolute bottom-[50px] left-0 right-0 p-4 z-50 pointer-events-none">
                <button 
                    onClick={() => setIsTicketVisible(true)}
                    className="w-full bg-primary text-primary-content rounded-xl shadow-xl shadow-primary/30 flex items-center justify-between p-4 active:scale-[0.98] transition-transform pointer-events-auto"
                >
                    <div className="flex items-center gap-3">
                        <span className="bg-white/20 px-2.5 py-1 rounded-md text-sm font-bold backdrop-blur-sm">
                            {currentOrder.reduce((acc, item) => acc + item.quantity, 0)}
                        </span>
                        <span className="font-bold text-sm uppercase tracking-wide">View Cart</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">₹{total.toFixed(2)}</span>
                        <SalesIcon className="h-5 w-5 opacity-80" />
                    </div>
                </button>
            </div>
        )}

        {/* Category Tabs - Fixed at bottom of the Left Section */}
        <div className="bg-surface border-t border-border z-40 flex-shrink-0 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <CategoryTabs
                grids={customGrids}
                activeGridId={activeGridId}
                setActiveGridId={setActiveGridId}
                onAddNew={handleAddNewGrid}
                onManage={() => setIsManageGridsModalOpen(true)}
                isSearchActive={debouncedSearchQuery.trim().length > 0}
                searchResultsCount={itemsForDisplay.length}
                searchQuery={searchQuery}
                isEditing={isGridEditing}
                onToggleEditMode={() => setIsGridEditing(prev => !prev)}
              />
        </div>
      </div>

      {/* --- TICKET SECTION --- */}
      {/* Mobile: Full Screen Overlay. Desktop: Static Right Column */}
      <div 
        className={`
            fixed inset-0 z-[60] bg-background flex flex-col
            transition-transform duration-300 ease-out will-change-transform
            md:static md:z-auto md:w-[320px] lg:w-[380px] md:border-l md:border-border md:translate-y-0
            ${isTicketVisible ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        <Ticket
          className="w-full h-full flex flex-col"
          onClose={handleTicketClose} 
          currentOrder={currentOrder} 
          editingTicket={editingTicket}
          savedTickets={savedTickets} 
          settings={settings} 
          total={total} 
          subtotal={subtotal} 
          tax={tax}
          editingQuantityItemId={editingQuantityItemId} 
          tempQuantity={tempQuantity} 
          setEditingQuantityItemId={setEditingQuantityItemId}
          setTempQuantity={setTempQuantity} 
          removeFromOrder={removeFromOrder} 
          deleteLineItem={deleteLineItem}
          updateOrderItemQuantity={updateOrderItemQuantity}
          handleQuantityClick={handleQuantityClick} 
          handleQuantityChangeCommit={handleQuantityChangeCommit}
          handleQuantityInputChange={handleQuantityInputChange}
          handleQuantityInputKeyDown={handleQuantityInputKeyDown}
          handlePrimarySaveAction={handlePrimarySaveAction}
          onCharge={handleChargeClick} 
          onOpenTickets={handleOpenTicketsClick}
          onSaveTicket={handleSaveTicketClick} 
          printers={printers}
          onClearTicket={handleClearTicket}
          onPrintRequest={handlePrintRequest}
        />
      </div>

      {/* Modals */}
      <SaveTicketModal isOpen={isSaveModalOpen} onClose={() => { setIsSaveModalOpen(false); setPendingPrintAction(false); }} onSave={handleSaveTicketComplete} editingTicket={editingTicket} />
      <OpenTicketsModal isOpen={isOpenTicketsModalOpen} tickets={savedTickets} onClose={() => setIsOpenTicketsModalOpen(false)} onLoadTicket={handleLoadTicket} onDeleteTicket={handleDeleteTicket} />
      <SelectItemModal isOpen={isSelectItemModalOpen} onClose={() => setIsSelectItemModalOpen(false)} onSelect={handleSelectItem} allItems={items} />
      <ManageGridsModal isOpen={isManageGridsModalOpen} onClose={() => setIsManageGridsModalOpen(false)} initialGrids={customGrids} onSave={handleSaveGrids} />
      <AddGridModal isOpen={isAddGridModalOpen} onClose={() => setIsAddGridModalOpen(false)} onSave={handleSaveNewGrid} />
      
      {/* Variable Price Modal */}
      <PriceInputModal 
        isOpen={!!variablePriceItem}
        onClose={() => setVariablePriceItem(null)}
        onConfirm={handleVariablePriceConfirm}
        item={variablePriceItem}
      />

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
            confirmModalState.onConfirm();
            setConfirmModalState(prev => ({ ...prev, isOpen: false }));
        }}
        title={confirmModalState.title}
        confirmText={confirmModalState.confirmText}
        confirmButtonClass={confirmModalState.confirmButtonClass}
      >
        {confirmModalState.message}
      </ConfirmModal>
    </div>
  );
};

export default SalesScreen;


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
import SalesHeader from '../components/sales/SalesHeader';
import ItemGrid from '../components/sales/ItemGrid';
import CategoryTabs from '../components/sales/CategoryTabs';
import Ticket from '../components/sales/Ticket';
import ChargeScreen from '../components/sales/ChargeScreen';
import { ItemsIcon } from '../constants';

const GRID_SIZE = 20; // 5 columns * 4 rows

type SalesView = 'grid' | 'payment';

// UUID Generator Fallback
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : `G${Date.now()}`;

// --- SEARCH WORKER CODE ---
// We define this as a string to create a Blob Worker.
// This avoids complex build configuration for separate worker files.
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
        // Optional: Add category matching if desired
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
          // Optimization: If items array is massive, we might want to avoid cloning it every time.
          // However, for React apps < 10k items, structured cloning via postMessage is usually acceptable
          // and much faster than blocking the main thread with filter logic.
          searchWorkerRef.current.postMessage({
              items: items,
              query: debouncedSearchQuery
          });
      } else {
          setWorkerSearchResults([]);
      }
  }, [debouncedSearchQuery, items]);

  // Force scroll container reflow when active to fix mobile glitches
  useEffect(() => {
    if (isActive && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
    }
  }, [isActive]);
  
  // Reset pagination and scroll position when category or search changes
  useEffect(() => {
    setDisplayLimit(40);
    setIsGridEditing(false); // Always exit edit mode when switching views
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeGridId, debouncedSearchQuery]);

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

  // Extracted Handlers to ensure stable props for Ticket
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
    
    // OPTIMIZATION: Remove large image data from receipt items to save storage space
    const optimizedItems = currentOrder.map(item => ({
        ...item,
        imageUrl: '' // Strip base64 string
    }));

    // Construct receipt safely to avoid undefined values
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
    // If search is active, return worker results
    if (debouncedSearchQuery.trim()) {
        return workerSearchResults;
    }
    
    // Otherwise, Standard Grid Logic
    if (activeGridId === 'All') return items;
    const grid = customGrids.find(g => g.id === activeGridId);
    if (grid) {
        const sourceIds = Array.isArray(grid.itemIds) ? grid.itemIds : [];
        const finalItemIds = new Array(GRID_SIZE).fill(null);
        for(let i = 0; i < Math.min(sourceIds.length, GRID_SIZE); i++) {
            finalItemIds[i] = sourceIds[i];
        }
        return finalItemIds.map(itemId => items.find(i => i.id === itemId) || null);
    }
    return new Array(GRID_SIZE).fill(null);
  }, [activeGridId, items, customGrids, debouncedSearchQuery, workerSearchResults]);

  const paginatedItems = useMemo(() => {
      // Only paginate "All" view or Search results
      if (activeGridId !== 'All' && !debouncedSearchQuery.trim()) {
          return itemsForDisplay;
      }
      return itemsForDisplay.slice(0, displayLimit);
  }, [itemsForDisplay, displayLimit, activeGridId, debouncedSearchQuery]);

  // Infinite Scroll Observer
  useEffect(() => {
    if ((activeGridId !== 'All' && !debouncedSearchQuery.trim()) || paginatedItems.length >= itemsForDisplay.length) {
        return; 
    }

    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                setDisplayLimit((prev) => prev + 20);
            }
        },
        { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
        observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [paginatedItems.length, itemsForDisplay.length, activeGridId, debouncedSearchQuery]);


  const handleAddNewGrid = useCallback(() => setIsAddGridModalOpen(true), []);
  const handleSaveNewGrid = useCallback((name: string) => {
      addCustomGrid({ id: generateId(), name, itemIds: new Array(GRID_SIZE).fill(null) });
      setIsAddGridModalOpen(false);
  }, [addCustomGrid]);

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
          const newItemIds = new Array(GRID_SIZE).fill(null);
          for(let i = 0; i < Math.min(sourceIds.length, GRID_SIZE); i++) {
              newItemIds[i] = sourceIds[i];
          }
          newItemIds[assigningSlot.slotIndex] = item.id;
          updateCustomGrid({ ...gridToUpdate, itemIds: newItemIds });
      }
      setIsSelectItemModalOpen(false);
      setAssigningSlot(null);
  }, [assigningSlot, customGrids, updateCustomGrid]);

  const handleRemoveItemFromGrid = useCallback((slotIndex: number) => {
    if (activeGridId === 'All') return;
    const gridToUpdate = customGrids.find(g => g.id === activeGridId);
    if (gridToUpdate) {
        const sourceIds = Array.isArray(gridToUpdate.itemIds) ? gridToUpdate.itemIds : [];
        const newItemIds = new Array(GRID_SIZE).fill(null);
        for(let i = 0; i < Math.min(sourceIds.length, GRID_SIZE); i++) {
            newItemIds[i] = sourceIds[i];
        }
        newItemIds[slotIndex] = null;
        updateCustomGrid({ ...gridToUpdate, itemIds: newItemIds });
    }
  }, [activeGridId, customGrids, updateCustomGrid]);

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
          // On mobile, show ticket after loading
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
  
  // Memoized Primary Action
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
          - Grid is always Layer 0.
          - Ticket is Layer 1 (Full screen Overlay).
          - Bottom Cart Bar is fixed on Layer 0.
        Tablet/Desktop:
          - Grid is Left Column.
          - Ticket is Right Column.
      */}

      {/* --- GRID SECTION (Main Content) --- */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <SalesHeader openDrawer={openDrawer} onSearchChange={setSearchQuery} searchQuery={searchQuery} />
        
        {/* Scrollable Container */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
            <div 
              ref={scrollContainerRef} 
              className="flex-1 overflow-y-auto overflow-x-hidden p-2 md:p-4 scroll-smooth pb-24 md:pb-4"
              style={{ 
                  WebkitOverflowScrolling: 'touch',
                  transform: 'translateZ(0)' // Fix for painting glitches on iOS
              }}
            >
              {items.length === 0 && !debouncedSearchQuery.trim() ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary p-4">
                  <div className="max-w-md">
                    <ItemsIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" />
                    <h2 className="mt-4 text-xl font-semibold text-text-primary">Your Menu is Empty</h2>
                    <p className="mt-2 text-sm">
                      Get started by adding your first menu item.
                    </p>
                    <button
                      onClick={() => navigate('/items')}
                      className="mt-6 px-6 py-3 bg-primary text-primary-content font-bold rounded-lg hover:bg-primary-hover shadow-md"
                    >
                      Add Items
                    </button>
                  </div>
                </div>
              ) : (
                <ItemGrid
                  itemsForDisplay={paginatedItems}
                  mode={isViewingAll ? 'all' : 'grid'}
                  onAddItemToOrder={addToOrder}
                  onAssignItem={handleOpenSelectItemModal}
                  onRemoveItem={handleRemoveItemFromGrid}
                  isEditing={!isViewingAll && isGridEditing}
                  loadMoreRef={isViewingAll ? loadMoreRef : undefined}
                />
              )}
            </div>

            {/* Floating Mobile Cart Bar */}
            {currentOrder.length > 0 && (
                <div className="md:hidden absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background via-background to-transparent z-10 pb-safe-bottom">
                    <button 
                        onClick={() => setIsTicketVisible(true)}
                        className="w-full bg-primary text-primary-content rounded-xl shadow-lg flex items-center justify-center p-4 active:scale-[0.98] transition-transform"
                    >
                        <div className="flex items-center gap-3 w-full justify-between">
                            <div className="flex items-center gap-3">
                                <span className="bg-white/20 px-2 py-1 rounded-md text-sm font-bold">
                                    {currentOrder.reduce((acc, item) => acc + item.quantity, 0)}
                                </span>
                                <span className="font-bold">View Cart</span>
                            </div>
                            <span className="font-bold text-lg">₹{total.toFixed(2)}</span>
                        </div>
                    </button>
                </div>
            )}

            {/* Category Tabs - Anchored at bottom of Grid Area on Mobile for thumbs */}
            <div className="bg-surface border-t border-border z-20">
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
      </div>

      {/* --- TICKET SECTION --- */}
      {/* Mobile: Full Screen Slide-Up Overlay. Desktop: Static Right Column */}
      <div 
        className={`
            fixed inset-0 z-[50] bg-background flex flex-col
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

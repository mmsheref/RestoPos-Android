
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
      openDrawer, settings, printers, addReceipt, openAddPrinterModal,
      items, customGrids, addCustomGrid, updateCustomGrid, setCustomGrids,
      savedTickets, saveTicket, removeTicket,
      currentOrder, addToOrder, removeFromOrder, deleteLineItem, 
      updateOrderItemQuantity, clearOrder, loadOrder,
      activeGridId, setActiveGridId
  } = useAppContext();
  
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === '/sales';

  // --- 1. DYNAMIC GRID SIZING ---
  const getGridSize = () => {
      // 25 items for desktop/tablet landscape, 20 for mobile
      return window.innerWidth >= 768 ? 25 : 20;
  };
  const [gridSize, setGridSize] = useState(getGridSize());

  useEffect(() => {
      let timeoutId: any;
      const handleResize = () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
              setGridSize(getGridSize());
          }, 150); // Debounce resize event
      };
      window.addEventListener('resize', handleResize);
      return () => {
          window.removeEventListener('resize', handleResize);
          clearTimeout(timeoutId);
      };
  }, []);

  // Main View State
  const [salesView, setSalesView] = useState<SalesView>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Search Worker
  const [workerSearchResults, setWorkerSearchResults] = useState<Item[]>([]);
  const searchWorkerRef = useRef<Worker | null>(null);
  
  // Ticket Management
  const [editingTicket, setEditingTicket] = useState<SavedTicket | null>(null);
  const [editingQuantityItemId, setEditingQuantityItemId] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>('');
  
  // UI State
  const [pendingPrintAction, setPendingPrintAction] = useState(false);
  const [isGridEditing, setIsGridEditing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ method: string, change: number, receiptId: string, date: Date } | null>(null);
  
  // Pagination
  const [displayLimit, setDisplayLimit] = useState(40);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isManageGridsModalOpen, setIsManageGridsModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isOpenTicketsModalOpen, setIsOpenTicketsModalOpen] = useState(false);
  const [isSelectItemModalOpen, setIsSelectItemModalOpen] = useState(false);
  const [isAddGridModalOpen, setIsAddGridModalOpen] = useState(false);
  const [assigningSlot, setAssigningSlot] = useState<{gridId: string, slotIndex: number} | null>(null);
  const [variablePriceItem, setVariablePriceItem] = useState<Item | null>(null);
  
  const [confirmModalState, setConfirmModalState] = useState<{
      isOpen: boolean; title: string; message: React.ReactNode; onConfirm: () => void;
      confirmText?: string; confirmButtonClass?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  const [isTicketVisible, setIsTicketVisible] = useState(false);

  // Worker Lifecycle
  useEffect(() => {
      const blob = new Blob([SEARCH_WORKER_CODE], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      searchWorkerRef.current = worker;
      worker.onmessage = (e) => setWorkerSearchResults(e.data);
      return () => worker.terminate();
  }, []);

  // Dispatch Search
  useEffect(() => {
      if (searchWorkerRef.current && debouncedSearchQuery.trim()) {
          searchWorkerRef.current.postMessage({ items: items, query: debouncedSearchQuery });
      } else {
          setWorkerSearchResults([]);
      }
  }, [debouncedSearchQuery, items]);

  // Reset View on Activation/Category Change
  useEffect(() => {
    if (isActive && scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [isActive]);
  
  useEffect(() => {
    setDisplayLimit(40);
    setIsGridEditing(false);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [activeGridId, debouncedSearchQuery]);

  // --- LOGIC HANDLERS ---
  
  const handleItemClick = useCallback((item: Item) => {
      if (item.price === 0) setVariablePriceItem(item);
      else addToOrder(item);
  }, [addToOrder]);

  const handleVariablePriceConfirm = (price: number) => {
      if (variablePriceItem) {
          addToOrder({ ...variablePriceItem, price: price });
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

  const handleProcessPayment = useCallback((method: string, tendered: number, splitDetails?: SplitPaymentDetail[]) => {
    if (editingTicket) removeTicket(editingTicket.id);
    const receiptId = `R${Date.now()}`;
    const receiptDate = new Date();
    
    const subtotal = currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = settings.taxEnabled ? subtotal * (settings.taxRate / 100) : 0;
    const total = subtotal + tax;

    const newReceipt: Receipt = { 
        id: receiptId, 
        date: receiptDate, 
        items: currentOrder.map(item => ({...item, imageUrl: ''})), 
        total, 
        paymentMethod: method 
    };

    if (splitDetails && splitDetails.length > 0) newReceipt.splitDetails = splitDetails;

    addReceipt(newReceipt);
    setPaymentResult({ method, change: tendered - total, receiptId, date: receiptDate });
  }, [addReceipt, currentOrder, editingTicket, removeTicket, settings]);

  // --- GRID LOGIC ---
  const itemsForDisplay = useMemo<(Item | null)[]>(() => {
    if (debouncedSearchQuery.trim()) return workerSearchResults;
    if (activeGridId === 'All') return items;
    
    const grid = customGrids.find(g => g.id === activeGridId);
    if (grid) {
        const sourceIds = Array.isArray(grid.itemIds) ? grid.itemIds : [];
        const finalItemIds = new Array(gridSize).fill(null);
        // Only fill up to grid size
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

  // Infinite Scroll
  useEffect(() => {
    if ((activeGridId !== 'All' && !debouncedSearchQuery.trim()) || paginatedItems.length >= itemsForDisplay.length) return; 
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) setDisplayLimit((prev) => prev + 20);
        },
        { threshold: 0.1, rootMargin: '100px' }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [paginatedItems.length, itemsForDisplay.length, activeGridId, debouncedSearchQuery]);

  const handleAssignItem = useCallback((item: Item) => {
      if (!assigningSlot) return;
      const grid = customGrids.find(g => g.id === assigningSlot.gridId);
      if (grid) {
          const newItemIds = [...(grid.itemIds || [])];
          // Ensure array is large enough
          while (newItemIds.length < gridSize) newItemIds.push(null);
          newItemIds[assigningSlot.slotIndex] = item.id;
          updateCustomGrid({ ...grid, itemIds: newItemIds });
      }
      setIsSelectItemModalOpen(false);
      setAssigningSlot(null);
  }, [assigningSlot, customGrids, updateCustomGrid, gridSize]);

  const handleRemoveItemFromGrid = useCallback((slotIndex: number) => {
    if (activeGridId === 'All') return;
    const grid = customGrids.find(g => g.id === activeGridId);
    if (grid) {
        const newItemIds = [...(grid.itemIds || [])];
        while (newItemIds.length < gridSize) newItemIds.push(null);
        newItemIds[slotIndex] = null;
        updateCustomGrid({ ...grid, itemIds: newItemIds });
    }
  }, [activeGridId, customGrids, updateCustomGrid, gridSize]);

  // --- RENDER ---
  if (salesView === 'payment') {
    const sub = currentOrder.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const t = settings.taxEnabled ? sub * (settings.taxRate / 100) : 0;
    return <ChargeScreen total={sub + t} tax={t} subtotal={sub} onBack={() => setSalesView('grid')} onProcessPayment={handleProcessPayment} onNewSale={() => { setSalesView('grid'); setPaymentResult(null); clearOrder(); setEditingTicket(null); }} paymentResult={paymentResult} orderItems={currentOrder} />;
  }

  const subtotal = currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = settings.taxEnabled ? subtotal * (settings.taxRate / 100) : 0;
  const total = subtotal + tax;
  const isViewingAll = activeGridId === 'All' || debouncedSearchQuery.trim().length > 0;

  return (
    <div className="flex h-full w-full bg-background font-sans relative overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <SalesHeader 
            openDrawer={openDrawer} 
            onSearchChange={setSearchQuery} 
            searchQuery={searchQuery} 
            storeName={settings.storeName}
        />
        
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
                    <button onClick={() => navigate('/items')} className="mt-6 px-6 py-3 bg-primary text-primary-content font-bold rounded-lg hover:bg-primary-hover shadow-md">Add Items</button>
                  </div>
                </div>
              ) : (
                <div className={`pb-24 md:pb-0 ${!isViewingAll ? 'md:h-full' : 'md:pb-4'}`}>
                    <ItemGrid
                        itemsForDisplay={paginatedItems}
                        mode={isViewingAll ? 'all' : 'grid'}
                        onAddItemToOrder={handleItemClick}
                        onAssignItem={(idx) => { if(activeGridId !== 'All') { setAssigningSlot({ gridId: activeGridId, slotIndex: idx }); setIsSelectItemModalOpen(true); } }}
                        onRemoveItem={handleRemoveItemFromGrid}
                        isEditing={!isViewingAll && isGridEditing}
                        loadMoreRef={isViewingAll ? loadMoreRef : undefined}
                    />
                </div>
              )}
            </div>
        </div>

        {currentOrder.length > 0 && (
            <div className="md:hidden absolute bottom-[50px] left-0 right-0 p-4 z-50 pointer-events-none">
                <button 
                    onClick={() => setIsTicketVisible(true)}
                    className="w-full bg-primary text-primary-content rounded-xl shadow-xl shadow-primary/30 flex items-center justify-between p-4 active:opacity-90 transition-opacity pointer-events-auto"
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

        <div className="bg-surface border-t border-border z-40 flex-shrink-0 relative shadow-sm">
             <CategoryTabs
                grids={customGrids}
                activeGridId={activeGridId}
                setActiveGridId={setActiveGridId}
                onAddNew={() => setIsAddGridModalOpen(true)}
                onManage={() => setIsManageGridsModalOpen(true)}
                isSearchActive={debouncedSearchQuery.trim().length > 0}
                searchResultsCount={itemsForDisplay.length}
                searchQuery={searchQuery}
                isEditing={isGridEditing}
                onToggleEditMode={() => setIsGridEditing(prev => !prev)}
              />
        </div>
      </div>

      <div className={`fixed inset-0 z-[60] bg-background flex flex-col transition-transform duration-300 ease-out will-change-transform md:static md:z-auto md:w-[320px] lg:w-[380px] md:border-l md:border-border md:translate-y-0 ${isTicketVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <Ticket
          className="w-full h-full flex flex-col"
          onClose={() => setIsTicketVisible(false)} 
          currentOrder={currentOrder} 
          editingTicket={editingTicket}
          savedTickets={savedTickets} 
          settings={settings} 
          total={total} 
          subtotal={subtotal} 
          tax={tax}
          printers={printers}
          editingQuantityItemId={editingQuantityItemId} 
          tempQuantity={tempQuantity} 
          setEditingQuantityItemId={setEditingQuantityItemId}
          setTempQuantity={(v) => /^\d*$/.test(v) && setTempQuantity(v)} 
          removeFromOrder={removeFromOrder} 
          deleteLineItem={deleteLineItem}
          updateOrderItemQuantity={updateOrderItemQuantity}
          handleQuantityClick={handleQuantityClick} 
          handleQuantityChangeCommit={handleQuantityChangeCommit}
          handleQuantityInputChange={(e) => /^\d*$/.test(e.target.value) && setTempQuantity(e.target.value)}
          handleQuantityInputKeyDown={(e) => { if (e.key === 'Enter') handleQuantityChangeCommit(); else if (e.key === 'Escape') setEditingQuantityItemId(null); }}
          handlePrimarySaveAction={() => {
              if (editingTicket) {
                  saveTicket({ ...editingTicket, items: currentOrder });
                  clearOrder();
                  setEditingTicket(null);
                  setIsTicketVisible(false);
              } else {
                  setPendingPrintAction(false);
                  setIsSaveModalOpen(true);
              }
          }}
          onCharge={() => setSalesView('payment')} 
          onOpenTickets={() => setIsOpenTicketsModalOpen(true)}
          onSaveTicket={() => { setPendingPrintAction(false); setIsSaveModalOpen(true); }} 
          onClearTicket={() => { clearOrder(); setEditingTicket(null); setEditingQuantityItemId(null); }}
          onPrintRequest={async () => {
              if (editingTicket) {
                  const updated = { ...editingTicket, items: [...currentOrder], lastModified: Date.now() };
                  await saveTicket(updated);
                  // Add logic here to call print util
                  clearOrder();
                  setEditingTicket(null);
                  if (window.innerWidth < 768) setIsTicketVisible(false);
              } else {
                  setPendingPrintAction(true);
                  setIsSaveModalOpen(true);
              }
          }}
        />
      </div>

      <SaveTicketModal 
        isOpen={isSaveModalOpen} 
        onClose={() => { setIsSaveModalOpen(false); setPendingPrintAction(false); }} 
        onSave={(name) => {
            const itemsToSave = [...currentOrder];
            saveTicket({ id: `T${Date.now()}`, name, items: itemsToSave }); 
            clearOrder(); 
            setEditingTicket(null); 
            setIsSaveModalOpen(false); 
            if (pendingPrintAction) {
                // Print logic stub
                setPendingPrintAction(false); 
            }
        }} 
        editingTicket={editingTicket} 
      />
      <OpenTicketsModal 
        isOpen={isOpenTicketsModalOpen} 
        tickets={savedTickets} 
        onClose={() => setIsOpenTicketsModalOpen(false)} 
        onLoadTicket={(t) => {
            if (currentOrder.length > 0) {
                setConfirmModalState({
                    isOpen: true,
                    title: 'Replace Current Order?',
                    message: 'Loading a saved ticket will replace your current unsaved order.',
                    onConfirm: () => { loadOrder(t.items); setEditingTicket(t); setIsOpenTicketsModalOpen(false); if(window.innerWidth < 768) setIsTicketVisible(true); },
                    confirmText: 'Yes, Load',
                    confirmButtonClass: 'bg-amber-500'
                });
            } else {
                loadOrder(t.items);
                setEditingTicket(t);
                setIsOpenTicketsModalOpen(false);
                if(window.innerWidth < 768) setIsTicketVisible(true);
            }
        }} 
        onDeleteTicket={removeTicket} 
      />
      <SelectItemModal isOpen={isSelectItemModalOpen} onClose={() => setIsSelectItemModalOpen(false)} onSelect={handleAssignItem} allItems={items} />
      <ManageGridsModal isOpen={isManageGridsModalOpen} onClose={() => setIsManageGridsModalOpen(false)} initialGrids={customGrids} onSave={(gs) => { setCustomGrids(gs); setIsManageGridsModalOpen(false); }} />
      <AddGridModal isOpen={isAddGridModalOpen} onClose={() => setIsAddGridModalOpen(false)} onSave={(n) => { const id = generateId(); addCustomGrid({id, name: n, itemIds: []}); setIsAddGridModalOpen(false); setActiveGridId(id); setIsGridEditing(true); }} />
      
      <PriceInputModal isOpen={!!variablePriceItem} onClose={() => setVariablePriceItem(null)} onConfirm={handleVariablePriceConfirm} item={variablePriceItem} />

      <ConfirmModal isOpen={confirmModalState.isOpen} onClose={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))} onConfirm={() => { confirmModalState.onConfirm(); setConfirmModalState(prev => ({ ...prev, isOpen: false })); }} title={confirmModalState.title} confirmText={confirmModalState.confirmText} confirmButtonClass={confirmModalState.confirmButtonClass}>{confirmModalState.message}</ConfirmModal>
    </div>
  );
};

export default SalesScreen;

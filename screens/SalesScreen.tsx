

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { OrderItem, SavedTicket, Item, CustomGrid } from '../types';
import { useAppContext } from '../context/AppContext';
import { useDebounce } from '../hooks/useDebounce';

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
import { ReceiptIcon } from '../constants';
import ItemGridContextMenu from '../components/sales/ItemGridContextMenu';

const GRID_SIZE = 20; // 5 columns * 4 rows

type SalesView = 'grid' | 'payment';

// UUID Generator Fallback
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : `G${Date.now()}`;

const SalesScreen: React.FC = () => {
  const { 
      setHeaderTitle, openDrawer, settings, printers, addReceipt, 
      items, customGrids, addCustomGrid, updateCustomGrid, setCustomGrids,
      savedTickets, saveTicket, removeTicket
  } = useAppContext();

  // Main screen view state
  const [salesView, setSalesView] = useState<SalesView>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  // Use debounced value for heavy filtering operations (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const [activeGridId, setActiveGridId] = useState<'All' | string>('All');
  
  // Ticket management state
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [editingTicket, setEditingTicket] = useState<SavedTicket | null>(null);
  const [editingQuantityItemId, setEditingQuantityItemId] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>('');
  
  // Payment state
  const [paymentResult, setPaymentResult] = useState<{ method: string, change: number, receiptId: string } | null>(null);

  // Modal states
  const [isManageGridsModalOpen, setIsManageGridsModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isOpenTicketsModalOpen, setIsOpenTicketsModalOpen] = useState(false);
  const [isSelectItemModalOpen, setIsSelectItemModalOpen] = useState(false);
  const [isAddGridModalOpen, setIsAddGridModalOpen] = useState(false);
  const [assigningSlot, setAssigningSlot] = useState<{gridId: string, slotIndex: number} | null>(null);
  
  // Universal confirmation modal state
  const [confirmModalState, setConfirmModalState] = useState<{
      isOpen: boolean;
      title: string;
      message: React.ReactNode;
      onConfirm: () => void;
      confirmText?: string;
      confirmButtonClass?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  // New context menu state
  const [contextMenuState, setContextMenuState] = useState<{
      isOpen: boolean;
      position: { top: number, left: number };
      item: Item | null;
      slotIndex: number;
  }>({ isOpen: false, position: { top: 0, left: 0 }, item: null, slotIndex: -1 });

  // Mobile landscape state
  const [isTicketVisible, setIsTicketVisible] = useState(false);
  
  useEffect(() => {
    if (salesView === 'payment') setHeaderTitle('Checkout');
    else if (editingTicket) setHeaderTitle(`Editing: ${editingTicket.name}`);
    else if (currentOrder.length > 0) setHeaderTitle('New Order');
    else setHeaderTitle('Sales');
  }, [editingTicket, currentOrder.length, setHeaderTitle, salesView]);

  const addToOrder = useCallback((item: Item) => {
    setCurrentOrder(current => {
      const existing = current.find(i => i.id === item.id);
      if (existing) {
        return current.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...current, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromOrder = useCallback((itemId: string) => {
    setCurrentOrder(current => {
      const existing = current.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return current.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return current.filter(i => i.id !== itemId);
    });
  }, []);

  const deleteLineItem = useCallback((itemId: string) => {
    setCurrentOrder(prev => prev.filter(i => i.id !== itemId));
    if (editingQuantityItemId === itemId) setEditingQuantityItemId(null);
  }, [editingQuantityItemId]);

  const handleQuantityClick = useCallback((item: OrderItem) => {
    setEditingQuantityItemId(item.id);
    setTempQuantity(item.quantity.toString());
  }, []);

  const handleQuantityChangeCommit = useCallback(() => {
    if (!editingQuantityItemId) return;
    const newQuantity = parseInt(tempQuantity, 10);
    if (isNaN(newQuantity) || newQuantity <= 0) {
        setCurrentOrder(prev => prev.filter(i => i.id !== editingQuantityItemId));
    } else {
        setCurrentOrder(prev => prev.map(i => i.id === editingQuantityItemId ? { ...i, quantity: newQuantity } : i));
    }
    setEditingQuantityItemId(null);
  }, [editingQuantityItemId, tempQuantity]);

  const subtotal = useMemo(() => currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0), [currentOrder]);
  const tax = useMemo(() => settings.taxEnabled ? subtotal * (settings.taxRate / 100) : 0, [subtotal, settings]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);
  
  const handleProcessPayment = useCallback((method: string, tendered: number) => {
    if (editingTicket) removeTicket(editingTicket.id);
    const receiptId = `R${Date.now()}`;
    addReceipt({ id: receiptId, date: new Date(), items: currentOrder, total, paymentMethod: method });
    setPaymentResult({ method, change: tendered - total, receiptId });
  }, [addReceipt, currentOrder, editingTicket, removeTicket, total]);
  
  const handleNewSale = useCallback(() => {
    setSalesView('grid'); setPaymentResult(null); setCurrentOrder([]); setEditingTicket(null);
  }, []);
  
  const itemsForDisplay = useMemo<(Item | null)[]>(() => {
    if (debouncedSearchQuery.trim()) {
        const lowerQuery = debouncedSearchQuery.trim().toLowerCase();
        return items.filter(item => item.name.toLowerCase().includes(lowerQuery));
    }
    if (activeGridId === 'All') return items;
    const grid = customGrids.find(g => g.id === activeGridId);
    if (grid) {
        // BUG FIX: Ensure itemIds is always a fixed-size array to prevent crashes.
        const sourceIds = Array.isArray(grid.itemIds) ? grid.itemIds : [];
        const finalItemIds = new Array(GRID_SIZE).fill(null);
        for(let i = 0; i < Math.min(sourceIds.length, GRID_SIZE); i++) {
            finalItemIds[i] = sourceIds[i];
        }
        return finalItemIds.map(itemId => items.find(i => i.id === itemId) || null);
    }
    return new Array(GRID_SIZE).fill(null);
  }, [activeGridId, items, customGrids, debouncedSearchQuery]);

  // --- Grid Management ---
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
  }, [activeGridId, setCustomGrids]);

  const handleOpenSelectItemModal = useCallback((slotIndex: number) => {
      if (activeGridId === 'All') return;
      setAssigningSlot({ gridId: activeGridId, slotIndex });
      setIsSelectItemModalOpen(true);
  }, [activeGridId]);

  const handleSelectItem = useCallback((item: Item) => {
      if (!assigningSlot) return;
      const gridToUpdate = customGrids.find(g => g.id === assigningSlot.gridId);
      if (gridToUpdate) {
          // BUG FIX: Ensure we start with a safe, full-sized array before modification.
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
        // BUG FIX: Ensure we start with a safe, full-sized array before modification.
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
    setCurrentOrder([]);
    setEditingTicket(null);
    setEditingQuantityItemId(null);
  }, []);

  const handleLoadTicket = (ticket: SavedTicket) => {
      const loadAction = () => {
          setCurrentOrder(ticket.items);
          setEditingTicket(ticket);
          setIsOpenTicketsModalOpen(false);
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

  // --- Context Menu Handlers ---
  const handleItemLongPress = useCallback((item: Item, slotIndex: number, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        return { x: e.clientX, y: e.clientY };
    }
    const { x, y } = getCoords(event);
    setContextMenuState({ isOpen: true, position: { top: y, left: x }, item, slotIndex });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuState(prev => ({ ...prev, isOpen: false }));
  }, []);
  
  const handleContextRemove = useCallback(() => {
    if (contextMenuState.item) handleRemoveItemFromGrid(contextMenuState.slotIndex);
    closeContextMenu();
  }, [contextMenuState, handleRemoveItemFromGrid, closeContextMenu]);
  
  const handleContextChange = useCallback(() => {
    if (contextMenuState.item) handleOpenSelectItemModal(contextMenuState.slotIndex);
    closeContextMenu();
  }, [contextMenuState, handleOpenSelectItemModal, closeContextMenu]);


  if (salesView === 'payment') {
    return <ChargeScreen total={total} tax={tax} subtotal={subtotal} onBack={() => setSalesView('grid')} onProcessPayment={handleProcessPayment} onNewSale={handleNewSale} paymentResult={paymentResult} orderItems={currentOrder} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50 dark:bg-slate-900 font-sans relative">
      <div className={`w-full md:w-[70%] flex-col ${isTicketVisible ? 'hidden md:flex' : 'flex'}`}>
        <SalesHeader openDrawer={openDrawer} onSearchChange={setSearchQuery} />
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2 content-visibility-auto">
            <ItemGrid
              itemsForDisplay={itemsForDisplay}
              mode={activeGridId === 'All' || debouncedSearchQuery.trim() ? 'all' : 'grid'}
              onAddItemToOrder={addToOrder}
              onAssignItem={handleOpenSelectItemModal}
              onItemLongPress={handleItemLongPress}
            />
          </div>
          <CategoryTabs
            grids={customGrids}
            activeGridId={activeGridId}
            setActiveGridId={setActiveGridId}
            onAddNew={handleAddNewGrid}
            onManage={() => setIsManageGridsModalOpen(true)}
            isSearchActive={debouncedSearchQuery.trim().length > 0}
            searchResultsCount={itemsForDisplay.length}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      <Ticket
        className={`w-full md:w-[30%] flex-col ${isTicketVisible ? 'flex' : 'hidden md:flex'}`}
        onClose={() => setIsTicketVisible(false)} currentOrder={currentOrder} editingTicket={editingTicket}
        savedTickets={savedTickets} settings={settings} total={total} subtotal={subtotal} tax={tax}
        editingQuantityItemId={editingQuantityItemId} tempQuantity={tempQuantity} setEditingQuantityItemId={setEditingQuantityItemId}
        setTempQuantity={setTempQuantity} removeFromOrder={removeFromOrder} addToOrder={addToOrder} deleteLineItem={deleteLineItem}
        handleQuantityClick={handleQuantityClick} handleQuantityChangeCommit={handleQuantityChangeCommit}
        handleQuantityInputChange={(e) => /^\d*$/.test(e.target.value) && setTempQuantity(e.target.value)}
        handleQuantityInputKeyDown={(e) => { if (e.key === 'Enter') handleQuantityChangeCommit(); else if (e.key === 'Escape') setEditingQuantityItemId(null); }}
        handlePrimarySaveAction={() => editingTicket ? (saveTicket({ ...editingTicket, items: currentOrder }), setCurrentOrder([]), setEditingTicket(null)) : setIsSaveModalOpen(true)}
        onCharge={() => setSalesView('payment')} onOpenTickets={() => setIsOpenTicketsModalOpen(true)}
        onSaveTicket={() => setIsSaveModalOpen(true)} printers={printers}
        onClearTicket={handleClearTicket}
      />
      
      {currentOrder.length > 0 && !isTicketVisible && (
        <button onClick={() => setIsTicketVisible(true)} className="md:hidden fixed bottom-4 right-4 bg-blue-600 text-white font-bold py-3 px-5 rounded-full shadow-lg flex items-center gap-2 z-20">
            <ReceiptIcon className="h-5 w-5" />
            <span>View Order ({currentOrder.reduce((acc, item) => acc + item.quantity, 0)})</span>
            <span className="font-mono bg-blue-700/50 px-2 py-0.5 rounded-full text-sm">{total.toFixed(2)}</span>
        </button>
      )}

      <SaveTicketModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onSave={(name) => { saveTicket({ id: `T${Date.now()}`, name, items: currentOrder }); setCurrentOrder([]); setEditingTicket(null); setIsSaveModalOpen(false); }} editingTicket={editingTicket} />
      <OpenTicketsModal isOpen={isOpenTicketsModalOpen} tickets={savedTickets} onClose={() => setIsOpenTicketsModalOpen(false)} onLoadTicket={handleLoadTicket} onDeleteTicket={handleDeleteTicket} />
      <SelectItemModal isOpen={isSelectItemModalOpen} onClose={() => setIsSelectItemModalOpen(false)} onSelect={handleSelectItem} allItems={items} />
      <ManageGridsModal isOpen={isManageGridsModalOpen} onClose={() => setIsManageGridsModalOpen(false)} initialGrids={customGrids} onSave={handleSaveGrids} />
      <AddGridModal isOpen={isAddGridModalOpen} onClose={() => setIsAddGridModalOpen(false)} onSave={handleSaveNewGrid} />
      
      <ItemGridContextMenu 
        state={contextMenuState}
        onClose={closeContextMenu}
        onRemove={handleContextRemove}
        onChange={handleContextChange}
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
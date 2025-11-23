
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { OrderItem, SavedTicket, Item, CustomGrid } from '../types';
import { useAppContext } from '../context/AppContext';

// Modals and Child Components
import SaveTicketModal from '../components/modals/SaveTicketModal';
import OpenTicketsModal from '../components/modals/OpenTicketsModal';
import ManageGridsModal from '../components/modals/ManageGridsModal';
import SelectItemModal from '../components/modals/SelectItemModal';
import AddGridModal from '../components/modals/AddGridModal';
import SalesHeader from '../components/sales/SalesHeader';
import ItemGrid from '../components/sales/ItemGrid';
import CategoryTabs from '../components/sales/CategoryTabs';
import Ticket from '../components/sales/Ticket';
import ChargeScreen from '../components/sales/ChargeScreen';
import { ReceiptIcon } from '../constants';

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
  const [activeGridId, setActiveGridId] = useState<'All' | string>('All');
  
  // Ticket management state
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [editingTicket, setEditingTicket] = useState<SavedTicket | null>(null);
  const [editingQuantityItemId, setEditingQuantityItemId] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>('');
  
  // Payment state
  const [paymentResult, setPaymentResult] = useState<{ method: 'Cash' | 'QR', change: number } | null>(null);

  // Modal states
  const [isManageGridsModalOpen, setIsManageGridsModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isOpenTicketsModalOpen, setIsOpenTicketsModalOpen] = useState(false);
  const [isSelectItemModalOpen, setIsSelectItemModalOpen] = useState(false);
  const [isAddGridModalOpen, setIsAddGridModalOpen] = useState(false);
  const [assigningSlot, setAssigningSlot] = useState<{gridId: string, slotIndex: number} | null>(null);

  // Mobile landscape state
  const [isTicketVisible, setIsTicketVisible] = useState(false);
  
  useEffect(() => {
    if (salesView === 'payment') setHeaderTitle('Checkout');
    else if (editingTicket) setHeaderTitle(`Editing: ${editingTicket.name}`);
    else if (currentOrder.length > 0) setHeaderTitle('New Order');
    else setHeaderTitle('Sales');
  }, [editingTicket, currentOrder.length, setHeaderTitle, salesView]);

  const addToOrder = (item: Item) => {
    const existing = currentOrder.find(i => i.id === item.id);
    if (existing) {
      setCurrentOrder(currentOrder.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCurrentOrder([...currentOrder, { ...item, quantity: 1 }]);
    }
  };

  const removeFromOrder = (itemId: string) => {
    const existing = currentOrder.find(i => i.id === itemId);
    if (existing && existing.quantity > 1) {
      setCurrentOrder(currentOrder.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
    } else {
      setCurrentOrder(currentOrder.filter(i => i.id !== itemId));
    }
  };

  const deleteLineItem = (itemId: string) => {
    setCurrentOrder(prev => prev.filter(i => i.id !== itemId));
    if (editingQuantityItemId === itemId) setEditingQuantityItemId(null);
  };

  const handleQuantityClick = (item: OrderItem) => {
    setEditingQuantityItemId(item.id);
    setTempQuantity(item.quantity.toString());
  };

  const handleQuantityChangeCommit = () => {
    if (!editingQuantityItemId) return;
    const newQuantity = parseInt(tempQuantity, 10);
    if (isNaN(newQuantity) || newQuantity <= 0) {
        setCurrentOrder(prev => prev.filter(i => i.id !== editingQuantityItemId));
    } else {
        setCurrentOrder(prev => prev.map(i => i.id === editingQuantityItemId ? { ...i, quantity: newQuantity } : i));
    }
    setEditingQuantityItemId(null);
  };

  const subtotal = useMemo(() => currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0), [currentOrder]);
  const tax = useMemo(() => settings.taxEnabled ? subtotal * (settings.taxRate / 100) : 0, [subtotal, settings]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);
  
  const handleProcessPayment = (method: 'Cash' | 'QR', tendered: number) => {
    if (editingTicket) removeTicket(editingTicket.id);
    addReceipt({ id: `R${Date.now()}`, date: new Date(), items: currentOrder, total, paymentMethod: method });
    setPaymentResult({ method, change: tendered - total });
  };
  
  const handleNewSale = () => {
    setSalesView('grid'); setPaymentResult(null); setCurrentOrder([]); setEditingTicket(null);
  };
  
  const itemsForDisplay = useMemo<(Item | null)[]>(() => {
    const allFilteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));
    
    if (activeGridId === 'All' || searchQuery.trim()) {
      return allFilteredItems;
    }
    
    const grid = customGrids.find(g => g.id === activeGridId);
    if (grid) {
      return grid.itemIds.map(itemId => items.find(i => i.id === itemId) || null);
    }
    
    return new Array(GRID_SIZE).fill(null);
  }, [activeGridId, items, customGrids, searchQuery]);

  // --- Grid Management ---
  const handleAddNewGrid = () => {
      setIsAddGridModalOpen(true);
  };
  const handleSaveNewGrid = (name: string) => {
      addCustomGrid({ id: generateId(), name, itemIds: new Array(GRID_SIZE).fill(null) });
      setIsAddGridModalOpen(false);
  };
  const handleSaveGrids = (newGrids: CustomGrid[]) => {
      setCustomGrids(newGrids);
      setIsManageGridsModalOpen(false);
  };
  const handleOpenSelectItemModal = (slotIndex: number) => {
      if (activeGridId === 'All') return;
      setAssigningSlot({ gridId: activeGridId, slotIndex });
      setIsSelectItemModalOpen(true);
  };
  const handleSelectItem = (item: Item) => {
      if (!assigningSlot) return;
      const gridToUpdate = customGrids.find(g => g.id === assigningSlot.gridId);
      if (gridToUpdate) {
          const newItemIds = [...gridToUpdate.itemIds];
          newItemIds[assigningSlot.slotIndex] = item.id;
          updateCustomGrid({ ...gridToUpdate, itemIds: newItemIds });
      }
      setIsSelectItemModalOpen(false);
      setAssigningSlot(null);
  };

  if (salesView === 'payment') {
    return <ChargeScreen total={total} tax={tax} subtotal={subtotal} onBack={() => setSalesView('grid')} onProcessPayment={handleProcessPayment} onNewSale={handleNewSale} paymentResult={paymentResult} orderItems={currentOrder} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50 dark:bg-slate-900 font-sans relative">
      <div className={`w-full md:w-[70%] flex-col ${isTicketVisible ? 'hidden md:flex' : 'flex'}`}>
        <SalesHeader openDrawer={openDrawer} onSearchChange={setSearchQuery} />
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* This container isolates the scrolling to just the item grid */}
          <div className="flex-1 overflow-y-auto pr-2">
            <ItemGrid
              itemsForDisplay={itemsForDisplay}
              mode={activeGridId === 'All' || searchQuery.trim() ? 'all' : 'grid'}
              onAddItemToOrder={addToOrder}
              onAssignItem={handleOpenSelectItemModal}
            />
          </div>
          <CategoryTabs
            grids={customGrids}
            activeGridId={activeGridId}
            setActiveGridId={setActiveGridId}
            onAddNew={handleAddNewGrid}
            onManage={() => setIsManageGridsModalOpen(true)}
            isSearchActive={searchQuery.trim().length > 0}
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
      />
      
      {currentOrder.length > 0 && !isTicketVisible && (
        <button onClick={() => setIsTicketVisible(true)} className="md:hidden fixed bottom-4 right-4 bg-blue-600 text-white font-bold py-3 px-5 rounded-full shadow-lg flex items-center gap-2 z-20">
            <ReceiptIcon className="h-5 w-5" />
            <span>View Order ({currentOrder.reduce((acc, item) => acc + item.quantity, 0)})</span>
            <span className="font-mono bg-blue-700/50 px-2 py-0.5 rounded-full text-sm">₹{total.toFixed(2)}</span>
        </button>
      )}

      <SaveTicketModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onSave={(name) => { saveTicket({ id: `T${Date.now()}`, name, items: currentOrder }); setCurrentOrder([]); setEditingTicket(null); setIsSaveModalOpen(false); }} editingTicket={editingTicket} />
      <OpenTicketsModal isOpen={isOpenTicketsModalOpen} tickets={savedTickets} onClose={() => setIsOpenTicketsModalOpen(false)} onLoadTicket={(ticket) => { if (currentOrder.length > 0 && !window.confirm("Loading will replace current order. Continue?")) return; setCurrentOrder(ticket.items); setEditingTicket(ticket); setIsOpenTicketsModalOpen(false); }} onDeleteTicket={(id) => { if (window.confirm("Delete this ticket?")) removeTicket(id); }} />
      <SelectItemModal isOpen={isSelectItemModalOpen} onClose={() => setIsSelectItemModalOpen(false)} onSelect={handleSelectItem} allItems={items} />
      <ManageGridsModal isOpen={isManageGridsModalOpen} onClose={() => setIsManageGridsModalOpen(false)} initialGrids={customGrids} onSave={handleSaveGrids} />
      <AddGridModal isOpen={isAddGridModalOpen} onClose={() => setIsAddGridModalOpen(false)} onSave={handleSaveNewGrid} />
    </div>
  );
};

export default SalesScreen;

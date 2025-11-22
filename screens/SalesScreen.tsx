
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { OrderItem, SavedTicket, Item } from '../types';
import { useAppContext } from '../context/AppContext';

// Modals and Child Components
import SaveTicketModal from '../components/modals/SaveTicketModal';
import OpenTicketsModal from '../components/modals/OpenTicketsModal';
import TabManagementModal from '../components/modals/TabManagementModal';
import SalesHeader from '../components/sales/SalesHeader';
import ItemGrid from '../components/sales/ItemGrid';
import CategoryTabs from '../components/sales/CategoryTabs';
import Ticket from '../components/sales/Ticket';
import ChargeScreen from '../components/sales/ChargeScreen';
import { ReceiptIcon } from '../constants';

const GRID_SIZE = 20; // 5 columns * 4 rows

type SalesView = 'grid' | 'payment';

const SalesScreen: React.FC = () => {
  const { 
      setHeaderTitle, openDrawer, settings, printers, addReceipt, 
      items, categories, setCategories, addCategory
  } = useAppContext();

  // Main screen view state
  const [salesView, setSalesView] = useState<SalesView>('grid');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState(categories[0] || 'All');

  // Ensure active tab exists
  useEffect(() => {
      if (categories.length > 0 && !categories.includes(activeTab)) {
          setActiveTab(categories[0]);
      }
  }, [categories, activeTab]);
  
  // Ticket management state
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [savedTickets, setSavedTickets] = useState<SavedTicket[]>([]);
  const [editingTicket, setEditingTicket] = useState<SavedTicket | null>(null);
  const [editingQuantityItemId, setEditingQuantityItemId] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>('');
  
  // Payment state
  const [paymentResult, setPaymentResult] = useState<{ method: 'Cash' | 'QR', change: number } | null>(null);

  // Modal states
  const [isTabModalOpen, setIsTabModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isOpenTicketsModalOpen, setIsOpenTicketsModalOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<{ oldName: string; index: number } | null>(null);

  // Mobile landscape state
  const [isTicketVisible, setIsTicketVisible] = useState(false);
  
  // Update header title based on current order status
  useEffect(() => {
    if (salesView === 'payment') {
        setHeaderTitle('Checkout');
    } else if (editingTicket) {
      setHeaderTitle(`Editing: ${editingTicket.name}`);
    } else if (currentOrder.length > 0) {
      setHeaderTitle('New Order');
    } else {
      setHeaderTitle('Sales');
    }
  }, [editingTicket, currentOrder.length, setHeaderTitle, salesView]);

  const openEditModal = (tabName: string) => {
    const index = categories.findIndex(t => t === tabName);
    if (index === -1) return;
    setEditingTab({ oldName: tabName, index });
    setIsTabModalOpen(true);
  };
  
  const handleAddNewTab = () => {
    const name = window.prompt("Enter new category name:");
    if (name && name.trim() !== '') {
        addCategory(name.trim());
        setActiveTab(name.trim());
    }
  };

  const handleRenameTab = (newTabName: string) => {
    if (!editingTab || !newTabName || newTabName.trim() === '') return;
    
    const updatedCategories = [...categories];
    updatedCategories[editingTab.index] = newTabName;
    setCategories(updatedCategories);

    if (activeTab === editingTab.oldName) {
        setActiveTab(newTabName);
    }
    setIsTabModalOpen(false);
    setEditingTab(null);
  };
  
  const handleMoveTab = (direction: 'left' | 'right') => {
    if (!editingTab) return;
    const { index } = editingTab;
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;
    
    const newTabs = [...categories];
    [newTabs[index], newTabs[newIndex]] = [newTabs[newIndex], newTabs[index]];
    setCategories(newTabs);
    setEditingTab({ ...editingTab, index: newIndex });
  };
  
  const handleDeleteTab = () => {
    if (!editingTab) return;
    if (window.confirm(`Delete category "${editingTab.oldName}"? Items in this category will not be deleted, but hidden from this view.`)) {
      const newTabs = categories.filter(t => t !== editingTab.oldName);
      setCategories(newTabs);
      if (activeTab === editingTab.oldName) setActiveTab(newTabs[0] || '');
      setIsTabModalOpen(false);
      setEditingTab(null);
    }
  };
  
  const addToOrder = (item: Item) => {
    const existingItem = currentOrder.find(orderItem => orderItem.id === item.id);
    if (existingItem) {
      setCurrentOrder(currentOrder.map(orderItem =>
        orderItem.id === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem
      ));
    } else {
      setCurrentOrder([...currentOrder, { ...item, quantity: 1 }]);
    }
  };

  const removeFromOrder = (itemId: string) => {
    const existingItem = currentOrder.find(orderItem => orderItem.id === itemId);
    if (existingItem && existingItem.quantity > 1) {
      setCurrentOrder(currentOrder.map(orderItem =>
        orderItem.id === itemId ? { ...orderItem, quantity: orderItem.quantity - 1 } : orderItem
      ));
    } else {
      setCurrentOrder(currentOrder.filter(orderItem => orderItem.id !== itemId));
    }
  };

  const deleteLineItem = (itemId: string) => {
    setCurrentOrder(prev => prev.filter(i => i.id !== itemId));
    if (editingQuantityItemId === itemId) {
        setEditingQuantityItemId(null);
    }
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
        setCurrentOrder(prev => prev.map(i => 
            i.id === editingQuantityItemId ? { ...i, quantity: newQuantity } : i
        ));
    }
    setEditingQuantityItemId(null);
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (/^\d*$/.test(value)) {
          setTempQuantity(value);
      }
  }

  const handleQuantityInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleQuantityChangeCommit();
          (e.target as HTMLInputElement).blur();
      } else if (e.key === 'Escape') {
          setEditingQuantityItemId(null);
      }
  }
  
  const handlePrimarySaveAction = () => {
    if (editingTicket) {
      setSavedTickets(savedTickets.map(t => 
        t.id === editingTicket.id ? { ...t, items: currentOrder } : t
      ));
      setCurrentOrder([]);
      setEditingTicket(null);
    } else {
      setIsSaveModalOpen(true);
    }
  };

  const handleSaveTicketFromModal = (name: string) => {
    if (editingTicket) {
      setSavedTickets(savedTickets.map(t => t.id === editingTicket.id ? { ...t, name, items: currentOrder } : t));
    } else {
      const newTicket: SavedTicket = { id: `T${Date.now()}`, name, items: currentOrder };
      setSavedTickets([...savedTickets, newTicket]);
    }
    setCurrentOrder([]);
    setEditingTicket(null);
    setIsSaveModalOpen(false);
  };

  const handleLoadTicket = (ticket: SavedTicket) => {
    if (currentOrder.length > 0 && !window.confirm("Loading a ticket will replace your current unsaved order. Are you sure?")) {
        return;
    }
    setCurrentOrder(ticket.items);
    setEditingTicket(ticket);
    setIsOpenTicketsModalOpen(false);
  };
  
  const handleDeleteTicket = (ticketId: string) => {
    if (window.confirm("Are you sure you want to delete this ticket permanently?")) {
      setSavedTickets(savedTickets.filter(t => t.id !== ticketId));
      if (editingTicket && editingTicket.id === ticketId) {
        setCurrentOrder([]);
        setEditingTicket(null);
      }
    }
  };
  
  const subtotal = useMemo(() => currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0), [currentOrder]);
  const tax = useMemo(() => settings.taxEnabled ? subtotal * (settings.taxRate / 100) : 0, [subtotal, settings]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);
  
  const handleChargeClick = () => {
    setSalesView('payment');
  };

  const handleProcessPayment = (method: 'Cash' | 'QR', tendered: number) => {
    const changeDue = tendered - total;

    if (editingTicket) {
      setSavedTickets(prev => prev.filter(t => t.id !== editingTicket.id));
    }
    
    addReceipt({
        id: `R${Date.now()}`,
        date: new Date(),
        items: currentOrder,
        total: total,
        paymentMethod: method,
    });

    setPaymentResult({ method, change: changeDue });
  };

  const handleNewSale = () => {
    setSalesView('grid');
    setPaymentResult(null);
    setCurrentOrder([]);
    setEditingTicket(null);
  };
  
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [searchQuery, items]);

  const itemsForGrid = useMemo(() => {
    // Filter by Active Tab if no search, otherwise show search results
    const filteredItems = searchQuery.trim() 
        ? searchResults 
        : items.filter(i => i.category === activeTab);

    const displayItems: (Item | null)[] = new Array(GRID_SIZE).fill(null);
    for (let i = 0; i < Math.min(filteredItems.length, GRID_SIZE); i++) {
      displayItems[i] = filteredItems[i];
    }
    return displayItems;
  }, [activeTab, items, searchQuery, searchResults]);

  if (salesView === 'payment') {
    return (
      <ChargeScreen
        total={total}
        tax={tax}
        subtotal={subtotal}
        onBack={() => setSalesView('grid')}
        onProcessPayment={handleProcessPayment}
        onNewSale={handleNewSale}
        paymentResult={paymentResult}
        orderItems={currentOrder}
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50 dark:bg-slate-900 font-sans relative">
      {/* Main Content Area (Grid + Tab Bar) */}
      <div className={`w-full md:w-[70%] flex-col ${isTicketVisible ? 'hidden md:flex' : 'flex'}`}>
        <SalesHeader
          openDrawer={openDrawer}
          onSearchChange={setSearchQuery}
        />
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <ItemGrid
            itemsForGrid={itemsForGrid}
            addToOrder={addToOrder}
          />
          <CategoryTabs
            tabs={categories}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onAddNewTab={handleAddNewTab}
            onEditTab={openEditModal}
            isSearchActive={searchQuery.trim().length > 0}
            searchResultsCount={searchResults.length}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      {/* Ticket Section */}
      <Ticket
        className={`w-full md:w-[30%] flex-col ${isTicketVisible ? 'flex' : 'hidden md:flex'}`}
        onClose={() => setIsTicketVisible(false)}
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
        addToOrder={addToOrder}
        deleteLineItem={deleteLineItem}
        handleQuantityClick={handleQuantityClick}
        handleQuantityChangeCommit={handleQuantityChangeCommit}
        handleQuantityInputChange={handleQuantityInputChange}
        handleQuantityInputKeyDown={handleQuantityInputKeyDown}
        handlePrimarySaveAction={handlePrimarySaveAction}
        onCharge={handleChargeClick}
        onOpenTickets={() => setIsOpenTicketsModalOpen(true)}
        onSaveTicket={() => setIsSaveModalOpen(true)}
        printers={printers}
      />
      
      {/* Mobile Floating "View Order" Button */}
      {currentOrder.length > 0 && !isTicketVisible && (
        <button
            onClick={() => setIsTicketVisible(true)}
            className="md:hidden fixed bottom-4 right-4 bg-blue-600 text-white font-bold py-3 px-5 rounded-full shadow-lg flex items-center gap-2 z-20 animate-pulse"
        >
            <ReceiptIcon className="h-5 w-5" />
            <span>View Order ({currentOrder.reduce((acc, item) => acc + item.quantity, 0)})</span>
            <span className="font-mono bg-blue-700/50 px-2 py-0.5 rounded-full text-sm">₹{total.toFixed(2)}</span>
        </button>
      )}

      {/* Modals */}
      <SaveTicketModal 
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)} 
        onSave={handleSaveTicketFromModal} 
        editingTicket={editingTicket} 
      />

      <OpenTicketsModal 
        isOpen={isOpenTicketsModalOpen}
        tickets={savedTickets} 
        onClose={() => setIsOpenTicketsModalOpen(false)} 
        onLoadTicket={handleLoadTicket} 
        onDeleteTicket={handleDeleteTicket} 
      />
      
      <TabManagementModal
        isOpen={isTabModalOpen}
        onClose={() => setIsTabModalOpen(false)}
        editingTab={editingTab}
        tabs={categories}
        onRename={handleRenameTab}
        onMove={handleMoveTab}
        onDelete={handleDeleteTab}
      />
    </div>
  );
};

export default SalesScreen;



import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { OrderItem, SavedTicket } from '../types';
import { useAppContext } from '../context/AppContext';

// Modals and Child Components
import SaveTicketModal from '../components/modals/SaveTicketModal';
import OpenTicketsModal from '../components/modals/OpenTicketsModal';
import TabManagementModal from '../components/modals/TabManagementModal';
import SalesHeader from '../components/sales/SalesHeader';
import ItemGrid from '../components/sales/ItemGrid';
import CategoryTabs from '../components/sales/CategoryTabs';
import Ticket from '../components/sales/Ticket';
import { ReceiptIcon } from '../constants';

// --- Initial Data ---
const initialTabs = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Sides'];

const initialItems = {
  'Appetizers': [
    { id: 'a1', name: 'Spring Rolls', price: 150.00, imageUrl: 'https://picsum.photos/id/10/200/200' },
    { id: 'a2', name: 'Garlic Bread', price: 120.00, imageUrl: 'https://picsum.photos/id/20/200/200' },
    { id: 'a3', name: 'Bruschetta', price: 180.00, imageUrl: 'https://picsum.photos/id/30/200/200' },
  ],
  'Main Courses': [
    { id: 'm1', name: 'Steak Frites', price: 650.00, imageUrl: 'https://picsum.photos/id/40/200/200' },
    { id: 'm2', name: 'Veg Noodles', price: 250.00, imageUrl: 'https://picsum.photos/id/50/200/200' },
    { id: 'm3', name: 'Shawarma Plate', price: 350.00, imageUrl: 'https://picsum.photos/id/60/200/200' },
  ],
  'Desserts': [
    { id: 'd1', name: 'Cheesecake', price: 220.00, imageUrl: 'https://picsum.photos/id/70/200/200' },
    { id: 'd2', name: 'Chocolate Lava Cake', price: 240.00, imageUrl: 'https://picsum.photos/id/80/200/200' },
  ],
  'Beverages': [
    { id: 'b1', name: 'Coke', price: 60.00, imageUrl: 'https://picsum.photos/id/90/200/200' },
    { id: 'b2', name: 'Iced Tea', price: 80.00, imageUrl: 'https://picsum.photos/id/100/200/200' },
    { id: 'b3', name: 'Orange Juice', price: 100.00, imageUrl: 'https://picsum.photos/id/110/200/200' },
  ],
  'Sides': [
    { id: 's1', name: 'French Fries', price: 110.00, imageUrl: 'https://picsum.photos/id/120/200/200' },
    { id: 's2', name: 'Side Salad', price: 130.00, imageUrl: 'https://picsum.photos/id/130/200/200' },
  ],
};

const GRID_SIZE = 20; // 5 columns * 4 rows

const SalesScreen: React.FC = () => {
  const { setHeaderTitle, openDrawer, settings, printers } = useAppContext();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Item grid state
  const [tabs, setTabs] = useState<string[]>(initialTabs);
  const [itemsByTab, setItemsByTab] = useState<Record<string, {id: string, name: string, price: number, imageUrl: string}[]>>(initialItems);
  const [activeTab, setActiveTab] = useState('Appetizers');
  
  // Ticket management state
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [savedTickets, setSavedTickets] = useState<SavedTicket[]>([]);
  const [editingTicket, setEditingTicket] = useState<SavedTicket | null>(null);
  const [editingQuantityItemId, setEditingQuantityItemId] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>('');
  
  // Modal states
  const [isTabModalOpen, setIsTabModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isOpenTicketsModalOpen, setIsOpenTicketsModalOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<{ oldName: string; index: number } | null>(null);

  // Mobile landscape state
  const [isTicketVisible, setIsTicketVisible] = useState(false);
  
  // Update header title based on current order status
  useEffect(() => {
    if (editingTicket) {
      setHeaderTitle(`Editing: ${editingTicket.name}`);
    } else if (currentOrder.length > 0) {
      setHeaderTitle('New Order');
    } else {
      setHeaderTitle('Sales');
    }
  }, [editingTicket, currentOrder.length, setHeaderTitle]);

  const openEditModal = (tabName: string) => {
    const index = tabs.findIndex(t => t === tabName);
    if (index === -1) return;
    setEditingTab({ oldName: tabName, index });
    setIsTabModalOpen(true);
  };
  
  const handleAddNewTab = () => {
    const name = window.prompt("Enter new tab name:");
    if (name && name.trim() !== '' && !tabs.includes(name)) {
      setTabs([...tabs, name]);
      setItemsByTab({...itemsByTab, [name]: []});
      setActiveTab(name);
    } else if (name && tabs.includes(name)) {
      alert("A tab with this name already exists.");
    }
  };

  const handleRenameTab = (newTabName: string) => {
    if (!editingTab || !newTabName || newTabName.trim() === '') return;
    if (newTabName !== editingTab.oldName && tabs.includes(newTabName)) {
      alert("A tab with this name already exists.");
      return;
    }

    const oldName = editingTab.oldName;
    setTabs(prevTabs => prevTabs.map(t => (t === oldName ? newTabName : t)));
    
    setItemsByTab(prevItems => {
        const newItems = {...prevItems};
        newItems[newTabName] = newItems[oldName];
        if (oldName !== newTabName) {
            delete newItems[oldName];
        }
        return newItems;
    });

    if (activeTab === oldName) {
        setActiveTab(newTabName);
    }
    setIsTabModalOpen(false);
    setEditingTab(null);
  };
  
  const handleMoveTab = (direction: 'left' | 'right') => {
    if (!editingTab) return;
    const { index } = editingTab;
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tabs.length) return;
    const newTabs = [...tabs];
    [newTabs[index], newTabs[newIndex]] = [newTabs[newIndex], newTabs[index]];
    setTabs(newTabs);
    setEditingTab({ ...editingTab, index: newIndex });
  };
  
  const handleDeleteTab = () => {
    if (!editingTab) return;
    if (window.confirm(`Are you sure you want to delete the "${editingTab.oldName}" tab and all its items?`)) {
      const tabToDelete = editingTab.oldName;
      setTabs(prevTabs => prevTabs.filter(t => t !== tabToDelete));
      setItemsByTab(prevItems => {
        const newItems = {...prevItems};
        delete newItems[tabToDelete];
        return newItems;
      });
      if (activeTab === tabToDelete) setActiveTab(tabs[0] || '');
      setIsTabModalOpen(false);
      setEditingTab(null);
    }
  };
  
  const addToOrder = (item: { id: string; name: string; price: number; imageUrl: string }) => {
    const existingItem = currentOrder.find(orderItem => orderItem.id === item.id);
    if (existingItem) {
      setCurrentOrder(currentOrder.map(orderItem =>
        orderItem.id === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem
      ));
    } else {
      setCurrentOrder([...currentOrder, { ...item, quantity: 1, category: activeTab, stock: 100 }]);
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
  
  const handleCharge = () => {
    alert(`Charging ₹${total.toFixed(2)}.`);
    if (editingTicket) {
      setSavedTickets(savedTickets.filter(t => t.id !== editingTicket.id));
    }
    setCurrentOrder([]);
    setEditingTicket(null);
    setIsTicketVisible(false); // Go back to grid on mobile
  };
  
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    // FIX: Replaced .flat() with a more compatible .reduce() to flatten the array, avoiding potential TypeScript type inference issues.
    // FIX: Explicitly type the accumulator `acc` to resolve type inference error with the initial empty array value.
    const allItems: { id: string; name: string; price: number; imageUrl: string; }[] = Object.values(itemsByTab).reduce((acc: { id: string; name: string; price: number; imageUrl: string; }[], val) => acc.concat(val), []);
    return allItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [searchQuery, itemsByTab]);

  const itemsForGrid = useMemo(() => {
    const itemsToDisplay = searchQuery.trim() ? searchResults : (itemsByTab[activeTab] || []);
    const displayItems: ({ id: string; name: string; price: number; imageUrl: string; } | null)[] = new Array(GRID_SIZE).fill(null);
    for (let i = 0; i < Math.min(itemsToDisplay.length, GRID_SIZE); i++) {
      displayItems[i] = itemsToDisplay[i];
    }
    return displayItems;
  }, [activeTab, itemsByTab, searchQuery, searchResults]);

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
            tabs={tabs}
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
        handleCharge={handleCharge}
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
        tabs={tabs}
        onRename={handleRenameTab}
        onMove={handleMoveTab}
        onDelete={handleDeleteTab}
      />
    </div>
  );
};

export default SalesScreen;
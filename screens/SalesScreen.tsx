import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OrderItem, SavedTicket } from '../types';
import { useAppContext } from '../context/AppContext';
import { useLongPress } from '../hooks/useLongPress';
import SaveTicketModal from '../components/modals/SaveTicketModal';
import OpenTicketsModal from '../components/modals/OpenTicketsModal';
import TabManagementModal from '../components/modals/TabManagementModal';
import { MenuIcon, SearchIcon, CloseIcon, ThreeDotsIcon } from '../constants';


// --- Initial Data ---
const initialTabs = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Sides'];

const initialItems = {
  'Appetizers': [
    { id: 'a1', name: 'Spring Rolls', price: 5.99 },
    { id: 'a2', name: 'Garlic Bread', price: 4.50 },
    { id: 'a3', name: 'Bruschetta', price: 6.25 },
  ],
  'Main Courses': [
    { id: 'm1', name: 'Steak Frites', price: 24.99 },
    { id: 'm2', name: 'Veg Noodles', price: 8.00 },
    { id: 'm3', name: 'Shawarma Plate', price: 12.00 },
  ],
  'Desserts': [
    { id: 'd1', name: 'Cheesecake', price: 7.50 },
    { id: 'd2', name: 'Chocolate Lava Cake', price: 8.00 },
  ],
  'Beverages': [
    { id: 'b1', name: 'Coke', price: 2.50 },
    { id: 'b2', name: 'Iced Tea', price: 2.50 },
    { id: 'b3', name: 'Orange Juice', price: 3.00 },
  ],
  'Sides': [
    { id: 's1', name: 'French Fries', price: 3.50 },
    { id: 's2', name: 'Side Salad', price: 4.00 },
  ],
};

const GRID_SIZE = 20; // 5 columns * 4 rows

const SalesScreen: React.FC = () => {
  const { setHeaderTitle, openDrawer } = useAppContext();

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Item grid state
  const [tabs, setTabs] = useState<string[]>(initialTabs);
  const [itemsByTab, setItemsByTab] = useState<Record<string, {id: string, name: string, price: number}[]>>(initialItems);
  const [activeTab, setActiveTab] = useState('Appetizers');
  
  // Ticket management state
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [savedTickets, setSavedTickets] = useState<SavedTicket[]>([]);
  const [editingTicket, setEditingTicket] = useState<SavedTicket | null>(null);
  const [editingQuantityItemId, setEditingQuantityItemId] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>('');
  const [isTicketMenuOpen, setTicketMenuOpen] = useState(false);

  // Modal states
  const [isTabModalOpen, setIsTabModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isOpenTicketsModalOpen, setIsOpenTicketsModalOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<{ oldName: string; index: number } | null>(null);
  
  const ticketMenuRef = useRef<HTMLDivElement>(null);

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

  // Close ticket menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (ticketMenuRef.current && !ticketMenuRef.current.contains(event.target as Node)) {
            setTicketMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
  
  const addToOrder = (item: { id: string; name: string; price: number }) => {
    const existingItem = currentOrder.find(orderItem => orderItem.id === item.id);
    if (existingItem) {
      setCurrentOrder(currentOrder.map(orderItem =>
        orderItem.id === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem
      ));
    } else {
      setCurrentOrder([...currentOrder, { ...item, quantity: 1, category: activeTab, stock: 100, imageUrl: '' }]);
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
  
  const handleCharge = () => {
    alert(`Charging $${total.toFixed(2)}.`);
    if (editingTicket) {
      setSavedTickets(savedTickets.filter(t => t.id !== editingTicket.id));
    }
    setCurrentOrder([]);
    setEditingTicket(null);
  };

  const subtotal = useMemo(() => currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0), [currentOrder]);
  const tax = useMemo(() => subtotal * 0.085, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
        return [];
    }
    const allItems = Object.values(itemsByTab).flat();
    return allItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [searchQuery, itemsByTab]);

  const itemsForGrid = useMemo(() => {
    const itemsToDisplay = searchQuery.trim() ? searchResults : (itemsByTab[activeTab] || []);
    const displayItems = new Array(GRID_SIZE).fill(null);
    for (let i = 0; i < Math.min(itemsToDisplay.length, GRID_SIZE); i++) {
      displayItems[i] = itemsToDisplay[i];
    }
    return displayItems;
  }, [activeTab, itemsByTab, searchQuery, searchResults]);
  
  const TabButton = ({ tab }: { tab: string }) => {
    const longPressProps = useLongPress(
      () => openEditModal(tab),
      () => setActiveTab(tab)
    );
  
    return (
      <button
        {...longPressProps}
        className={`flex-shrink-0 whitespace-nowrap px-5 py-3 border-b-2 text-sm font-medium transition-colors duration-200 focus:outline-none ${
          activeTab === tab
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }`}
      >
        {tab}
      </button>
    );
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
          onClick={() => setIsOpenTicketsModalOpen(true)}
          className="w-full bg-amber-500 text-white font-bold py-4 rounded-lg transition-colors text-lg shadow-md hover:bg-amber-600"
        >
          Open Tickets ({savedTickets.length})
        </button>
      );
    }
    return (
      <button 
        disabled
        className="w-full bg-slate-300 text-white font-bold py-4 rounded-lg text-lg cursor-not-allowed shadow-none"
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
    <div className="flex flex-row h-full bg-slate-50 font-sans">
      {/* Main Content Area (Grid + Tab Bar) */}
      <div className="w-[70%] flex flex-col">
        <header className="bg-white shadow-sm w-full z-10 flex-shrink-0 h-16 flex items-center justify-between px-4">
          <AnimatePresence>
            {isSearching ? (
              <motion.div
                key="search-bar"
                initial={{ opacity: 0, width: '0%' }}
                animate={{ opacity: 1, width: '100%' }}
                exit={{ opacity: 0, width: '0%' }}
                transition={{ duration: 0.2 }}
                className="flex items-center w-full"
              >
                <input
                  type="text"
                  placeholder="Search all items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full px-2 bg-transparent focus:outline-none text-lg text-gray-800"
                  autoFocus
                />
                <button
                  onClick={() => { setIsSearching(false); setSearchQuery(''); }}
                  className="p-2 text-gray-500 hover:text-gray-800"
                  aria-label="Close search"
                >
                  <CloseIcon className="h-6 w-6" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="title-bar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between w-full"
              >
                <button onClick={openDrawer} className="p-2 text-gray-600 hover:text-gray-900">
                  <MenuIcon className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-semibold text-gray-800">
                  {isSearching ? 'Search' : 'Sales'}
                </h1>
                <button onClick={() => setIsSearching(true)} className="p-2 text-gray-600 hover:text-gray-900">
                  <SearchIcon className="h-5 w-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <main className="flex-grow grid grid-cols-5 grid-rows-4 gap-4">
              {itemsForGrid.map((item, index) =>
                item ? (
                  <div
                    key={item.id}
                    onClick={() => addToOrder(item)}
                    className="bg-white rounded-xl border border-slate-200 p-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-indigo-500"
                    role="button"
                    aria-label={`Add ${item.name} to order`}
                  >
                    <h3 className="font-semibold text-slate-800 text-base leading-tight">{item.name}</h3>
                    <p className="text-slate-500 text-sm mt-1">${item.price.toFixed(2)}</p>
                  </div>
                ) : (
                  <div
                    key={`placeholder-${index}`}
                    className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl"
                  >
                  </div>
                )
              )}
            </main>
            
            {searchQuery.trim().length > 0 ? (
              <div className="flex-shrink-0 pt-4 mt-4 text-center text-slate-500">
                Showing {searchResults.length} results for "{searchQuery}"
              </div>
            ) : (
              <nav className="flex-shrink-0 pt-4 mt-4">
                  <div className="border-b border-slate-200">
                      <div className="flex -mb-px overflow-x-auto">
                      {tabs.map(tab => (
                        <TabButton key={tab} tab={tab} />
                      ))}
                      <button
                          onClick={handleAddNewTab}
                          className="flex-shrink-0 whitespace-nowrap px-5 py-3 border-b-2 border-transparent text-slate-500 hover:text-indigo-600"
                          title="Add new tab"
                      >
                         [ + ]
                      </button>
                      </div>
                  </div>
              </nav>
            )}
        </div>
      </div>

      {/* Ticket Section */}
      <section className="w-[30%] bg-white border-l border-slate-200 flex flex-col">
        <header className="bg-white shadow-sm w-full z-10 flex-shrink-0 h-16 flex items-center justify-between px-4">
          <h1 className="text-xl font-semibold text-gray-800">{ticketHeaderTitle}</h1>
          <div className="relative" ref={ticketMenuRef}>
            <button onClick={() => setTicketMenuOpen(prev => !prev)} className="p-2 text-gray-600 hover:text-gray-900" aria-label="Ticket options">
              <ThreeDotsIcon className="h-5 w-5" />
            </button>
            <AnimatePresence>
                {isTicketMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20"
                    >
                        <div className="py-1">
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Clear Ticket</a>
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Print Bill</a>
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit Ticket</a>
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Assign Ticket</a>
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Split Ticket</a>
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Move Ticket</a>
                            <div className="border-t my-1"></div>
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Open Cash Drawer</a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {currentOrder.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h6" /><path d="M12 14v-4" /></svg>
              <p className="mt-4 font-medium text-slate-500">Your order is empty</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {currentOrder.map(item => (
                <li key={item.id} className="flex items-center text-sm">
                  <div className="flex-grow">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-slate-500">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 mx-4">
                    <button onClick={() => removeFromOrder(item.id)} className="h-7 w-7 bg-slate-200 text-lg rounded-full text-slate-600 hover:bg-red-200 hover:text-red-700 transition-colors" aria-label={`Remove one ${item.name}`}>-</button>
                    {editingQuantityItemId === item.id ? (
                        <input
                          type="tel"
                          value={tempQuantity}
                          onChange={handleQuantityInputChange}
                          onBlur={handleQuantityChangeCommit}
                          onKeyDown={handleQuantityInputKeyDown}
                          className="font-mono w-10 text-center text-base text-slate-900 bg-white border border-indigo-400 rounded-md ring-1 ring-indigo-400"
                          autoFocus
                          onFocus={(e) => e.target.select()}
                        />
                      ) : (
                        <span
                          onClick={() => handleQuantityClick(item)}
                          className="font-mono w-10 text-center text-base text-slate-900 cursor-pointer rounded-md hover:bg-slate-200 p-1"
                          aria-label="Edit quantity"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleQuantityClick(item)}}
                        >
                          {item.quantity}
                        </span>
                      )}
                    <button onClick={() => addToOrder(item)} className="h-7 w-7 bg-slate-200 text-lg rounded-full text-slate-600 hover:bg-green-200 hover:text-green-700 transition-colors" aria-label={`Add one ${item.name}`}>+</button>
                  </div>
                  <p className="w-16 font-semibold text-slate-800 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 border-t border-slate-200 bg-white mt-auto">
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (8.5%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-xl text-slate-800 pt-2 border-t mt-2 border-slate-200">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {renderActionButtons()}
            <button
              onClick={handleCharge}
              disabled={currentOrder.length === 0}
              className="w-full bg-emerald-500 text-white font-bold py-4 rounded-lg transition-colors text-lg shadow-md hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none flex justify-between items-center px-4"
            >
              <span>Charge</span>
              <span className="font-mono">${total.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </section>

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
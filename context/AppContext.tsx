
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { 
    Printer, Receipt, Item, AppSettings, BackupData, SavedTicket, 
    CustomGrid, PaymentType, OrderItem, AppContextType, Table 
} from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { exportItemsToCsv } from '../utils/csvHelper';
import { requestAppPermissions } from '../utils/permissions';
import { db, signOutUser, clearAllData, firebaseConfig, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, Timestamp, query, orderBy, limit, startAfter, getDocs, getDoc, QueryDocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import FirebaseError from '../components/FirebaseError';
import { APP_VERSION } from '../constants';

type Theme = 'light' | 'dark';

// Default configuration for new users
const DEFAULT_SETTINGS: AppSettings = { 
    taxEnabled: true, 
    taxRate: 5, 
    storeName: 'My Restaurant',
    storeAddress: '123 Food Street, Flavor Town',
    receiptFooter: 'Follow us @myrestaurant',
    reportsPIN: '', // Empty means no PIN protection
};

interface FirebaseErrorState {
  title: string;
  message: string;
  instructions: string[];
  projectId: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// LocalStorage Keys
const ITEMS_CACHE_KEY = 'pos_items_cache';
const SETTINGS_CACHE_KEY = 'pos_settings_cache';
const GRIDS_CACHE_KEY = 'pos_grids_cache'; 
const ONBOARDING_COMPLETED_KEY = 'pos_onboarding_completed_v1';
const ACTIVE_GRID_KEY = 'pos_active_grid_id';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  
  // ==========================================
  // SECTION: AUTH & INITIALIZATION
  // ==========================================
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<FirebaseErrorState | null>(null);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem(ONBOARDING_COMPLETED_KEY);
  });

  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    // If native, request permissions first
    if (Capacitor.isNativePlatform()) {
      const permissionsGranted = await requestAppPermissions();
      if (permissionsGranted) {
        localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
        setShowOnboarding(false);
        return true;
      }
      return false; 
    }
    // If web, just proceed
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setShowOnboarding(false);
    return true;
  }, []);

  // ==========================================
  // SECTION: UI STATE
  // ==========================================
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  const [isReportsUnlocked, setReportsUnlocked] = useState(false); // Session-based security
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
        const storedPrefs = localStorage.getItem('theme');
        if (storedPrefs) return storedPrefs as Theme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);

  // ==========================================
  // SECTION: DATA STATE (LOCAL & REMOTE)
  // ==========================================
  // We initialize state from localStorage where possible for instant boot ('Optimistic UI')
  const [settings, setSettingsState] = useState<AppSettings>(() => {
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
      // Merge with default to ensure new properties exist if cached data is old
      const parsed = cached ? JSON.parse(cached) : {};
      return { ...DEFAULT_SETTINGS, ...parsed };
  });
  
  const [items, setItemsState] = useState<Item[]>(() => {
      const cached = localStorage.getItem(ITEMS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
  });

  const [customGrids, setCustomGridsState] = useState<CustomGrid[]>(() => {
      const cached = localStorage.getItem(GRIDS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
  });

  const [printers, setPrintersState] = useState<Printer[]>([]);
  const [paymentTypes, setPaymentTypesState] = useState<PaymentType[]>([]);
  const [receipts, setReceiptsState] = useState<Receipt[]>([]);
  const [savedTickets, setSavedTicketsState] = useState<SavedTicket[]>([]);
  const [tables, setTablesState] = useState<Table[]>([]);
  
  // Status State
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  
  // Sales Screen Persistence
  const [activeGridId, setActiveGridIdState] = useState<string>(() => {
      return localStorage.getItem(ACTIVE_GRID_KEY) || 'All';
  });

  const setActiveGridId = useCallback((id: string) => {
      setActiveGridIdState(id);
      localStorage.setItem(ACTIVE_GRID_KEY, id);
  }, []);
  
  // Pagination State for Receipts
  const [lastReceiptDoc, setLastReceiptDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreReceipts, setHasMoreReceipts] = useState(true);

  const getUid = useCallback(() => {
    if (!user) throw new Error("User not authenticated");
    return user.uid;
  }, [user]);

  // ==========================================
  // SECTION: CART LOGIC
  // ==========================================
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);

  /**
   * Smart Add: If the last item added is the same, just increment qty.
   * Otherwise, append as a new line.
   */
  const addToOrder = useCallback((item: Item) => {
    setCurrentOrder(current => {
      const lastItem = current.length > 0 ? current[current.length - 1] : null;

      if (lastItem && lastItem.id === item.id) {
        const newOrder = [...current];
        newOrder[newOrder.length - 1] = { ...lastItem, quantity: lastItem.quantity + 1 };
        return newOrder;
      } else {
        const newLineItem: OrderItem = {
          ...item,
          quantity: 1,
          lineItemId: `L${Date.now()}-${Math.random()}`
        };
        return [...current, newLineItem];
      }
    });
  }, []);

  const removeFromOrder = useCallback((lineItemId: string) => {
    setCurrentOrder(current => {
      const itemIndex = current.findIndex(i => i.lineItemId === lineItemId);
      if (itemIndex === -1) return current;

      const itemToUpdate = current[itemIndex];
      if (itemToUpdate.quantity > 1) {
        const newOrder = [...current];
        newOrder[itemIndex] = { ...itemToUpdate, quantity: itemToUpdate.quantity - 1 };
        return newOrder;
      } else {
        return current.filter(i => i.lineItemId !== lineItemId);
      }
    });
  }, []);

  const deleteLineItem = useCallback((lineItemId: string) => {
    setCurrentOrder(prev => prev.filter(i => i.lineItemId !== lineItemId));
  }, []);

  const updateOrderItemQuantity = useCallback((lineItemId: string, newQuantity: number) => {
    if (isNaN(newQuantity) || newQuantity <= 0) {
      deleteLineItem(lineItemId);
    } else {
      setCurrentOrder(prev => prev.map(i => i.lineItemId === lineItemId ? { ...i, quantity: newQuantity } : i));
    }
  }, [deleteLineItem]);
  
  const clearOrder = useCallback(() => setCurrentOrder([]), []);
  
  const loadOrder = useCallback((items: OrderItem[]) => {
    // Regenerate line IDs to prevent conflicts if loaded multiple times
    const migratedItems = items.map(item => ({
      ...item,
      lineItemId: item.lineItemId || `L${Date.now()}-${Math.random()}`
    }));
    setCurrentOrder(migratedItems);
  }, []);

  // ==========================================
  // SECTION: FIREBASE SYNC LOGIC
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            const uid = currentUser.uid;

            // STRATEGY: Fetch static data (Settings, Items, Grids) ONLY ONCE on load to save reads.
            // Only Receipts need a real-time listener (for the latest transactions).
            const fetchAllDataOnce = async () => {
              try {
                // 1. Settings
                const settingsSnap = await getDoc(doc(db, 'users', uid, 'config', 'settings'));
                if (settingsSnap.exists()) {
                    const fetched = settingsSnap.data() as AppSettings;
                    // Merge with defaults to handle new fields
                    const merged = { ...DEFAULT_SETTINGS, ...fetched };
                    setSettingsState(merged);
                    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(merged));
                } else {
                    // Initialize default data for new user
                    await setDoc(doc(db, 'users', uid, 'config', 'settings'), DEFAULT_SETTINGS);
                    setSettingsState(DEFAULT_SETTINGS);
                    
                    const batch = writeBatch(db);
                    const ptCollection = collection(db, 'users', uid, 'payment_types');
                    batch.set(doc(ptCollection, 'cash'), { id: 'cash', name: 'Cash', icon: 'cash', type: 'cash', enabled: true });
                    batch.set(doc(ptCollection, 'upi'), { id: 'upi', name: 'UPI', icon: 'upi', type: 'other', enabled: true });
                    
                    const tablesCollection = collection(db, 'users', uid, 'tables');
                    ['Table 1', 'Table 2', 'Table 3', 'Takeout 1'].forEach((name, index) => {
                       const tableId = `T${index + 1}`;
                       batch.set(doc(tablesCollection, tableId), { id: tableId, name, order: index });
                    });
                    await batch.commit();
                }

                // 2. Parallel Fetch of Static Collections
                const [itemsSnap, printersSnap, paymentTypesSnap, tablesSnap, ticketsSnap, gridsSnap] = await Promise.all([
                    getDocs(collection(db, 'users', uid, 'items')),
                    getDocs(collection(db, 'users', uid, 'printers')),
                    getDocs(collection(db, 'users', uid, 'payment_types')),
                    getDocs(query(collection(db, 'users', uid, 'tables'), orderBy('order'))),
                    getDocs(collection(db, 'users', uid, 'saved_tickets')),
                    getDocs(query(collection(db, 'users', uid, 'custom_grids'), orderBy('order')))
                ]);

                // 3. Populate State & Cache
                const itemsData = itemsSnap.docs.map(doc => doc.data() as Item);
                setItemsState(itemsData);
                localStorage.setItem(ITEMS_CACHE_KEY, JSON.stringify(itemsData));

                const gridsData = gridsSnap.docs.map(doc => doc.data() as CustomGrid);
                setCustomGridsState(gridsData);
                localStorage.setItem(GRIDS_CACHE_KEY, JSON.stringify(gridsData));

                setPrintersState(printersSnap.docs.map(doc => doc.data() as Printer));
                setPaymentTypesState(paymentTypesSnap.docs.map(doc => doc.data() as PaymentType));
                setTablesState(tablesSnap.docs.map(doc => doc.data() as Table));
                setSavedTicketsState(ticketsSnap.docs.map(doc => doc.data() as SavedTicket));

              } catch (e) {
                  console.error("Error fetching initial data:", e);
              }
            };
            
            fetchAllDataOnce();

            // 4. Real-time Listener for Receipts (Limited to 100 for performance)
            // Added includeMetadataChanges to track pending writes (offline/syncing status)
            const qReceipts = query(collection(db, 'users', uid, 'receipts'), orderBy('date', 'desc'), limit(100));
            const unsubReceipts = onSnapshot(qReceipts, { includeMetadataChanges: true }, (snapshot) => {
                const receiptsData = snapshot.docs.map(doc => ({ ...doc.data(), date: (doc.data().date as Timestamp).toDate() } as Receipt));
                setReceiptsState(prev => {
                    // Merge new receipts with existing state safely
                    const combined = [...receiptsData, ...prev.filter(p => !receiptsData.some(n => n.id === p.id))];
                    return combined.sort((a,b) => b.date.getTime() - a.date.getTime());
                });
                
                // Track unsynced items
                const pendingCount = snapshot.docs.filter(doc => doc.metadata.hasPendingWrites).length;
                setPendingSyncCount(pendingCount);
                
                // Track pagination cursor
                if (snapshot.docs.length > 0) setLastReceiptDoc(snapshot.docs[snapshot.docs.length - 1]);
                if (snapshot.docs.length < 100) setHasMoreReceipts(false); else setHasMoreReceipts(true);
            });
            
            setIsLoading(false);
            return () => { unsubReceipts(); };

        } else {
            // Cleanup on Logout
            setUser(null);
            setItemsState([]); setReceiptsState([]); setPrintersState([]); setPaymentTypesState([]); 
            setSavedTicketsState([]); setCustomGridsState([]); setTablesState([]);
            setSettingsState(DEFAULT_SETTINGS);
            setCurrentOrder([]);
            setIsLoading(false);
            setPendingSyncCount(0);
            localStorage.removeItem(ITEMS_CACHE_KEY);
            localStorage.removeItem(SETTINGS_CACHE_KEY);
            localStorage.removeItem(GRIDS_CACHE_KEY);
            localStorage.removeItem(ACTIVE_GRID_KEY);
        }
    }, (error) => {
        console.error("Firebase Auth error:", error);
        setInitializationError({ title: 'Connection Failed', message: error.message || 'Could not connect. Working offline.', instructions: ['Check internet connection.'], projectId: firebaseConfig.projectId });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ==========================================
  // SECTION: CRUD OPERATIONS
  // ==========================================

  // --- RECEIPTS ---
  const loadMoreReceipts = useCallback(async () => {
      if (!lastReceiptDoc || !user) return;
      try {
          const qNext = query(collection(db, 'users', user.uid, 'receipts'), orderBy('date', 'desc'), startAfter(lastReceiptDoc), limit(50));
          const snapshot = await getDocs(qNext);
          if (!snapshot.empty) {
              const newReceipts = snapshot.docs.map(doc => ({ ...doc.data(), date: (doc.data().date as Timestamp).toDate() } as Receipt));
              setReceiptsState(prev => [...prev, ...newReceipts]);
              setLastReceiptDoc(snapshot.docs[snapshot.docs.length - 1]);
          } else {
              setHasMoreReceipts(false);
          }
      } catch (e) { console.error("Error loading more receipts", e); }
  }, [lastReceiptDoc, user]);
  
  const addReceipt = useCallback(async (receipt: Receipt) => {
    // Optimistic Update: Update UI immediately
    setReceiptsState(prev => [receipt, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()).slice(0, 100));
    try { 
        await setDoc(doc(db, 'users', getUid(), 'receipts', receipt.id), receipt);
    } 
    catch (e) { console.error("Failed to save receipt", e); alert("Saved locally. Sync failed (Offline).");}
  }, [getUid]);

  const deleteReceipt = useCallback(async (id: string) => {
    setReceiptsState(prev => prev.filter(r => r.id !== id));
    try {
        await deleteDoc(doc(db, 'users', getUid(), 'receipts', id));
    } catch (e) {
        console.error("Failed to delete receipt", e);
        alert("Failed to delete receipt from server. It may reappear on refresh.");
    }
  }, [getUid]);

  // --- SETTINGS ---
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated);
    try { await setDoc(doc(db, 'users', getUid(), 'config', 'settings'), updated, { merge: true }); } 
    catch (e) { console.error(e); }
  }, [settings, getUid]);

  // --- HARDWARE & CONFIG ---
  const addPrinter = useCallback(async (printer: Printer) => {
    setPrintersState(prev => [...prev, printer]);
    try { await setDoc(doc(db, 'users', getUid(), 'printers', printer.id), printer); } 
    catch (e) { alert("Failed to save printer."); }
  }, [getUid]);

  const removePrinter = useCallback(async (printerId: string) => {
    setPrintersState(prev => prev.filter(p => p.id !== printerId));
    try { await deleteDoc(doc(db, 'users', getUid(), 'printers', printerId)); } 
    catch (e) { alert("Failed to delete printer."); }
  }, [getUid]);

  const addPaymentType = useCallback(async (paymentType: Omit<PaymentType, 'id' | 'enabled' | 'type'>) => {
      const id = `pt_${Date.now()}`;
      const newPaymentType: PaymentType = { ...paymentType, id, enabled: true, type: 'other' };
      setPaymentTypesState(prev => [...prev, newPaymentType]);
      try { await setDoc(doc(db, 'users', getUid(), 'payment_types', id), newPaymentType); } 
      catch (e) { console.error(e); alert("Failed to add payment type."); }
  }, [getUid]);

  const updatePaymentType = useCallback(async (paymentType: PaymentType) => {
      setPaymentTypesState(prev => prev.map(pt => pt.id === paymentType.id ? paymentType : pt));
      try { await setDoc(doc(db, 'users', getUid(), 'payment_types', paymentType.id), paymentType); } 
      catch (e) { console.error(e); alert("Failed to update payment type."); }
  }, [getUid]);

  const removePaymentType = useCallback(async (paymentTypeId: string) => {
      if (paymentTypeId === 'cash') {
          alert("The 'Cash' payment type is essential and cannot be removed.");
          return;
      }
      setPaymentTypesState(prev => prev.filter(pt => pt.id !== paymentTypeId));
      try { await deleteDoc(doc(db, 'users', getUid(), 'payment_types', paymentTypeId)); } 
      catch (e) { console.error(e); alert("Failed to delete payment type."); }
  }, [getUid]);

  // --- ITEMS ---
  const addItem = useCallback(async (item: Item) => {
    setItemsState(prev => [...prev, item]);
    try { await setDoc(doc(db, 'users', getUid(), 'items', item.id), item); } 
    catch (e) { console.error(e); alert("Failed to add item."); }
  }, [getUid]);

  const updateItem = useCallback(async (updatedItem: Item) => {
    setItemsState(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
    try { await setDoc(doc(db, 'users', getUid(), 'items', updatedItem.id), updatedItem); } 
    catch (e) { console.error(e); alert("Failed to update item."); }
  }, [getUid]);

  /**
   * Deleting an item is complex because we must also remove it from any Custom Grids
   * where it might be placed. We use a Batch Write for atomicity.
   */
  const deleteItem = useCallback(async (id: string) => {
    const uid = getUid();
    // 1. Optimistic UI updates
    setItemsState(prev => prev.filter(i => i.id !== id));
    setCustomGridsState(prev => prev.map(grid => ({
      ...grid,
      itemIds: Array.isArray(grid.itemIds) ? grid.itemIds.map(itemId => itemId === id ? null : itemId) : []
    })));

    // 2. Database Batch Operation
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', uid, 'items', id));
    
    const gridsToUpdate = customGrids.filter(grid => Array.isArray(grid.itemIds) && grid.itemIds.includes(id));
    gridsToUpdate.forEach(grid => {
      const newItemIds = grid.itemIds.map(itemId => (itemId === id ? null : itemId));
      const gridRef = doc(db, 'users', uid, 'custom_grids', grid.id);
      batch.update(gridRef, { itemIds: newItemIds });
    });

    try {
      await batch.commit();
    } catch (e) {
      console.error("Failed to delete item and clean up grids:", e);
      alert("Failed to delete item and sync grid changes. Please check your connection.");
    }
  }, [getUid, customGrids]);

  // --- TICKETS ---
  const saveTicket = useCallback(async (ticket: SavedTicket) => {
      const ticketWithTimestamp = { ...ticket, lastModified: Date.now() };
      setSavedTicketsState(prev => [...prev.filter(t => t.id !== ticket.id), ticketWithTimestamp]);
      try { await setDoc(doc(db, 'users', getUid(), 'saved_tickets', ticket.id), ticketWithTimestamp); } 
      catch (e) { console.error(e); alert("Failed to save ticket."); }
  }, [getUid]);

  const removeTicket = useCallback(async (ticketId: string) => {
      setSavedTicketsState(prev => prev.filter(t => t.id !== ticketId));
      try { await deleteDoc(doc(db, 'users', getUid(), 'saved_tickets', ticketId)); } 
      catch (e) { console.error(e); alert("Failed to delete ticket."); }
  }, [getUid]);
  
  const mergeTickets = useCallback(async (ticketIds: string[], newName: string) => {
    if (ticketIds.length < 2) return;
    const uid = getUid();

    // Logic: Combine items from all tickets, create a new one, delete old ones.
    const ticketsToMerge = savedTickets.filter(t => ticketIds.includes(t.id));
    if (ticketsToMerge.length === 0) return;

    const mergedItems: OrderItem[] = [];
    ticketsToMerge.forEach(ticket => {
        ticket.items.forEach(item => {
            // Important: New unique lineItemId to avoid React key conflicts
            mergedItems.push({ 
                ...item, 
                lineItemId: `L${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
            });
        });
    });

    const newTicketId = `T${Date.now()}`;
    const newTicket: SavedTicket = {
        id: newTicketId,
        name: newName,
        items: mergedItems,
        lastModified: Date.now()
    };

    setSavedTicketsState(prev => [...prev.filter(t => !ticketIds.includes(t.id)), newTicket]);

    try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', uid, 'saved_tickets', newTicketId), newTicket);
        ticketIds.forEach(id => {
            batch.delete(doc(db, 'users', uid, 'saved_tickets', id));
        });
        await batch.commit();
    } catch (e) {
        console.error("Merge failed:", e);
        alert("Failed to merge tickets on server.");
    }
  }, [savedTickets, getUid]);

  // --- CUSTOM GRIDS & TABLES ---
  const addCustomGrid = useCallback(async (grid: CustomGrid) => {
      const newGridWithOrder = { ...grid, order: customGrids.length };
      setCustomGridsState(prev => [...prev, newGridWithOrder]);
      try { await setDoc(doc(db, 'users', getUid(), 'custom_grids', grid.id), newGridWithOrder); } 
      catch (e) { console.error(e); alert("Failed to add custom grid."); }
  }, [getUid, customGrids.length]);

  const updateCustomGrid = useCallback(async (grid: CustomGrid) => {
      setCustomGridsState(prev => prev.map(g => g.id === grid.id ? grid : g));
      try { await setDoc(doc(db, 'users', getUid(), 'custom_grids', grid.id), grid); } 
      catch (e) { console.error(e); alert("Failed to update custom grid."); }
  }, [getUid]);

  const deleteCustomGrid = useCallback(async (id: string) => {
      setCustomGridsState(prev => prev.filter(g => g.id !== id));
      if (activeGridId === id) setActiveGridId('All');
      try { await deleteDoc(doc(db, 'users', getUid(), 'custom_grids', id)); } 
      catch (e) { console.error(e); alert("Failed to delete custom grid."); }
  }, [getUid, activeGridId, setActiveGridId]);

  const setCustomGrids = useCallback(async (newGrids: CustomGrid[]) => {
      const newGridsWithOrder = newGrids.map((g, i) => ({ ...g, order: i }));
      setCustomGridsState(newGridsWithOrder); 
      
      const batch = writeBatch(db);
      const gridsRef = collection(db, 'users', getUid(), 'custom_grids');
      const oldGridsMap = new Map(customGrids.map(g => [g.id, g]));

      // Delete removed grids
      for (const oldGrid of customGrids) {
          if (!newGrids.some(g => g.id === oldGrid.id)) {
              batch.delete(doc(gridsRef, oldGrid.id));
          }
      }
      
      // Update/Add remaining grids
      for (const newGrid of newGridsWithOrder) {
          const existingGrid = oldGridsMap.get(newGrid.id) as CustomGrid | undefined;
          if (!existingGrid || existingGrid.name !== newGrid.name || existingGrid.order !== newGrid.order) {
              batch.set(doc(gridsRef, newGrid.id), newGrid, { merge: true });
          }
      }

      try { await batch.commit(); } 
      catch (e) { console.error(e); alert("Failed to save grid changes."); }
  }, [customGrids, getUid]);
  
  const addTable = useCallback(async (name: string) => {
    const newTable: Table = { id: `tbl_${Date.now()}`, name, order: tables.length };
    setTablesState(prev => [...prev, newTable].sort((a,b) => a.order - b.order));
    try { await setDoc(doc(db, 'users', getUid(), 'tables', newTable.id), newTable); }
    catch(e) { console.error(e); alert("Failed to add table."); }
  }, [getUid, tables.length]);

  const updateTable = useCallback(async (table: Table) => {
    setTablesState(prev => prev.map(t => t.id === table.id ? table : t));
    try { await setDoc(doc(db, 'users', getUid(), 'tables', table.id), table); }
    catch(e) { console.error(e); alert("Failed to update table."); }
  }, [getUid]);

  const removeTable = useCallback(async (tableId: string) => {
    setTablesState(prev => prev.filter(t => t.id !== tableId));
    try { await deleteDoc(doc(db, 'users', getUid(), 'tables', tableId)); }
    catch(e) { console.error(e); alert("Failed to remove table."); }
  }, [getUid]);
  
  const setTables = useCallback(async (newTables: Table[]) => {
    const newTablesWithOrder = newTables.map((t, i) => ({ ...t, order: i }));
    setTablesState(newTablesWithOrder);
    
    const batch = writeBatch(db);
    const tablesRef = collection(db, 'users', getUid(), 'tables');
    
    tables.forEach(oldTable => {
        if (!newTables.find(newTable => newTable.id === oldTable.id)) {
            batch.delete(doc(tablesRef, oldTable.id));
        }
    });

    newTablesWithOrder.forEach((table) => {
        batch.set(doc(tablesRef, table.id), table, { merge: true });
    });

    try { await batch.commit(); } 
    catch(e) { console.error(e); alert("Failed to save table changes."); }
  }, [getUid, tables]);


  // ==========================================
  // SECTION: IMPORT / EXPORT UTILITIES
  // ==========================================
  const replaceItems = useCallback(async (newItems: Item[]) => {
    setIsLoading(true);
    setItemsState(newItems);
    const batch = writeBatch(db);
    const itemsRef = collection(db, 'users', getUid(), 'items');
    try {
      // Note: This is a destructive operation (delete all, then add all)
      const snapshot = await getDocs(itemsRef);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      newItems.forEach(item => batch.set(doc(itemsRef), item));
      await batch.commit();
    } catch (e) { alert("Failed to import items. Data unchanged."); } 
    finally { setIsLoading(false); }
  }, [getUid]);

  const exportItemsCsv = useCallback(() => {
    try {
      const csvString = exportItemsToCsv(items);
      const fileName = `pos_items_${Date.now()}.csv`;
      if (Capacitor.isNativePlatform()) {
        Filesystem.writeFile({ path: fileName, data: csvString, directory: Directory.Documents, encoding: Encoding.UTF8 })
            .then(result => Share.share({ url: result.uri }))
            .catch(error => alert(`Export Failed: ${error.message}`));
      } else {
        const a = document.createElement('a');
        a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csvString);
        a.download = fileName;
        a.click();
        a.remove();
      }
    } catch (e) { alert("Error generating CSV."); }
  }, [items]);
  
  const exportData = useCallback(async () => {
    const backup: BackupData = {
        version: APP_VERSION, timestamp: new Date().toISOString(),
        settings, items, printers, paymentTypes, receipts, savedTickets, customGrids, tables
    };
    const jsonString = JSON.stringify(backup, null, 2);
    const fileName = `pos_backup_${Date.now()}.json`;
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({ path: fileName, data: jsonString, directory: Directory.Documents, encoding: Encoding.UTF8 });
        await Share.share({ url: result.uri });
      } catch (error: any) { alert(`Export Failed: ${error.message}`); }
    } else {
      const a = document.createElement('a');
      a.href = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
      a.download = fileName;
      a.click();
      a.remove();
    }
  }, [settings, items, printers, paymentTypes, receipts, savedTickets, customGrids, tables]);

  const restoreData = useCallback(async (data: BackupData) => {
      setIsLoading(true);
      const uid = getUid();
      try {
          await clearAllData(uid);
          
          // Helper: Collect all operations into a single array
          const operations: { ref: any; data: any }[] = [];
          
          operations.push({ ref: doc(db, 'users', uid, 'config', 'settings'), data: data.settings });
          (data.items || []).forEach(item => operations.push({ ref: doc(db, 'users', uid, 'items', item.id), data: item }));
          (data.printers || []).forEach(p => operations.push({ ref: doc(db, 'users', uid, 'printers', p.id), data: p }));
          (data.paymentTypes || []).forEach(pt => operations.push({ ref: doc(db, 'users', uid, 'payment_types', pt.id), data: pt }));
          (data.receipts || []).forEach(r => operations.push({ ref: doc(db, 'users', uid, 'receipts', r.id), data: {...r, date: new Date(r.date)} }));
          (data.savedTickets || []).forEach(t => operations.push({ ref: doc(db, 'users', uid, 'saved_tickets', t.id), data: t }));
          (data.customGrids || []).forEach(g => operations.push({ ref: doc(db, 'users', uid, 'custom_grids', g.id), data: g }));
          (data.tables || []).forEach(t => operations.push({ ref: doc(db, 'users', uid, 'tables', t.id), data: t }));

          // Commit in chunks of 500 (Firestore Batch Limit)
          const chunkSize = 500;
          for (let i = 0; i < operations.length; i += chunkSize) {
              const batch = writeBatch(db);
              const chunk = operations.slice(i, i + chunkSize);
              chunk.forEach(op => batch.set(op.ref, op.data));
              await batch.commit();
          }

      } catch(e) { console.error(e); alert("Restore failed."); } finally { setIsLoading(false); }
  }, [getUid]);

  if (initializationError) return <FirebaseError error={initializationError} />;

  const contextValue: AppContextType = {
      user, signOut: signOutUser,
      isDrawerOpen, openDrawer, closeDrawer, toggleDrawer, 
      headerTitle, setHeaderTitle,
      theme, setTheme,
      showOnboarding, completeOnboarding,
      isLoading,
      settings, updateSettings,
      printers, addPrinter, removePrinter,
      paymentTypes, addPaymentType, updatePaymentType, removePaymentType,
      receipts, addReceipt, loadMoreReceipts, hasMoreReceipts, deleteReceipt,
      items, addItem, updateItem, deleteItem,
      savedTickets, saveTicket, removeTicket, mergeTickets,
      customGrids, addCustomGrid, updateCustomGrid, deleteCustomGrid, setCustomGrids,
      tables, addTable, updateTable, setTables, removeTable,
      activeGridId, setActiveGridId,
      currentOrder, addToOrder, removeFromOrder, deleteLineItem, updateOrderItemQuantity, clearOrder, loadOrder,
      exportData, restoreData, exportItemsCsv, replaceItems,
      isReportsUnlocked, setReportsUnlocked,
      pendingSyncCount,
      isOnline
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
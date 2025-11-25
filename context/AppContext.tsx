import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';
import { 
    Printer, Receipt, Item, AppSettings, BackupData, SavedTicket, 
    CustomGrid, PaymentType, OrderItem, AppContextType, Table 
} from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { exportItemsToCsv } from '../utils/csvHelper';
import { db, signOutUser, clearAllData, firebaseConfig, auth, enableNetwork, disableNetwork } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, Timestamp, query, orderBy, limit, startAfter, getDocs, getDoc, QueryDocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import FirebaseError from '../components/FirebaseError';
import { APP_VERSION } from '../constants';

type Theme = 'light' | 'dark';

const DEFAULT_SETTINGS: AppSettings = { 
    taxEnabled: true, 
    taxRate: 5, 
    storeName: 'My Restaurant',
    storeAddress: '123 Food Street, Flavor Town',
    receiptFooter: 'Follow us @myrestaurant'
};

interface FirebaseErrorState {
  title: string;
  message: string;
  instructions: string[];
  projectId: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ITEMS_CACHE_KEY = 'pos_items_cache';
const SETTINGS_CACHE_KEY = 'pos_settings_cache';
const ONBOARDING_COMPLETED_KEY = 'pos_onboarding_completed_v1';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<FirebaseErrorState | null>(null);
  
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem(ONBOARDING_COMPLETED_KEY);
  });

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setShowOnboarding(false);
  }, []);

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
        const storedPrefs = localStorage.getItem('theme');
        if (storedPrefs) {
            return storedPrefs as Theme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // --- State ---
  const [settings, setSettingsState] = useState<AppSettings>(() => {
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
      return cached ? JSON.parse(cached) : DEFAULT_SETTINGS;
  });
  
  const [items, setItemsState] = useState<Item[]>(() => {
      const cached = localStorage.getItem(ITEMS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
  });

  const [printers, setPrintersState] = useState<Printer[]>([]);
  const [paymentTypes, setPaymentTypesState] = useState<PaymentType[]>([]);
  const [receipts, setReceiptsState] = useState<Receipt[]>([]);
  const [savedTickets, setSavedTicketsState] = useState<SavedTicket[]>([]);
  const [customGrids, setCustomGridsState] = useState<CustomGrid[]>([]);
  const [tables, setTablesState] = useState<Table[]>([]);
  
  // --- Global Ticket State ---
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  
  const [lastReceiptDoc, setLastReceiptDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreReceipts, setHasMoreReceipts] = useState(true);

  const manualSync = useCallback(async () => {
    console.log("Attempting manual sync...");
    try {
        await disableNetwork(db);
        await enableNetwork(db);
        alert("Data sync initiated.");
    } catch (e) {
        console.error("Manual sync failed:", e);
        alert("Failed to force sync. Check your connection.");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            const uid = currentUser.uid;

            // --- OPTIMIZATION: Fetch-once for configuration data ---
            const fetchInitialConfig = async () => {
              try {
                // Settings
                const settingsSnap = await getDoc(doc(db, 'users', uid, 'config', 'settings'));
                if (settingsSnap.exists()) {
                    const newSettings = settingsSnap.data() as AppSettings;
                    setSettingsState(newSettings);
                    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(newSettings));
                } else {
                    // Initialize default settings and payment types for new users
                    await setDoc(doc(db, 'users', uid, 'config', 'settings'), DEFAULT_SETTINGS);
                    setSettingsState(DEFAULT_SETTINGS);
                    
                    const batch = writeBatch(db);
                    const ptCollection = collection(db, 'users', uid, 'payment_types');
                    batch.set(doc(ptCollection, 'cash'), { id: 'cash', name: 'Cash', icon: 'cash', type: 'cash', enabled: true });
                    batch.set(doc(ptCollection, 'upi'), { id: 'upi', name: 'UPI', icon: 'upi', type: 'other', enabled: true });
                    
                    const tablesCollection = collection(db, 'users', uid, 'tables');
                    const defaultTables = ['Table 1', 'Table 2', 'Table 3', 'Takeout 1', 'Delivery'];
                    defaultTables.forEach((name, index) => {
                       const tableId = `T${index + 1}`;
                       batch.set(doc(tablesCollection, tableId), { id: tableId, name, order: index });
                    });

                    await batch.commit();
                }

                // Other configs
                const printersSnap = await getDocs(collection(db, 'users', uid, 'printers'));
                setPrintersState(printersSnap.docs.map(doc => doc.data() as Printer));
                
                const paymentTypesSnap = await getDocs(collection(db, 'users', uid, 'payment_types'));
                setPaymentTypesState(paymentTypesSnap.docs.map(doc => doc.data() as PaymentType));

                const tablesQuery = query(collection(db, 'users', uid, 'tables'), orderBy('order'));
                const tablesSnap = await getDocs(tablesQuery);
                setTablesState(tablesSnap.docs.map(doc => doc.data() as Table));

              } catch (e) {
                  console.error("Error fetching initial configuration:", e);
              }
            };
            
            fetchInitialConfig();

            // --- REAL-TIME LISTENERS for dynamic data ---
            const unsubItems = onSnapshot(collection(db, 'users', uid, 'items'), (snapshot) => {
                  const itemsData = snapshot.docs.map(doc => ({ ...doc.data() } as Item));
                  setItemsState(itemsData);
                  localStorage.setItem(ITEMS_CACHE_KEY, JSON.stringify(itemsData));
            });

            const qReceipts = query(collection(db, 'users', uid, 'receipts'), orderBy('date', 'desc'), limit(25));
            const unsubReceipts = onSnapshot(qReceipts, (snapshot) => {
                const receiptsData = snapshot.docs.map(doc => ({ ...doc.data(), date: (doc.data().date as Timestamp).toDate() } as Receipt));
                setReceiptsState(prev => {
                    const combined = [...receiptsData, ...prev.filter(p => !receiptsData.some(n => n.id === p.id))];
                    return combined.sort((a,b) => b.date.getTime() - a.date.getTime());
                });
                if (snapshot.docs.length > 0) setLastReceiptDoc(snapshot.docs[snapshot.docs.length - 1]);
            });

            const unsubTickets = onSnapshot(collection(db, 'users', uid, 'saved_tickets'), (snapshot) => setSavedTicketsState(snapshot.docs.map(doc => doc.data() as SavedTicket)));
            const unsubGrids = onSnapshot(query(collection(db, 'users', uid, 'custom_grids'), orderBy('order')), (snapshot) => setCustomGridsState(snapshot.docs.map(doc => doc.data() as CustomGrid)));
            
            setIsLoading(false);
            return () => { unsubItems(); unsubReceipts(); unsubTickets(); unsubGrids(); };

        } else {
            setUser(null);
            setItemsState([]); setReceiptsState([]); setPrintersState([]); setPaymentTypesState([]); setSavedTicketsState([]); setCustomGridsState([]); setTablesState([]);
            setSettingsState(DEFAULT_SETTINGS);
            setCurrentOrder([]);
            setIsLoading(false);
            localStorage.removeItem(ITEMS_CACHE_KEY);
            localStorage.removeItem(SETTINGS_CACHE_KEY);
        }
    }, (error) => {
        console.error("Firebase Auth error:", error);
        setInitializationError({ title: 'Connection Failed', message: error.message || 'Could not connect. Working offline.', instructions: ['Check internet connection.'], projectId: firebaseConfig.projectId });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getUid = useCallback(() => {
    if (!user) throw new Error("User not authenticated");
    return user.uid;
  }, [user]);

  // --- START: Ticket Management Functions ---
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
    const migratedItems = items.map(item => ({
      ...item,
      lineItemId: item.lineItemId || `L${Date.now()}-${Math.random()}`
    }));
    setCurrentOrder(migratedItems);
  }, []);
  // --- END: Ticket Management Functions ---


  const loadMoreReceipts = useCallback(async () => {
      if (!lastReceiptDoc || !user) return;
      try {
          const qNext = query(collection(db, 'users', user.uid, 'receipts'), orderBy('date', 'desc'), startAfter(lastReceiptDoc), limit(25));
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
    setReceiptsState(prev => [receipt, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
    try { await setDoc(doc(db, 'users', getUid(), 'receipts', receipt.id), receipt); } 
    catch (e) { console.error("Failed to save receipt", e); alert("Saved locally. Sync failed (Offline).");}
  }, [getUid]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated);
    try { await setDoc(doc(db, 'users', getUid(), 'config', 'settings'), updated, { merge: true }); } 
    catch (e) { console.error(e); }
  }, [settings, getUid]);

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

  const addItem = useCallback(async (item: Item) => {
    try { await setDoc(doc(db, 'users', getUid(), 'items', item.id), item); } 
    catch (e) { console.error(e); alert("Failed to add item."); }
  }, [getUid]);

  const updateItem = useCallback(async (updatedItem: Item) => {
    try { await setDoc(doc(db, 'users', getUid(), 'items', updatedItem.id), updatedItem); } 
    catch (e) { console.error(e); alert("Failed to update item."); }
  }, [getUid]);

  const deleteItem = useCallback(async (id: string) => {
    const uid = getUid();
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
      alert("Failed to delete item.");
    }
  }, [getUid, customGrids]);

  const saveTicket = useCallback(async (ticket: SavedTicket) => {
      try { await setDoc(doc(db, 'users', getUid(), 'saved_tickets', ticket.id), ticket); } 
      catch (e) { console.error(e); alert("Failed to save ticket."); }
  }, [getUid]);

  const removeTicket = useCallback(async (ticketId: string) => {
      try { await deleteDoc(doc(db, 'users', getUid(), 'saved_tickets', ticketId)); } 
      catch (e) { console.error(e); alert("Failed to delete ticket."); }
  }, [getUid]);

  const addCustomGrid = useCallback(async (grid: CustomGrid) => {
      try { await setDoc(doc(db, 'users', getUid(), 'custom_grids', grid.id), { ...grid, order: customGrids.length }); } 
      catch (e) { console.error(e); alert("Failed to add custom grid."); }
  }, [getUid, customGrids.length]);

  const updateCustomGrid = useCallback(async (grid: CustomGrid) => {
      try { await setDoc(doc(db, 'users', getUid(), 'custom_grids', grid.id), grid); } 
      catch (e) { console.error(e); alert("Failed to update custom grid."); }
  }, [getUid]);

  const deleteCustomGrid = useCallback(async (id: string) => {
      try { await deleteDoc(doc(db, 'users', getUid(), 'custom_grids', id)); } 
      catch (e) { console.error(e); alert("Failed to delete custom grid."); }
  }, [getUid]);

  const setCustomGrids = useCallback(async (newGrids: CustomGrid[]) => {
      const batch = writeBatch(db);
      const gridsRef = collection(db, 'users', getUid(), 'custom_grids');
      const oldGridsMap = new Map(customGrids.map(g => [g.id, g]));
      const newGridsMap = new Map(newGrids.map(g => [g.id, g]));
      for (const oldGrid of customGrids) {
          if (!newGridsMap.has(oldGrid.id)) batch.delete(doc(gridsRef, oldGrid.id));
      }
      for (const [index, newGrid] of newGrids.entries()) {
          const existingGrid = oldGridsMap.get(newGrid.id) as CustomGrid | undefined;
          const newGridWithOrder = { ...newGrid, order: index };
          if (!existingGrid || existingGrid.name !== newGridWithOrder.name || existingGrid.order !== newGridWithOrder.order) {
              batch.set(doc(gridsRef, newGrid.id), newGridWithOrder);
          }
      }
      try {
          await batch.commit();
      } catch (e) { console.error("Failed to save grid changes to DB:", e); alert("Failed to save grid changes."); }
  }, [customGrids, getUid]);
  
  // Table Management
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
    const batch = writeBatch(db);
    const tablesRef = collection(db, 'users', getUid(), 'tables');
    const oldTablesMap = new Map(tables.map(t => [t.id, t]));
    newTables.forEach((table, index) => {
        const newTableWithOrder = { ...table, order: index };
        const oldTable = oldTablesMap.get(table.id) as Table | undefined;
        if (!oldTable || oldTable.name !== newTableWithOrder.name || oldTable.order !== newTableWithOrder.order) {
            batch.set(doc(tablesRef, table.id), newTableWithOrder);
        }
    });
    tables.forEach(oldTable => {
        if (!newTables.find(newTable => newTable.id === oldTable.id)) {
            batch.delete(doc(tablesRef, oldTable.id));
        }
    });
    setTablesState(newTables.map((t, i) => ({ ...t, order: i })));
    try { await batch.commit(); } 
    catch(e) { console.error(e); alert("Failed to save table changes."); }
  }, [getUid, tables]);


  const replaceItems = useCallback(async (newItems: Item[]) => {
    setIsLoading(true);
    const batch = writeBatch(db);
    const itemsRef = collection(db, 'users', getUid(), 'items');
    try {
      items.forEach(item => batch.delete(doc(itemsRef, item.id)));
      newItems.forEach(item => batch.set(doc(itemsRef, item.id), item));
      await batch.commit();
    } catch (e) { alert("Failed to import items. Data unchanged."); } 
    finally { setIsLoading(false); }
  }, [items, getUid]);

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
          const batch = writeBatch(db);
          batch.set(doc(db, 'users', uid, 'config', 'settings'), data.settings);
          (data.items || []).forEach(item => batch.set(doc(db, 'users', uid, 'items', item.id), item));
          (data.printers || []).forEach(p => batch.set(doc(db, 'users', uid, 'printers', p.id), p));
          (data.paymentTypes || []).forEach(pt => batch.set(doc(db, 'users', uid, 'payment_types', pt.id), pt));
          (data.receipts || []).forEach(r => batch.set(doc(db, 'users', uid, 'receipts', r.id), {...r, date: new Date(r.date)}));
          (data.savedTickets || []).forEach(t => batch.set(doc(db, 'users', uid, 'saved_tickets', t.id), t));
          (data.customGrids || []).forEach(g => batch.set(doc(db, 'users', uid, 'custom_grids', g.id), g));
          (data.tables || []).forEach(t => batch.set(doc(db, 'users', uid, 'tables', t.id), t));
          await batch.commit();
      } catch(e) { console.error(e); alert("Restore failed."); } finally { setIsLoading(false); }
  }, [getUid]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);
  
  if (initializationError) return <FirebaseError error={initializationError} />;

  const contextValue: AppContextType = {
      user, signOut: signOutUser,
      isDrawerOpen, openDrawer, closeDrawer, toggleDrawer, 
      headerTitle, setHeaderTitle,
      theme, setTheme,
      showOnboarding, completeOnboarding,
      isLoading, manualSync,
      settings, updateSettings,
      printers, addPrinter, removePrinter,
      paymentTypes, addPaymentType, updatePaymentType, removePaymentType,
      receipts, addReceipt, loadMoreReceipts, hasMoreReceipts,
      items, addItem, updateItem, deleteItem,
      savedTickets, saveTicket, removeTicket,
      customGrids, addCustomGrid, updateCustomGrid, deleteCustomGrid, setCustomGrids,
      tables, addTable, updateTable, setTables, removeTable,
      currentOrder, addToOrder, removeFromOrder, deleteLineItem, updateOrderItemQuantity, clearOrder, loadOrder,
      exportData, restoreData, exportItemsCsv, replaceItems
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
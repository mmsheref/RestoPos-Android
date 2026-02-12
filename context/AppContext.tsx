
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { 
    Printer, Receipt, Item, AppSettings, BackupData, SavedTicket, 
    CustomGrid, PaymentType, OrderItem, AppContextType, Table, Theme
} from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { exportItemsToCsv } from '../utils/csvHelper';
import { requestAppPermissions } from '../utils/permissions';
import { requestNotificationPermission, scheduleDailySummary, cancelDailySummary, sendLowStockAlert } from '../utils/notificationHelper';
import { db, signOutUser, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, Timestamp, query, orderBy, limit, getDocs, getDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { idb } from '../utils/indexedDB'; 

const DEFAULT_SETTINGS: AppSettings = { 
    taxEnabled: true, 
    taxRate: 5, 
    storeName: 'My Restaurant',
    storeAddress: '123 Food Street, Flavor Town',
    receiptFooter: 'Follow us @myrestaurant',
    reportsPIN: '',
    shiftMorningStart: '06:00',
    shiftMorningEnd: '17:30',
    shiftNightEnd: '05:00',
    notificationsEnabled: false,
    notifyLowStock: false,
    lowStockThreshold: 10,
    notifyDailySummary: false,
    dailySummaryTime: '22:00'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const SETTINGS_CACHE_KEY = 'pos_settings_cache';
const PRINTERS_CACHE_KEY = 'pos_local_printers';
const ONBOARDING_COMPLETED_KEY = 'pos_onboarding_completed_v1';
const ACTIVE_GRID_KEY = 'pos_active_grid_id';

// Defensive localStorage utility to prevent crashes in private tabs or restricted sandboxes
const safeStorage = {
    getItem: (key: string) => { try { return localStorage.getItem(key); } catch(e) { return null; } },
    setItem: (key: string, val: string) => { try { localStorage.setItem(key, val); } catch(e) {} }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => !safeStorage.getItem(ONBOARDING_COMPLETED_KEY));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  const [isReportsUnlocked, setReportsUnlocked] = useState(false);
  const [theme, setThemeState] = useState<Theme>(() => (safeStorage.getItem('theme') as Theme) || 'system');
  
  // Centralized Hardware UI State
  const [isAddPrinterModalOpen, setIsAddPrinterModalOpen] = useState(false);

  const openAddPrinterModal = useCallback(() => setIsAddPrinterModalOpen(true), []);
  const closeAddPrinterModal = useCallback(() => setIsAddPrinterModalOpen(false), []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    safeStorage.setItem('theme', newTheme);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
        let effectiveTheme = theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme;
        document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
    };
    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);

  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [items, setItemsState] = useState<Item[]>([]);
  const [customGrids, setCustomGridsState] = useState<CustomGrid[]>([]);
  const [receipts, setReceiptsState] = useState<Receipt[]>([]);
  
  // Load printers from local storage only
  const [printers, setPrintersState] = useState<Printer[]>(() => {
      const cached = safeStorage.getItem(PRINTERS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
  });

  const [paymentTypes, setPaymentTypesState] = useState<PaymentType[]>([]);
  const [savedTickets, setSavedTicketsState] = useState<SavedTicket[]>([]);
  const [tables, setTablesState] = useState<Table[]>([]);
  const [activeGridId, setActiveGridIdState] = useState<string>(() => safeStorage.getItem(ACTIVE_GRID_KEY) || 'All');

  const setActiveGridId = useCallback((id: string) => {
      setActiveGridIdState(id);
      safeStorage.setItem(ACTIVE_GRID_KEY, id);
  }, []);

  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);

  // CART ACTIONS - Optimized to keep memory footprint low
  const addToOrder = useCallback((item: Item) => {
    setCurrentOrder(current => {
      const lastItem = current.length > 0 ? current[current.length - 1] : null;
      if (lastItem && lastItem.id === item.id && lastItem.price === item.price) {
        const newOrder = [...current];
        newOrder[newOrder.length - 1] = { ...lastItem, quantity: lastItem.quantity + 1 };
        return newOrder;
      }
      return [...current, { ...item, imageUrl: '', quantity: 1, lineItemId: `L${Date.now()}-${Math.random()}` }];
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
      }
      return current.filter(i => i.lineItemId !== lineItemId);
    });
  }, []);

  const deleteLineItem = useCallback((lineItemId: string) => {
    setCurrentOrder(prev => prev.filter(i => i.lineItemId !== lineItemId));
  }, []);

  const updateOrderItemQuantity = useCallback((lineItemId: string, newQuantity: number) => {
    if (isNaN(newQuantity) || newQuantity <= 0) deleteLineItem(lineItemId);
    else setCurrentOrder(prev => prev.map(i => i.lineItemId === lineItemId ? { ...i, quantity: newQuantity } : i));
  }, [deleteLineItem]);
  
  const clearOrder = useCallback(() => setCurrentOrder([]), []);
  const loadOrder = useCallback((items: OrderItem[]) => setCurrentOrder(items.map(item => ({ ...item, lineItemId: item.lineItemId || `L${Date.now()}-${Math.random()}` }))), []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            const uid = currentUser.uid;
            try {
                const settingsSnap = await getDoc(doc(db, 'users', uid, 'config', 'settings'));
                if (settingsSnap.exists()) setSettingsState({ ...DEFAULT_SETTINGS, ...settingsSnap.data() as AppSettings });
                
                // Note: PRINTERS removed from cloud sync query to save quota and support device-local hardware
                const [itemsSnap, ptSnap, tblSnap, tktSnap, grdSnap] = await Promise.all([
                    getDocs(collection(db, 'users', uid, 'items')),
                    getDocs(collection(db, 'users', uid, 'payment_types')),
                    getDocs(query(collection(db, 'users', uid, 'tables'), orderBy('order'))),
                    getDocs(collection(db, 'users', uid, 'saved_tickets')),
                    getDocs(query(collection(db, 'users', uid, 'custom_grids'), orderBy('order')))
                ]);

                setItemsState(itemsSnap.docs.map(d => d.data() as Item));
                setPaymentTypesState(ptSnap.docs.map(d => d.data() as PaymentType));
                setTablesState(tblSnap.docs.map(d => d.data() as Table));
                setSavedTicketsState(tktSnap.docs.map(d => d.data() as SavedTicket));
                setCustomGridsState(grdSnap.docs.map(d => d.data() as CustomGrid));
            } catch (e) { console.error("Initial load sync deferred"); }
            
            const unsubReceipts = onSnapshot(query(collection(db, 'users', uid, 'receipts'), orderBy('date', 'desc'), limit(50)), (snap) => {
                setReceiptsState(snap.docs.map(d => ({ ...d.data(), date: (d.data().date as Timestamp).toDate() } as Receipt)));
            });
            setIsLoading(false);
            return () => unsubReceipts();
        } else {
            setUser(null);
            setIsLoading(false);
        }
    });
    return () => unsubAuth();
  }, []);

  const addReceipt = useCallback(async (receipt: Receipt) => {
    if (!user) return;
    const persistenceFriendlyReceipt = {
        ...receipt,
        items: receipt.items.map(item => {
            const { imageUrl, ...rest } = item;
            return { ...rest, imageUrl: '' };
        })
    };
    setReceiptsState(prev => [receipt, ...prev].slice(0, 100));
    idb.saveReceipt(persistenceFriendlyReceipt); 
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', user.uid, 'receipts', receipt.id), persistenceFriendlyReceipt);

    const updatedItems = [...items];
    receipt.items.forEach(orderItem => {
        const idx = updatedItems.findIndex(i => i.id === orderItem.id);
        if (idx > -1) {
            updatedItems[idx].stock = Math.max(0, updatedItems[idx].stock - orderItem.quantity);
            batch.update(doc(db, 'users', user.uid, 'items', orderItem.id), { stock: increment(-orderItem.quantity) });
            if (settings.notifyLowStock && updatedItems[idx].stock <= (settings.lowStockThreshold || 0)) {
                sendLowStockAlert(updatedItems[idx].name, updatedItems[idx].stock);
            }
        }
    });
    setItemsState(updatedItems);
    try { await batch.commit(); } catch (e) { console.warn("Background sync deferred"); }
  }, [user, items, settings]);
  
  const saveTicket = useCallback(async (t: SavedTicket) => {
      if (!user) return;
      setSavedTicketsState(v => [...v.filter(x => x.id !== t.id), t]);
      await setDoc(doc(db, 'users', user.uid, 'saved_tickets', t.id), t);
  }, [user]);

  const removeTicket = useCallback(async (id: string) => {
      if (!user) return;
      setSavedTicketsState(v => v.filter(x => x.id !== id));
      await deleteDoc(doc(db, 'users', user.uid, 'saved_tickets', id));
  }, [user]);

  const mergeTickets = useCallback(async (ticketIds: string[], newName: string) => {
      if (!user) return;
      const ticketsToMerge = savedTickets.filter(t => ticketIds.includes(t.id));
      if (ticketsToMerge.length < 2) return;

      const allItems = ticketsToMerge.flatMap(t => t.items);
      const newTicket: SavedTicket = {
          id: `T${Date.now()}`,
          name: newName,
          items: allItems,
          lastModified: Date.now()
      };
      
      await saveTicket(newTicket);
      const batch = writeBatch(db);
      for (const id of ticketIds) {
          batch.delete(doc(db, 'users', user.uid, 'saved_tickets', id));
      }
      await batch.commit();
      
      setSavedTicketsState(prev => [...prev.filter(t => !ticketIds.includes(t.id)), newTicket]);
  }, [savedTickets, saveTicket, user]);
  
  const completeOnboarding = useCallback(async () => {
      if (Capacitor.isNativePlatform()) {
          const p = await requestAppPermissions();
          await requestNotificationPermission();
          if (!p) return false;
      }
      safeStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      setShowOnboarding(false);
      return true;
  }, []);
  
  const updateSettings = useCallback(async (s: Partial<AppSettings>) => {
      if (!user) return;
      const next = { ...settings, ...s };
      setSettingsState(next);
      safeStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(next));
      await setDoc(doc(db, 'users', user.uid, 'config', 'settings'), next, { merge: true });
  }, [user, settings]);
  
  // PRINTER ACTIONS - LOCAL ONLY
  const addPrinter = useCallback((p: Printer) => {
      setPrintersState(v => {
          const next = [...v, p];
          safeStorage.setItem(PRINTERS_CACHE_KEY, JSON.stringify(next));
          return next;
      });
  }, []);
  
  const removePrinter = useCallback((id: string) => {
      setPrintersState(v => {
          const next = v.filter(p => p.id !== id);
          safeStorage.setItem(PRINTERS_CACHE_KEY, JSON.stringify(next));
          return next;
      });
  }, []);

  const addPaymentType = useCallback(async (p: Omit<PaymentType, 'id' | 'enabled' | 'type'>) => {
      if (!user) return;
      const id = `pt_${Date.now()}`;
      const pt = { ...p, id, enabled: true, type: 'other' } as PaymentType;
      setPaymentTypesState(v => [...v, pt]);
      await setDoc(doc(db, 'users', user.uid, 'payment_types', id), pt);
  }, [user]);
  
  const updatePaymentType = useCallback(async (p: PaymentType) => {
      if (!user) return;
      setPaymentTypesState(v => v.map(i => i.id === p.id ? p : i));
      await setDoc(doc(db, 'users', user.uid, 'payment_types', p.id), p);
  }, [user]);
  
  const removePaymentType = useCallback(async (id: string) => {
      if (!user) return;
      setPaymentTypesState(v => v.filter(p => p.id !== id));
      await deleteDoc(doc(db, 'users', user.uid, 'payment_types', id));
  }, [user]);

  const deleteReceipt = useCallback(async (id: string) => {
      if (!user) return;
      setReceiptsState(v => v.filter(r => r.id !== id));
      await deleteDoc(doc(db, 'users', user.uid, 'receipts', id));
  }, [user]);

  const addItem = useCallback(async (i: Item) => {
      if (!user) return;
      setItemsState(v => [...v, i]);
      await setDoc(doc(db, 'users', user.uid, 'items', i.id), i);
  }, [user]);
  
  const updateItem = useCallback(async (i: Item) => {
      if (!user) return;
      setItemsState(v => v.map(x => x.id === i.id ? i : x));
      await setDoc(doc(db, 'users', user.uid, 'items', i.id), i);
  }, [user]);
  
  const deleteItem = useCallback(async (id: string) => {
      if (!user) return;
      setItemsState(v => v.filter(x => x.id !== id));
      await deleteDoc(doc(db, 'users', user.uid, 'items', id));
  }, [user]);

  const addCustomGrid = useCallback(async (g: CustomGrid) => {
      if (!user) return;
      setCustomGridsState(v => [...v, g]);
      await setDoc(doc(db, 'users', user.uid, 'custom_grids', g.id), g);
  }, [user]);

  const updateCustomGrid = useCallback(async (g: CustomGrid) => {
      if (!user) return;
      setCustomGridsState(v => v.map(x => x.id === g.id ? g : x));
      await setDoc(doc(db, 'users', user.uid, 'custom_grids', g.id), g);
  }, [user]);
  
  const deleteCustomGrid = useCallback(async (id: string) => {
      if (!user) return;
      setCustomGridsState(v => v.filter(x => x.id !== id));
      await deleteDoc(doc(db, 'users', user.uid, 'custom_grids', id));
  }, [user]);

  const setCustomGrids = useCallback(async (gs: CustomGrid[]) => {
      if (!user) return;
      setCustomGridsState(gs);
      const batch = writeBatch(db);
      gs.forEach(g => batch.set(doc(db, 'users', user.uid, 'custom_grids', g.id), g));
      await batch.commit();
  }, [user]);

  const addTable = useCallback(async (n: string) => {
      if (!user) return;
      const t = { id: `tbl_${Date.now()}`, name: n, order: tables.length };
      setTablesState(v => [...v, t]);
      await setDoc(doc(db, 'users', user.uid, 'tables', t.id), t);
  }, [user, tables.length]);

  const updateTable = useCallback(async (t: Table) => {
      if (!user) return;
      setTablesState(v => v.map(x => x.id === t.id ? t : x));
      await setDoc(doc(db, 'users', user.uid, 'tables', t.id), t);
  }, [user]);

  const removeTable = useCallback(async (id: string) => {
      if (!user) return;
      setTablesState(v => v.filter(x => x.id !== id));
      await deleteDoc(doc(db, 'users', user.uid, 'tables', id));
  }, [user]);
  
  const setTables = useCallback(async (ts: Table[]) => {
      if (!user) return;
      setTablesState(ts);
      const batch = writeBatch(db);
      ts.forEach(t => batch.set(doc(db, 'users', user.uid, 'tables', t.id), t));
      await batch.commit();
  }, [user]);
  
  const exportItemsCsv = useCallback(async () => {
      const csvString = exportItemsToCsv(items);
      const fileName = `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`;
      try {
          if (Capacitor.isNativePlatform()) {
              const result = await Filesystem.writeFile({ path: fileName, data: csvString, directory: Directory.Documents, encoding: Encoding.UTF8 });
              await Share.share({ url: result.uri, title: 'Export Inventory' });
          } else {
              const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement("a");
              link.setAttribute("href", URL.createObjectURL(blob));
              link.setAttribute("download", fileName);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
      } catch (error) { console.error("Export failed", error); }
  }, [items]);

  const replaceItems = useCallback((is: Item[]) => {
      if (!user) return;
      setItemsState(is);
      const batch = writeBatch(db);
      is.forEach(i => batch.set(doc(db, 'users', user.uid, 'items', i.id), i));
      batch.commit();
  }, [user]);

  const value = useMemo(() => ({
      user, signOut: signOutUser,
      isDrawerOpen, openDrawer, closeDrawer, toggleDrawer, 
      headerTitle, setHeaderTitle, theme, setTheme,
      showOnboarding, completeOnboarding, isLoading, 
      isAddPrinterModalOpen, openAddPrinterModal, closeAddPrinterModal,
      settings, updateSettings,
      printers, addPrinter, removePrinter,
      paymentTypes, addPaymentType, updatePaymentType, removePaymentType,
      receipts, addReceipt, loadMoreReceipts: async () => {}, hasMoreReceipts: false, deleteReceipt,
      items, addItem, updateItem, deleteItem,
      savedTickets, saveTicket, removeTicket, mergeTickets,
      customGrids, addCustomGrid, updateCustomGrid, deleteCustomGrid, setCustomGrids,
      tables, addTable, updateTable, removeTable, setTables,
      activeGridId, setActiveGridId,
      currentOrder, addToOrder, removeFromOrder, deleteLineItem, updateOrderItemQuantity, clearOrder, loadOrder,
      exportData: () => {}, restoreData: () => {}, 
      exportItemsCsv, replaceItems,
      isReportsUnlocked, setReportsUnlocked
  }), [
      user, isDrawerOpen, headerTitle, theme, showOnboarding, isLoading, isAddPrinterModalOpen, settings, items, customGrids, receipts, 
      printers, paymentTypes, savedTickets, tables, activeGridId, currentOrder, isReportsUnlocked,
      openDrawer, closeDrawer, toggleDrawer, setTheme, completeOnboarding, openAddPrinterModal, closeAddPrinterModal,
      updateSettings, addPrinter, removePrinter,
      addPaymentType, updatePaymentType, removePaymentType, addReceipt, deleteReceipt, addItem, updateItem, deleteItem,
      saveTicket, removeTicket, mergeTickets, addCustomGrid, updateCustomGrid, deleteCustomGrid, setCustomGrids,
      addTable, updateTable, removeTable, setTables, setActiveGridId, addToOrder, removeFromOrder, deleteLineItem,
      updateOrderItemQuantity, clearOrder, loadOrder, exportItemsCsv, replaceItems
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

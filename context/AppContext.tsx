
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
import { db, signOutUser, clearAllData, firebaseConfig, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, Timestamp, query, orderBy, limit, startAfter, getDocs, getDoc, QueryDocumentSnapshot, increment } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import FirebaseError from '../components/modals/FirebaseError';
import { APP_VERSION } from '../constants';
import { idb } from '../utils/indexedDB'; 
import { useStatusContext } from './StatusContext';

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

const ITEMS_CACHE_KEY = 'pos_items_cache';
const SETTINGS_CACHE_KEY = 'pos_settings_cache';
const GRIDS_CACHE_KEY = 'pos_grids_cache'; 
const ONBOARDING_COMPLETED_KEY = 'pos_onboarding_completed_v1';
const ACTIVE_GRID_KEY = 'pos_active_grid_id';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setPendingSyncCount } = useStatusContext();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(ONBOARDING_COMPLETED_KEY));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  const [isReportsUnlocked, setReportsUnlocked] = useState(false);
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
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

  const [settings, setSettingsState] = useState<AppSettings>(() => {
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
      return cached ? { ...DEFAULT_SETTINGS, ...JSON.parse(cached) } : DEFAULT_SETTINGS;
  });
  
  const [items, setItemsState] = useState<Item[]>(() => {
      const cached = localStorage.getItem(ITEMS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
  });

  const [customGrids, setCustomGridsState] = useState<CustomGrid[]>(() => {
      const cached = localStorage.getItem(GRIDS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
  });

  const [receipts, setReceiptsState] = useState<Receipt[]>([]);
  const [printers, setPrintersState] = useState<Printer[]>([]);
  const [paymentTypes, setPaymentTypesState] = useState<PaymentType[]>([]);
  const [savedTickets, setSavedTicketsState] = useState<SavedTicket[]>([]);
  const [tables, setTablesState] = useState<Table[]>([]);
  const [activeGridId, setActiveGridIdState] = useState<string>(() => localStorage.getItem(ACTIVE_GRID_KEY) || 'All');

  const setActiveGridId = useCallback((id: string) => {
      setActiveGridIdState(id);
      localStorage.setItem(ACTIVE_GRID_KEY, id);
  }, []);

  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);

  const addToOrder = useCallback((item: Item) => {
    setCurrentOrder(current => {
      const lastItem = current.length > 0 ? current[current.length - 1] : null;
      if (lastItem && lastItem.id === item.id && lastItem.price === item.price) {
        const newOrder = [...current];
        newOrder[newOrder.length - 1] = { ...lastItem, quantity: lastItem.quantity + 1 };
        return newOrder;
      }
      return [...current, { ...item, quantity: 1, lineItemId: `L${Date.now()}-${Math.random()}` }];
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
                
                const [itemsSnap, printersSnap, ptSnap, tblSnap, tktSnap, grdSnap] = await Promise.all([
                    getDocs(collection(db, 'users', uid, 'items')),
                    getDocs(collection(db, 'users', uid, 'printers')),
                    getDocs(collection(db, 'users', uid, 'payment_types')),
                    getDocs(query(collection(db, 'users', uid, 'tables'), orderBy('order'))),
                    getDocs(collection(db, 'users', uid, 'saved_tickets')),
                    getDocs(query(collection(db, 'users', uid, 'custom_grids'), orderBy('order')))
                ]);

                setItemsState(itemsSnap.docs.map(d => d.data() as Item));
                setPrintersState(printersSnap.docs.map(d => d.data() as Printer));
                setPaymentTypesState(ptSnap.docs.map(d => d.data() as PaymentType));
                setTablesState(tblSnap.docs.map(d => d.data() as Table));
                setSavedTicketsState(tktSnap.docs.map(d => d.data() as SavedTicket));
                setCustomGridsState(grdSnap.docs.map(d => d.data() as CustomGrid));
            } catch (e) { console.error(e); }
            
            const unsubReceipts = onSnapshot(query(collection(db, 'users', uid, 'receipts'), orderBy('date', 'desc'), limit(100)), (snap) => {
                setReceiptsState(snap.docs.map(d => ({ ...d.data(), date: (d.data().date as Timestamp).toDate() } as Receipt)));
                setPendingSyncCount(snap.docs.filter(d => d.metadata.hasPendingWrites).length);
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
    setReceiptsState(prev => [receipt, ...prev]);
    idb.saveReceipt(receipt); 
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', user!.uid, 'receipts', receipt.id), receipt);

    const updatedItems = [...items];
    receipt.items.forEach(orderItem => {
        const idx = updatedItems.findIndex(i => i.id === orderItem.id);
        if (idx > -1) {
            updatedItems[idx].stock = Math.max(0, updatedItems[idx].stock - orderItem.quantity);
            batch.update(doc(db, 'users', user!.uid, 'items', orderItem.id), { stock: increment(-orderItem.quantity) });
            if (settings.notifyLowStock && updatedItems[idx].stock <= (settings.lowStockThreshold || 0)) {
                sendLowStockAlert(updatedItems[idx].name, updatedItems[idx].stock);
            }
        }
    });
    setItemsState(updatedItems);
    try { await batch.commit(); } catch (e) { console.error("Sync failed", e); }
  }, [user, items, settings]);

  const value = useMemo(() => ({
      user, signOut: signOutUser,
      isDrawerOpen, openDrawer, closeDrawer, toggleDrawer, 
      headerTitle, setHeaderTitle, theme, setTheme,
      showOnboarding, completeOnboarding: async () => {
          if (Capacitor.isNativePlatform()) {
              const p = await requestAppPermissions();
              await requestNotificationPermission();
              if (!p) return false;
          }
          localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
          setShowOnboarding(false);
          return true;
      },
      isLoading, settings, updateSettings: async (s: Partial<AppSettings>) => {
          const next = { ...settings, ...s };
          setSettingsState(next);
          localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(next));
          await setDoc(doc(db, 'users', user!.uid, 'config', 'settings'), next, { merge: true });
      },
      printers, addPrinter: async (p: Printer) => {
          setPrintersState(v => [...v, p]);
          await setDoc(doc(db, 'users', user!.uid, 'printers', p.id), p);
      },
      removePrinter: async (id: string) => {
          setPrintersState(v => v.filter(p => p.id !== id));
          await deleteDoc(doc(db, 'users', user!.uid, 'printers', id));
      },
      paymentTypes, addPaymentType: async (p: any) => {
          const id = `pt_${Date.now()}`;
          const pt = { ...p, id, enabled: true, type: 'other' };
          setPaymentTypesState(v => [...v, pt]);
          await setDoc(doc(db, 'users', user!.uid, 'payment_types', id), pt);
      },
      updatePaymentType: async (p: PaymentType) => {
          setPaymentTypesState(v => v.map(i => i.id === p.id ? p : i));
          await setDoc(doc(db, 'users', user!.uid, 'payment_types', p.id), p);
      },
      removePaymentType: async (id: string) => {
          setPaymentTypesState(v => v.filter(p => p.id !== id));
          await deleteDoc(doc(db, 'users', user!.uid, 'payment_types', id));
      },
      receipts, addReceipt, loadMoreReceipts: async () => {}, hasMoreReceipts: false, 
      deleteReceipt: async (id: string) => {
          setReceiptsState(v => v.filter(r => r.id !== id));
          await deleteDoc(doc(db, 'users', user!.uid, 'receipts', id));
      },
      items, addItem: async (i: Item) => {
          setItemsState(v => [...v, i]);
          await setDoc(doc(db, 'users', user!.uid, 'items', i.id), i);
      },
      updateItem: async (i: Item) => {
          setItemsState(v => v.map(x => x.id === i.id ? i : x));
          await setDoc(doc(db, 'users', user!.uid, 'items', i.id), i);
      },
      deleteItem: async (id: string) => {
          setItemsState(v => v.filter(x => x.id !== id));
          await deleteDoc(doc(db, 'users', user!.uid, 'items', id));
      },
      savedTickets, saveTicket: async (t: SavedTicket) => {
          setSavedTicketsState(v => [...v.filter(x => x.id !== t.id), t]);
          await setDoc(doc(db, 'users', user!.uid, 'saved_tickets', t.id), t);
      },
      removeTicket: async (id: string) => {
          setSavedTicketsState(v => v.filter(x => x.id !== id));
          await deleteDoc(doc(db, 'users', user!.uid, 'saved_tickets', id));
      },
      mergeTickets: async (ids: string[], name: string) => {},
      customGrids, addCustomGrid: async (g: CustomGrid) => {
          setCustomGridsState(v => [...v, g]);
          await setDoc(doc(db, 'users', user!.uid, 'custom_grids', g.id), g);
      },
      updateCustomGrid: async (g: CustomGrid) => {
          setCustomGridsState(v => v.map(x => x.id === g.id ? g : x));
          await setDoc(doc(db, 'users', user!.uid, 'custom_grids', g.id), g);
      },
      deleteCustomGrid: async (id: string) => {
          setCustomGridsState(v => v.filter(x => x.id !== id));
          await deleteDoc(doc(db, 'users', user!.uid, 'custom_grids', id));
      },
      setCustomGrids: async (gs: CustomGrid[]) => {
          setCustomGridsState(gs);
          const batch = writeBatch(db);
          gs.forEach(g => batch.set(doc(db, 'users', user!.uid, 'custom_grids', g.id), g));
          await batch.commit();
      },
      tables, addTable: async (n: string) => {
          const t = { id: `tbl_${Date.now()}`, name: n, order: tables.length };
          setTablesState(v => [...v, t]);
          await setDoc(doc(db, 'users', user!.uid, 'tables', t.id), t);
      },
      updateTable: async (t: Table) => {
          setTablesState(v => v.map(x => x.id === t.id ? t : x));
          await setDoc(doc(db, 'users', user!.uid, 'tables', t.id), t);
      },
      removeTable: async (id: string) => {
          setTablesState(v => v.filter(x => x.id !== id));
          await deleteDoc(doc(db, 'users', user!.uid, 'tables', id));
      },
      setTables: async (ts: Table[]) => {
          setTablesState(ts);
          const batch = writeBatch(db);
          ts.forEach(t => batch.set(doc(db, 'users', user!.uid, 'tables', t.id), t));
          await batch.commit();
      },
      activeGridId, setActiveGridId,
      currentOrder, addToOrder, removeFromOrder, deleteLineItem, updateOrderItemQuantity, clearOrder, loadOrder,
      exportData: () => {}, restoreData: (d: any) => {}, exportItemsCsv: () => {}, replaceItems: (is: Item[]) => {},
      isReportsUnlocked, setReportsUnlocked
  }), [user, isDrawerOpen, headerTitle, theme, showOnboarding, isLoading, settings, items, customGrids, receipts, printers, paymentTypes, savedTickets, tables, activeGridId, currentOrder, isReportsUnlocked, addReceipt]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

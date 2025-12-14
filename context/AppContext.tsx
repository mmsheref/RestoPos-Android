
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
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, Timestamp, query, orderBy, limit, startAfter, getDocs, getDoc, QueryDocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import FirebaseError from '../components/modals/FirebaseError';
import { APP_VERSION } from '../constants';
import { idb } from '../utils/indexedDB'; // Import the new DB helper

// Default configuration for new users
const DEFAULT_SETTINGS: AppSettings = { 
    taxEnabled: true, 
    taxRate: 5, 
    storeName: 'My Restaurant',
    storeAddress: '123 Food Street, Flavor Town',
    receiptFooter: 'Follow us @myrestaurant',
    reportsPIN: '', // Empty means no PIN protection
    
    // Default Shift Timings as requested
    shiftMorningStart: '06:00',
    shiftMorningEnd: '17:30',
    shiftNightEnd: '05:00',

    // Default Notifications
    notificationsEnabled: false,
    notifyLowStock: false,
    lowStockThreshold: 10,
    notifyDailySummary: false,
    dailySummaryTime: '22:00'
};

interface FirebaseErrorState {
  title: string;
  message: string;
  instructions: string[];
  projectId: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// LocalStorage Keys (Only for small data)
const ITEMS_CACHE_KEY = 'pos_items_cache';
const SETTINGS_CACHE_KEY = 'pos_settings_cache';
const GRIDS_CACHE_KEY = 'pos_grids_cache'; 
const ONBOARDING_COMPLETED_KEY = 'pos_onboarding_completed_v1';
const ACTIVE_GRID_KEY = 'pos_active_grid_id';
// Removed RECEIPTS_CACHE_KEY in favor of IndexedDB

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
      // Also request notification permissions if platform supports it, 
      // but we don't block onboarding for it (optional)
      await requestNotificationPermission();
      
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
        // Validate stored preference
        if (storedPrefs === 'light' || storedPrefs === 'dark' || storedPrefs === 'system') {
            return storedPrefs as Theme;
        }
        return 'system'; // Default to system
    }
    return 'system';
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);
  
  // Apply theme class to HTML body
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
        let effectiveTheme = theme;
        
        if (theme === 'system') {
            effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
        }
        
        if (effectiveTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    applyTheme();

    // Listener for system preference changes when in 'system' mode
    const handleChange = () => {
        if (theme === 'system') {
            applyTheme();
        }
    };

    // Modern browsers use addEventListener
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
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

  // Receipts: Empty initially, populated async from IndexedDB
  const [receipts, setReceiptsState] = useState<Receipt[]>([]);

  // Load ONLY RECENT receipts from IDB on mount for performance
  useEffect(() => {
      const loadRecent = async () => {
          // Optimization: Only load last 50 items to keep app snappy
          const stored = await idb.getRecentReceipts(50);
          if (stored.length > 0) {
              setReceiptsState(stored);
          }
      };
      loadRecent();
  }, []);

  const [printers, setPrintersState] = useState<Printer[]>([]);
  const [paymentTypes, setPaymentTypesState] = useState<PaymentType[]>([]);
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

  // ==========================================
  // SECTION: FIREBASE SYNC LOGIC
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            const uid = currentUser.uid;

            const fetchAllDataOnce = async () => {
              try {
                // 1. Settings
                const settingsSnap = await getDoc(doc(db, 'users', uid, 'config', 'settings'));
                if (settingsSnap.exists()) {
                    const fetched = settingsSnap.data() as AppSettings;
                    const merged = { ...DEFAULT_SETTINGS, ...fetched };
                    setSettingsState(merged);
                    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(merged));
                    
                    // Initialize notifications based on fetched settings
                    if (merged.notificationsEnabled) {
                        requestNotificationPermission().then(() => {
                            if (merged.notifyDailySummary && merged.dailySummaryTime) {
                                scheduleDailySummary(merged.dailySummaryTime);
                            }
                        });
                    }

                } else {
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

                // 2. Parallel Fetch
                const [itemsSnap, printersSnap, paymentTypesSnap, tablesSnap, ticketsSnap, gridsSnap] = await Promise.all([
                    getDocs(collection(db, 'users', uid, 'items')),
                    getDocs(collection(db, 'users', uid, 'printers')),
                    getDocs(collection(db, 'users', uid, 'payment_types')),
                    getDocs(query(collection(db, 'users', uid, 'tables'), orderBy('order'))),
                    getDocs(collection(db, 'users', uid, 'saved_tickets')),
                    getDocs(query(collection(db, 'users', uid, 'custom_grids'), orderBy('order')))
                ]);

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

            // 4. Real-time Listener for Receipts
            const qReceipts = query(collection(db, 'users', uid, 'receipts'), orderBy('date', 'desc'), limit(100));
            const unsubReceipts = onSnapshot(qReceipts, { includeMetadataChanges: true }, (snapshot) => {
                const latestReceipts = snapshot.docs.map(doc => ({ ...doc.data(), date: (doc.data().date as Timestamp).toDate() } as Receipt));
                
                // HYBRID STORAGE STRATEGY (IndexedDB):
                setReceiptsState(currentLocalReceipts => {
                    const mergedMap = new Map<string, Receipt>();
                    
                    // Optimization: We are NOT iterating the entire history here anymore,
                    // just the active 'view' set (limit 50 from IDB + 100 from snapshot).
                    
                    // 1. Put active local receipts into map
                    currentLocalReceipts.forEach(r => mergedMap.set(r.id, r));
                    
                    // 2. Overwrite with latest data from listener
                    latestReceipts.forEach(r => mergedMap.set(r.id, r));
                    
                    const combined = Array.from(mergedMap.values()).sort((a,b) => b.date.getTime() - a.date.getTime());
                    
                    // 3. Save updates to IndexedDB (Async, don't await)
                    idb.saveBulkReceipts(latestReceipts);
                    
                    return combined;
                });
                
                const pendingCount = snapshot.docs.filter(doc => doc.metadata.hasPendingWrites).length;
                setPendingSyncCount(pendingCount);
                
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
            // Clear IndexedDB for security
            idb.clearAll();
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

  const loadMoreReceipts = useCallback(async () => {
      if (!lastReceiptDoc || !user) return;
      try {
          const qNext = query(collection(db, 'users', user.uid, 'receipts'), orderBy('date', 'desc'), startAfter(lastReceiptDoc), limit(50));
          const snapshot = await getDocs(qNext);
          if (!snapshot.empty) {
              const newReceipts = snapshot.docs.map(doc => ({ ...doc.data(), date: (doc.data().date as Timestamp).toDate() } as Receipt));
              
              setReceiptsState(prev => {
                  const merged = [...prev, ...newReceipts].sort((a,b) => b.date.getTime() - a.date.getTime());
                  idb.saveBulkReceipts(newReceipts); // Persist fetched history
                  return merged;
              });
              
              setLastReceiptDoc(snapshot.docs[snapshot.docs.length - 1]);
          } else {
              setHasMoreReceipts(false);
          }
      } catch (e) { console.error("Error loading more receipts", e); }
  }, [lastReceiptDoc, user]);
  
  const addReceipt = useCallback(async (receipt: Receipt) => {
    // 1. Save Receipt (Optimistic) - Optimized: Prepend (O(1)) instead of full sort (O(N log N))
    setReceiptsState(prev => [receipt, ...prev]);
    idb.saveReceipt(receipt); 
    
    // 2. Prepare Batch for Receipt + Stock Deductions
    const batch = writeBatch(db);
    const receiptRef = doc(db, 'users', getUid(), 'receipts', receipt.id);
    batch.set(receiptRef, receipt);

    // 3. Handle Inventory Updates & Low Stock Alerts
    const updatedItems = [...items]; 
    let stockUpdated = false;

    receipt.items.forEach(orderItem => {
        const itemIndex = updatedItems.findIndex(i => i.id === orderItem.id);
        if (itemIndex > -1) {
            const currentItem = updatedItems[itemIndex];
            const newStock = Math.max(0, currentItem.stock - orderItem.quantity);
            
            // Update local state copy
            updatedItems[itemIndex] = { ...currentItem, stock: newStock };
            
            // Add to batch write
            const itemRef = doc(db, 'users', getUid(), 'items', currentItem.id);
            batch.update(itemRef, { stock: newStock });
            
            stockUpdated = true;

            // Check for Low Stock Notification
            if (settings.notificationsEnabled && settings.notifyLowStock && settings.lowStockThreshold !== undefined) {
                if (newStock <= settings.lowStockThreshold) {
                    sendLowStockAlert(currentItem.name, newStock);
                }
            }
        }
    });

    if (stockUpdated) {
        setItemsState(updatedItems);
        localStorage.setItem(ITEMS_CACHE_KEY, JSON.stringify(updatedItems));
    }

    try { 
        await batch.commit();
    } 
    catch (e) { console.error("Failed to save transaction", e); alert("Saved locally. Sync failed (Offline).");}
  }, [getUid, items, settings]); // Added items and settings dependencies for stock logic

  const deleteReceipt = useCallback(async (id: string) => {
    setReceiptsState(prev => prev.filter(r => r.id !== id));
    idb.deleteReceipt(id); // Non-blocking delete

    try {
        await deleteDoc(doc(db, 'users', getUid(), 'receipts', id));
    } catch (e) { console.error("Failed to delete receipt", e); }
  }, [getUid]);

  // --- SETTINGS ---
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated);
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(updated));
    
    // Notification Logic Handling
    if (newSettings.notificationsEnabled === true) {
        requestNotificationPermission(); // Request permission when master toggle enabled
    }
    
    // Handle Schedule Updates
    if (updated.notificationsEnabled) {
        if (updated.notifyDailySummary && updated.dailySummaryTime) {
            // Re-schedule if time changed or just enabled
            if (newSettings.dailySummaryTime || newSettings.notifyDailySummary || newSettings.notificationsEnabled) {
                scheduleDailySummary(updated.dailySummaryTime);
            }
        } else {
            // Cancel if specifically the daily summary was disabled
            if (newSettings.notifyDailySummary === false) {
                cancelDailySummary();
            }
        }
    } else {
        cancelDailySummary(); // Cancel if master disabled
    }

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
    setItemsState(prev => {
        const next = [...prev, item];
        localStorage.setItem(ITEMS_CACHE_KEY, JSON.stringify(next));
        return next;
    });
    try { await setDoc(doc(db, 'users', getUid(), 'items', item.id), item); } 
    catch (e) { console.error(e); alert("Failed to add item."); }
  }, [getUid]);

  const updateItem = useCallback(async (updatedItem: Item) => {
    setItemsState(prev => {
        const next = prev.map(i => i.id === updatedItem.id ? updatedItem : i);
        localStorage.setItem(ITEMS_CACHE_KEY, JSON.stringify(next));
        return next;
    });
    try { await setDoc(doc(db, 'users', getUid(), 'items', updatedItem.id), updatedItem); } 
    catch (e) { console.error(e); alert("Failed to update item."); }
  }, [getUid]);

  const deleteItem = useCallback(async (id: string) => {
    const uid = getUid();
    setItemsState(prev => {
        const next = prev.filter(i => i.id !== id);
        localStorage.setItem(ITEMS_CACHE_KEY, JSON.stringify(next));
        return next;
    });
    setCustomGridsState(prev => {
        const next = prev.map(grid => ({
            ...grid,
            itemIds: Array.isArray(grid.itemIds) ? grid.itemIds.map(itemId => itemId === id ? null : itemId) : []
        }));
        localStorage.setItem(GRIDS_CACHE_KEY, JSON.stringify(next));
        return next;
    });

    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', uid, 'items', id));
    const gridsToUpdate = customGrids.filter(grid => Array.isArray(grid.itemIds) && grid.itemIds.includes(id));
    gridsToUpdate.forEach(grid => {
      const newItemIds = grid.itemIds.map(itemId => (itemId === id ? null : itemId));
      const gridRef = doc(db, 'users', uid, 'custom_grids', grid.id);
      batch.update(gridRef, { itemIds: newItemIds });
    });

    try { await batch.commit(); } catch (e) { console.error("Failed to delete item:", e); }
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
    const ticketsToMerge = savedTickets.filter(t => ticketIds.includes(t.id));
    if (ticketsToMerge.length === 0) return;

    const mergedItems: OrderItem[] = [];
    ticketsToMerge.forEach(ticket => {
        ticket.items.forEach(item => {
            mergedItems.push({ ...item, lineItemId: `L${Date.now()}-${Math.random().toString(36).substr(2, 9)}` });
        });
    });

    const newTicketId = `T${Date.now()}`;
    const newTicket: SavedTicket = { id: newTicketId, name: newName, items: mergedItems, lastModified: Date.now() };

    setSavedTicketsState(prev => [...prev.filter(t => !ticketIds.includes(t.id)), newTicket]);

    try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', uid, 'saved_tickets', newTicketId), newTicket);
        ticketIds.forEach(id => { batch.delete(doc(db, 'users', uid, 'saved_tickets', id)); });
        await batch.commit();
    } catch (e) { console.error("Merge failed:", e); alert("Failed to merge tickets on server."); }
  }, [savedTickets, getUid]);

  // --- CUSTOM GRIDS & TABLES ---
  const addCustomGrid = useCallback(async (grid: CustomGrid) => {
      const newGridWithOrder = { ...grid, order: customGrids.length };
      setCustomGridsState(prev => {
          const next = [...prev, newGridWithOrder];
          localStorage.setItem(GRIDS_CACHE_KEY, JSON.stringify(next));
          return next;
      });
      try { await setDoc(doc(db, 'users', getUid(), 'custom_grids', grid.id), newGridWithOrder); } 
      catch (e) { console.error(e); alert("Failed to add custom grid."); }
  }, [getUid, customGrids.length]);

  const updateCustomGrid = useCallback(async (grid: CustomGrid) => {
      setCustomGridsState(prev => {
          const next = prev.map(g => g.id === grid.id ? grid : g);
          localStorage.setItem(GRIDS_CACHE_KEY, JSON.stringify(next));
          return next;
      });
      try { await setDoc(doc(db, 'users', getUid(), 'custom_grids', grid.id), grid); } 
      catch (e) { console.error(e); alert("Failed to update custom grid."); }
  }, [getUid]);

  const deleteCustomGrid = useCallback(async (id: string) => {
      setCustomGridsState(prev => {
          const next = prev.filter(g => g.id !== id);
          localStorage.setItem(GRIDS_CACHE_KEY, JSON.stringify(next));
          return next;
      });
      if (activeGridId === id) setActiveGridId('All');
      try { await deleteDoc(doc(db, 'users', getUid(), 'custom_grids', id)); } 
      catch (e) { console.error(e); alert("Failed to delete custom grid."); }
  }, [getUid, activeGridId, setActiveGridId]);

  const setCustomGrids = useCallback(async (newGrids: CustomGrid[]) => {
      const newGridsWithOrder = newGrids.map((g, i) => ({ ...g, order: i }));
      setCustomGridsState(newGridsWithOrder); 
      localStorage.setItem(GRIDS_CACHE_KEY, JSON.stringify(newGridsWithOrder));
      const batch = writeBatch(db);
      const gridsRef = collection(db, 'users', getUid(), 'custom_grids');
      const oldGridsMap = new Map(customGrids.map(g => [g.id, g]));
      for (const oldGrid of customGrids) {
          if (!newGrids.some(g => g.id === oldGrid.id)) { batch.delete(doc(gridsRef, oldGrid.id)); }
      }
      for (const newGrid of newGridsWithOrder) {
          const existingGrid = oldGridsMap.get(newGrid.id) as CustomGrid | undefined;
          if (!existingGrid || existingGrid.name !== newGrid.name || existingGrid.order !== newGrid.order) {
              batch.set(doc(gridsRef, newGrid.id), newGrid, { merge: true });
          }
      }
      try { await batch.commit(); } catch (e) { console.error(e); alert("Failed to save grid changes."); }
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
        if (!newTables.find(newTable => newTable.id === oldTable.id)) { batch.delete(doc(tablesRef, oldTable.id)); }
    });
    newTablesWithOrder.forEach((table) => { batch.set(doc(tablesRef, table.id), table, { merge: true }); });
    try { await batch.commit(); } catch(e) { console.error(e); alert("Failed to save table changes."); }
  }, [getUid, tables]);

  // ==========================================
  // SECTION: IMPORT / EXPORT UTILITIES
  // ==========================================
  const replaceItems = useCallback(async (newItems: Item[]) => {
    setIsLoading(true);
    setItemsState(newItems);
    localStorage.setItem(ITEMS_CACHE_KEY, JSON.stringify(newItems));
    const batch = writeBatch(db);
    const itemsRef = collection(db, 'users', getUid(), 'items');
    try {
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
          const operations: { ref: any; data: any }[] = [];
          
          operations.push({ ref: doc(db, 'users', uid, 'config', 'settings'), data: data.settings });
          (data.items || []).forEach(item => operations.push({ ref: doc(db, 'users', uid, 'items', item.id), data: item }));
          (data.printers || []).forEach(p => operations.push({ ref: doc(db, 'users', uid, 'printers', p.id), data: p }));
          (data.paymentTypes || []).forEach(pt => operations.push({ ref: doc(db, 'users', uid, 'payment_types', pt.id), data: pt }));
          (data.receipts || []).forEach(r => operations.push({ ref: doc(db, 'users', uid, 'receipts', r.id), data: {...r, date: new Date(r.date)} }));
          (data.savedTickets || []).forEach(t => operations.push({ ref: doc(db, 'users', uid, 'saved_tickets', t.id), data: t }));
          (data.customGrids || []).forEach(g => operations.push({ ref: doc(db, 'users', uid, 'custom_grids', g.id), data: g }));
          (data.tables || []).forEach(t => operations.push({ ref: doc(db, 'users', uid, 'tables', t.id), data: t }));

          const chunkSize = 500;
          for (let i = 0; i < operations.length; i += chunkSize) {
              const batch = writeBatch(db);
              const chunk = operations.slice(i, i + chunkSize);
              chunk.forEach(op => batch.set(op.ref, op.data));
              await batch.commit();
          }
          window.location.reload();
      } catch(e) { console.error(e); alert("Restore failed."); } finally { setIsLoading(false); }
  }, [getUid]);

  if (initializationError) return <FirebaseError error={initializationError} />;

  // MEMOIZED CONTEXT VALUE
  // Prevents re-creation of the object on every render, which triggers re-renders in all consumers.
  const contextValue = useMemo<AppContextType>(() => ({
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
  }), [
      user, isDrawerOpen, headerTitle, theme, showOnboarding, isLoading,
      settings, printers, paymentTypes, receipts, items, savedTickets, 
      customGrids, tables, activeGridId, currentOrder, isReportsUnlocked, 
      pendingSyncCount, isOnline,
      openDrawer, closeDrawer, toggleDrawer, setHeaderTitle, setTheme, completeOnboarding,
      updateSettings, addPrinter, removePrinter, addPaymentType, updatePaymentType, removePaymentType,
      addReceipt, loadMoreReceipts, hasMoreReceipts, deleteReceipt, addItem, updateItem, deleteItem,
      saveTicket, removeTicket, mergeTickets, addCustomGrid, updateCustomGrid, deleteCustomGrid, setCustomGrids,
      addTable, updateTable, setTables, removeTable, setActiveGridId, addToOrder, removeFromOrder, deleteLineItem,
      updateOrderItemQuantity, clearOrder, loadOrder, exportData, restoreData, exportItemsCsv, replaceItems, setReportsUnlocked
  ]);

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

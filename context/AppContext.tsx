
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Printer, Receipt, Item, AppSettings, BackupData, SavedTicket, CustomGrid } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { exportItemsToCsv } from '../utils/csvHelper';
import { db, signOutUser, clearAllData, firebaseConfig, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, Timestamp, query, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import FirebaseError from '../components/FirebaseError';

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

interface AppContextType {
  user: User | null;
  signOut: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  headerTitle: string;
  setHeaderTitle: (title: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Data
  isLoading: boolean;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  printers: Printer[];
  addPrinter: (printer: Printer) => void;
  removePrinter: (printerId: string) => void;
  
  receipts: Receipt[];
  addReceipt: (receipt: Receipt) => void;
  loadMoreReceipts: () => Promise<void>;
  hasMoreReceipts: boolean;
  
  items: Item[];
  addItem: (item: Item) => void;
  updateItem: (item: Item) => void;
  deleteItem: (id: string) => void;

  savedTickets: SavedTicket[];
  saveTicket: (ticket: SavedTicket) => void;
  removeTicket: (ticketId: string) => void;

  customGrids: CustomGrid[];
  addCustomGrid: (grid: CustomGrid) => void;
  updateCustomGrid: (grid: CustomGrid) => void;
  deleteCustomGrid: (id: string) => void;
  setCustomGrids: (grids: CustomGrid[]) => void;

  // Backup
  exportData: () => void;
  restoreData: (data: BackupData) => void;
  exportItemsCsv: () => void;
  replaceItems: (items: Item[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ITEMS_CACHE_KEY = 'pos_items_cache';
const SETTINGS_CACHE_KEY = 'pos_settings_cache';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<FirebaseErrorState | null>(null);
  
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
  // Initialize from LocalStorage for instant startup where possible
  const [settings, setSettingsState] = useState<AppSettings>(() => {
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
      return cached ? JSON.parse(cached) : DEFAULT_SETTINGS;
  });
  
  const [items, setItemsState] = useState<Item[]>(() => {
      const cached = localStorage.getItem(ITEMS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
  });

  const [printers, setPrintersState] = useState<Printer[]>([]);
  const [receipts, setReceiptsState] = useState<Receipt[]>([]);
  const [savedTickets, setSavedTicketsState] = useState<SavedTicket[]>([]);
  const [customGrids, setCustomGridsState] = useState<CustomGrid[]>([]);
  
  // Pagination State
  const [lastReceiptDoc, setLastReceiptDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreReceipts, setHasMoreReceipts] = useState(true);

  // --- Initialize & Load Data from Firebase based on Auth State ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            const uid = currentUser.uid;
            
            // 1. Items Listener (Updates Cache)
            const unsubItems = onSnapshot(collection(db, 'users', uid, 'items'), (snapshot) => {
                  const itemsData = snapshot.docs.map(doc => ({ ...doc.data() } as Item));
                  setItemsState(itemsData);
                  localStorage.setItem(ITEMS_CACHE_KEY, JSON.stringify(itemsData));
            });

            // 2. Receipts Listener - OPTIMIZED: Only listen to the last 25 items for real-time updates
            const qReceipts = query(
                collection(db, 'users', uid, 'receipts'), 
                orderBy('date', 'desc'), 
                limit(25)
            );
            
            const unsubReceipts = onSnapshot(qReceipts, (snapshot) => {
                const receiptsData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return { ...data, date: (data.date as Timestamp).toDate() } as Receipt;
                });
                
                setReceiptsState(prev => {
                    // Merge real-time updates with existing loaded data, preventing duplicates
                    const existingIds = new Set(prev.map(r => r.id));
                    const newItems = receiptsData.filter(r => !existingIds.has(r.id));
                    
                    // If we have a fresh load, just set it. If we have older data loaded, merge intelligently.
                    if (prev.length === 0) {
                        if (snapshot.docs.length > 0) {
                             setLastReceiptDoc(snapshot.docs[snapshot.docs.length - 1]);
                        }
                        return receiptsData;
                    }

                    // Replace the top of the list with the real-time data, keep the rest (older pages)
                    // This is a simplified approach: we trust the listener for the "head" of the list.
                    // For a robust infinite scroll, we simply prepend new items.
                    const combined = [...receiptsData, ...prev.filter(p => !receiptsData.some(n => n.id === p.id))];
                    return combined.sort((a,b) => b.date.getTime() - a.date.getTime());
                });
            });

            // 3. Printers Listener
            const unsubPrinters = onSnapshot(collection(db, 'users', uid, 'printers'), (snapshot) => {
                  const printersData = snapshot.docs.map(doc => ({ ...doc.data() } as Printer));
                  setPrintersState(printersData);
            });

            // 4. Saved Tickets Listener
            const unsubTickets = onSnapshot(collection(db, 'users', uid, 'saved_tickets'), (snapshot) => {
                  const ticketsData = snapshot.docs.map(doc => ({ ...doc.data() } as SavedTicket));
                  setSavedTicketsState(ticketsData);
            });

            // 5. Custom Grids Listener
            const unsubGrids = onSnapshot(collection(db, 'users', uid, 'custom_grids'), (snapshot) => {
                  const gridsData = snapshot.docs.map(doc => ({ ...doc.data() } as CustomGrid));
                  setCustomGridsState(gridsData);
            });

            // 6. Settings Listener
            const unsubSettings = onSnapshot(doc(db, 'users', uid, 'config', 'settings'), async (docSnap) => {
                  if (docSnap.exists()) {
                    const newSettings = docSnap.data() as AppSettings;
                    setSettingsState(newSettings);
                    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(newSettings));
                  } else {
                    setSettingsState(DEFAULT_SETTINGS);
                    try {
                      await setDoc(doc(db, 'users', uid, 'config', 'settings'), DEFAULT_SETTINGS);
                    } catch (e) { console.error(e); }
                  }
            });
            
            setIsLoading(false);
            return () => {
                unsubItems(); unsubReceipts(); unsubPrinters(); unsubTickets(); unsubGrids(); unsubSettings();
            };

        } else {
            // User is signed out
            setUser(null);
            setItemsState([]);
            setReceiptsState([]);
            setPrintersState([]);
            setSavedTicketsState([]);
            setCustomGridsState([]);
            setSettingsState(DEFAULT_SETTINGS);
            setIsLoading(false);
            localStorage.removeItem(ITEMS_CACHE_KEY);
            localStorage.removeItem(SETTINGS_CACHE_KEY);
        }
    }, (error) => {
        console.error("Firebase Auth error:", error);
        setInitializationError({
            title: 'Connection Failed',
            message: error.message || 'Could not connect. Working offline.',
            instructions: ['Check internet connection.'],
            projectId: firebaseConfig.projectId
        });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getUid = useCallback(() => {
    if (!user) throw new Error("User not authenticated");
    return user.uid;
  }, [user]);

  // --- Pagination Logic ---
  const loadMoreReceipts = useCallback(async () => {
      if (!lastReceiptDoc || !user) return;
      
      try {
          const qNext = query(
              collection(db, 'users', user.uid, 'receipts'),
              orderBy('date', 'desc'),
              startAfter(lastReceiptDoc),
              limit(25)
          );
          
          const snapshot = await getDocs(qNext);
          
          if (!snapshot.empty) {
              const newReceipts = snapshot.docs.map(doc => {
                  const data = doc.data();
                  return { ...data, date: (data.date as Timestamp).toDate() } as Receipt;
              });
              
              setReceiptsState(prev => [...prev, ...newReceipts]);
              setLastReceiptDoc(snapshot.docs[snapshot.docs.length - 1]);
          } else {
              setHasMoreReceipts(false);
          }
      } catch (e) {
          console.error("Error loading more receipts", e);
      }
  }, [lastReceiptDoc, user]);

  // --- Optimistic Updates ---
  // Update local state immediately, then sync to Firestore
  
  const addReceipt = useCallback(async (receipt: Receipt) => {
    // 1. Optimistic Update
    setReceiptsState(prev => [receipt, ...prev]);

    try {
        await setDoc(doc(db, 'users', getUid(), 'receipts', receipt.id), receipt);
    } catch (e) {
        console.error("Failed to save receipt", e);
        // In a production app, we would revert the state or queue this for retry
        alert("Saved locally. Sync failed (Offline).");
    }
  }, [getUid]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated); // Optimistic
    try {
        await setDoc(doc(db, 'users', getUid(), 'config', 'settings'), updated);
    } catch (e) { console.error(e); }
  }, [settings, getUid]);

  const addPrinter = useCallback(async (printer: Printer) => {
    try {
        await setDoc(doc(db, 'users', getUid(), 'printers', printer.id), printer);
    } catch (e) { alert("Failed to save printer."); }
  }, [getUid]);

  const removePrinter = useCallback(async (printerId: string) => {
    try {
        await deleteDoc(doc(db, 'users', getUid(), 'printers', printerId));
    } catch (e) { alert("Failed to delete printer."); }
  }, [getUid]);

  const addItem = useCallback(async (item: Item) => {
    try { 
      await setDoc(doc(db, 'users', getUid(), 'items', item.id), item); 
    } catch (e) { console.error(e); alert("Failed to add item."); }
  }, [getUid]);

  const updateItem = useCallback(async (updatedItem: Item) => {
    try { 
      await setDoc(doc(db, 'users', getUid(), 'items', updatedItem.id), updatedItem); 
    } catch (e) { console.error(e); alert("Failed to update item."); }
  }, [getUid]);

  const deleteItem = useCallback(async (id: string) => {
    try {
        await deleteDoc(doc(db, 'users', getUid(), 'items', id));
    } catch (e) { console.error(e); alert("Failed to delete item."); }
  }, [getUid]);

  const saveTicket = useCallback(async (ticket: SavedTicket) => {
      try { 
        await setDoc(doc(db, 'users', getUid(), 'saved_tickets', ticket.id), ticket); 
      } catch (e) { console.error(e); alert("Failed to save ticket."); }
  }, [getUid]);

  const removeTicket = useCallback(async (ticketId: string) => {
      try { 
        await deleteDoc(doc(db, 'users', getUid(), 'saved_tickets', ticketId));
      } catch (e) { console.error(e); alert("Failed to delete ticket."); }
  }, [getUid]);

  const addCustomGrid = useCallback(async (grid: CustomGrid) => {
      try { 
        await setDoc(doc(db, 'users', getUid(), 'custom_grids', grid.id), grid); 
      } catch (e) { console.error(e); alert("Failed to add custom grid."); }
  }, [getUid]);

  const updateCustomGrid = useCallback(async (grid: CustomGrid) => {
      try { 
        await setDoc(doc(db, 'users', getUid(), 'custom_grids', grid.id), grid);
      } catch (e) { console.error(e); alert("Failed to update custom grid."); }
  }, [getUid]);

  const deleteCustomGrid = useCallback(async (id: string) => {
      try { 
        await deleteDoc(doc(db, 'users', getUid(), 'custom_grids', id));
      } catch (e) { console.error(e); alert("Failed to delete custom grid."); }
  }, [getUid]);

  const setCustomGrids = useCallback(async (newGrids: CustomGrid[]) => {
      const batch = writeBatch(db);
      const gridsCollectionRef = collection(db, 'users', getUid(), 'custom_grids');
      try {
          // Optimistic update could be complex here, relying on listener for now as it's infrequent
          const currentGridIds = customGrids.map(g => g.id);
          const newGridIds = new Set(newGrids.map(g => g.id));
          const gridsToDelete = currentGridIds.filter(id => !newGridIds.has(id));
          
          gridsToDelete.forEach(id => {
              batch.delete(doc(gridsCollectionRef, id));
          });

          newGrids.forEach(grid => {
              batch.set(doc(gridsCollectionRef, grid.id), grid);
          });
          
          await batch.commit();

      } catch (e) {
          console.error("Failed to save grid changes to DB:", e);
          alert("Failed to save grid changes.");
      }
  }, [customGrids, getUid]);

  const replaceItems = useCallback(async (newItems: Item[]) => {
    setIsLoading(true);
    const batch = writeBatch(db);
    const itemsCollectionRef = collection(db, 'users', getUid(), 'items');
    try {
      items.forEach(item => batch.delete(doc(itemsCollectionRef, item.id)));
      newItems.forEach(item => batch.set(doc(itemsCollectionRef, item.id), item));
      await batch.commit();
    } catch (e) {
      alert("Failed to import items. Data unchanged.");
    } finally {
      setIsLoading(false);
    }
  }, [items, getUid]);

  const exportItemsCsv = useCallback(() => {
    try {
      const csvString = exportItemsToCsv(items);
      const fileName = `pos_items_${Date.now()}.csv`;
  
      if (Capacitor.isNativePlatform()) {
        Filesystem.writeFile({
          path: fileName,
          data: csvString,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        }).then(result => {
           Share.share({ url: result.uri });
        }).catch(error => alert(`Export Failed: ${error.message}`));
      } else {
        const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvString);
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) { alert("Error generating CSV."); }
  }, [items]);
  
  const exportData = useCallback(async () => {
    const backup: BackupData = {
        version: '2.0-opt', timestamp: new Date().toISOString(),
        settings, items, categories: [], printers, receipts, savedTickets, customGrids
    };
    const jsonString = JSON.stringify(backup, null, 2);
    const fileName = `pos_backup_${Date.now()}.json`;

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({ path: fileName, data: jsonString, directory: Directory.Documents, encoding: Encoding.UTF8 });
        await Share.share({ url: result.uri });
      } catch (error: any) { alert(`Export Failed: ${error.message}`); }
    } else {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }, [settings, items, printers, receipts, savedTickets, customGrids]);

  const restoreData = useCallback(async (data: BackupData) => {
      setIsLoading(true);
      const uid = getUid();
      try {
          await clearAllData(uid);
          const batch = writeBatch(db);
          batch.set(doc(db, 'users', uid, 'config', 'settings'), data.settings);
          (data.items || []).forEach(item => batch.set(doc(db, 'users', uid, 'items', item.id), item));
          (data.printers || []).forEach(p => batch.set(doc(db, 'users', uid, 'printers', p.id), p));
          (data.receipts || []).forEach(r => batch.set(doc(db, 'users', uid, 'receipts', r.id), {...r, date: new Date(r.date)}));
          (data.savedTickets || []).forEach(t => batch.set(doc(db, 'users', uid, 'saved_tickets', t.id), t));
          (data.customGrids || []).forEach(g => batch.set(doc(db, 'users', uid, 'custom_grids', g.id), g));
          await batch.commit();
      } catch(e) { console.error(e); alert("Restore failed."); } finally { setIsLoading(false); }
  }, [getUid]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);
  
  if (initializationError) return <FirebaseError error={initializationError} />;

  return (
    <AppContext.Provider value={{ 
      user, signOut: signOutUser,
      isDrawerOpen, openDrawer, closeDrawer, toggleDrawer, 
      headerTitle, setHeaderTitle,
      theme, setTheme,
      isLoading,
      settings, updateSettings,
      printers, addPrinter, removePrinter,
      receipts, addReceipt, loadMoreReceipts, hasMoreReceipts,
      items, addItem, updateItem, deleteItem,
      savedTickets, saveTicket, removeTicket,
      customGrids, addCustomGrid, updateCustomGrid, deleteCustomGrid, setCustomGrids,
      exportData, restoreData, exportItemsCsv, replaceItems
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

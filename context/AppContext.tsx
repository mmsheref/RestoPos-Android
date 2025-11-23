
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Printer, Receipt, Item, AppSettings, BackupData, SavedTicket, CustomGrid } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import * as DB from '../db/db';
import { exportItemsToCsv } from '../utils/csvHelper';

type Theme = 'light' | 'dark';

const DEFAULT_SETTINGS: AppSettings = { taxEnabled: true, taxRate: 5, storeName: 'My Restaurant' };

interface AppContextType {
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
  
  items: Item[];
  addItem: (item: Item) => void;
  updateItem: (item: Item) => void;
  deleteItem: (id: string) => void;
  
  categories: string[];
  setCategories: (categories: string[]) => void; 
  addCategory: (name: string) => void;

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
  replaceItemsAndCategories: (items: Item[], newCategories: string[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
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
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [printers, setPrintersState] = useState<Printer[]>([]);
  const [receipts, setReceiptsState] = useState<Receipt[]>([]);
  const [items, setItemsState] = useState<Item[]>([]);
  const [categories, setCategoriesState] = useState<string[]>([]);
  const [savedTickets, setSavedTicketsState] = useState<SavedTicket[]>([]);
  const [customGrids, setCustomGridsState] = useState<CustomGrid[]>([]);
  
  // --- Initialize & Load Data ---
  useEffect(() => {
    const initData = async () => {
      try {
        await DB.initDB();
        
        const [
            loadedItems, loadedReceipts, loadedPrinters, 
            loadedSettings, loadedCategories, loadedTickets, loadedGrids
        ] = await Promise.all([
            DB.getAllItems(), DB.getAllReceipts(), DB.getAllPrinters(),
            DB.getSettings(), DB.getCategories(), DB.getAllSavedTickets(),
            DB.getAllCustomGrids()
        ]);

        setItemsState(loadedItems);
        setReceiptsState(loadedReceipts.sort((a,b) => b.date.getTime() - a.date.getTime())); // Sort desc
        setPrintersState(loadedPrinters);
        setSettingsState(loadedSettings || DEFAULT_SETTINGS);
        setCategoriesState(loadedCategories || []);
        setSavedTicketsState(loadedTickets);
        setCustomGridsState(loadedGrids);
        
        // Seed initial settings if none exist
        if (!loadedSettings) {
             await DB.saveSettings(DEFAULT_SETTINGS);
        }

      } catch (e) {
        console.error("Failed to initialize database:", e);
        alert("Critical Error: Database initialization failed. Some features may not work.");
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);


  // --- Logic Wrappers with Robust Error Handling (Optimistic UI) ---

  const addReceipt = useCallback(async (receipt: Receipt) => {
    const prev = receipts;
    setReceiptsState(curr => [receipt, ...curr]);
    try {
        await DB.addReceipt(receipt);
    } catch (e) {
        console.error("Failed to save receipt", e);
        setReceiptsState(prev);
        alert("Failed to save receipt to database.");
    }
  }, [receipts]);

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
    const prev = settings;
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated);
    try {
        await DB.saveSettings(updated);
    } catch (e) {
        setSettingsState(prev);
        console.error("Failed to save settings", e);
    }
  }, [settings]);

  const addPrinter = useCallback(async (printer: Printer) => {
    const prev = printers;
    setPrintersState(curr => [...curr, printer]);
    try {
        await DB.putPrinter(printer);
    } catch (e) {
        setPrintersState(prev);
        alert("Failed to save printer.");
    }
  }, [printers]);

  const removePrinter = useCallback(async (printerId: string) => {
    const prev = printers;
    setPrintersState(curr => curr.filter(p => p.id !== printerId));
    try {
        await DB.deletePrinter(printerId);
    } catch (e) {
        setPrintersState(prev);
        alert("Failed to delete printer.");
    }
  }, [printers]);

  // --- Item Management ---
  const addItem = useCallback(async (item: Item) => {
    setItemsState(curr => [...curr, item]);
    try { await DB.putItem(item); } catch (e) { alert("Failed to add item."); }
  }, []);

  const updateItem = useCallback(async (updatedItem: Item) => {
    setItemsState(curr => curr.map(item => item.id === updatedItem.id ? updatedItem : item));
    try { await DB.putItem(updatedItem); } catch (e) { alert("Failed to update item."); }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
        await DB.deleteItem(id);
        setItemsState(curr => curr.filter(item => item.id !== id));
    } catch (e) {
        alert("Failed to delete item from database. The item will reappear on refresh.");
    }
  }, []);

  // --- Category Management ---
  const setCategories = useCallback(async (newCategories: string[]) => {
      try {
        await DB.saveCategories(newCategories);
        setCategoriesState(newCategories);
      } catch (e) {
          alert("Failed to update categories.");
      }
  }, []);

  const addCategory = useCallback(async (name: string) => {
      if (categories.includes(name)) return;
      const newCats = [...categories, name];
      try {
          await DB.saveCategories(newCats);
          setCategoriesState(newCats);
      } catch (e) {
          alert("Failed to save category.");
      }
  }, [categories]);

  // --- Ticket Management ---
  const saveTicket = useCallback(async (ticket: SavedTicket) => {
      setSavedTicketsState(curr => {
          const exists = curr.find(t => t.id === ticket.id);
          return exists ? curr.map(t => t.id === ticket.id ? ticket : t) : [...curr, ticket];
      });
      try { await DB.putSavedTicket(ticket); } catch (e) { alert("Failed to save ticket."); }
  }, []);

  const removeTicket = useCallback(async (ticketId: string) => {
      setSavedTicketsState(curr => curr.filter(t => t.id !== ticketId));
      try { await DB.deleteSavedTicket(ticketId); } catch (e) { alert("Failed to delete ticket."); }
  }, []);

  // --- Custom Grid Management ---
  const addCustomGrid = useCallback(async (grid: CustomGrid) => {
      setCustomGridsState(curr => [...curr, grid]);
      try { await DB.putCustomGrid(grid); } catch (e) { alert("Failed to add custom grid."); }
  }, []);

  const updateCustomGrid = useCallback(async (grid: CustomGrid) => {
      setCustomGridsState(curr => curr.map(g => g.id === grid.id ? grid : g));
      try { await DB.putCustomGrid(grid); } catch (e) { alert("Failed to update custom grid."); }
  }, []);

  const deleteCustomGrid = useCallback(async (id: string) => {
      setCustomGridsState(curr => curr.filter(g => g.id !== id));
      try { await DB.deleteCustomGrid(id); } catch (e) { alert("Failed to delete custom grid."); }
  }, []);

  const setCustomGrids = useCallback(async (grids: CustomGrid[]) => {
      setCustomGridsState(grids);
      try {
          // This needs to be transactional
          for (const grid of grids) {
              await DB.putCustomGrid(grid);
          }
      } catch (e) {
          alert("Failed to save grid order.");
      }
  }, []);


  // --- CSV Import/Export ---
  const replaceItemsAndCategories = useCallback(async (newItems: Item[], newCategories: string[]) => {
    setIsLoading(true);
    try {
      const existingCategories = await DB.getCategories() || [];
      const combinedCategories = Array.from(new Set([...existingCategories, ...newCategories]));
      await DB.replaceAllItems(newItems);
      await DB.saveCategories(combinedCategories);
      setItemsState(newItems);
      setCategoriesState(combinedCategories);
    } catch (e) {
      alert("Failed to import items from CSV. Data has not been changed.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportItemsCsv = useCallback(() => {
    try {
      const csvString = exportItemsToCsv(items);
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `pos_items_export_${dateStr}.csv`;
  
      if (Capacitor.isNativePlatform()) {
        Filesystem.writeFile({
          path: fileName,
          data: csvString,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        }).then(result => {
           Share.share({ url: result.uri });
        }).catch(error => {
          alert(`CSV Export Failed: ${error.message || error}`);
        });
      } else {
        const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvString);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", fileName);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
    } catch (e) {
      alert("An error occurred while generating the CSV file.");
    }
  }, [items]);
  
  // --- Backup & Restore ---
  const exportData = useCallback(async () => {
    const backup: BackupData = {
        version: '2.0', timestamp: new Date().toISOString(),
        settings, items, categories, printers, receipts, savedTickets, customGrids
    };
    const jsonString = JSON.stringify(backup, null, 2);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `pos_backup_${dateStr}.json`;

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({ path: fileName, data: jsonString, directory: Directory.Documents, encoding: Encoding.UTF8 });
        await Share.share({ url: result.uri });
      } catch (error: any) {
        alert(`Export Failed: ${error.message || error}`);
      }
    } else {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", fileName);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  }, [settings, items, categories, printers, receipts, savedTickets, customGrids]);

  const restoreData = useCallback(async (data: BackupData) => {
      setIsLoading(true);
      try {
          await DB.clearDatabase();
          
          const restoredReceipts = (data.receipts || []).map(r => ({ ...r, date: new Date(r.date) }));

          // Bulk Insert to DB
          await DB.saveSettings(data.settings);
          await DB.saveCategories(data.categories);
          for(const p of (data.printers || [])) await DB.putPrinter(p);
          for(const i of (data.items || [])) await DB.putItem(i);
          for(const r of restoredReceipts) await DB.addReceipt(r);
          for(const t of (data.savedTickets || [])) await DB.putSavedTicket(t);
          for(const g of (data.customGrids || [])) await DB.putCustomGrid(g);

          // Update State
          setSettingsState(data.settings);
          setItemsState(data.items || []);
          setCategoriesState(data.categories || []);
          setPrintersState(data.printers || []);
          setReceiptsState(restoredReceipts);
          setSavedTicketsState(data.savedTickets || []);
          setCustomGridsState(data.customGrids || []);

      } catch(e) {
          alert("Failed to restore data from backup.");
      } finally {
          setIsLoading(false);
      }
  }, []);


  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);
  
  if (isLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
             <div className="text-center">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                 <p className="text-gray-600 dark:text-gray-400">Loading Database...</p>
             </div>
          </div>
      )
  }

  return (
    <AppContext.Provider value={{ 
      isDrawerOpen, openDrawer, closeDrawer, toggleDrawer, 
      headerTitle, setHeaderTitle,
      theme, setTheme,
      isLoading,
      settings, updateSettings,
      printers, addPrinter, removePrinter,
      receipts, addReceipt,
      items, addItem, updateItem, deleteItem,
      categories, setCategories, addCategory,
      savedTickets, saveTicket, removeTicket,
      customGrids, addCustomGrid, updateCustomGrid, deleteCustomGrid, setCustomGrids,
      exportData, restoreData,
      exportItemsCsv, replaceItemsAndCategories
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

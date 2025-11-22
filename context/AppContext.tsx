
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Printer, Receipt, Item, AppSettings, BackupData } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

type Theme = 'light' | 'dark';

// --- Initial Seed Data ---
const INITIAL_CATEGORIES = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Sides'];

const INITIAL_ITEMS: Item[] = [
    { id: 'a1', name: 'Spring Rolls', price: 150.00, category: 'Appetizers', stock: 100, imageUrl: 'https://picsum.photos/id/10/200/200' },
    { id: 'a2', name: 'Garlic Bread', price: 120.00, category: 'Appetizers', stock: 100, imageUrl: 'https://picsum.photos/id/20/200/200' },
    { id: 'm1', name: 'Steak Frites', price: 650.00, category: 'Main Courses', stock: 50, imageUrl: 'https://picsum.photos/id/40/200/200' },
    { id: 'm2', name: 'Veg Noodles', price: 250.00, category: 'Main Courses', stock: 60, imageUrl: 'https://picsum.photos/id/50/200/200' },
    { id: 'd1', name: 'Cheesecake', price: 220.00, category: 'Desserts', stock: 20, imageUrl: 'https://picsum.photos/id/70/200/200' },
    { id: 'b1', name: 'Coke', price: 60.00, category: 'Beverages', stock: 200, imageUrl: 'https://picsum.photos/id/90/200/200' },
];

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
  setCategories: (categories: string[]) => void; // For reordering/renaming
  addCategory: (name: string) => void;

  // Backup
  exportData: () => void;
  restoreData: (data: BackupData) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  
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

  // --- Persistent State (The "Database") ---
  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', { taxEnabled: true, taxRate: 5, storeName: 'My Restaurant' });
  const [printers, setPrinters] = useLocalStorage<Printer[]>('printers', []);
  const [receipts, setReceipts] = useLocalStorage<Receipt[]>('receipts', []);
  const [items, setItems] = useLocalStorage<Item[]>('items', INITIAL_ITEMS);
  const [categories, setCategoriesState] = useLocalStorage<string[]>('categories', INITIAL_CATEGORIES);
  
  // Memoize receipts to parse date strings from localStorage into Date objects
  const parsedReceipts = useMemo(() => {
    return receipts.map(r => ({...r, date: new Date(r.date)}));
  }, [receipts]);

  const addReceipt = useCallback((receipt: Receipt) => {
    setReceipts(prev => [receipt, ...prev]);
    // Optional: Deduct stock logic could go here
  }, [setReceipts]);

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

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  const addPrinter = useCallback((printer: Printer) => {
    setPrinters(prev => [...prev, printer]);
  }, [setPrinters]);

  const removePrinter = useCallback((printerId: string) => {
    setPrinters(prev => prev.filter(p => p.id !== printerId));
  }, [setPrinters]);

  // --- Item Management ---
  const addItem = useCallback((item: Item) => {
    setItems(prev => [...prev, item]);
  }, [setItems]);

  const updateItem = useCallback((updatedItem: Item) => {
    setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  }, [setItems]);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, [setItems]);

  // --- Category Management ---
  const setCategories = useCallback((newCategories: string[]) => {
      setCategoriesState(newCategories);
  }, [setCategoriesState]);

  const addCategory = useCallback((name: string) => {
      setCategoriesState(prev => {
          if (prev.includes(name)) return prev;
          return [...prev, name];
      });
  }, [setCategoriesState]);


  // --- Backup & Restore ---
  const exportData = useCallback(() => {
    const backup: BackupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        settings,
        items,
        categories,
        printers,
        receipts
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const date = new Date().toISOString().slice(0, 10);
    downloadAnchorNode.setAttribute("download", `pos_backup_${date}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [settings, items, categories, printers, receipts]);

  const restoreData = useCallback((data: BackupData) => {
      setSettings(data.settings);
      setItems(data.items);
      setCategoriesState(data.categories);
      setPrinters(data.printers || []);
      setReceipts(data.receipts || []);
  }, [setSettings, setItems, setCategoriesState, setPrinters, setReceipts]);


  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);
  
  return (
    <AppContext.Provider value={{ 
      isDrawerOpen, openDrawer, closeDrawer, toggleDrawer, 
      headerTitle, setHeaderTitle,
      theme, setTheme,
      settings, updateSettings,
      printers, addPrinter, removePrinter,
      receipts: parsedReceipts, addReceipt,
      items, addItem, updateItem, deleteItem,
      categories, setCategories, addCategory,
      exportData, restoreData
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

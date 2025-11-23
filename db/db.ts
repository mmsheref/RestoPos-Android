import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Item, Receipt, Printer, AppSettings, SavedTicket, CustomGrid } from '../types';

interface POSDB extends DBSchema {
  items: {
    key: string;
    value: Item;
  };
  receipts: {
    key: string;
    value: Receipt;
    indexes: { 'by-date': Date };
  };
  printers: {
    key: string;
    value: Printer;
  };
  config: {
    key: string;
    value: any;
  };
  saved_tickets: {
    key: string;
    value: SavedTicket;
  };
  custom_grids: {
    key: string;
    value: CustomGrid;
  };
}

const DB_NAME = 'pos_db';
const DB_VERSION = 10; // Bumped for custom grids

let dbPromise: Promise<IDBPDatabase<POSDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<POSDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains('items')) {
          db.createObjectStore('items', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('receipts')) {
          const receiptStore = db.createObjectStore('receipts', { keyPath: 'id' });
          receiptStore.createIndex('by-date', 'date');
        }
        if (!db.objectStoreNames.contains('printers')) {
          db.createObjectStore('printers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config');
        }
        if (!db.objectStoreNames.contains('saved_tickets')) {
          db.createObjectStore('saved_tickets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('custom_grids')) {
          db.createObjectStore('custom_grids', { keyPath: 'id' });
        }
      },
      terminated() {
          console.error("DB Connection Terminated unexpectedly.");
      },
    });
  }
  return dbPromise;
};

// --- Item CRUD ---
export const getAllItems = async () => (await initDB()).getAll('items');
export const putItem = async (item: Item) => (await initDB()).put('items', item);

export const deleteItem = async (id: string) => {
  const db = await initDB();
  try {
    const tx = db.transaction('items', 'readwrite');
    await tx.objectStore('items').delete(id);
    await tx.done;
  } catch (error) {
    console.error(`[DB] Error during delete transaction for ID ${id}:`, error);
    throw error;
  }
};

// --- Receipt CRUD ---
export const getAllReceipts = async () => (await initDB()).getAllFromIndex('receipts', 'by-date');
export const addReceipt = async (receipt: Receipt) => (await initDB()).add('receipts', receipt);

// --- Printer CRUD ---
export const getAllPrinters = async () => (await initDB()).getAll('printers');
export const putPrinter = async (printer: Printer) => (await initDB()).put('printers', printer);
export const deletePrinter = async (id: string) => (await initDB()).delete('printers', id);

// --- Config (Settings & Categories) ---
export const getSettings = async (): Promise<AppSettings | undefined> => (await initDB()).get('config', 'settings');
export const saveSettings = async (settings: AppSettings) => (await initDB()).put('config', settings, 'settings');
export const getCategories = async (): Promise<string[] | undefined> => (await initDB()).get('config', 'categories');
export const saveCategories = async (categories: string[]) => (await initDB()).put('config', categories, 'categories');

// --- Saved Tickets ---
export const getAllSavedTickets = async () => (await initDB()).getAll('saved_tickets');
export const putSavedTicket = async (ticket: SavedTicket) => (await initDB()).put('saved_tickets', ticket);
export const deleteSavedTicket = async (id: string) => (await initDB()).delete('saved_tickets', id);

// --- Custom Grids ---
export const getAllCustomGrids = async () => (await initDB()).getAll('custom_grids');
export const putCustomGrid = async (grid: CustomGrid) => (await initDB()).put('custom_grids', grid);
export const deleteCustomGrid = async (id: string) => (await initDB()).delete('custom_grids', id);


// --- Bulk Ops ---
export const replaceAllItems = async (items: Item[]) => {
    const db = await initDB();
    const tx = db.transaction('items', 'readwrite');
    await tx.objectStore('items').clear();
    for (const item of items) {
        tx.objectStore('items').put(item);
    }
    await tx.done;
};

export const clearDatabase = async () => {
    const db = await initDB();
    const storeNames = ['items', 'receipts', 'printers', 'config', 'saved_tickets', 'custom_grids'] as const;
    for (const storeName of storeNames) {
        await db.clear(storeName);
    }
}


import { Receipt } from '../types';

const DB_NAME = 'restaurant_pos_db';
const DB_VERSION = 1;
const STORE_NAME = 'receipts';

/**
 * Opens the IndexedDB database.
 * Creates the object store if it doesn't exist.
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Create the 'receipts' store, using 'id' as the primary key
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const idb = {
  /**
   * Retrieves all receipts from the local database.
   * Returns them sorted by date (newest first).
   * WARNING: Use carefully with large datasets.
   */
  getAllReceipts: async (): Promise<Receipt[]> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const results = request.result as Receipt[];
                // Sort in memory after retrieval
                results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                resolve(results);
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Failed to get receipts from IDB", error);
        return [];
    }
  },

  /**
   * Retrieves only the most recent receipts.
   * Uses a cursor to avoid loading the entire database into memory.
   * Assumes ID generation (R + Timestamp) correlates with time, or simply returns latest added.
   */
  getRecentReceipts: async (limit: number): Promise<Receipt[]> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const results: Receipt[] = [];
            
            // Open cursor in 'prev' direction to get last keys (newest) first
            // Note: This relies on IDs being somewhat chronological or inserted in order. 
            // Since IDs are R{Timestamp}, they sort correctly as strings for time.
            const request = store.openCursor(null, 'prev');

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
                if (cursor && results.length < limit) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Failed to get recent receipts from IDB", error);
        return [];
    }
  },

  /**
   * Saves a single receipt to the local database.
   * Updates it if it already exists.
   */
  saveReceipt: async (receipt: Receipt): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(receipt);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Failed to save receipt to IDB", error);
    }
  },

  /**
   * Efficiently saves multiple receipts in a single transaction.
   * Used when syncing batch updates from Firebase.
   */
  saveBulkReceipts: async (receipts: Receipt[]): Promise<void> => {
    if (receipts.length === 0) return;
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            receipts.forEach(receipt => {
                store.put(receipt);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error("Failed to bulk save to IDB", error);
    }
  },

  /**
   * Deletes a receipt by ID.
   */
  deleteReceipt: async (id: string): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Failed to delete from IDB", error);
    }
  },
  
  /**
   * Clears all data (Used on logout/restore)
   */
  clearAll: async (): Promise<void> => {
      try {
          const db = await openDB();
          return new Promise((resolve, reject) => {
              const transaction = db.transaction(STORE_NAME, 'readwrite');
              const store = transaction.objectStore(STORE_NAME);
              store.clear();
              transaction.oncomplete = () => resolve();
          });
      } catch (error) {
          console.error("Failed to clear IDB", error);
      }
  }
};

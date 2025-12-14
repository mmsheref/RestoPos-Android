
import { Receipt } from '../types';

const DB_NAME = 'restaurant_pos_db';
// Bumping version to trigger schema upgrade (adding index)
const DB_VERSION = 2;
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
      const transaction = (event.target as IDBOpenDBRequest).transaction;
      
      let store: IDBObjectStore;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Create the 'receipts' store, using 'id' as the primary key
        store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      } else {
        // Retrieve existing store for modification
        store = transaction!.objectStore(STORE_NAME);
      }

      // Create 'date' index for range queries if it doesn't exist
      if (!store.indexNames.contains('date')) {
          store.createIndex('date', 'date', { unique: false });
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
   * Retrieves all receipts.
   * WARNING: High memory usage. Only use for backups.
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
   * Efficiently fetches receipts within a specific date range using the IDB Index.
   * This is O(log n) + k, vastly faster than loading all and filtering in memory.
   */
  getReceiptsByDateRange: async (start: Date, end: Date): Promise<Receipt[]> => {
      try {
          const db = await openDB();
          return new Promise((resolve, reject) => {
              const transaction = db.transaction(STORE_NAME, 'readonly');
              const store = transaction.objectStore(STORE_NAME);
              const index = store.index('date');
              const range = IDBKeyRange.bound(start, end);
              const request = index.getAll(range);

              request.onsuccess = () => {
                  const results = request.result as Receipt[];
                  // Sort newest first
                  results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  resolve(results);
              };
              
              request.onerror = () => reject(request.error);
          });
      } catch (error) {
          console.error("Failed to get range receipts", error);
          return [];
      }
  },

  /**
   * Retrieves only the most recent receipts.
   */
  getRecentReceipts: async (limit: number): Promise<Receipt[]> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const results: Receipt[] = [];
            
            // Open cursor in 'prev' direction to get last keys (newest) first
            // Note: We use the 'date' index now if available, otherwise fallback to store (id)
            // Using 'date' index ensures true chronological order regardless of ID format
            let request: IDBRequest;
            if (store.indexNames.contains('date')) {
                request = store.index('date').openCursor(null, 'prev');
            } else {
                request = store.openCursor(null, 'prev');
            }

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
   * Efficiently saves multiple receipts.
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
   * Clears all data.
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

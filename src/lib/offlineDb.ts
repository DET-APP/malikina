/**
 * IndexedDB wrapper for offline-first data persistence
 * Stores xassidas, verses, and metadata for offline access
 */

const DB_NAME = 'malikina-offline';
const DB_VERSION = 1;

interface CachedData {
  id: string;
  type: 'xassida' | 'verses' | 'audios' | 'authors';
  data: any;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

let db: IDBDatabase | null = null;

export const initOfflineDb = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[OfflineDB] Failed to open database');
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('[OfflineDB] Database opened successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!database.objectStoreNames.contains('cache')) {
        const store = database.createObjectStore('cache', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!database.objectStoreNames.contains('metadata')) {
        database.createObjectStore('metadata', { keyPath: 'key' });
      }

      console.log('[OfflineDB] Database schema created');
    };
  });
};

/**
 * Cache data in IndexedDB
 */
export const cacheData = async (
  type: 'xassida' | 'verses' | 'audios' | 'authors',
  id: string,
  data: any,
  ttl?: number
): Promise<void> => {
  try {
    const database = await initOfflineDb();
    const transaction = database.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');

    const cacheEntry: CachedData = {
      id: `${type}:${id}`,
      type,
      data,
      timestamp: Date.now(),
      ttl
    };

    await new Promise((resolve, reject) => {
      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });

    console.log(`[OfflineDB] Cached ${type}:${id}`);
  } catch (error) {
    console.error(`[OfflineDB] Failed to cache data:`, error);
  }
};

/**
 * Retrieve cached data from IndexedDB
 */
export const getCachedData = async (
  type: 'xassida' | 'verses' | 'audios' | 'authors',
  id: string
): Promise<any | null> => {
  try {
    const database = await initOfflineDb();
    const transaction = database.transaction('cache', 'readonly');
    const store = transaction.objectStore('cache');

    return new Promise((resolve, reject) => {
      const request = store.get(`${type}:${id}`);
      request.onsuccess = () => {
        const entry = request.result as CachedData | undefined;
        
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if cache has expired (TTL)
        if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
          // Delete expired entry
          store.delete(entry.id);
          resolve(null);
          return;
        }

        resolve(entry.data);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`[OfflineDB] Failed to retrieve cached data:`, error);
    return null;
  }
};

/**
 * Get all cached items of a specific type
 */
export const getCachedByType = async (
  type: 'xassida' | 'verses' | 'audios' | 'authors'
): Promise<any[]> => {
  try {
    const database = await initOfflineDb();
    const transaction = database.transaction('cache', 'readonly');
    const store = transaction.objectStore('cache');
    const index = store.index('type');

    return new Promise((resolve, reject) => {
      const request = index.getAll(type);
      request.onsuccess = () => {
        const entries = request.result as CachedData[];
        const validEntries = entries
          .filter((entry) => {
            // Remove expired entries
            if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
              store.delete(entry.id);
              return false;
            }
            return true;
          })
          .map((entry) => entry.data);
        
        resolve(validEntries);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`[OfflineDB] Failed to retrieve cached items:`, error);
    return [];
  }
};

/**
 * Clear all cache
 */
export const clearOfflineCache = async (): Promise<void> => {
  try {
    const database = await initOfflineDb();
    const transaction = database.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        console.log('[OfflineDB] Cache cleared');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`[OfflineDB] Failed to clear cache:`, error);
  }
};

/**
 * Get cache size in bytes
 */
export const getCacheSize = async (): Promise<number> => {
  try {
    const database = await initOfflineDb();
    const transaction = database.transaction('cache', 'readonly');
    const store = transaction.objectStore('cache');

    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const entries = request.result as CachedData[];
        const size = entries.reduce((acc, entry) => {
          return acc + JSON.stringify(entry).length;
        }, 0);
        resolve(size);
      };
      request.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
};

/**
 * Store metadata (like sync timestamps)
 */
export const setMetadata = async (key: string, value: any): Promise<void> => {
  try {
    const database = await initOfflineDb();
    const transaction = database.transaction('metadata', 'readwrite');
    const store = transaction.objectStore('metadata');

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`[OfflineDB] Failed to set metadata:`, error);
  }
};

/**
 * Get metadata
 */
export const getMetadata = async (key: string): Promise<any> => {
  try {
    const database = await initOfflineDb();
    const transaction = database.transaction('metadata', 'readonly');
    const store = transaction.objectStore('metadata');

    return new Promise((resolve) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const entry = request.result as any;
        resolve(entry?.value ?? null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

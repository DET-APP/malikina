import { useEffect, useState, useCallback } from 'react';
import { cacheData, getCachedData, initOfflineDb } from '@/lib/offlineDb';

interface UseOfflineOptions {
  cacheKey?: string;
  ttl?: number; // Time to live in milliseconds (default: 7 days)
}

/**
 * Hook to detect online/offline status and manage offline-first data fetching
 */
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[Offline] Going online');
      setIsOnline(true);
      setIsSynced(false); // Trigger re-sync
    };

    const handleOffline = () => {
      console.log('[Offline] Going offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isSynced, setIsSynced };
};

/**
 * Wrap a fetch call with offline-first caching
 * Returns cached data if offline, fetches if online
 */
export const useFetchWithCache = async <T,>(
  url: string,
  options: UseOfflineOptions = {}
): Promise<T | null> => {
  const { cacheKey = url, ttl = 7 * 24 * 60 * 60 * 1000 } = options; // 7 days default

  try {
    await initOfflineDb();

    // Try to fetch from network
    if (navigator.onLine) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          
          // Cache the fresh data
          cacheData('xassida', cacheKey, data, ttl).catch(() => {});
          
          return data as T;
        }
      } catch (error) {
        console.warn(`[Offline] Network fetch failed for ${url}:`, error);
      }
    }

    // Fall back to cache
    const cached = await getCachedData('xassida', cacheKey);
    if (cached) {
      console.log(`[Offline] Using cached data for ${cacheKey}`);
      return cached as T;
    }

    return null;
  } catch (error) {
    console.error(`[Offline] Error in useFetchWithCache:`, error);
    return null;
  }
};

/**
 * Initialize offline support and warm up cache
 * Call this from App.tsx on mount
 */
export const useOfflineInit = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize IndexedDB
        await initOfflineDb();
        console.log('[Offline] Offline database initialized');

        // Load critical data into cache
        const apiUrl = import.meta.env.VITE_API_URL || 
          (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://165-245-211-201.sslip.io/api');

        // Pre-cache xassidas list
        if (navigator.onLine) {
          fetch(`${apiUrl}/xassidas`)
            .then(r => r.json())
            .then(data => {
              cacheData('xassida', 'all-xassidas', data, 24 * 60 * 60 * 1000);
              console.log('[Offline] Pre-cached xassidas');
            })
            .catch(err => console.warn('[Offline] Failed to pre-cache xassidas:', err));
        }

        setIsReady(true);
      } catch (error) {
        console.error('[Offline] Initialization failed:', error);
        setIsReady(true); // Still ready, just without offline support
      }
    };

    init();
  }, []);

  return isReady;
};

/**
 * Send a message to the service worker to cache specific URLs
 * Useful for pre-caching videos, audios, etc.
 */
export const preCacheUrls = (urls: string[]) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.controller?.postMessage({
      type: 'CACHE_URLS',
      urls
    });
  }
};

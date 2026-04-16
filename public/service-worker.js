// Service Worker for Al Moutahabbina Fillahi PWA - Offline First
const CACHE_VERSION = 'v2';
const CACHE_NAME = `malikina-assets-${CACHE_VERSION}`;
const API_CACHE = `malikina-api-${CACHE_VERSION}`;
const AUDIO_CACHE = `malikina-audio-${CACHE_VERSION}`;

// Static assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/robots.txt'
];

// ─── Install: Cache essential assets ───
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Install failed:', err))
  );
});

// ─── Activate: Clean old caches ───
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.map((name) => {
          if (![CACHE_NAME, API_CACHE, AUDIO_CACHE].includes(name)) {
            console.log('[SW] Cleaning old cache:', name);
            return caches.delete(name);
          }
        })
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch: Smart caching strategies ───
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET, cross-origin
  if (event.request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // ── API data: Stale-while-revalidate ──
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.match(event.request)
        .then((cached) => {
          // Return cached immediately while fetching fresh data
          const fetchPromise = fetch(event.request)
            .then((response) => {
              if (response && response.status === 200) {
                const clone = response.clone();
                caches.open(API_CACHE)
                  .then((cache) => cache.put(event.request, clone));
              }
              return response;
            })
            .catch(() => cached || new Response('Offline', { status: 503 }));
          
          return cached || fetchPromise;
        })
    );
    return;
  }

  // ── Audio/Video: Cache-first with network fallback ──
  if (/\.(mp3|wav|m4a|ogg|webm|mp4)$/i.test(url.pathname) || 
      url.hostname.includes('youtube.com') || 
      url.hostname.includes('youtu.be')) {
    event.respondWith(
      caches.match(event.request)
        .then((cached) => {
          if (cached) return cached;
          
          return fetch(event.request)
            .then((response) => {
              if (response && response.status === 200) {
                const clone = response.clone();
                caches.open(AUDIO_CACHE)
                  .then((cache) => cache.put(event.request, clone));
              }
              return response;
            })
            .catch(() => new Response('Audio not available offline', { status: 503 }));
        })
    );
    return;
  }

  // ── Static assets: Cache-first ──
  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) return cached;
        
        return fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => caches.match('/index.html'));
      })
  );
});

// ─── Message handler: Force cache update ───
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(API_CACHE)
      .then((cache) => {
        urls.forEach((url) => {
          fetch(url)
            .then((response) => {
              if (response && response.status === 200) {
                cache.put(url, response.clone());
              }
            })
            .catch(() => console.warn('[SW] Failed to cache:', url));
        });
      });
  }
});

    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].url === url && 'focus' in clientList[i]) {
            return clientList[i].focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

console.log('[Service Worker] Script loaded');

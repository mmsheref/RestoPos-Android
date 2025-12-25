
const CACHE_NAME = 'pos-core-v7';

/**
 * PAKKA OFFLINE STRATEGY
 * 1. Critical CDNs (Tailwind, React) are cached forever (Cache-First).
 * 2. App logic (HTML, JS) is Network-First to allow updates, with instant offline fallback.
 * 3. Data APIs (Firebase) are EXCLUDED to prevent storage bloat and lag.
 */

const PRE_CACHE = [
  './',
  'index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRE_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clear old versions
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // CRITICAL: Never cache Firebase/Firestore API calls. 
  // Caching these causes synchronization lag and memory leaks.
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebase')) {
    return;
  }

  // Strategy: Cache-First for stable CDNs
  const isCDN = 
    url.hostname.includes('aistudiocdn.com') || 
    url.hostname.includes('tailwindcss.com') || 
    url.hostname.includes('esm.sh');

  if (isCDN) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          if (!response || response.status !== 200) return response;
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
    );
    return;
  }

  // Strategy: Network-First for local app logic
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
          return caches.match(event.request).then(cached => {
              if (cached) return cached;
              // If it's a navigation request and we are offline, show the cached app Shell
              if (event.request.mode === 'navigate') {
                  return caches.match('index.html');
              }
          });
      })
  );
});


const CACHE_NAME = 'pos-core-v8';

/**
 * PAKKA OFFLINE STRATEGY
 * 1. Critical CDNs (Tailwind, React) are cached forever (Cache-First).
 * 2. App logic (HTML, JS) is Network-First to allow updates, with instant offline fallback.
 * 3. Data APIs (Firebase) are EXCLUDED to prevent storage bloat and lag.
 */

// List of critical assets that MUST be available for the app to render correctly offline.
const CRITICAL_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  // UI Framework
  'https://cdn.tailwindcss.com',
  // Core Libraries (from importmap)
  'https://aistudiocdn.com/react@^19.2.1',
  'https://aistudiocdn.com/react-dom@^19.2.1/',
  'https://aistudiocdn.com/firebase@^12.6.0/',
  'https://aistudiocdn.com/vite@^7.2.7',
  'https://aistudiocdn.com/@vitejs/plugin-react@^5.1.1',
  // Capacitor Core & Plugins
  'https://aistudiocdn.com/@capacitor/core@^7.4.4',
  'https://aistudiocdn.com/@capacitor/filesystem@^7.1.5',
  'https://aistudiocdn.com/@capacitor/share@^7.0.2',
  'https://aistudiocdn.com/@capacitor/app@^7.0.0',
  'https://aistudiocdn.com/react-router-dom@^7.10.1',
  'https://aistudiocdn.com/@capacitor/local-notifications@^7.0.0',
  'https://esm.sh/@capacitor/status-bar@^8.0.0',
  'https://esm.sh/@capacitor/haptics@^8.0.0'
];

self.addEventListener('install', (event) => {
  // Force this service worker to become the active one immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Pre-caching critical assets...');
      
      // Attempt to cache all critical assets. 
      // We fetch them individually to avoid one failure breaking the entire install.
      const promises = CRITICAL_ASSETS.map(async (url) => {
        try {
          const req = new Request(url, { mode: 'cors' });
          const res = await fetch(req);
          if (res.ok) {
            await cache.put(req, res);
          } else {
            console.warn(`[SW] Failed to cache ${url}: ${res.status}`);
          }
        } catch (e) {
          console.warn(`[SW] Fetch failed during install for ${url}`, e);
        }
      });

      await Promise.all(promises);
    })
  );
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
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebase')) {
    return;
  }

  // Strategy: Cache-First for critical CDNs
  // This ensures that if we have the Tailwind/React file, we use it instantly.
  const isCDN = 
    url.hostname.includes('aistudiocdn.com') || 
    url.hostname.includes('tailwindcss.com') || 
    url.hostname.includes('esm.sh');

  if (isCDN) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        
        // If not in cache, fetch, return, and cache it for next time
        return fetch(event.request).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
            return response;
          }
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

  // Strategy: Network-First for local app logic (HTML, JS bundles)
  // This allows updates to be seen when online, but falls back to cache instantly offline.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update cache with new version
        if (response && response.status === 200 && response.type === 'basic') {
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
              // Fallback for navigation
              if (event.request.mode === 'navigate') {
                  return caches.match('index.html');
              }
          });
      })
  );
});

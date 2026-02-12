
import React, { useEffect, useState } from 'react';

// Must match the list in sw.js roughly, or include all essentials
const CRITICAL_URLS = [
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/react@^19.2.1',
  'https://aistudiocdn.com/react-dom@^19.2.1/',
  'https://aistudiocdn.com/firebase@^12.6.0/',
  'https://aistudiocdn.com/vite@^7.2.7',
  'https://aistudiocdn.com/@vitejs/plugin-react@^5.1.1',
  'https://aistudiocdn.com/@capacitor/core@^7.4.4',
  'https://aistudiocdn.com/@capacitor/filesystem@^7.1.5',
  'https://aistudiocdn.com/@capacitor/share@^7.0.2',
  'https://aistudiocdn.com/@capacitor/app@^7.0.0',
  'https://aistudiocdn.com/react-router-dom@^7.10.1',
  'https://aistudiocdn.com/@capacitor/local-notifications@^7.0.0',
  'https://esm.sh/@capacitor/status-bar@^8.0.0',
  'https://esm.sh/@capacitor/haptics@^8.0.0'
];

const OFFLINE_CACHE_NAME = 'pos-core-v8'; // Keep in sync with sw.js conceptually, though they share storage

/**
 * Headless component that ensures critical assets are cached for offline use.
 * It runs quietly in the background when the app loads.
 */
const OfflineManager: React.FC = () => {
  useEffect(() => {
    const cacheAssets = async () => {
      // Only attempt if online and cache API is available
      if (typeof window === 'undefined' || !('caches' in window) || !navigator.onLine) return;

      try {
        const cache = await caches.open(OFFLINE_CACHE_NAME);
        
        // Check which assets are missing
        const missingAssets = [];
        for (const url of CRITICAL_URLS) {
            const match = await cache.match(url);
            if (!match) {
                missingAssets.push(url);
            }
        }

        if (missingAssets.length > 0) {
            console.log(`[OfflineManager] Downloading ${missingAssets.length} missing assets...`);
            
            await Promise.all(missingAssets.map(async (url) => {
                try {
                    const response = await fetch(url, { mode: 'cors' });
                    if (response.ok) {
                        await cache.put(url, response);
                    }
                } catch (e) {
                    console.warn(`[OfflineManager] Failed to download ${url}`, e);
                }
            }));
            
            console.log('[OfflineManager] Asset download complete.');
        }
      } catch (err) {
        console.error('[OfflineManager] Error in cache routine', err);
      }
    };

    // Run shortly after mount to not block main thread immediately
    const timer = setTimeout(cacheAssets, 3000);
    return () => clearTimeout(timer);
  }, []);

  return null;
};

export default OfflineManager;

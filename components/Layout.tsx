
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Header from './Header';
import NavDrawer from './NavDrawer';
import { useAppContext } from '../context/AppContext';
import { NAV_LINKS } from '../constants';

import SalesScreen from '../screens/SalesScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import ItemsScreen from '../screens/ItemsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AboutScreen from '../screens/AboutScreen';

const SCREEN_TIMEOUT = 10 * 60 * 1000; // 10 Minutes
const SWIPE_THRESHOLD = 50; // Pixels to trigger open
const EDGE_ZONE = 60; // Pixels from left edge to start detection (increased for better sensitivity)
const MAX_VERTICAL_SWIPE = 50; // Max vertical movement allowed during horizontal swipe

const KeepAliveScreen = React.memo(({ isVisible, children }: { isVisible: boolean, children: React.ReactNode }) => {
    return (
        <div 
            className={`flex flex-col h-full w-full absolute inset-0 bg-background transition-opacity duration-200 ${isVisible ? 'opacity-100 z-10' : 'opacity-0 z-[-1] pointer-events-none'}`}
            style={{ visibility: isVisible ? 'visible' : 'hidden' }}
        >
            {children}
        </div>
    );
});

const Layout: React.FC = () => {
  const { isDrawerOpen, openDrawer, closeDrawer } = useAppContext();
  const location = useLocation();
  const { pathname } = location;

  // --- SWIPE GESTURE LOGIC ---
  const touchStart = useRef<{ x: number, y: number } | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    
    // Check if swipe started near the left edge
    if (x <= EDGE_ZONE) {
      touchStart.current = { x, y };
    } else {
      touchStart.current = null;
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    
    const y = e.touches[0].clientY;
    const deltaY = Math.abs(y - touchStart.current.y);
    
    // If user is scrolling vertically, cancel the horizontal swipe gesture
    if (deltaY > MAX_VERTICAL_SWIPE) {
      touchStart.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    
    const x = e.changedTouches[0].clientX;
    const deltaX = x - touchStart.current.x;

    if (deltaX > SWIPE_THRESHOLD && !isDrawerOpen) {
      openDrawer();
    }
    touchStart.current = null;
  };

  // Track last used timestamp for each screen to free up memory
  const [activeScreens, setActiveScreens] = useState<Record<string, number>>({ '/sales': Date.now() });
  
  useEffect(() => {
      setActiveScreens(prev => ({ ...prev, [pathname]: Date.now() }));
  }, [pathname]);

  // Aggressive memory cleanup for Android WebViews
  useEffect(() => {
      const interval = setInterval(() => {
          const now = Date.now();
          setActiveScreens(prev => {
              const next = { ...prev };
              let changed = false;
              Object.keys(next).forEach(path => {
                  // Never unmount Sales; unmount others if inactive
                  if (path !== '/sales' && path !== pathname && now - next[path] > SCREEN_TIMEOUT) {
                      delete next[path];
                      changed = true;
                  }
              });
              return changed ? next : prev;
          });
      }, 60000);
      return () => clearInterval(interval);
  }, [pathname]);

  const displayTitle = useMemo(() => {
      const currentLink = NAV_LINKS.find(link => pathname.startsWith(link.path));
      return currentLink ? currentLink.label : 'Restaurant POS';
  }, [pathname]);
  
  const showDefaultHeader = !['/sales', '/receipts', '/settings', '/items', '/reports', '/about'].includes(pathname); 

  if (!['/sales', '/receipts', '/items', '/settings', '/reports', '/about'].some(p => pathname.startsWith(p))) {
      return <Navigate to="/sales" replace />;
  }

  return (
    <div 
      className="relative h-screen w-full overflow-hidden bg-background text-text-primary flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 
        Dedicated invisible grab zone for swipes. 
        High z-index ensures it captures touches even over scrollable areas.
      */}
      {!isDrawerOpen && (
        <div 
            className="fixed left-0 top-0 bottom-0 w-[25px] z-[100]" 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        />
      )}

      {showDefaultHeader && <Header title={displayTitle} onMenuClick={openDrawer} />}
      <NavDrawer />
      
      <main className="flex-1 relative overflow-hidden">
        <KeepAliveScreen isVisible={pathname === '/sales'}><SalesScreen /></KeepAliveScreen>
        {activeScreens['/receipts'] && <KeepAliveScreen isVisible={pathname === '/receipts'}><ReceiptsScreen /></KeepAliveScreen>}
        {activeScreens['/reports'] && <KeepAliveScreen isVisible={pathname === '/reports'}><ReportsScreen /></KeepAliveScreen>}
        {activeScreens['/items'] && <KeepAliveScreen isVisible={pathname === '/items'}><ItemsScreen /></KeepAliveScreen>}
        {activeScreens['/settings'] && <KeepAliveScreen isVisible={pathname === '/settings'}><SettingsScreen /></KeepAliveScreen>}
        {activeScreens['/about'] && <KeepAliveScreen isVisible={pathname === '/about'}><AboutScreen /></KeepAliveScreen>}
      </main>
    </div>
  );
};

export default Layout;

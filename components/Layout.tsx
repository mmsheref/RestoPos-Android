
import React, { useEffect, useState, useRef, useMemo } from 'react';
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

const SCREEN_TIMEOUT = 10 * 60 * 1000; 

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
  const { isDrawerOpen, openDrawer } = useAppContext();
  const location = useLocation();
  const { pathname } = location;

  const [activeScreens, setActiveScreens] = useState<Record<string, number>>({ '/sales': Date.now() });
  const touchStartRef = useRef<{x: number, y: number, time: number} | null>(null);

  useEffect(() => {
      setActiveScreens(prev => ({ ...prev, [pathname]: Date.now() }));
  }, [pathname]);

  useEffect(() => {
      const interval = setInterval(() => {
          const now = Date.now();
          setActiveScreens(prev => {
              const next = { ...prev };
              let changed = false;
              Object.keys(next).forEach(path => {
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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1 || isDrawerOpen) return;
    touchStartRef.current = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY,
        time: Date.now()
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y);

    // Only trigger if swipe starts near left edge (< 50px)
    // and horizontal movement is dominant
    if (touchStartRef.current.x < 50 && deltaX > 40 && deltaX > deltaY * 1.8) {
        openDrawer();
        touchStartRef.current = null; // Reset to prevent multiple triggers
    }
  };

  const handleTouchEnd = () => { touchStartRef.current = null; };

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


import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Navigate, Routes, Route } from 'react-router-dom';
import Header from './Header';
import NavDrawer from './NavDrawer';
import { useAppContext } from '../context/AppContext';
import { NAV_LINKS } from '../constants';

// Import all screens
import SalesScreen from '../screens/SalesScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import ItemsScreen from '../screens/ItemsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AboutScreen from '../screens/AboutScreen';

const Layout: React.FC = () => {
  const { 
    isDrawerOpen, openDrawer, 
    headerTitle, setHeaderTitle, 
  } = useAppContext();
  const location = useLocation();
  const { pathname } = location;

  // State to track which screens have been visited to lazy-load them
  const [visitedRoutes, setVisitedRoutes] = useState<Record<string, boolean>>({
      '/sales': true // Always load Sales first
  });

  // Swipe Gesture Ref
  const touchStartRef = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
      if (!visitedRoutes[pathname]) {
          setVisitedRoutes(prev => ({ ...prev, [pathname]: true }));
      }
  }, [pathname, visitedRoutes]);

  const currentLink = NAV_LINKS.find(link => pathname.startsWith(link.path));
  const baseTitle = currentLink ? currentLink.label : 'Sales';
  
  // Sales handles its own title. For others, we use the base title.
  const finalTitle = pathname === '/sales' && headerTitle ? headerTitle : baseTitle;
  
  // Determine which screens need a default header.
  const showDefaultHeader = !['/sales', '/receipts', '/settings', '/items', '/reports', '/about'].includes(pathname); 

  useEffect(() => {
    // When navigating to non-Sales pages, ensure the title is set correctly
    if(pathname !== '/sales') {
        setHeaderTitle(''); // Reset custom titles
    }
  }, [pathname, setHeaderTitle]);

  const validPaths = ['/sales', '/receipts', '/items', '/settings', '/reports', '/about'];
  const isRootOrInvalid = !validPaths.some(p => pathname.startsWith(p));
  if (isRootOrInvalid) {
      return <Navigate to="/sales" replace />;
  }

  // Helper to determine visibility
  const isVisible = (path: string) => pathname === path;

  // --- Swipe Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only track single touch
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isDrawerOpen) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    const deltaX = touchX - touchStartRef.current.x;
    const deltaY = Math.abs(touchY - touchStartRef.current.y);

    // Logic:
    // 1. Swipe must start near left edge (within 50px - increased from 30px for better usability)
    // 2. Swipe must be horizontal (deltaX > 50px)
    // 3. Vertical movement must be minimal (deltaY < 30px) to distinguish from scrolling
    
    if (touchStartRef.current.x < 50 && deltaX > 50 && deltaY < 30) {
        openDrawer();
        touchStartRef.current = null; // Reset to prevent repeated triggers during same gesture
    }
  };

  const handleTouchEnd = () => {
      touchStartRef.current = null;
  };

  return (
    <div 
        className="relative h-screen w-full overflow-x-hidden bg-background text-text-primary flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      {showDefaultHeader && <Header 
        title={finalTitle} 
        onMenuClick={openDrawer}
      />}
      
      <NavDrawer />
      
      {/* 
         REMOVED: transform translate-x-64
         Fixed: Laggy drawer animation by using overlay instead of pushing content.
      */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* 
            PERFORMANCE OPTIMIZATION: "Keep Alive" Screens
            Instead of unmounting screens (which destroys DOM and triggers heavy re-renders),
            we hide them using CSS. This makes navigation instantaneous.
        */}
        
        <div className={isVisible('/sales') ? 'flex flex-col h-full' : 'hidden'}>
            <SalesScreen />
        </div>

        <div className={isVisible('/receipts') ? 'flex flex-col h-full' : 'hidden'}>
            {visitedRoutes['/receipts'] && <ReceiptsScreen />}
        </div>

        <div className={isVisible('/reports') ? 'flex flex-col h-full' : 'hidden'}>
            {visitedRoutes['/reports'] && <ReportsScreen />}
        </div>

        <div className={isVisible('/items') ? 'flex flex-col h-full' : 'hidden'}>
            {visitedRoutes['/items'] && <ItemsScreen />}
        </div>

        <div className={isVisible('/settings') ? 'flex flex-col h-full' : 'hidden'}>
            {visitedRoutes['/settings'] && <SettingsScreen />}
        </div>
        
        <div className={isVisible('/about') ? 'flex flex-col h-full' : 'hidden'}>
            {visitedRoutes['/about'] && <AboutScreen />}
        </div>

      </main>
    </div>
  );
};

export default Layout;

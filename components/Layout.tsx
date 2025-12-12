
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
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

// Memoized wrapper for kept-alive screens to prevent unnecessary re-renders when parent Layout updates (e.g. drawer toggle)
const KeepAliveScreen = React.memo(({ isVisible, children }: { isVisible: boolean, children: React.ReactNode }) => {
    return (
        <div 
            className={`flex flex-col h-full w-full absolute inset-0 bg-background transition-opacity duration-200 ${isVisible ? 'opacity-100 z-10' : 'opacity-0 z-[-1] pointer-events-none'}`}
            // Use visibility: hidden for accessibility/focus management when not active, but keep display: flex to preserve layout calculations
            style={{ visibility: isVisible ? 'visible' : 'hidden' }}
        >
            {children}
        </div>
    );
});

const Layout: React.FC = () => {
  const { 
    isDrawerOpen, openDrawer, 
    headerTitle
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

  // DERIVED STATE: Determine Header Title without causing re-renders via useEffect/setState
  const displayTitle = useMemo(() => {
      if (pathname === '/sales') {
          return headerTitle || 'Sales';
      }
      const currentLink = NAV_LINKS.find(link => pathname.startsWith(link.path));
      return currentLink ? currentLink.label : 'Restaurant POS';
  }, [pathname, headerTitle]);
  
  // Determine which screens need a default header.
  const showDefaultHeader = !['/sales', '/receipts', '/settings', '/items', '/reports', '/about'].includes(pathname); 

  const validPaths = ['/sales', '/receipts', '/items', '/settings', '/reports', '/about'];
  const isRootOrInvalid = !validPaths.some(p => pathname.startsWith(p));
  
  if (isRootOrInvalid) {
      return <Navigate to="/sales" replace />;
  }

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
    // 1. Swipe must start near left edge (within 50px)
    // 2. Swipe must be horizontal (deltaX > 50px)
    // 3. Vertical movement must be minimal (deltaY < 30px)
    
    if (touchStartRef.current.x < 50 && deltaX > 50 && deltaY < 30) {
        openDrawer();
        touchStartRef.current = null; // Reset
    }
  };

  const handleTouchEnd = () => {
      touchStartRef.current = null;
  };

  return (
    <div 
        className="relative h-screen w-full overflow-hidden bg-background text-text-primary flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      {showDefaultHeader && <Header 
        title={displayTitle} 
        onMenuClick={openDrawer}
      />}
      
      <NavDrawer />
      
      <main className="flex-1 relative overflow-hidden">
        {/* 
            PERFORMANCE OPTIMIZATION: 
            1. Absolute positioning for all screens to stack them.
            2. Opacity transition for smoothness (hardware accelerated).
            3. Visibility toggling to remove inactive screens from access tree.
            4. Memoized wrappers to prevent children re-rendering on Layout updates.
        */}
        
        <KeepAliveScreen isVisible={pathname === '/sales'}>
            <SalesScreen />
        </KeepAliveScreen>

        {visitedRoutes['/receipts'] && (
            <KeepAliveScreen isVisible={pathname === '/receipts'}>
                <ReceiptsScreen />
            </KeepAliveScreen>
        )}

        {visitedRoutes['/reports'] && (
            <KeepAliveScreen isVisible={pathname === '/reports'}>
                <ReportsScreen />
            </KeepAliveScreen>
        )}

        {visitedRoutes['/items'] && (
            <KeepAliveScreen isVisible={pathname === '/items'}>
                <ItemsScreen />
            </KeepAliveScreen>
        )}

        {visitedRoutes['/settings'] && (
            <KeepAliveScreen isVisible={pathname === '/settings'}>
                <SettingsScreen />
            </KeepAliveScreen>
        )}
        
        {visitedRoutes['/about'] && (
            <KeepAliveScreen isVisible={pathname === '/about'}>
                <AboutScreen />
            </KeepAliveScreen>
        )}

      </main>
    </div>
  );
};

export default Layout;


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

// Screen Timeout in milliseconds (e.g., 10 minutes)
const SCREEN_TIMEOUT = 10 * 60 * 1000; 

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

  // State to track which screens are currently kept alive in the DOM
  // Maps path -> timestamp of last access
  const [activeScreens, setActiveScreens] = useState<Record<string, number>>({
      '/sales': Date.now() // Sales is always active initially
  });

  // Swipe Gesture Ref
  const touchStartRef = useRef<{x: number, y: number} | null>(null);

  // Update active timestamp when visiting a route
  useEffect(() => {
      setActiveScreens(prev => ({
          ...prev,
          [pathname]: Date.now()
      }));
  }, [pathname]);

  // Garbage Collection Effect: Unmount screens that haven't been visited in SCREEN_TIMEOUT
  useEffect(() => {
      const interval = setInterval(() => {
          const now = Date.now();
          setActiveScreens(prev => {
              const next = { ...prev };
              let hasChanges = false;

              Object.keys(next).forEach(path => {
                  // Never unmount Sales screen (Home) or the currently active screen
                  if (path === '/sales' || path === pathname) return;

                  if (now - next[path] > SCREEN_TIMEOUT) {
                      delete next[path];
                      hasChanges = true;
                      console.log(`[Layout] Garbage collecting screen: ${path}`);
                  }
              });

              return hasChanges ? next : prev;
          });
      }, 60000); // Check every minute

      return () => clearInterval(interval);
  }, [pathname]);

  // DERIVED STATE: Determine Header Title without causing re-renders via useEffect/setState
  const displayTitle = useMemo(() => {
      // Note: SalesScreen renders its own header, so this value is ignored there.
      // We rely on this for generic screens like Items, Receipts, etc.
      const currentLink = NAV_LINKS.find(link => pathname.startsWith(link.path));
      return currentLink ? currentLink.label : 'Restaurant POS';
  }, [pathname]);
  
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

    // Optimized Swipe Logic:
    // 1. Swipe must start near left edge (Increased to 120px to account for cases/bezels)
    // 2. Swipe must be horizontal (Reduced threshold to 30px for faster response)
    // 3. Dominant direction must be horizontal (deltaX > deltaY * 1.2) to prevent accidental diagonal triggers
    
    if (touchStartRef.current.x < 120 && deltaX > 30 && deltaX > (deltaY * 1.2)) {
        openDrawer();
        touchStartRef.current = null; // Reset to prevent multiple triggers
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
            5. Automatic unmounting (GC) of inactive screens via `activeScreens` state.
        */}
        
        <KeepAliveScreen isVisible={pathname === '/sales'}>
            <SalesScreen />
        </KeepAliveScreen>

        {activeScreens['/receipts'] && (
            <KeepAliveScreen isVisible={pathname === '/receipts'}>
                <ReceiptsScreen />
            </KeepAliveScreen>
        )}

        {activeScreens['/reports'] && (
            <KeepAliveScreen isVisible={pathname === '/reports'}>
                <ReportsScreen />
            </KeepAliveScreen>
        )}

        {activeScreens['/items'] && (
            <KeepAliveScreen isVisible={pathname === '/items'}>
                <ItemsScreen />
            </KeepAliveScreen>
        )}

        {activeScreens['/settings'] && (
            <KeepAliveScreen isVisible={pathname === '/settings'}>
                <SettingsScreen />
            </KeepAliveScreen>
        )}
        
        {activeScreens['/about'] && (
            <KeepAliveScreen isVisible={pathname === '/about'}>
                <AboutScreen />
            </KeepAliveScreen>
        )}

      </main>
    </div>
  );
};

export default Layout;

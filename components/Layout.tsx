
import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Header from './Header';
import NavDrawer from './NavDrawer';
import { useAppContext } from '../context/AppContext';
import { NAV_LINKS } from '../constants';
import AddPrinterModal from './modals/AddPrinterModal';
import OfflineManager from './OfflineManager';
import { useEdgeSwipe } from '../hooks/useEdgeSwipe';

import SalesScreen from '../screens/SalesScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import ItemsScreen from '../screens/ItemsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AboutScreen from '../screens/AboutScreen';

const SCREEN_TIMEOUT = 10 * 60 * 1000; // 10 Minutes

// Optimized KeepAlive component
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
  const { isDrawerOpen, openDrawer, isAddPrinterModalOpen, closeAddPrinterModal, addPrinter } = useAppContext();
  const location = useLocation();
  const { pathname } = location;

  // --- GESTURE LOGIC ---
  const swipeHandlers = useEdgeSwipe({
      onSwipe: () => !isDrawerOpen && openDrawer(),
      threshold: 50,
      edgeWidth: 32 // 32px hit zone from the left
  });

  // --- SCREEN MANAGEMENT ---
  const [activeScreens, setActiveScreens] = useState<Record<string, number>>({ '/sales': Date.now() });
  
  useEffect(() => {
      setActiveScreens(prev => ({ ...prev, [pathname]: Date.now() }));
  }, [pathname]);

  // Garbage collection for inactive screens
  useEffect(() => {
      const interval = setInterval(() => {
          const now = Date.now();
          setActiveScreens(prev => {
              const next = { ...prev };
              let changed = false;
              Object.keys(next).forEach(path => {
                  // Keep Sales screen always alive
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
    <div className="relative h-screen w-full overflow-hidden bg-background text-text-primary flex flex-col">
      <OfflineManager />
      
      {/* SWIPE CATCHER LAYER */}
      {!isDrawerOpen && (
        <div 
            className="fixed left-0 top-0 bottom-0 w-8 z-[100] touch-none" 
            {...swipeHandlers}
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

      <AddPrinterModal 
        isOpen={isAddPrinterModalOpen} 
        onClose={closeAddPrinterModal} 
        onSave={(p) => {
            addPrinter(p);
            closeAddPrinterModal();
        }} 
      />
    </div>
  );
};

export default Layout;

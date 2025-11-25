import React, { useEffect } from 'react';
import { useLocation, Navigate, Routes, Route } from 'react-router-dom';
import Header from './Header';
import NavDrawer from './NavDrawer';
import { useAppContext } from '../context/AppContext';
import { NAV_LINKS } from '../constants';

// Import all screens for routing
import SalesScreen from '../screens/SalesScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import ItemsScreen from '../screens/ItemsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AdvancedScreen from '../screens/AdvancedScreen';

const Layout: React.FC = () => {
  const { 
    isDrawerOpen, openDrawer, 
    headerTitle, setHeaderTitle, 
  } = useAppContext();
  const location = useLocation();
  const { pathname } = location;

  const currentLink = NAV_LINKS.find(link => pathname.startsWith(link.path));
  const baseTitle = currentLink ? currentLink.label : 'Sales';
  
  const finalTitle = pathname === '/sales' && headerTitle ? headerTitle : baseTitle;
  
  // Determine which screens need a default header. Screens with custom headers (like Sales) handle it internally.
  const showDefaultHeader = !['/sales', '/receipts', '/settings'].includes(pathname);

  useEffect(() => {
    // Reset any screen-specific header titles when navigating away
    if(pathname !== '/sales') {
        setHeaderTitle('');
    }
  }, [pathname, setHeaderTitle]);

  const validPaths = ['/sales', '/receipts', 'items', '/settings', '/advanced'];
  const isRootOrInvalid = !validPaths.some(p => pathname.startsWith(p));
  if (isRootOrInvalid) {
      return <Navigate to="/sales" replace />;
  }

  return (
    <div className="relative h-screen w-full overflow-x-hidden bg-background text-text-primary flex flex-col">
      {showDefaultHeader && <Header 
        title={finalTitle} 
        onMenuClick={openDrawer}
      />}
      <NavDrawer />
      <main
        className={`flex-1 flex flex-col shadow-lg overflow-hidden relative transition-transform duration-300 ease-in-out will-change-transform ${isDrawerOpen ? 'translate-x-64' : 'translate-x-0'}`}
      >
        {/* PERFORMANCE FIX: Use proper routing to only render the active screen. */}
        <Routes>
          <Route path="/sales" element={<SalesScreen />} />
          <Route path="/receipts" element={<ReceiptsScreen />} />
          <Route path="/items" element={<ItemsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/advanced" element={<AdvancedScreen />} />
          {/* Default route within the layout */}
          <Route path="*" element={<Navigate to="/sales" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default Layout;
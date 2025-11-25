
import React, { ReactNode, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Header from './Header';
import NavDrawer from './NavDrawer';
import { useAppContext } from '../context/AppContext';
import { NAV_LINKS } from '../constants';

// Import all screens that will be persistently rendered
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

  const currentLink = NAV_LINKS.find(link => link.path === pathname);
  const baseTitle = currentLink ? currentLink.label : 'Sales';
  
  const finalTitle = pathname === '/sales' && headerTitle ? headerTitle : baseTitle;
  
  // Determine which screens need custom header handling (or no header)
  const showDefaultHeader = !['/sales', '/receipts', '/settings'].includes(pathname);

  useEffect(() => {
    // Reset any screen-specific header titles when navigating away
    if(pathname !== '/sales') {
        setHeaderTitle('');
    }
  }, [pathname, setHeaderTitle]);

  // Handle default route and unknown routes within the authenticated layout
  const validPaths = ['/sales', '/receipts', '/items', '/settings', '/advanced'];
  if (!validPaths.includes(pathname)) {
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
        className={`flex-1 flex flex-col shadow-lg overflow-hidden relative transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-64' : 'translate-x-0'}`}
      >
        {/* Persistent Screen Rendering: All screens are rendered, but only the active one is visible. */}
        <div className={pathname === '/sales' ? 'h-full' : 'hidden'}><SalesScreen /></div>
        <div className={pathname === '/receipts' ? 'h-full' : 'hidden'}><ReceiptsScreen /></div>
        <div className={pathname === '/items' ? 'h-full' : 'hidden'}><ItemsScreen /></div>
        <div className={pathname === '/settings' ? 'h-full' : 'hidden'}><SettingsScreen /></div>
        <div className={pathname === '/advanced' ? 'h-full' : 'hidden'}><AdvancedScreen /></div>
      </main>
    </div>
  );
};

export default Layout;

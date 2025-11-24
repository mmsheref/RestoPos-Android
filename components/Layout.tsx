
import React, { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import NavDrawer from './NavDrawer';
import { useAppContext } from '../context/AppContext';
import { NAV_LINKS } from '../constants';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { 
    isDrawerOpen, openDrawer, 
    headerTitle, setHeaderTitle, 
  } = useAppContext();
  const location = useLocation();

  const currentLink = NAV_LINKS.find(link => link.path === location.pathname);
  const baseTitle = currentLink ? currentLink.label : 'Sales';
  
  const finalTitle = location.pathname === '/sales' && headerTitle ? headerTitle : baseTitle;
  const isSalesScreen = location.pathname === '/sales';
  const isReceiptsScreen = location.pathname === '/receipts';

  useEffect(() => {
    // Reset header title when navigating away from the sales screen
    if(location.pathname !== '/sales') {
        setHeaderTitle('');
    }
  }, [location.pathname, setHeaderTitle]);


  return (
    <div className="relative h-screen w-full overflow-x-hidden bg-background text-text-primary flex flex-col">
      {!isSalesScreen && !isReceiptsScreen && <Header 
        title={finalTitle} 
        onMenuClick={openDrawer}
      />}
      <NavDrawer />
      <main
        className={`flex-1 flex flex-col shadow-lg overflow-hidden relative transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-64' : 'translate-x-0'}`}
      >
        <div className={`flex-1 overflow-y-auto w-full`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, Navigate, Routes, Route } from 'react-router-dom';
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
  const { isDrawerOpen, headerTitle, setHeaderTitle } = useAppContext();
  const location = useLocation();
  const { pathname } = location;

  const [activeScreens, setActiveScreens] = useState<Record<string, number>>({ '/sales': Date.now() });
  
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
      }, 60 * 1000);
      return () => clearInterval(interval);
  }, [pathname]);

  useEffect(() => {
      const currentLink = NAV_LINKS.find(link => link.path === pathname);
      setHeaderTitle(currentLink?.label || 'Sales');
  }, [pathname, setHeaderTitle]);

  return (
    <div className="h-full flex relative overflow-hidden">
      <NavDrawer />
      <main className={`h-full flex-1 flex flex-col transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-[85vw] md:translate-x-[320px] lg:translate-x-[380px] rounded-l-2xl shadow-2xl' : ''}`}>
        <div className="flex-1 overflow-hidden relative">
            <Routes>
                <Route path="/sales" element={<SalesScreen />} />
                <Route path="/receipts" element={<ReceiptsScreen />} />
                <Route path="/reports" element={<ReportsScreen />} />
                <Route path="/items" element={<ItemsScreen />} />
                <Route path="/settings" element={<SettingsScreen />} />
                <Route path="/about" element={<AboutScreen />} />
                <Route path="*" element={<Navigate to="/sales" replace />} />
            </Routes>
        </div>
      </main>
    </div>
  );
};

export default Layout;

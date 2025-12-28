
import React, { useEffect, useRef } from 'react';
import { useLocation, Navigate, Routes, Route } from 'react-router-dom';
import NavDrawer from './NavDrawer';
import { useAppContext } from '../context/AppContext';
import { NAV_LINKS } from '../constants';

import SalesScreen from '../screens/SalesScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import ItemsScreen from '../screens/ItemsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AboutScreen from '../screens/AboutScreen';

const Layout: React.FC = () => {
  const { isDrawerOpen, setHeaderTitle, openDrawer } = useAppContext();
  const { pathname } = useLocation();
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
      const currentLink = NAV_LINKS.find(link => link.path === pathname);
      setHeaderTitle(currentLink?.label || 'Sales');
  }, [pathname, setHeaderTitle]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only track single-finger swipes starting near the left edge, when drawer is closed
    if (e.touches.length === 1 && e.touches[0].clientX < 50 && !isDrawerOpen) {
      touchStartX.current = e.touches[0].clientX;
    } else {
      touchStartX.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;

    // A reasonably significant swipe to the right
    if (deltaX > 100) {
      openDrawer();
    }

    touchStartX.current = null; // Reset
  };

  return (
    <div 
      className="h-full flex relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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

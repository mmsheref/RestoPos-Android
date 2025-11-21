import React, { ReactNode, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
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
    isDrawerOpen, openDrawer, closeDrawer, 
    headerTitle, setHeaderTitle, 
  } = useAppContext();
  const location = useLocation();
  const dragControls = useDragControls();
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLink = NAV_LINKS.find(link => link.path === location.pathname);
  const baseTitle = currentLink ? currentLink.label : 'Sales';
  
  const finalTitle = location.pathname === '/sales' && headerTitle ? headerTitle : baseTitle;
  const isSalesScreen = location.pathname === '/sales';

  useEffect(() => {
    // Reset header title when navigating away from the sales screen
    if(location.pathname !== '/sales') {
        setHeaderTitle('');
    }
  }, [location.pathname, setHeaderTitle]);


  const startDrag = (event: React.PointerEvent) => {
    // Only allow dragging from the left edge of the screen
    if (event.clientX < 40) {
      dragControls.start(event, { snapToCursor: false });
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-100 flex flex-col" ref={containerRef}>
      {!isSalesScreen && <Header 
        title={finalTitle} 
        onMenuClick={openDrawer}
      />}
      <NavDrawer />
      <motion.main
        onPointerDown={startDrag}
        drag="x"
        dragControls={dragControls}
        dragConstraints={{ left: 0, right: 256 }}
        dragElastic={{ left: 0.1, right: 0.1 }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100 || (info.velocity.x > 200 && info.offset.x > 50)) {
            openDrawer();
          }
        }}
        animate={{ x: isDrawerOpen ? 256 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col will-change-transform shadow-lg"
      >
        <div className={`flex-1 overflow-y-auto ${isSalesScreen ? '' : 'bg-white'}`}>
          {children}
        </div>
      </motion.main>
    </div>
  );
};

export default Layout;
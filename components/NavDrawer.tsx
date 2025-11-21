
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { NAV_LINKS } from '../constants';

const NavDrawer: React.FC = () => {
  const { isDrawerOpen, closeDrawer } = useAppContext();

  const backdropVariants = {
    open: { opacity: 1, pointerEvents: 'auto' as const },
    closed: { opacity: 0, pointerEvents: 'none' as const },
  };

  const drawerVariants = {
    open: { x: 0 },
    closed: { x: '-100%' },
  };

  return (
    <>
      <motion.div
        variants={backdropVariants}
        initial="closed"
        animate={isDrawerOpen ? 'open' : 'closed'}
        transition={{ duration: 0.3 }}
        onClick={closeDrawer}
        className="fixed inset-0 bg-black bg-opacity-50 z-30"
      />
      <motion.aside
        variants={drawerVariants}
        initial="closed"
        animate={isDrawerOpen ? 'open' : 'closed'}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-full w-64 bg-gray-800 text-white z-40 flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">POS Menu</h2>
        </div>
        <nav className="flex-1 py-4">
          <ul>
            {NAV_LINKS.map(({ path, label, Icon }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    `flex items-center px-6 py-3 text-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-6 w-6 mr-4" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </motion.aside>
    </>
  );
};

export default NavDrawer;

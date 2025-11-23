
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { NAV_LINKS } from '../constants';

const NavDrawer: React.FC = () => {
  const { isDrawerOpen, closeDrawer } = useAppContext();

  return (
    <>
      {isDrawerOpen && (
        <div
          onClick={closeDrawer}
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-30"
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-gray-800 dark:bg-slate-900 text-white z-40 flex flex-col shadow-2xl transform ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-700 dark:border-gray-800">
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
                        : 'text-gray-300 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
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
      </aside>
    </>
  );
};

export default NavDrawer;
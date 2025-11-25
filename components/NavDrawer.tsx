
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { NAV_LINKS, SignOutIcon, APP_VERSION } from '../constants';

const NavDrawer: React.FC = () => {
  const { isDrawerOpen, closeDrawer, user, signOut } = useAppContext();

  return (
    <>
      {isDrawerOpen && (
        <div
          onClick={closeDrawer}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-slate-800 text-white z-40 flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">POS Menu</h2>
        </div>
        <nav className="flex-1 py-2">
          <ul>
            {NAV_LINKS.map(({ path, label, Icon }) => (
              <li key={path} className="px-2">
                <NavLink
                  to={path}
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 my-1 text-base rounded-md transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 mr-4" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="px-4 py-2 mt-auto text-center">
            <p className="text-xs text-slate-400">Version {APP_VERSION}</p>
            <p className="text-xs text-slate-400">Made with ❤️ by Ameer</p>
        </div>

        <div className="p-4 border-t border-slate-700">
            {user && (
                <div className="text-xs text-slate-400 mb-2 truncate px-2">
                    Logged in as: {user.email}
                </div>
            )}
            <button 
                onClick={signOut}
                className="w-full flex items-center px-4 py-3 text-base transition-colors duration-200 text-slate-300 hover:bg-red-500/20 hover:text-white rounded-md"
            >
                <SignOutIcon className="h-5 w-5 mr-4"/>
                <span>Sign Out</span>
            </button>
        </div>
      </aside>
    </>
  );
};

export default NavDrawer;

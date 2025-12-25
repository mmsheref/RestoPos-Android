
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { NAV_LINKS, SignOutIcon, UserIcon, PowerIcon } from '../constants';
import ConfirmModal from './modals/ConfirmModal';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const NavDrawer: React.FC = () => {
  const { isDrawerOpen, closeDrawer, user, signOut, settings, currentOrder } = useAppContext();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const stateRef = useRef({ isDrawerOpen, isExitModalOpen, pathname: location.pathname });

  useEffect(() => {
      stateRef.current = { isDrawerOpen, isExitModalOpen, pathname: location.pathname };
  }, [isDrawerOpen, isExitModalOpen, location.pathname]);

  useEffect(() => {
      if (!Capacitor.isNativePlatform()) return;
      const setupListener = async () => {
          await App.addListener('backButton', () => {
              const { isDrawerOpen, isExitModalOpen, pathname } = stateRef.current;
              if (isDrawerOpen) { closeDrawer(); return; } 
              if (isExitModalOpen) { setIsExitModalOpen(false); return; } 
              if (pathname !== '/sales') navigate(-1);
              else setIsExitModalOpen(true);
          });
      };
      setupListener();
      return () => { App.removeAllListeners(); };
  }, [closeDrawer, navigate]);

  const handleSignOutClick = async () => { await Haptics.impact({ style: ImpactStyle.Light }); closeDrawer(); setIsSignOutModalOpen(true); };
  const handleExitClick = async () => { await Haptics.impact({ style: ImpactStyle.Medium }); closeDrawer(); setIsExitModalOpen(true); };
  const handleNavClick = async () => { await Haptics.impact({ style: ImpactStyle.Light }); closeDrawer(); };

  return (
    <>
      <div onClick={closeDrawer} className={`fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[60] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />
      <aside className={`fixed top-0 left-0 bottom-0 w-[85vw] max-w-[320px] bg-neutral-900 text-white z-[70] flex flex-col shadow-2xl transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-neutral-800 pt-safe-top">
          <h2 className="text-xl font-bold text-white truncate">{settings.storeName || 'POS Menu'}</h2>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider font-semibold">Restaurant Workspace</p>
        </div>
        
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {NAV_LINKS.map(({ path, label, Icon }) => (
              <li key={path}>
                <NavLink to={path} onClick={handleNavClick} className={({ isActive }) => `flex items-center px-4 py-3 text-sm font-medium rounded-full transition-all duration-200 ${isActive ? 'bg-primary text-primary-content' : 'text-neutral-400 hover:bg-neutral-800'}`}>
                  <Icon className="h-5 w-5 mr-3" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-neutral-800 bg-neutral-900 pb-safe-bottom mt-auto">
            <div className="flex items-center gap-3 mb-4 px-2">
                <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 border border-neutral-700">
                     <UserIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                    <p className="text-[10px] text-neutral-500 uppercase font-black">Admin Mode</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <button onClick={handleSignOutClick} className="flex items-center justify-center py-2.5 text-xs font-bold transition-colors text-neutral-400 hover:bg-neutral-800 rounded-xl border border-neutral-800">
                    <SignOutIcon className="h-4 w-4 mr-2"/>Sign Out
                </button>
                <button onClick={handleExitClick} className="flex items-center justify-center py-2.5 text-xs font-bold transition-colors text-red-400 hover:bg-red-500/10 rounded-xl border border-red-500/20">
                    <PowerIcon className="h-4 w-4 mr-2"/>Quit
                </button>
            </div>
        </div>
      </aside>

      <ConfirmModal isOpen={isSignOutModalOpen} onClose={() => setIsSignOutModalOpen(false)} onConfirm={() => { signOut(); setIsSignOutModalOpen(false); }} title="Sign Out" confirmText="Sign Out" confirmButtonClass="bg-red-600"><p>Are you sure you want to end your session?</p></ConfirmModal>
      <ConfirmModal isOpen={isExitModalOpen} onClose={() => setIsExitModalOpen(false)} onConfirm={async () => { if (Capacitor.isNativePlatform()) await App.exitApp(); else window.close(); }} title="Exit App" confirmText="Exit" confirmButtonClass="bg-red-600"><p>Close the POS application?</p></ConfirmModal>
    </>
  );
};

export default NavDrawer;

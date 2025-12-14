
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useStatusContext } from '../context/StatusContext';
import { NAV_LINKS, SignOutIcon, SyncIcon, OfflineIcon, CheckIcon, UserIcon, PowerIcon } from '../constants';
import ConfirmModal from './modals/ConfirmModal';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const NavDrawer: React.FC = () => {
  const { isDrawerOpen, closeDrawer, user, signOut, settings } = useAppContext();
  const { pendingSyncCount, isOnline } = useStatusContext();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // State Ref for Back Button Listener Closure
  const stateRef = useRef({ isDrawerOpen, isExitModalOpen, pathname: location.pathname });

  useEffect(() => {
      stateRef.current = { isDrawerOpen, isExitModalOpen, pathname: location.pathname };
  }, [isDrawerOpen, isExitModalOpen, location.pathname]);

  // Hardware Back Button Handler
  useEffect(() => {
      if (!Capacitor.isNativePlatform()) return;

      const setupListener = async () => {
          await App.addListener('backButton', ({ canGoBack }) => {
              const { isDrawerOpen, isExitModalOpen, pathname } = stateRef.current;

              if (isDrawerOpen) {
                  closeDrawer();
              } else if (isExitModalOpen) {
                  // If exit modal is already open, back button closes it
                  setIsExitModalOpen(false);
              } else if (pathname !== '/sales') {
                  // Navigate back if not on home screen
                  navigate(-1);
              } else {
                  // On Home Screen (Sales), show Exit Confirmation
                  setIsExitModalOpen(true);
              }
          });
      };

      setupListener();

      return () => {
          App.removeAllListeners();
      };
  }, [closeDrawer, navigate]);

  const handleSignOutClick = () => {
    closeDrawer();
    setIsSignOutModalOpen(true);
  };

  const confirmSignOut = () => {
    signOut();
    setIsSignOutModalOpen(false);
  };

  const handleExitClick = () => {
    closeDrawer();
    setIsExitModalOpen(true);
  };

  const confirmExit = async () => {
    if (Capacitor.isNativePlatform()) {
        await App.exitApp();
    } else {
        // Web fallback
        window.close();
    }
    setIsExitModalOpen(false);
  };

  return (
    <>
      {/* Backdrop: Always rendered, toggle opacity/pointer-events for performance */}
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ease-out ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      <aside
        className={`fixed top-0 left-0 bottom-0 w-[85vw] max-w-[320px] bg-neutral-900 text-white z-[70] flex flex-col shadow-2xl transform transition-transform duration-300 ease-out will-change-transform border-r border-neutral-800 pt-safe-top ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backfaceVisibility: 'hidden' }} // Fix for flickering text during transition
      >
        <div className="p-6 border-b border-neutral-800 bg-neutral-900">
          <h2 className="text-xl font-bold text-white truncate tracking-tight">
            {settings.storeName || 'POS Menu'}
          </h2>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider font-semibold">Point of Sale</p>
        </div>
        
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {NAV_LINKS.map(({ path, label, Icon }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-full transition-all duration-200 group ${
                      isActive
                        ? 'bg-primary text-primary-content shadow-lg shadow-primary/20'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className={`h-5 w-5 mr-3 transition-colors ${ ({isActive}: {isActive:boolean}) => isActive ? 'text-primary-content' : 'text-neutral-500 group-hover:text-white' }`} />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Sync Status Indicator */}
        <div className="px-4 py-2 mt-auto">
            <div className={`flex items-center gap-3 text-xs font-medium px-4 py-3 rounded-xl border ${
                !isOnline 
                  ? 'bg-neutral-800 border-neutral-700 text-neutral-400' 
                  : pendingSyncCount > 0 
                    ? 'bg-amber-900/20 border-amber-900/30 text-amber-400' 
                    : 'bg-emerald-900/20 border-emerald-900/30 text-emerald-400'
            }`}>
                {!isOnline ? (
                    <>
                        <OfflineIcon className="h-4 w-4 flex-shrink-0" />
                        <span>Offline Mode</span>
                    </>
                ) : pendingSyncCount > 0 ? (
                    <>
                        <SyncIcon className="h-4 w-4 animate-spin flex-shrink-0" />
                        <span>Syncing {pendingSyncCount} items...</span>
                    </>
                ) : (
                    <>
                        <CheckIcon className="h-4 w-4 flex-shrink-0" />
                        <span>System Synced</span>
                    </>
                )}
            </div>
        </div>
        
        <div className="p-4 border-t border-neutral-800 bg-neutral-900 pb-safe-bottom">
            <div className="flex items-center gap-3 mb-3 px-2">
                <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                     <UserIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                    <p className="text-xs text-neutral-500">Administrator</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={handleSignOutClick}
                    className="flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors duration-200 text-neutral-400 hover:bg-neutral-800 hover:text-white rounded-lg border border-transparent"
                >
                    <SignOutIcon className="h-4 w-4 mr-2"/>
                    <span>Sign Out</span>
                </button>
                <button 
                    onClick={handleExitClick}
                    className="flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg border border-transparent hover:border-red-500/20"
                >
                    <PowerIcon className="h-4 w-4 mr-2"/>
                    <span>Exit</span>
                </button>
            </div>
        </div>
      </aside>

      {/* Sign Out Confirmation */}
      <ConfirmModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={confirmSignOut}
        title="Sign Out"
        confirmText="Sign Out"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      >
        <p>Are you sure you want to sign out of your session?</p>
      </ConfirmModal>

      {/* Exit Confirmation */}
      <ConfirmModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirm={confirmExit}
        title="Exit Application"
        confirmText="Exit"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      >
        <p>Are you sure you want to close the application?</p>
      </ConfirmModal>
    </>
  );
};

export default NavDrawer;

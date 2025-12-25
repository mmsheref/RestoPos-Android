
import React from 'react';
import { MenuIcon, SyncIcon, OfflineIcon, CheckIcon } from '../constants';
import { useStatusContext } from '../context/StatusContext';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const { isOnline, pendingSyncCount } = useStatusContext();

  return (
    <header className="bg-surface shadow-sm w-full z-20 flex-shrink-0">
      <div className="h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-1">
            <button onClick={onMenuClick} className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-muted transition-colors">
                <MenuIcon className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-text-primary ml-2">{title}</h1>
        </div>

        {/* Informative Sync Pill */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
            !isOnline 
                ? 'bg-neutral-100 border-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:border-neutral-700' 
                : pendingSyncCount > 0 
                    ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800'
        }`}>
            {!isOnline ? (
                <>
                    <OfflineIcon className="h-3.5 w-3.5" />
                    <span>Offline</span>
                </>
            ) : pendingSyncCount > 0 ? (
                <>
                    <SyncIcon className="h-3.5 w-3.5 animate-spin" />
                    <span>{pendingSyncCount} Syncing</span>
                </>
            ) : (
                <>
                    <CheckIcon className="h-3.5 w-3.5" />
                    <span>Synced</span>
                </>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;

import React from 'react';
import { MenuIcon, SyncIcon, OfflineIcon } from '../constants';
import { useAppContext } from '../context/AppContext';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const { isSyncing, isOnline } = useAppContext();
  return (
    <header className="bg-surface shadow-sm w-full z-20 flex-shrink-0">
      <div className="h-16 flex items-center justify-between px-4">
        <button onClick={onMenuClick} className="p-2 text-text-secondary hover:text-text-primary">
          <MenuIcon className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
            {!isOnline && <OfflineIcon className="h-5 w-5 text-red-500" title="Offline: Changes are saved locally." />}
            {isOnline && isSyncing && <SyncIcon className="h-5 w-5 text-primary" title="Syncing..." />}
            <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
        </div>
        <div className="w-10"></div>
      </div>
    </header>
  );
};

export default Header;
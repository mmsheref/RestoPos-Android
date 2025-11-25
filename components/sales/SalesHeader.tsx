import React, { useState } from 'react';
import { MenuIcon, SearchIcon, CloseIcon, SyncIcon, OfflineIcon } from '../../constants';
import { useAppContext } from '../../context/AppContext';

interface SalesHeaderProps {
  openDrawer: () => void;
  onSearchChange: (query: string) => void;
}

const SalesHeader: React.FC<SalesHeaderProps> = ({ openDrawer, onSearchChange }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isSyncing, isOnline } = useAppContext();

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange(e.target.value);
  };

  const handleCloseSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
    onSearchChange('');
  };

  return (
    <header className="bg-surface shadow-sm w-full z-10 flex-shrink-0 h-16 flex items-center justify-between px-4">
      {isSearching ? (
        <div className="flex items-center w-full">
          <input
            type="text"
            placeholder="Search all items..."
            value={searchQuery}
            onChange={handleQueryChange}
            className="w-full h-full px-2 bg-transparent focus:outline-none text-lg text-text-primary"
            autoFocus
          />
          <button
            onClick={handleCloseSearch}
            className="p-2 text-text-muted hover:text-text-primary"
            aria-label="Close search"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full">
          <button onClick={openDrawer} className="p-2 text-text-secondary hover:text-text-primary">
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            {!isOnline && <OfflineIcon className="h-5 w-5 text-red-500" title="Offline: Changes are saved locally." />}
            {isOnline && isSyncing && <SyncIcon className="h-5 w-5 text-primary" title="Syncing..." />}
            <h1 className="text-xl font-semibold text-text-primary">
              Sales
            </h1>
          </div>
          <button onClick={() => setIsSearching(true)} className="p-2 text-text-secondary hover:text-text-primary">
            <SearchIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </header>
  );
};

export default SalesHeader;
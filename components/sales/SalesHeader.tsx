
import React, { useState, useRef, useEffect } from 'react';
import { MenuIcon, SearchIcon, CloseIcon, SyncIcon, OfflineIcon, CheckIcon } from '../../constants';
import { useStatusContext } from '../../context/StatusContext';

interface SalesHeaderProps {
  openDrawer: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  storeName?: string;
}

const SalesHeader: React.FC<SalesHeaderProps> = ({ openDrawer, searchQuery, onSearchChange, storeName }) => {
  const { isOnline, pendingSyncCount } = useStatusContext();
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (searchQuery && !isSearching) setIsSearching(true);
  }, [searchQuery]);

  useEffect(() => {
      if (isSearching && inputRef.current) inputRef.current.focus();
  }, [isSearching]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value);
  const handleClearText = () => { onSearchChange(''); inputRef.current?.focus(); };
  const handleCloseSearch = () => { setIsSearching(false); onSearchChange(''); };

  return (
    <header className="bg-surface shadow-sm border-b border-border w-full z-10 flex-shrink-0 pt-safe-top transition-all">
      <div className="h-14 flex items-center justify-between px-4 w-full">
        {isSearching ? (
          <div className="flex items-center w-full gap-3 animate-fadeIn">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-4 w-4 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={handleQueryChange}
                className="w-full h-10 pl-9 pr-9 bg-surface-muted rounded-full border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm text-text-primary"
              />
              {searchQuery && (
                  <button onClick={handleClearText} className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-text-muted hover:text-text-primary">
                      <CloseIcon className="h-3 w-3" />
                  </button>
              )}
            </div>
            <button onClick={handleCloseSearch} className="whitespace-nowrap px-3 py-1.5 text-text-secondary font-semibold text-sm rounded-lg hover:bg-surface-muted">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
               <button onClick={openDrawer} className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-muted transition-colors">
                  <MenuIcon className="h-6 w-6" />
               </button>
               <h1 className="text-lg font-bold text-text-primary tracking-tight truncate max-w-[120px] sm:max-w-md">
                 {storeName || 'POS'}
               </h1>
            </div>

            <div className="flex items-center gap-2">
                {/* Informative Sync Pill for Sales Screen */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${
                    !isOnline 
                        ? 'bg-neutral-100 border-neutral-200 text-neutral-500' 
                        : pendingSyncCount > 0 
                            ? 'bg-amber-50 border-amber-200 text-amber-600' 
                            : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                }`}>
                    {!isOnline ? (
                        <OfflineIcon className="h-3 w-3" />
                    ) : pendingSyncCount > 0 ? (
                        <SyncIcon className="h-3 w-3 animate-spin" />
                    ) : (
                        <CheckIcon className="h-3 w-3" />
                    )}
                    <span className="hidden xs:inline">
                        {!isOnline ? 'Offline' : pendingSyncCount > 0 ? `${pendingSyncCount} Syncing` : 'Synced'}
                    </span>
                </div>

                <button onClick={() => setIsSearching(true)} className="p-2 text-text-secondary hover:text-primary bg-surface-muted/50 hover:bg-primary/10 rounded-full transition-all">
                    <SearchIcon className="h-5 w-5" />
                </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default SalesHeader;

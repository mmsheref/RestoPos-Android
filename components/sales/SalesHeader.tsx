
import React, { useState, useRef, useEffect } from 'react';
import { MenuIcon, SearchIcon, CloseIcon } from '../../constants';

interface SalesHeaderProps {
  openDrawer: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SalesHeader: React.FC<SalesHeaderProps> = ({ openDrawer, searchQuery, onSearchChange }) => {
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Automatically enter search mode if there is a query (e.g. restored from state)
  useEffect(() => {
      if (searchQuery && !isSearching) {
          setIsSearching(true);
      }
  }, [searchQuery]);

  // Focus input when entering search mode
  useEffect(() => {
      if (isSearching && inputRef.current) {
          inputRef.current.focus();
      }
  }, [isSearching]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleClearText = () => {
    onSearchChange('');
    // Keep focus on input after clearing
    inputRef.current?.focus();
  };

  const handleCloseSearch = () => {
    setIsSearching(false);
    onSearchChange('');
  };

  return (
    <header className="bg-surface shadow-sm border-b border-border w-full z-10 flex-shrink-0 h-16 pt-safe-top box-content flex items-center justify-between px-4 transition-all">
      {isSearching ? (
        <div className="flex items-center w-full gap-3 animate-fadeIn">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-5 w-5 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search item name..."
              value={searchQuery}
              onChange={handleQueryChange}
              className="w-full h-11 pl-10 pr-10 bg-surface-muted rounded-xl border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-text-primary placeholder:text-text-muted"
            />
            {searchQuery && (
                <button 
                    onClick={handleClearText}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-text-muted hover:text-text-primary bg-surface border border-border rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Clear text"
                >
                    <CloseIcon className="h-3 w-3" />
                </button>
            )}
          </div>
          <button
            onClick={handleCloseSearch}
            className="px-3 py-2 text-text-secondary hover:text-text-primary font-semibold text-sm rounded-lg hover:bg-surface-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
             <button onClick={openDrawer} className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-muted transition-colors">
                <MenuIcon className="h-6 w-6" />
             </button>
             <h1 className="text-xl font-bold text-text-primary tracking-tight">
               Sales
             </h1>
          </div>
          <button onClick={() => setIsSearching(true)} className="p-2.5 text-text-secondary hover:text-primary bg-surface-muted hover:bg-primary/10 rounded-xl transition-all">
            <SearchIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </header>
  );
};

export default SalesHeader;

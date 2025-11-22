import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuIcon, SearchIcon, CloseIcon } from '../../constants';

interface SalesHeaderProps {
  openDrawer: () => void;
  onSearchChange: (query: string) => void;
}

const SalesHeader: React.FC<SalesHeaderProps> = ({ openDrawer, onSearchChange }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    <header className="bg-white dark:bg-slate-800 shadow-sm w-full z-10 flex-shrink-0 h-16 flex items-center justify-between px-4">
      <AnimatePresence>
        {isSearching ? (
          <motion.div
            key="search-bar"
            initial={{ opacity: 0, width: '0%' }}
            animate={{ opacity: 1, width: '100%' }}
            exit={{ opacity: 0, width: '0%' }}
            transition={{ duration: 0.2 }}
            className="flex items-center w-full"
          >
            <input
              type="text"
              placeholder="Search all items..."
              value={searchQuery}
              onChange={handleQueryChange}
              className="w-full h-full px-2 bg-transparent focus:outline-none text-lg text-gray-800 dark:text-slate-100"
              autoFocus
            />
            <button
              onClick={handleCloseSearch}
              className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-100"
              aria-label="Close search"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="title-bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between w-full"
          >
            <button onClick={openDrawer} className="p-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white">
              <MenuIcon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-slate-100">
              Sales
            </h1>
            <button onClick={() => setIsSearching(true)} className="p-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white">
              <SearchIcon className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default SalesHeader;

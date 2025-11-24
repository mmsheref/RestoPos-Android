
import React, { useState, useMemo } from 'react';
import { Item } from '../../types';
import { SearchIcon } from '../../constants';

interface SelectItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: Item) => void;
  allItems: Item[];
}

const SelectItemModal: React.FC<SelectItemModalProps> = ({ isOpen, onClose, onSelect, allItems }) => {
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    return allItems.filter(i =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      // FIX: Safely access optional `category` property to prevent runtime errors.
      (i.category || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [allItems, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <header className="flex-shrink-0 p-4 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">Select an Item</h2>
          <div className="relative mt-2">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted h-5 w-5" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full bg-background border-border text-text-primary focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-4">
          <ul className="space-y-1">
            {filteredItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => onSelect(item)}
                  className="w-full text-left flex items-center gap-4 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-md object-cover flex-shrink-0 bg-surface-muted" />
                  <div className="flex-grow">
                    <p className="font-semibold text-text-primary">{item.name}</p>
                    <p className="text-sm text-text-secondary">₹{item.price.toFixed(2)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <footer className="flex-shrink-0 flex justify-end p-4 border-t border-border">
          <button onClick={onClose} className="px-6 py-2 bg-surface-muted text-text-secondary rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SelectItemModal;

import React from 'react';
import { PencilIcon, PlusIcon } from '../../constants';
import { CustomGrid } from '../../types';

interface CategoryTabsProps {
  grids: CustomGrid[];
  activeGridId: string;
  setActiveGridId: (id: string) => void;
  onAddNew: () => void;
  onManage: () => void;
  isSearchActive: boolean;
  searchResultsCount: number;
  searchQuery: string;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  grids, activeGridId, setActiveGridId, onAddNew, onManage,
  isSearchActive, searchResultsCount, searchQuery
}) => {

  if (isSearchActive) {
    return (
      <div className="flex-shrink-0 pt-2 text-center text-text-secondary">
        Showing {searchResultsCount} results for "{searchQuery}"
      </div>
    );
  }

  const TabButton: React.FC<{id: string, name: string}> = ({ id, name }) => (
    <button
        onClick={() => setActiveGridId(id)}
        className={`flex-shrink-0 whitespace-nowrap px-5 py-3 border-b-2 text-sm font-medium transition-colors duration-200 focus:outline-none ${
        activeGridId === id
            ? 'border-primary text-primary'
            : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300 dark:hover:border-gray-600'
        }`}
    >
        {name}
    </button>
  );

  return (
    <nav className="flex-shrink-0 pt-2">
      <div className="border-b border-border">
        <div className="flex -mb-px">
          {/* Scrollable Grids */}
          <div className="flex overflow-x-auto">
            {grids.map(grid => (
               <TabButton key={grid.id} id={grid.id} name={grid.name} />
            ))}
            <button
              onClick={onAddNew}
              className="flex-shrink-0 whitespace-nowrap px-4 py-3 border-b-2 border-transparent text-text-secondary hover:text-primary flex items-center gap-1.5"
              title="Add new grid"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          
          {/* Fixed Buttons on the Right */}
          <div className="flex items-center ml-auto pl-4">
            <button
              onClick={onManage}
              className="flex-shrink-0 whitespace-nowrap px-4 py-3 border-b-2 border-transparent text-text-secondary hover:text-primary flex items-center gap-1.5"
              title="Manage grids"
            >
              <PencilIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Manage</span>
            </button>
            <TabButton id="All" name="All Items" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default CategoryTabs;
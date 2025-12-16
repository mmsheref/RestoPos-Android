
import React from 'react';
import { PencilIcon, PlusIcon, GridIcon, SettingsIcon, CheckIcon } from '../../constants';
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
  isEditing: boolean;
  onToggleEditMode: () => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = React.memo(({
  grids, activeGridId, setActiveGridId, onAddNew, onManage,
  isSearchActive, searchResultsCount, searchQuery,
  isEditing, onToggleEditMode
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
        onClick={() => {
            if (!isEditing) setActiveGridId(id);
            else alert("Please finish editing before switching tabs.");
        }}
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
          <div className="flex items-center ml-auto pl-2 bg-background shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.1)] dark:shadow-none z-10">
            {/* Edit Items Mode Toggle */}
            {activeGridId !== 'All' && (
                <button
                    onClick={onToggleEditMode}
                    className={`flex-shrink-0 whitespace-nowrap px-3 py-3 border-b-2 transition-colors duration-200 ${
                        isEditing 
                        ? 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/20' 
                        : 'border-transparent text-text-secondary hover:text-primary'
                    }`}
                    title={isEditing ? "Done Editing" : "Edit Grid Layout"}
                >
                    {isEditing ? <CheckIcon className="h-5 w-5" /> : <PencilIcon className="h-5 w-5" />}
                </button>
            )}

            {/* Manage Categories (Reorder/Rename) */}
            <button
              onClick={onManage}
              className="flex-shrink-0 whitespace-nowrap px-3 py-3 border-b-2 border-transparent text-text-secondary hover:text-primary"
              title="Manage Grid Tabs"
            >
              <SettingsIcon className="h-5 w-5" />
            </button>

            {/* All Items Button */}
            <button
                onClick={() => {
                    if(isEditing) onToggleEditMode();
                    setActiveGridId('All');
                }}
                className={`flex-shrink-0 whitespace-nowrap px-3 py-3 border-b-2 text-sm font-medium transition-colors duration-200 focus:outline-none ${
                activeGridId === 'All'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
                title="All Items"
            >
                <GridIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      {isEditing && activeGridId !== 'All' && (
          <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs text-center py-1 px-2">
              Editing Mode: Tap items to change, or the <b>X</b> to remove. Tap Check to finish.
          </div>
      )}
    </nav>
  );
});

export default CategoryTabs;

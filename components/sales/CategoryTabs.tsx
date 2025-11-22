import React from 'react';
import { useLongPress } from '../../hooks/useLongPress';

interface CategoryTabsProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddNewTab: () => void;
  onEditTab: (tabName: string) => void;
  isSearchActive: boolean;
  searchResultsCount: number;
  searchQuery: string;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  tabs,
  activeTab,
  setActiveTab,
  onAddNewTab,
  onEditTab,
  isSearchActive,
  searchResultsCount,
  searchQuery
}) => {

  const TabButton: React.FC<{ tab: string }> = ({ tab }) => {
    const longPressProps = useLongPress(
      () => onEditTab(tab),
      () => setActiveTab(tab)
    );
  
    return (
      <button
        {...longPressProps}
        className={`flex-shrink-0 whitespace-nowrap px-5 py-3 border-b-2 text-sm font-medium transition-colors duration-200 focus:outline-none ${
          activeTab === tab
            ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
        }`}
      >
        {tab}
      </button>
    );
  };

  if (isSearchActive) {
    return (
      <div className="flex-shrink-0 pt-4 mt-4 text-center text-slate-500 dark:text-slate-400">
        Showing {searchResultsCount} results for "{searchQuery}"
      </div>
    );
  }

  return (
    <nav className="flex-shrink-0 pt-4 mt-4">
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex -mb-px overflow-x-auto">
          {tabs.map(tab => (
            <TabButton key={tab} tab={tab} />
          ))}
          <button
            onClick={onAddNewTab}
            className="flex-shrink-0 whitespace-nowrap px-5 py-3 border-b-2 border-transparent text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
            title="Add new tab"
          >
            [ + ]
          </button>
        </div>
      </div>
    </nav>
  );
};

export default CategoryTabs;

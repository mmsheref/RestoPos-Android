
import React from 'react';
import { PlusIcon, CloseIcon } from '../../constants';
import { Item } from '../../types';

interface ItemGridProps {
  itemsForDisplay: (Item | null)[];
  mode: 'all' | 'grid';
  onAddItemToOrder: (item: Item) => void;
  onAssignItem: (slotIndex: number) => void;
  onRemoveItemFromGrid: (slotIndex: number) => void;
}

const ItemGrid: React.FC<ItemGridProps> = ({ itemsForDisplay, mode, onAddItemToOrder, onAssignItem, onRemoveItemFromGrid }) => {
  // FIX: Differentiate layout for fixed 5x4 grids vs. scrolling 'all' items grid.
  const isFixedGrid = mode === 'grid';

  // For fixed grids, the container and grid itself must fill the parent's height.
  const gridContainerClasses = isFixedGrid ? 'h-full' : '';
  
  // A fixed grid uses `grid-rows-4` to ensure it fits, while a scrolling grid flows naturally.
  const gridClasses = isFixedGrid
    ? 'grid grid-cols-5 grid-rows-4 gap-2 h-full'
    : 'grid grid-cols-5 gap-2';

  return (
    <div className={gridContainerClasses}>
      <div className={gridClasses}>
        {itemsForDisplay.map((item, index) =>
          item ? (
            <div
              key={`${item.id}-${index}`}
              onClick={() => onAddItemToOrder(item)}
              className={`relative w-full rounded-lg overflow-hidden cursor-pointer group shadow-sm border border-slate-200 dark:border-slate-700 bg-gray-100 dark:bg-gray-800 flex flex-col ${isFixedGrid ? 'h-full' : 'aspect-square'}`}
              role="button"
              aria-label={`Add ${item.name} to order`}
            >
              {mode === 'grid' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItemFromGrid(index);
                  }}
                  className="absolute top-1 right-1 bg-black/50 hover:bg-red-600 text-white rounded-full p-1 z-10 transition-colors duration-200"
                  aria-label={`Remove ${item.name} from grid`}
                  title="Remove from grid"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
              <img 
                src={item.imageUrl} 
                alt={item.name} 
                className="flex-grow w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="flex-shrink-0 px-2 py-1.5 bg-black/75 flex items-center justify-center min-h-[30%]">
                <h3 className="font-medium text-white text-xs md:text-sm leading-tight text-center line-clamp-2" title={item.name}>
                  {item.name}
                </h3>
              </div>
            </div>
          ) : (
            <div
              key={`placeholder-${index}`}
              onClick={() => onAssignItem(index)}
              role="button"
              aria-label="Assign item to this slot"
              className={`w-full rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20
                         flex items-center justify-center cursor-pointer text-slate-400 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-indigo-400 hover:text-indigo-500 transition-colors ${isFixedGrid ? 'h-full' : 'aspect-square'}`}
            >
              <PlusIcon className="h-8 w-8" />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ItemGrid;

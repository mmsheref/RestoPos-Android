
import React from 'react';
import { PlusIcon } from '../../constants';
import { Item } from '../../types';

interface ItemGridProps {
  itemsForDisplay: (Item | null)[];
  mode: 'all' | 'grid';
  onAddItemToOrder: (item: Item) => void;
  onAssignItem: (slotIndex: number) => void;
}

const ItemGrid: React.FC<ItemGridProps> = ({ itemsForDisplay, mode, onAddItemToOrder, onAssignItem }) => {

  const gridClasses = mode === 'grid'
    ? 'grid grid-cols-5 grid-rows-4 gap-2 h-full' // Fixed 5x4 grid that fills the container
    : 'grid grid-cols-5 gap-2'; // "All Items" grid that grows naturally

  return (
    <div className={mode === 'grid' ? 'h-full' : ''}>
      <div className={gridClasses}>
        {itemsForDisplay.map((item, index) =>
          item ? (
            <div
              key={item.id}
              onClick={() => onAddItemToOrder(item)}
              className="relative w-full aspect-square rounded-lg overflow-hidden cursor-pointer group shadow-sm border border-slate-200 dark:border-slate-700 bg-gray-100 dark:bg-gray-800 flex flex-col"
              role="button"
              aria-label={`Add ${item.name} to order`}
            >
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
              className="w-full h-full rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20
                         flex items-center justify-center cursor-pointer text-slate-400 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
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
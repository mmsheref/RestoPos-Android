
import React from 'react';
import { PlusIcon } from '../../constants';
import { Item } from '../../types';
import ItemTile from './ItemTile';

interface ItemGridProps {
  itemsForDisplay: (Item | null)[];
  mode: 'all' | 'grid';
  onAddItemToOrder: (item: Item) => void;
  onAssignItem: (slotIndex: number) => void;
  onItemLongPress: (item: Item, slotIndex: number, event: React.MouseEvent | React.TouchEvent) => void;
}

const ItemGrid: React.FC<ItemGridProps> = ({ itemsForDisplay, mode, onAddItemToOrder, onAssignItem, onItemLongPress }) => {
  const isFixedGrid = mode === 'grid';

  const gridContainerClasses = isFixedGrid ? 'h-full' : '';
  
  const gridClasses = isFixedGrid
    ? 'grid grid-cols-5 grid-rows-4 gap-3 h-full'
    : 'grid grid-cols-5 gap-3';

  return (
    <div className={gridContainerClasses}>
      <div className={gridClasses}>
        {itemsForDisplay.map((item, index) => {
          if (!item) {
            // Renders the placeholder for an empty grid slot
            return (
              <div
                key={`placeholder-${index}`}
                onClick={() => onAssignItem(index)}
                role="button"
                aria-label="Assign item to this slot"
                className={`w-full rounded-lg border-2 border-dashed border-border bg-surface-muted/30
                           flex items-center justify-center cursor-pointer text-text-muted hover:bg-surface-muted hover:border-primary hover:text-primary transition-colors ${isFixedGrid ? 'h-full' : 'aspect-square'}`}
              >
                <PlusIcon className="h-8 w-8" />
              </div>
            );
          }
          
          return (
            <ItemTile
                key={`${item.id}-${index}`}
                item={item}
                mode={mode}
                onAddItemToOrder={onAddItemToOrder}
                onItemLongPress={onItemLongPress}
                index={index}
                isFixedGrid={isFixedGrid}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ItemGrid;
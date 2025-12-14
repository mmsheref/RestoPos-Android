
import React from 'react';
import { PlusIcon } from '../../constants';
import { Item } from '../../types';
import ItemTile from './ItemTile';

interface ItemGridProps {
  itemsForDisplay: (Item | null)[];
  mode: 'all' | 'grid';
  onAddItemToOrder: (item: Item) => void;
  onAssignItem: (slotIndex: number) => void;
  onRemoveItem?: (slotIndex: number) => void;
  loadMoreRef?: React.RefObject<HTMLDivElement>;
  isEditing?: boolean;
}

const ItemGrid = React.memo<ItemGridProps>(({ 
    itemsForDisplay, mode, onAddItemToOrder, onAssignItem, onRemoveItem, 
    loadMoreRef, isEditing = false 
}) => {
  const isFixedGrid = mode === 'grid';

  // Apply fixed height and row constraints only in 'grid' mode on tablet.
  // 'grid-rows-4' + 'h-full' ensures it fills the container exactly.
  const gridClasses = isFixedGrid
    ? 'grid grid-cols-3 gap-2 pb-20 md:grid-cols-5 md:grid-rows-4 md:gap-3 md:pb-0 md:h-full'
    : 'grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 pb-20 md:pb-0';

  return (
    <div className={isFixedGrid ? 'md:h-full' : ''}>
      <div className={gridClasses}>
        {itemsForDisplay.map((item, index) => {
          if (!item) {
            // Only allow assigning items to empty slots if we are in 'grid' mode.
            if (mode === 'all') return null;

            return (
              <button
                type="button"
                key={`placeholder-${index}`}
                onClick={() => {
                    if (isEditing) onAssignItem(index);
                }}
                disabled={!isEditing}
                className={`w-full rounded-xl border-2 border-dashed border-border 
                           flex items-center justify-center text-text-muted transition-colors 
                           ${isFixedGrid ? 'aspect-square md:aspect-auto md:h-full' : 'aspect-square'}
                           ${isEditing ? 'cursor-pointer hover:bg-surface-muted hover:border-primary hover:text-primary bg-surface-muted/20' : 'opacity-50 cursor-default'}`}
              >
                {isEditing && <PlusIcon className="h-8 w-8" />}
              </button>
            );
          }
          
          return (
            <ItemTile
                key={`${item.id}-${index}`}
                item={item}
                mode={mode}
                onAddItemToOrder={onAddItemToOrder}
                onAssignItem={onAssignItem}
                onRemoveFromGrid={onRemoveItem}
                index={index}
                isFixedGrid={isFixedGrid}
                isEditing={isEditing}
            />
          );
        })}
      </div>
      {/* Sentinel for infinite scrolling (only for 'all' mode) */}
      {loadMoreRef && itemsForDisplay.length > 0 && (
          <div ref={loadMoreRef} className="h-20 w-full flex items-center justify-center mt-4">
              <div className="w-2 h-2 bg-surface-muted rounded-full"></div>
          </div>
      )}
    </div>
  );
});

export default ItemGrid;

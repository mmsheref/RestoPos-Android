
import React from 'react';
import { Item } from '../../types';
import { useLongPress } from '../../hooks/useLongPress';

interface ItemTileProps {
    item: Item;
    mode: 'all' | 'grid';
    onAddItemToOrder: (item: Item) => void;
    onItemLongPress: (item: Item, slotIndex: number, event: React.MouseEvent | React.TouchEvent) => void;
    index: number;
    isFixedGrid: boolean;
}

const ItemTile: React.FC<ItemTileProps> = ({ item, mode, onAddItemToOrder, onItemLongPress, index, isFixedGrid }) => {
    // Correct usage of the hook: at the top level of a component.
    const longPressEvents = useLongPress(
        (e) => {
            if (mode === 'grid') {
                onItemLongPress(item, index, e);
            }
        },
        () => onAddItemToOrder(item),
        { delay: 400 }
    );

    const eventHandlers = mode === 'grid' ? longPressEvents : { onClick: () => onAddItemToOrder(item) };

    const hasRealImage = item.imageUrl && !item.imageUrl.includes('via.placeholder.com');

    if (hasRealImage) {
        // View for items WITH a real image (image and text overlay)
        return (
            <div
                {...eventHandlers}
                className={`relative w-full rounded-lg overflow-hidden cursor-pointer group shadow-sm border border-slate-200 dark:border-slate-700 bg-gray-200 dark:bg-gray-800 ${isFixedGrid ? 'h-full' : 'aspect-square'}`}
                aria-label={`Add ${item.name} to order`}
            >
                <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 z-0"
                    loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gray-900/60 backdrop-blur-sm z-10">
                    <h3 className="font-semibold text-white text-xs md:text-sm leading-tight text-center line-clamp-2" title={item.name}>
                        {item.name}
                    </h3>
                </div>
            </div>
        );
    } else {
        // View for items WITHOUT a real image (label only)
        return (
            <div
                {...eventHandlers}
                className={`relative w-full rounded-lg cursor-pointer group shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col justify-center items-center p-2 text-center ${isFixedGrid ? 'h-full' : 'aspect-square'}`}
                aria-label={`Add ${item.name} to order`}
            >
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm md:text-base leading-tight line-clamp-3">
                    {item.name}
                </h3>
            </div>
        );
    }
};

export default ItemTile;

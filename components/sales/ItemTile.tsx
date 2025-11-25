
import React, { useRef } from 'react';
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

const ItemTile: React.FC<ItemTileProps> = React.memo(({ item, mode, onAddItemToOrder, onItemLongPress, index, isFixedGrid }) => {
    const lastClickTime = useRef(0);

    // This debounce handler prevents rapid-fire clicks that can occur from a single touch event on some devices.
    const handleDebouncedClick = () => {
        const now = Date.now();
        if (now - lastClickTime.current < 100) { 
            return;
        }
        lastClickTime.current = now;
        onAddItemToOrder(item);
    };
    
    const longPressEvents = useLongPress(
        (e) => {
            if (mode === 'grid') {
                onItemLongPress(item, index, e);
            }
        },
        handleDebouncedClick,
        { delay: 400 }
    );

    const eventHandlers = mode === 'grid' ? longPressEvents : { onClick: handleDebouncedClick };

    const hasRealImage = item.imageUrl && !item.imageUrl.includes('via.placeholder.com');

    if (hasRealImage) {
        // View for items WITH a real image (image and text overlay)
        return (
            <div
                {...eventHandlers}
                className={`relative w-full rounded-lg overflow-hidden cursor-pointer group shadow-sm border border-border bg-surface-muted ${isFixedGrid ? 'h-full' : 'aspect-square'}`}
                aria-label={`Add ${item.name} to order`}
            >
                <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 z-0"
                    loading="lazy"
                    decoding="async"
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 backdrop-blur-sm z-10">
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
                className={`relative w-full rounded-lg cursor-pointer group shadow-sm border border-border bg-surface flex flex-col justify-center items-center p-2 text-center transition-colors hover:bg-surface-muted ${isFixedGrid ? 'h-full' : 'aspect-square'}`}
                aria-label={`Add ${item.name} to order`}
            >
                <h3 className="font-semibold text-text-primary text-sm md:text-base leading-tight line-clamp-3">
                    {item.name}
                </h3>
            </div>
        );
    }
});

export default ItemTile;

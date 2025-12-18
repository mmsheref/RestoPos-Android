
import React from 'react';
import { Item } from '../../types';
import { TrashIcon, PencilIcon } from '../../constants';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface ItemTileProps {
    item: Item;
    mode: 'all' | 'grid';
    onAddItemToOrder: (item: Item) => void;
    onAssignItem: (slotIndex: number) => void;
    onRemoveFromGrid?: (slotIndex: number) => void;
    index: number;
    isFixedGrid: boolean;
    isEditing: boolean;
}

const ItemTile: React.FC<ItemTileProps> = React.memo(({ 
    item, mode, onAddItemToOrder, onAssignItem, onRemoveFromGrid, 
    index, isFixedGrid, isEditing 
}) => {
    
    const hasRealImage = item.imageUrl && !item.imageUrl.includes('via.placeholder.com');

    const aspectRatioClass = isFixedGrid 
        ? 'aspect-square md:aspect-auto md:h-full' 
        : 'aspect-square';

    // --- EDIT MODE RENDER ---
    if (isEditing && mode === 'grid') {
        return (
            <div 
                className={`relative w-full rounded-xl overflow-hidden border-2 border-dashed border-primary/60 bg-primary/5 animate-pulse ${aspectRatioClass}`}
            >
                {hasRealImage && (
                    <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="absolute inset-0 w-full h-full object-cover z-0 opacity-30 grayscale pointer-events-none"
                    />
                )}
                
                <button
                    type="button"
                    onClick={async () => {
                        await Haptics.impact({ style: ImpactStyle.Light });
                        onAssignItem(index);
                    }}
                    className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full touch-manipulation"
                >
                    <div className="bg-primary/10 p-2 rounded-full mb-1">
                        <PencilIcon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-primary bg-surface/90 px-2 py-0.5 rounded-full shadow-sm">Change</span>
                </button>

                <button 
                    type="button"
                    onClick={async (e) => {
                        e.stopPropagation();
                        await Haptics.notification({ type: ImpactStyle.Heavy });
                        if(onRemoveFromGrid) onRemoveFromGrid(index);
                    }}
                    className="absolute top-1 right-1 z-20 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 active:scale-90 transition-transform touch-manipulation"
                >
                    <TrashIcon className="h-4 w-4" />
                </button>

                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/50 backdrop-blur-sm z-0 pointer-events-none">
                    <h3 className="font-semibold text-white text-xs text-center truncate">
                        {item.name}
                    </h3>
                </div>
            </div>
        );
    }

    // --- NORMAL MODE RENDER ---
    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        await Haptics.impact({ style: ImpactStyle.Light });
        onAddItemToOrder(item);
    };

    const PriceBadge = () => (
        <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-black/60 text-white backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-1 rounded-md text-[10px] md:text-xs font-bold shadow-lg z-10 tabular-nums tracking-tight border border-white/20 pointer-events-none">
            ₹{item.price.toFixed(0)}
        </div>
    );

    if (hasRealImage) {
        return (
            <button
                type="button"
                onClick={handleClick}
                className={`relative w-full rounded-xl overflow-hidden cursor-pointer shadow-sm border border-border/50 bg-surface-muted group touch-manipulation select-none ${aspectRatioClass}`}
                aria-label={`Add ${item.name} to order`}
            >
                <div className="w-full h-full pointer-events-none relative">
                    <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        loading="lazy"
                        decoding="async"
                    />
                    
                    <div className="absolute inset-0 bg-black opacity-0 group-active:opacity-20 z-30 transition-none"></div>

                    <PriceBadge />
                    
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-2 z-20">
                        <h3 className="font-bold text-white text-xs md:text-sm leading-tight text-center line-clamp-2 drop-shadow-sm">
                            {item.name}
                        </h3>
                    </div>
                </div>
            </button>
        );
    } else {
        return (
            <button
                type="button"
                onClick={handleClick}
                className={`relative w-full rounded-xl cursor-pointer shadow-sm border border-border bg-surface group touch-manipulation select-none hover:border-primary/50 ${aspectRatioClass}`}
                aria-label={`Add ${item.name} to order`}
            >
                <div className="absolute inset-0 bg-primary opacity-0 group-active:opacity-10 z-10 rounded-xl transition-none"></div>

                <PriceBadge />
                <div className="w-full h-full flex flex-col justify-center items-center p-2 md:p-3 text-center pointer-events-none relative z-0">
                     <div className="w-6 h-1 md:w-8 bg-primary/20 rounded-full mb-2 md:mb-3"></div>
                    <h3 className="font-bold text-text-primary text-xs md:text-base leading-snug line-clamp-3">
                        {item.name}
                    </h3>
                </div>
            </button>
        );
    }
});

export default ItemTile;

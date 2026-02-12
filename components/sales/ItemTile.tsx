
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
    
    const hasRealImage = item.imageUrl && item.imageUrl.startsWith('data:image');

    const aspectRatioClass = isFixedGrid 
        ? 'aspect-square md:aspect-auto md:h-full' 
        : 'aspect-square';

    if (isEditing && mode === 'grid') {
        return (
            <div className={`relative w-full rounded-2xl overflow-hidden border-2 border-dashed border-primary/60 bg-primary/5 animate-pulse ${aspectRatioClass}`}>
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
                    className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full"
                >
                    <div className="bg-primary/20 p-2 rounded-full mb-1"><PencilIcon className="h-6 w-6 text-primary" /></div>
                    <span className="text-[10px] uppercase font-bold text-primary bg-surface/90 px-2 py-0.5 rounded-full shadow-sm">Change</span>
                </button>
                <button 
                    type="button"
                    onClick={async (e) => {
                        e.stopPropagation();
                        await Haptics.notification({ type: ImpactStyle.Heavy });
                        if(onRemoveFromGrid) onRemoveFromGrid(index);
                    }}
                    className="absolute top-1 right-1 z-20 bg-red-500 text-white rounded-full p-1.5 shadow-md active:scale-90"
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/50 backdrop-blur-md z-0 pointer-events-none">
                    <h3 className="font-semibold text-white text-xs text-center truncate">{item.name}</h3>
                </div>
            </div>
        );
    }

    const handleClick = async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
        onAddItemToOrder(item);
    };

    const PriceBadge = () => (
        <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-white/20 dark:bg-black/40 backdrop-blur-md text-text-primary border border-white/40 dark:border-white/10 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg text-[10px] md:text-xs font-bold shadow-sm z-10 tabular-nums pointer-events-none">
            ₹{item.price.toFixed(0)}
        </div>
    );

    // --- LIQUID GLASS STYLING ---
    // Using bg-surface/60 for translucency + backdrop-blur for the glass effect.
    // White borders with low opacity create the "edge" highlight.
    
    const glassContainer = `relative w-full rounded-2xl overflow-hidden cursor-pointer group select-none shadow-glass hover:shadow-glass-hover active:scale-95 transition-all duration-300 ease-out border border-white/60 dark:border-white/10 ${aspectRatioClass}`;
    
    // Gradient overlay for "Shine" effect
    const liquidShine = (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/30 dark:to-white/5 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    );

    if (hasRealImage) {
        return (
            <button type="button" onClick={handleClick} className={glassContainer}>
                <div className="w-full h-full relative pointer-events-none">
                    <img src={item.imageUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    {liquidShine}
                    <PriceBadge />
                    
                    {/* Glass Caption Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                        <h3 className="font-bold text-white text-xs md:text-sm leading-tight text-center line-clamp-2 drop-shadow-md">{item.name}</h3>
                    </div>
                </div>
            </button>
        );
    }

    return (
        <button type="button" onClick={handleClick} className={`${glassContainer} bg-surface/60 backdrop-blur-md`}>
            <div className="w-full h-full flex flex-col justify-center items-center p-2 text-center pointer-events-none relative z-0">
                {liquidShine}
                <PriceBadge />
                
                {/* Decorative Pill */}
                <div className="w-8 h-1 bg-primary/40 rounded-full mb-3 shadow-[0_0_10px_rgba(var(--color-primary),0.4)]" />
                
                <h3 className="font-bold text-text-primary text-xs md:text-base leading-snug line-clamp-3 group-hover:text-primary transition-colors duration-300">
                    {item.name}
                </h3>
            </div>
        </button>
    );
}, (prev, next) => {
    return prev.item.id === next.item.id && 
           prev.item.price === next.item.price && 
           prev.isEditing === next.isEditing &&
           prev.item.stock === next.item.stock;
});

export default ItemTile;

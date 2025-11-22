
import React from 'react';

interface Item {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

interface ItemGridProps {
  itemsForGrid: (Item | null)[];
  addToOrder: (item: Item) => void;
}

const ItemGrid: React.FC<ItemGridProps> = ({ itemsForGrid, addToOrder }) => {
  return (
    <main className="flex-grow grid grid-cols-4 grid-rows-5 md:grid-cols-5 md:grid-rows-4 gap-3 h-0">
      {itemsForGrid.map((item, index) =>
        item ? (
          <div
            key={item.id}
            onClick={() => addToOrder(item)}
            className="relative w-full h-full rounded-xl overflow-hidden cursor-pointer group shadow-sm border border-slate-200 dark:border-slate-700 bg-gray-100 dark:bg-gray-800"
            role="button"
            aria-label={`Add ${item.name} to order`}
          >
            {/* Full size image */}
            <img 
              src={item.imageUrl} 
              alt={item.name} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            
            {/* Content Container: Simple black bar, name only */}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-black/75 flex items-center justify-center min-h-[20%]">
              <h3 className="font-medium text-white text-xs md:text-sm leading-tight text-center line-clamp-2" title={item.name}>
                {item.name}
              </h3>
            </div>
          </div>
        ) : (
          <div
            key={`placeholder-${index}`}
            className="w-full h-full rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20"
          >
          </div>
        )
      )}
    </main>
  );
};

export default ItemGrid;

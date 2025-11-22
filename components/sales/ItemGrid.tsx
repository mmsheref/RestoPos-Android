
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
    <main className="flex-grow grid grid-cols-4 grid-rows-5 md:grid-cols-5 md:grid-rows-4 gap-4">
      {itemsForGrid.map((item, index) =>
        item ? (
          <div
            key={item.id}
            onClick={() => addToOrder(item)}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-start text-center cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-indigo-500 dark:hover:ring-indigo-400 overflow-hidden"
            role="button"
            aria-label={`Add ${item.name} to order`}
          >
            <img 
              src={item.imageUrl} 
              alt={item.name} 
              className="w-full h-2/3 object-cover"
              loading="lazy"
            />
            <div className="p-2 flex-1 flex flex-col justify-center">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight">{item.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">₹{item.price.toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <div
            key={`placeholder-${index}`}
            className="bg-slate-100 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl"
          >
          </div>
        )
      )}
    </main>
  );
};

export default ItemGrid;
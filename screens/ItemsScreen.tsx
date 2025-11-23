import React, { useState, useMemo } from 'react';
import type { Item } from '../types';
import { useAppContext } from '../context/AppContext';
import ItemFormModal from '../components/modals/ItemFormModal';
import { SearchIcon, TrashIcon } from '../constants';

// UUID Generator Fallback for non-secure contexts (e.g. localhost/http)
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// FIX: Refactored ItemRow to use a props interface and React.FC to fix typing issue with the 'key' prop.
// Refactored Row Component: Row click edits, Delete button is separate/protected
interface ItemRowProps {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

const ItemRow: React.FC<ItemRowProps> = ({ item, onEdit, onDelete }) => {
    return (
        <tr 
            onClick={() => onEdit(item)}
            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
        >
            <td className="px-6 py-4 whitespace-nowrap">
                <img 
                    className="h-10 w-10 rounded-md object-cover bg-gray-200" 
                    src={item.imageUrl} 
                    alt={item.name} 
                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')} 
                />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">₹{item.price.toFixed(2)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.stock}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(item.id);
                    }} 
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors relative z-10"
                    title="Delete Item"
                    aria-label={`Delete ${item.name}`}
                >
                    <TrashIcon className="h-5 w-5" />
                </button>
            </td>
        </tr>
    );
};

const ItemsScreen: React.FC = () => {
  const { items, addItem, updateItem, deleteItem } = useAppContext();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);

  const filteredItems = useMemo(() => {
      return items.filter(i => 
        i.name.toLowerCase().includes(search.toLowerCase())
      );
  }, [items, search]);

  const handleAddItem = () => {
    setEditingItem(undefined);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
      console.log(`[ItemsScreen] User initiated delete for item ID: ${itemId}.`);
      deleteItem(itemId);
      
      if (editingItem?.id === itemId) {
          console.log(`[ItemsScreen] Closing edit modal because the item being edited was deleted.`);
          setIsModalOpen(false);
          setEditingItem(undefined);
      }
  };
  
  const handleSaveItem = (itemData: Partial<Item>) => {
      if (editingItem) {
          updateItem({ ...editingItem, ...itemData } as Item);
      } else {
          addItem({ 
              id: generateId(), 
              name: itemData.name || 'New Item',
              price: itemData.price || 0,
              stock: itemData.stock || 0,
              imageUrl: itemData.imageUrl || 'https://via.placeholder.com/150'
          } as Item);
      }
      setIsModalOpen(false);
  };

  return (
    <div className="p-6 dark:bg-gray-900 min-h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 self-start md:self-center">Menu Items</h1>
        <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-grow md:flex-grow-0">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input 
                    type="text" 
                    placeholder="Search items..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <button
              onClick={handleAddItem}
              className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0 shadow-sm"
            >
              + Add Item
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex-grow border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Image</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.length === 0 ? (
                  <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          {search ? 'No items found matching your search.' : 'No items available. Add your first item!'}
                      </td>
                  </tr>
              ) : (
                filteredItems.map((item) => (
                    <ItemRow 
                        key={item.id} 
                        item={item} 
                        onEdit={handleEditItem} 
                        onDelete={handleDeleteItem} 
                    />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ItemFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        onDelete={() => {
            if(editingItem) handleDeleteItem(editingItem.id);
        }}
        initialData={editingItem}
      />

    </div>
  );
};

export default ItemsScreen;
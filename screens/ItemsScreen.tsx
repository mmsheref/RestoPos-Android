

import React, { useState } from 'react';
import type { Item } from '../types';

const mockItems: Item[] = [
  { id: 'a1', name: 'Spring Rolls', price: 150.00, category: 'Appetizers', stock: 50, imageUrl: 'https://picsum.photos/id/102/100/100' },
  { id: 'm1', name: 'Steak Frites', price: 650.00, category: 'Main Courses', stock: 20, imageUrl: 'https://picsum.photos/id/103/100/100' },
  { id: 'd1', name: 'Cheesecake', price: 220.00, category: 'Desserts', stock: 30, imageUrl: 'https://picsum.photos/id/104/100/100' },
];

const ItemsScreen: React.FC = () => {
  const [items, setItems] = useState<Item[]>(mockItems);

  // In a real app, these functions would call an API
  const handleAddItem = () => {
    // Placeholder for add item modal
    alert('Add new item functionality to be implemented.');
  };

  const handleEditItem = (item: Item) => {
    // Placeholder for edit item modal
    alert(`Editing item: ${item.name}`);
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    }
  };

  return (
    <div className="p-6 dark:bg-gray-900 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Menu Items</h1>
        <button
          onClick={handleAddItem}
          className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Item
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Image</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img className="h-10 w-10 rounded-full" src={item.imageUrl} alt={item.name} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">₹{item.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => handleEditItem(item)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">Edit</button>
                    <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ItemsScreen;

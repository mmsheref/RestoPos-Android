
import React, { useState, useEffect } from 'react';
import { Item } from '../../types';

interface ItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Partial<Item>) => void;
    initialData?: Item;
    categories: string[];
}

const ItemFormModal: React.FC<ItemFormModalProps> = ({ isOpen, onClose, onSave, initialData, categories }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setCategory(initialData.category);
            setPrice(initialData.price.toString());
            setStock(initialData.stock.toString());
            setImageUrl(initialData.imageUrl);
        } else {
            setName('');
            setCategory(categories[0] || '');
            setPrice('');
            setStock('100');
            setImageUrl('');
        }
    }, [initialData, categories, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            category,
            price: parseFloat(price) || 0,
            stock: parseInt(stock) || 0,
            imageUrl: imageUrl || 'https://via.placeholder.com/150'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">
                    {initialData ? 'Edit Item' : 'Add New Item'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Item Name</label>
                        <input 
                            required
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price</label>
                            <input 
                                required
                                type="number" 
                                min="0"
                                step="0.01"
                                value={price} 
                                onChange={e => setPrice(e.target.value)} 
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock</label>
                            <input 
                                type="number" 
                                value={stock} 
                                onChange={e => setStock(e.target.value)} 
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                        <div className="flex gap-2">
                            <select 
                                value={category} 
                                onChange={e => setCategory(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                            >
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Image URL</label>
                        <input 
                            type="url" 
                            value={imageUrl} 
                            onChange={e => setImageUrl(e.target.value)} 
                            placeholder="https://..."
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Item</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ItemFormModal;

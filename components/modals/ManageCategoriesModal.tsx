
import React, { useState, useEffect } from 'react';
import { Item } from '../../types';
import { TrashIcon, PencilIcon, CheckIcon } from '../../constants';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categories: string[]) => void;
  initialCategories: string[];
  allItems: Item[];
}

const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({ isOpen, onClose, onSave, initialCategories, allItems }) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCategories(initialCategories);
    }
  }, [isOpen, initialCategories]);

  if (!isOpen) return null;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newCategories = [...categories];
    const item = newCategories.splice(index, 1)[0];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newCategories.splice(newIndex, 0, item);
    setCategories(newCategories);
  };

  const handleDelete = (index: number) => {
    console.log(`--- DEBUG: handleDelete INITIATED (Index: ${index}) ---`);
    const categoryToDelete = categories[index];
    console.log(`[1] Category to delete: "${categoryToDelete}"`);
    console.log(`[2] Checking against ${allItems.length} total items...`);

    // Detailed logging of items being checked
    console.log('[DEBUG] All items being checked:', allItems.map(i => ({name: i.name, category: i.category})));

    const itemsUsingCategory = allItems.filter(item => {
        const isMatch = item.category === categoryToDelete;
        if(isMatch) {
            console.log(`[DEBUG] Match found: Item "${item.name}" uses category "${item.category}"`);
        }
        return isMatch;
    });

    console.log(`[3] Found ${itemsUsingCategory.length} items using this category.`);
    if (itemsUsingCategory.length > 0) {
        console.warn(`[4] BLOCK: Deletion prevented because category is in use.`);
        const itemNames = itemsUsingCategory.map(i => i.name).join(', ');
        alert(`Cannot delete category "${categoryToDelete}". It is currently used by the following item(s): ${itemNames}. Please change their category first.`);
        console.log(`--- DEBUG: handleDelete ENDED (Blocked) ---`);
        return;
    }

    console.log(`[4] PROCEED: Category is not in use. Showing confirmation dialog.`);
    if (window.confirm(`Are you sure you want to delete the category "${categories[index]}"?`)) {
      console.log(`[5] CONFIRMED: User clicked OK. Removing category from state.`);
      setCategories(categories.filter((_, i) => i !== index));
      console.log(`[6] SUCCESS: Category removed.`);
    } else {
      console.log(`[5] CANCELLED: User clicked Cancel.`);
    }
    console.log(`--- DEBUG: handleDelete ENDED ---`);
  };
  
  const handleStartEditing = (index: number) => {
    setEditingIndex(index);
    setEditingText(categories[index]);
  };
  
  const handleSaveEdit = () => {
    if (editingIndex === null || !editingText.trim()) return;
    const newCategories = [...categories];
    newCategories[editingIndex] = editingText.trim();
    setCategories(newCategories);
    setEditingIndex(null);
  };
  
  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <header className="flex-shrink-0 flex justify-between items-center p-4 border-b dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Manage Categories</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-3xl font-light" aria-label="Close">&times;</button>
        </header>

        <div className="flex-grow overflow-y-auto p-4">
          {categories.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No categories exist.</p>
          ) : (
            <ul className="space-y-2">
              {categories.map((cat, index) => (
                <li key={`${cat}-${index}`} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex flex-col">
                    <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1 text-slate-400 disabled:opacity-30 hover:text-slate-700 dark:hover:text-slate-200">&uarr;</button>
                    <button onClick={() => handleMove(index, 'down')} disabled={index === categories.length - 1} className="p-1 text-slate-400 disabled:opacity-30 hover:text-slate-700 dark:hover:text-slate-200">&darr;</button>
                  </div>
                  {editingIndex === index ? (
                     <input type="text" value={editingText} onChange={e => setEditingText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()} autoFocus className="flex-grow p-2 border rounded bg-white dark:bg-slate-900 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500" />
                  ) : (
                     <span className="flex-grow font-medium text-slate-800 dark:text-slate-200">{cat}</span>
                  )}
                  <div className="flex items-center gap-1">
                    {editingIndex === index ? (
                        <>
                           <button onClick={handleSaveEdit} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full"><CheckIcon className="h-5 w-5" /></button>
                           <button onClick={handleCancelEdit} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full">&times;</button>
                        </>
                    ) : (
                        <>
                           <button onClick={() => handleStartEditing(index)} className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full"><PencilIcon className="h-5 w-5" /></button>
                           <button onClick={() => handleDelete(index)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full"><TrashIcon className="h-5 w-5" /></button>
                        </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex-shrink-0 p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
           <div className="flex gap-2">
               <input 
                 type="text" 
                 value={newCategory} 
                 onChange={e => setNewCategory(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                 placeholder="Add new category..." 
                 className="flex-grow p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500" 
               />
               <button onClick={handleAddCategory} className="px-4 py-2 bg-indigo-600 text-white rounded font-semibold hover:bg-indigo-700">Add</button>
           </div>
        </div>

        <footer className="flex-shrink-0 flex justify-end gap-3 p-4 border-t dark:border-slate-700">
          <button onClick={onClose} className="px-6 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500">Cancel</button>
          <button onClick={() => onSave(categories)} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Save Changes</button>
        </footer>
      </div>
    </div>
  );
};

export default ManageCategoriesModal;
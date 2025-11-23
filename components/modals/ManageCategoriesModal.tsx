
import React, { useState, useEffect } from 'react';
import { Item } from '../../types';
import { TrashIcon, PencilIcon, CheckIcon, CloseIcon } from '../../constants';

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
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCategories(initialCategories);
      setDeleteConfirmIndex(null);
      setEditingIndex(null);
    }
  }, [isOpen, initialCategories]);

  if (!isOpen) return null;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    // Reset UI states when moving to avoid confusion
    setDeleteConfirmIndex(null);
    setEditingIndex(null);

    const newCategories = [...categories];
    const item = newCategories.splice(index, 1)[0];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newCategories.splice(newIndex, 0, item);
    setCategories(newCategories);
  };

  const handleRequestDelete = (index: number) => {
    try {
      const categoryToDelete = categories[index];
      console.log(`[CategoryDelete] Requesting delete for index ${index}: "${categoryToDelete}"`);
      
      if (!categoryToDelete) return;

      // 1. Normalize for comparison (Trim + Lowercase)
      const normalizedToDelete = categoryToDelete.trim().toLowerCase();

      // 2. Check for items using this category
      const itemsUsingCategory = allItems.filter(item => {
          const itemCat = (item.category || '').trim().toLowerCase();
          return itemCat === normalizedToDelete;
      });

      if (itemsUsingCategory.length > 0) {
          const names = itemsUsingCategory.slice(0, 3).map(i => i.name).join(', ');
          const remaining = itemsUsingCategory.length - 3;
          const msg = `Cannot delete "${categoryToDelete}".\nIt is used by ${itemsUsingCategory.length} item(s) (e.g., ${names}${remaining > 0 ? '...' : ''}).`;
          
          console.warn(`[CategoryDelete] Blocked: Used by ${itemsUsingCategory.length} items.`);
          alert(msg);
          return;
      }

      // 3. Enter confirmation state (Inline UI)
      console.log(`[CategoryDelete] Usage check passed. Showing confirm UI.`);
      setDeleteConfirmIndex(index);
      setEditingIndex(null); // Close edit if open

    } catch (error) {
       console.error("[CategoryDelete] Error:", error);
    }
  };

  const handleConfirmDelete = (index: number) => {
      console.log(`[CategoryDelete] User confirmed delete for index ${index}`);
      const newCategories = categories.filter((_, i) => i !== index);
      setCategories(newCategories);
      setDeleteConfirmIndex(null);
  };
  
  const handleStartEditing = (index: number) => {
    setEditingIndex(index);
    setEditingText(categories[index]);
    setDeleteConfirmIndex(null);
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
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" aria-label="Close">
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>

        <div className="flex-grow overflow-y-auto p-4">
          {categories.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No categories exist.</p>
          ) : (
            <ul className="space-y-2">
              {categories.map((cat, index) => (
                <li key={`${cat}-${index}`} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg min-h-[50px]">
                  <div className="flex flex-col">
                    <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1 text-slate-400 disabled:opacity-30 hover:text-slate-700 dark:hover:text-slate-200">&uarr;</button>
                    <button onClick={() => handleMove(index, 'down')} disabled={index === categories.length - 1} className="p-1 text-slate-400 disabled:opacity-30 hover:text-slate-700 dark:hover:text-slate-200">&darr;</button>
                  </div>
                  
                  {editingIndex === index ? (
                     <input type="text" value={editingText} onChange={e => setEditingText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()} autoFocus className="flex-grow p-2 border rounded bg-white dark:bg-slate-900 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500" />
                  ) : (
                     <span className={`flex-grow font-medium text-slate-800 dark:text-slate-200 ${deleteConfirmIndex === index ? 'opacity-50' : ''}`}>{cat}</span>
                  )}

                  <div className="flex items-center gap-1">
                    {deleteConfirmIndex === index ? (
                        <div className="flex items-center gap-2 animate-fadeIn">
                             <span className="text-xs font-bold text-red-500 uppercase">Sure?</span>
                             <button 
                                onClick={() => handleConfirmDelete(index)} 
                                className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 shadow-sm"
                             >
                                Delete
                             </button>
                             <button 
                                onClick={() => setDeleteConfirmIndex(null)} 
                                className="px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded hover:bg-slate-300"
                             >
                                Cancel
                             </button>
                        </div>
                    ) : editingIndex === index ? (
                        <>
                           <button onClick={handleSaveEdit} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full"><CheckIcon className="h-5 w-5" /></button>
                           <button onClick={handleCancelEdit} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full"><CloseIcon className="h-5 w-5" /></button>
                        </>
                    ) : (
                        <>
                           <button onClick={() => handleStartEditing(index)} className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full"><PencilIcon className="h-5 w-5" /></button>
                           <button 
                             onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRequestDelete(index); }} 
                             className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full"
                             title="Delete Category"
                           >
                             <TrashIcon className="h-5 w-5" />
                           </button>
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


import React, { useState, useEffect } from 'react';
import { CustomGrid } from '../../types';
import { TrashIcon, PencilIcon, CheckIcon } from '../../constants';

interface ManageGridsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (grids: CustomGrid[]) => void;
  initialGrids: CustomGrid[];
}

const ManageGridsModal: React.FC<ManageGridsModalProps> = ({ isOpen, onClose, onSave, initialGrids }) => {
  const [grids, setGrids] = useState<CustomGrid[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGrids(initialGrids);
    }
  }, [isOpen, initialGrids]);

  if (!isOpen) return null;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === grids.length - 1)) return;
    
    const newGrids = [...grids];
    const item = newGrids.splice(index, 1)[0];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newGrids.splice(newIndex, 0, item);
    setGrids(newGrids);
  };

  const handleDelete = (index: number) => {
    if (window.confirm(`Are you sure you want to delete the grid "${grids[index].name}"?`)) {
      setGrids(grids.filter((_, i) => i !== index));
    }
  };
  
  const handleStartEditing = (index: number) => {
    setEditingIndex(index);
    setEditingText(grids[index].name);
  };
  
  const handleSaveEdit = () => {
    if (editingIndex === null || !editingText.trim()) return;
    const newGrids = [...grids];
    newGrids[editingIndex].name = editingText.trim();
    setGrids(newGrids);
    setEditingIndex(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <header className="flex-shrink-0 flex justify-between items-center p-4 border-b dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Manage Grids</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-3xl font-light" aria-label="Close">&times;</button>
        </header>

        <div className="flex-grow overflow-y-auto p-4">
          {grids.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No custom grids exist.</p>
          ) : (
            <ul className="space-y-2">
              {grids.map((grid, index) => (
                <li key={grid.id} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex flex-col">
                    <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1 text-slate-400 disabled:opacity-30 hover:text-slate-700 dark:hover:text-slate-200">&uarr;</button>
                    <button onClick={() => handleMove(index, 'down')} disabled={index === grids.length - 1} className="p-1 text-slate-400 disabled:opacity-30 hover:text-slate-700 dark:hover:text-slate-200">&darr;</button>
                  </div>
                  {editingIndex === index ? (
                     <input type="text" value={editingText} onChange={e => setEditingText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()} autoFocus className="flex-grow p-2 border rounded bg-white dark:bg-slate-900 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500" />
                  ) : (
                     <span className="flex-grow font-medium text-slate-800 dark:text-slate-200">{grid.name}</span>
                  )}
                  <div className="flex items-center gap-1">
                    {editingIndex === index ? (
                        <>
                           <button onClick={handleSaveEdit} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full"><CheckIcon className="h-5 w-5" /></button>
                           <button onClick={() => setEditingIndex(null)} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full">&times;</button>
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

        <footer className="flex-shrink-0 flex justify-end gap-3 p-4 border-t dark:border-slate-700">
          <button onClick={onClose} className="px-6 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500">Cancel</button>
          <button onClick={() => onSave(grids)} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Save Changes</button>
        </footer>
      </div>
    </div>
  );
};

export default ManageGridsModal;

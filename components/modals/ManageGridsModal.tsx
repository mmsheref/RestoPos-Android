
import React, { useState, useEffect } from 'react';
import { CustomGrid } from '../../types';
import { TrashIcon, PencilIcon, CheckIcon, CloseIcon } from '../../constants';

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
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGrids(initialGrids);
      setEditingIndex(null);
      setDeleteConfirmIndex(null);
    }
  }, [isOpen, initialGrids]);

  if (!isOpen) return null;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === grids.length - 1)) return;
    
    setEditingIndex(null);
    setDeleteConfirmIndex(null);

    const newGrids = [...grids];
    const item = newGrids.splice(index, 1)[0];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newGrids.splice(newIndex, 0, item);
    setGrids(newGrids);
  };

  const handleRequestDelete = (index: number) => {
    setDeleteConfirmIndex(index);
    setEditingIndex(null); // Close edit if open
  };

  const handleConfirmDelete = (index: number) => {
    setGrids(grids.filter((_, i) => i !== index));
    setDeleteConfirmIndex(null);
  };
  
  const handleStartEditing = (index: number) => {
    setEditingIndex(index);
    setEditingText(grids[index].name);
    setDeleteConfirmIndex(null);
  };
  
  const handleSaveEdit = () => {
    if (editingIndex === null || !editingText.trim()) return;
    
    const newGrids = [...grids];
    newGrids[editingIndex] = { 
        ...newGrids[editingIndex], 
        name: editingText.trim() 
    };
    
    setGrids(newGrids);
    setEditingIndex(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">Manage Grids</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary" aria-label="Close">
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>

        <div className="flex-grow overflow-y-auto p-4">
          {grids.length === 0 ? (
            <p className="text-text-secondary text-center py-4">No custom grids exist.</p>
          ) : (
            <ul className="space-y-2">
              {grids.map((grid, index) => (
                <li key={grid.id} className="flex items-center gap-2 p-2 bg-surface-muted rounded-lg min-h-[50px]">
                  <div className="flex flex-col">
                    <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1 text-text-muted disabled:opacity-30 hover:text-text-primary">&uarr;</button>
                    <button onClick={() => handleMove(index, 'down')} disabled={index === grids.length - 1} className="p-1 text-text-muted disabled:opacity-30 hover:text-text-primary">&darr;</button>
                  </div>
                  {editingIndex === index ? (
                     <input type="text" value={editingText} onChange={e => setEditingText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()} autoFocus className="flex-grow p-2 border rounded bg-background border-border focus:ring-2 focus:ring-primary" />
                  ) : (
                     <span className={`flex-grow font-medium text-text-primary ${deleteConfirmIndex === index ? 'opacity-50' : ''}`}>{grid.name}</span>
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
                                className="px-2 py-1 bg-surface-muted text-text-secondary text-xs font-bold rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                             >
                                Cancel
                             </button>
                        </div>
                    ) : editingIndex === index ? (
                        <>
                           <button onClick={handleSaveEdit} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full"><CheckIcon className="h-5 w-5" /></button>
                           <button onClick={() => setEditingIndex(null)} className="p-2 text-text-muted hover:bg-surface-muted rounded-full"><CloseIcon className="h-5 w-5" /></button>
                        </>
                    ) : (
                        <>
                           <button onClick={() => handleStartEditing(index)} className="p-2 text-text-muted hover:text-primary hover:bg-surface-muted rounded-full"><PencilIcon className="h-5 w-5" /></button>
                           <button onClick={() => handleRequestDelete(index)} className="p-2 text-text-muted hover:text-red-600 hover:bg-surface-muted rounded-full"><TrashIcon className="h-5 w-5" /></button>
                        </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="flex-shrink-0 flex justify-end gap-3 p-4 border-t border-border">
          <button onClick={onClose} className="px-6 py-2 bg-surface-muted text-text-secondary rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
          <button onClick={() => onSave(grids)} className="px-6 py-2 bg-primary text-primary-content font-semibold rounded-lg hover:bg-primary-hover">Save Changes</button>
        </footer>
      </div>
    </div>
  );
};

export default ManageGridsModal;

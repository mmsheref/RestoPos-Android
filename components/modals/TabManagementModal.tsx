import React, { useState, useEffect } from 'react';

interface EditingTabInfo {
    oldName: string;
    index: number;
}

interface TabManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingTab: EditingTabInfo | null;
    tabs: string[];
    onRename: (newName: string) => void;
    onMove: (direction: 'left' | 'right') => void;
    onDelete: () => void;
}

const TabManagementModal: React.FC<TabManagementModalProps> = ({ isOpen, onClose, editingTab, tabs, onRename, onMove, onDelete }) => {
    const [newTabName, setNewTabName] = useState('');

    useEffect(() => {
        if (editingTab) {
            setNewTabName(editingTab.oldName);
        }
    }, [editingTab]);

    if (!isOpen || !editingTab) return null;

    const handleRename = () => {
        onRename(newTabName);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-slate-800">Manage Tab: <span className="text-indigo-600">{editingTab.oldName}</span></h2>
                
                <div className="mb-4">
                    <label htmlFor="tab-name" className="block text-sm font-medium text-slate-700 mb-1">Rename Tab</label>
                    <input 
                        id="tab-name" 
                        type="text" 
                        value={newTabName} 
                        onChange={(e) => setNewTabName(e.target.value)} 
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                        autoFocus
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Move Tab</label>
                    <div className="flex gap-2">
                        <button onClick={() => onMove('left')} disabled={editingTab.index === 0} className="px-4 py-2 bg-slate-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300">Move Left</button>
                        <button onClick={() => onMove('right')} disabled={editingTab.index === tabs.length - 1} className="px-4 py-2 bg-slate-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300">Move Right</button>
                    </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                    <button onClick={onDelete} className="text-sm font-semibold text-red-600 hover:text-red-800">Delete Tab</button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Cancel</button>
                        <button onClick={handleRename} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TabManagementModal;

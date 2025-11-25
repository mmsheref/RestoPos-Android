
import React from 'react';
import { Item } from '../../types';
import { TrashIcon, PencilIcon } from '../../constants';

interface ContextMenuState {
    isOpen: boolean;
    position: { top: number; left: number };
    item: Item | null;
    slotIndex: number;
}

interface ItemGridContextMenuProps {
    state: ContextMenuState;
    onClose: () => void;
    onRemove: () => void;
    onChange: () => void;
}

const ItemGridContextMenu: React.FC<ItemGridContextMenuProps> = ({ state, onClose, onRemove, onChange }) => {
    if (!state.isOpen || !state.item) return null;

    // Position the menu. Basic implementation centers it on the cursor.
    // A more robust solution might check window boundaries.
    const style: React.CSSProperties = {
        top: `${state.position.top + 10}px`,
        left: `${state.position.left}px`,
        transform: 'translateX(-50%)',
    };

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div
                style={style}
                className="fixed z-50 w-56 bg-surface rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-white/10 p-1 animate-fadeIn"
            >
                <div className="p-2 border-b border-border">
                    <p className="font-semibold text-text-primary truncate">{state.item.name}</p>
                </div>
                <div className="py-1">
                    <button
                        onClick={onChange}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-text-primary hover:bg-surface-muted rounded"
                    >
                        <PencilIcon className="h-5 w-5" />
                        Change Item
                    </button>
                    <button
                        onClick={onRemove}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                        <TrashIcon className="h-5 w-5" />
                        Remove from Grid
                    </button>
                </div>
            </div>
        </>
    );
};

export default ItemGridContextMenu;
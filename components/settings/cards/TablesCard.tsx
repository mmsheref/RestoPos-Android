import React, { useState, useEffect, useMemo } from 'react';
import { Table } from '../../../types';
import { TrashIcon, PencilIcon, PlusIcon, CheckIcon } from '../../../constants';

interface TablesCardProps {
  tables: Table[];
  setTables: (tables: Table[]) => void;
  onAdd: () => void;
  onEdit: (table: Table) => void;
  onRemove: (id: string) => void;
}

const TablesCard: React.FC<TablesCardProps> = ({ tables, setTables, onAdd, onEdit, onRemove }) => {
  const [localTables, setLocalTables] = useState<Table[]>(tables);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLocalTables(tables);
  }, [tables]);
  
  const isDirty = useMemo(() => {
      if (localTables.length !== tables.length) return true;
      return localTables.some((table, index) => table.id !== tables[index].id);
  }, [localTables, tables]);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === localTables.length - 1)) return;
    
    const newTables = [...localTables];
    const item = newTables.splice(index, 1)[0];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newTables.splice(newIndex, 0, item);
    setLocalTables(newTables);
  };

  const handleSaveOrder = () => {
    setTables(localTables);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-text-primary">Tables & Quick Select</h2>
        <button onClick={onAdd} className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover text-sm flex items-center gap-1">
          <PlusIcon className="h-4 w-4" /> Add
        </button>
      </div>
      <p className="text-sm text-text-secondary mb-4">
        Manage the list of tables used for the "Quick Select" option when saving a ticket.
      </p>
      {localTables.length > 0 ? (
        <ul className="space-y-2">
          {localTables.map((table, index) => (
            <li key={table.id} className="flex items-center gap-2 p-2 bg-surface-muted rounded-lg">
              <div className="flex flex-col">
                <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1 text-text-muted disabled:opacity-30 hover:text-text-primary">&uarr;</button>
                <button onClick={() => handleMove(index, 'down')} disabled={index === localTables.length - 1} className="p-1 text-text-muted disabled:opacity-30 hover:text-text-primary">&darr;</button>
              </div>
              <span className="flex-grow font-medium text-text-primary">{table.name}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => onEdit(table)} className="p-2 text-text-muted hover:text-primary hover:bg-surface rounded-full"><PencilIcon className="h-5 w-5" /></button>
                <button onClick={() => onRemove(table.id)} className="p-2 text-text-muted hover:text-red-600 hover:bg-surface rounded-full"><TrashIcon className="h-5 w-5" /></button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-center text-text-secondary py-4">No tables configured.</p>
      )}
       <div className="flex justify-end mt-6">
            <button
              onClick={handleSaveOrder}
              disabled={!isDirty}
              className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-content transition-colors w-32 ${
                isDirty ? 'bg-primary hover:bg-primary-hover' : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              }`}
            >
              {isSaved ? <CheckIcon className="h-5 w-5" /> : 'Save Order'}
            </button>
        </div>
    </div>
  );
};

export default TablesCard;
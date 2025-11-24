import React from 'react';
import { Printer } from '../../../types';
import { TrashIcon } from '../../../constants';

interface PrintersCardProps {
  printers: Printer[];
  onAdd: () => void;
  onTest: (printer: Printer) => void;
  onRemove: (printer: Printer) => void;
  testingPrinterId: string | null;
}

const PrintersCard: React.FC<PrintersCardProps> = ({ printers, onAdd, onTest, onRemove, testingPrinterId }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Printers</h2>
        <button onClick={onAdd} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">+ Add</button>
      </div>
      {printers.length > 0 ? (
        <ul className="space-y-3">
          {printers.map(p => (
            <li key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">{p.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{p.interfaceType} - {p.address || 'N/A'}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onTest(p)} disabled={testingPrinterId === p.id} className="text-sm bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 px-3 py-1 rounded hover:bg-gray-300 disabled:opacity-50">
                  {testingPrinterId === p.id ? 'Testing...' : 'Test'}
                </button>
                <button onClick={() => onRemove(p)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">No printers configured.</p>
      )}
    </div>
  );
};

export default PrintersCard;

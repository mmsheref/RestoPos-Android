import React from 'react';
import { PaymentType } from '../../../types';
import { PaymentMethodIcon, TrashIcon } from '../../../constants';

interface PaymentTypesCardProps {
  paymentTypes: PaymentType[];
  onAdd: () => void;
  onToggle: (pt: PaymentType) => void;
  onRemove: (id: string) => void;
}

const PaymentTypesCard: React.FC<PaymentTypesCardProps> = ({ paymentTypes, onAdd, onToggle, onRemove }) => {
  const isDefault = (id: string) => ['cash', 'upi'].includes(id);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Payment Types</h2>
        <button onClick={onAdd} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">+ Add</button>
      </div>
      <ul className="space-y-3">
        {paymentTypes.map(pt => (
          <li key={pt.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <PaymentMethodIcon iconName={pt.icon} className="h-6 w-6 text-gray-600 dark:text-gray-300"/>
              <span className="font-medium text-gray-800 dark:text-gray-200">{pt.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {!isDefault(pt.id) && (
                <button onClick={() => onRemove(pt.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full">
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
              <label htmlFor={`pt-toggle-${pt.id}`} className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id={`pt-toggle-${pt.id}`} className="sr-only peer" checked={pt.enabled} onChange={() => onToggle(pt)} />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PaymentTypesCard;

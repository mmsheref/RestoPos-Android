
import React, { useState } from 'react';
import { PaymentType, PaymentTypeIcon, PaymentMethodType } from '../../types';
import { CloseIcon, PaymentMethodIcon } from '../../constants';

interface AddPaymentTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentType: Omit<PaymentType, 'id' | 'enabled'>) => void;
}

const ICONS: PaymentTypeIcon[] = ['cash', 'upi', 'card', 'generic'];

const AddPaymentTypeModal: React.FC<AddPaymentTypeModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<PaymentTypeIcon>('generic');
  const [type, setType] = useState<PaymentMethodType>('other');

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter a payment type name.");
      return;
    }
    onSave({ name, icon, type });
    // Reset form
    setName('');
    setIcon('generic');
    setType('other');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Add Payment Type</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Credit Card" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Icon</label>
            <div className="grid grid-cols-4 gap-2">
              {ICONS.map(iconName => (
                <button key={iconName} onClick={() => setIcon(iconName)} className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-1 capitalize text-xs transition-colors ${icon === iconName ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-700 border-transparent hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-300'}`}>
                  <PaymentMethodIcon iconName={iconName} className="h-6 w-6" />
                  {iconName}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Behavior</label>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setType('other')} className={`p-3 rounded-lg border-2 text-left ${type === 'other' ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500' : 'bg-slate-100 dark:bg-slate-700 border-transparent'}`}>
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Standard</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Charges the exact total.</p>
                </button>
                 <button onClick={() => setType('cash')} className={`p-3 rounded-lg border-2 text-left ${type === 'cash' ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500' : 'bg-slate-100 dark:bg-slate-700 border-transparent'}`}>
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Cash</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Allows calculating change.</p>
                </button>
            </div>
          </div>
          
          <div className="pt-4 flex gap-3 border-t dark:border-slate-700">
            <button onClick={onClose} className="flex-1 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-md">Add Type</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentTypeModal;
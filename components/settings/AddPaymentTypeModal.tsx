
import React, { useState } from 'react';
import { PaymentType, PaymentTypeIcon } from '../../types';
import { CloseIcon, PaymentMethodIcon } from '../../constants';

interface AddPaymentTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentType: Omit<PaymentType, 'id' | 'enabled' | 'type'>) => void;
}

const ICONS: PaymentTypeIcon[] = ['upi', 'card', 'generic'];

const AddPaymentTypeModal: React.FC<AddPaymentTypeModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<PaymentTypeIcon>('generic');

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter a payment type name.");
      return;
    }
    // The `type` (behavior) is no longer selected here; it's handled automatically in the context.
    onSave({ name, icon });
    
    // Reset form for next use
    setName('');
    setIcon('generic');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-lg p-6 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-text-primary">Add Payment Type</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Credit Card" className="w-full p-2 border border-border rounded-md focus:ring-2 focus:ring-primary bg-background text-text-primary" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Icon</label>
            <div className="grid grid-cols-4 gap-2">
              {ICONS.map(iconName => (
                <button 
                  key={iconName} 
                  onClick={() => setIcon(iconName)} 
                  title={iconName}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-1 capitalize text-xs transition-colors ${
                    icon === iconName 
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 border-primary text-primary' 
                      : 'bg-surface-muted border-transparent hover:border-border text-text-secondary'
                  }`}
                >
                  <PaymentMethodIcon iconName={iconName} className="h-6 w-6" />
                </button>
              ))}
            </div>
          </div>
          
          <div className="pt-4 flex gap-3 border-t border-border">
            <button onClick={onClose} className="flex-1 py-2 bg-surface-muted text-text-secondary rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-2 bg-primary text-primary-content font-semibold rounded-lg hover:bg-primary-hover shadow-md">Add Type</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentTypeModal;

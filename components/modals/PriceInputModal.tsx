
import React, { useState, useEffect } from 'react';
import { CloseIcon, CheckIcon } from '../../constants';
import { Item } from '../../types';

interface PriceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (price: number) => void;
  item: Item | null;
}

const PriceInputModal: React.FC<PriceInputModalProps> = ({ isOpen, onClose, onConfirm, item }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue('');
    }
  }, [isOpen]);

  const handlePress = (key: string) => {
    if (key === '.' && value.includes('.')) return;
    // Limit decimal places to 2
    if (value.includes('.') && value.split('.')[1].length >= 2) return;
    setValue(prev => prev + key);
  };

  const handleBackspace = () => {
    setValue(prev => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      onConfirm(num);
      onClose();
    }
  };

  if (!isOpen || !item) return null;

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[100]" onClick={onClose}>
      <div className="bg-surface w-full md:w-[400px] md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wider font-bold">Enter Price For</p>
            <h2 className="text-xl font-bold text-text-primary truncate">{item.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary bg-surface-muted rounded-full">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Display */}
        <div className="p-6 bg-surface-muted/30 flex justify-center">
          <div className="text-5xl font-mono font-bold text-text-primary flex items-baseline">
            <span className="text-2xl text-text-muted mr-1">₹</span>
            {value || '0'}
            <span className="w-1 h-10 bg-primary animate-pulse ml-1"></span>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="grid grid-cols-3 gap-2 p-4 pb-0">
             {quickAmounts.map(amt => (
                 <button 
                    key={amt} 
                    onClick={() => setValue(amt.toString())}
                    className="py-2 bg-surface-muted border border-border rounded-lg text-sm font-semibold text-text-secondary hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors"
                 >
                     ₹{amt}
                 </button>
             ))}
        </div>

        {/* Numpad */}
        <div className="p-4 grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handlePress(num.toString())}
              className="py-4 text-2xl font-bold bg-surface border border-border rounded-xl shadow-sm hover:bg-surface-muted active:scale-95 transition-all text-text-primary"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handlePress('.')}
            className="py-4 text-2xl font-bold bg-surface border border-border rounded-xl shadow-sm hover:bg-surface-muted active:scale-95 transition-all text-text-primary"
          >
            .
          </button>
          <button
            onClick={() => handlePress('0')}
            className="py-4 text-2xl font-bold bg-surface border border-border rounded-xl shadow-sm hover:bg-surface-muted active:scale-95 transition-all text-text-primary"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="py-4 flex items-center justify-center bg-surface-muted border border-border rounded-xl shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-all text-text-secondary"
          >
            <span className="text-lg">⌫</span>
          </button>
        </div>

        {/* Footer Action */}
        <div className="p-4 pt-0">
          <button
            onClick={handleConfirm}
            disabled={!value || parseFloat(value) === 0}
            className="w-full py-4 bg-primary text-primary-content text-lg font-bold rounded-xl shadow-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <CheckIcon className="h-6 w-6" />
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceInputModal;

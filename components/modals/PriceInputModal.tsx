
import React, { useState, useEffect } from 'react';
import { CloseIcon, CheckIcon } from '../../constants';
import { Item } from '../../types';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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

  const handlePress = async (key: string) => {
    await Haptics.impact({ style: ImpactStyle.Light });
    if (key === '.' && value.includes('.')) return;
    // Limit decimal places to 2
    if (value.includes('.') && value.split('.')[1].length >= 2) return;
    setValue(prev => prev + key);
  };

  const handleBackspace = async () => {
    await Haptics.impact({ style: ImpactStyle.Light });
    setValue(prev => prev.slice(0, -1));
  };

  const handleConfirm = async () => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      await Haptics.impact({ style: ImpactStyle.Medium });
      onConfirm(num);
      onClose();
    }
  };

  const handleQuickAmount = async (amt: number) => {
    await Haptics.impact({ style: ImpactStyle.Medium });
    setValue(amt.toString());
  };

  const handleClose = async () => {
    await Haptics.impact({ style: ImpactStyle.Light });
    onClose();
  };

  if (!isOpen || !item) return null;

  const quickAmounts = [10, 20, 50, 100, 200, 500];
  const isValid = !!value && parseFloat(value) > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[100]" onClick={handleClose}>
      <div className="bg-surface w-full md:w-[400px] md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface flex-shrink-0">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wider font-bold">Enter Price For</p>
            <h2 className="text-xl font-bold text-text-primary truncate max-w-[250px]">{item.name}</h2>
          </div>
          <button onClick={handleClose} className="p-2 text-text-muted hover:text-text-primary bg-surface-muted rounded-full transition-colors">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content Wrapper */}
        <div className="flex-1 overflow-y-auto">
            
            {/* Display Area with Integrated Backspace */}
            <div className="p-6 bg-surface-muted/30 flex items-center justify-between border-b border-border/50 relative">
                <div className="flex-1 flex justify-center pl-10">
                    <div className="text-5xl font-mono font-bold text-text-primary flex items-baseline">
                        <span className="text-2xl text-text-muted mr-1">₹</span>
                        {value || '0'}
                        <span className="w-1 h-10 bg-primary animate-pulse ml-1 rounded-full"></span>
                    </div>
                </div>
                
                {/* Backspace Button (iOS Style) */}
                <button
                    onClick={handleBackspace}
                    className="p-3 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors active:scale-90"
                    aria-label="Backspace"
                >
                    <span className="text-2xl">⌫</span>
                </button>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-3 gap-2 p-4 pb-0">
                {quickAmounts.map(amt => (
                    <button 
                        key={amt} 
                        onClick={() => handleQuickAmount(amt)}
                        className="py-2 bg-surface-muted border border-border rounded-lg text-sm font-semibold text-text-secondary hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors active:bg-primary/20"
                    >
                        ₹{amt}
                    </button>
                ))}
            </div>

            {/* Numpad with Integrated Confirm Button */}
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

                {/* Confirm Button inside Grid (Replaces Backspace position) */}
                <button
                    onClick={handleConfirm}
                    disabled={!isValid}
                    className={`py-4 flex items-center justify-center rounded-xl shadow-md active:scale-95 transition-all ${
                        isValid 
                        ? 'bg-primary text-primary-content hover:bg-primary-hover shadow-primary/30' 
                        : 'bg-surface-muted text-text-muted cursor-not-allowed border border-border'
                    }`}
                >
                    <CheckIcon className="h-8 w-8" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PriceInputModal;

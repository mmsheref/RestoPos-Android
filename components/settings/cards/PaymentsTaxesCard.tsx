
import React, { useState, useEffect } from 'react';
import { AppSettings, PaymentType } from '../../../types';
import { PaymentMethodIcon, TrashIcon, PlusIcon } from '../../../constants';

interface PaymentsTaxesCardProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  paymentTypes: PaymentType[];
  onAddPayment: () => void;
  onTogglePayment: (pt: PaymentType) => void;
  onRemovePayment: (id: string) => void;
}

const PaymentsTaxesCard: React.FC<PaymentsTaxesCardProps> = ({ 
    settings, updateSettings, paymentTypes, 
    onAddPayment, onTogglePayment, onRemovePayment 
}) => {
  const [taxRateInput, setTaxRateInput] = useState(settings.taxRate.toString());

  useEffect(() => {
    setTaxRateInput(settings.taxRate.toString());
  }, [settings.taxRate]);

  const handleTaxRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*\.?\d*$/.test(val)) {
      setTaxRateInput(val);
      const num = parseFloat(val);
      if (!isNaN(num)) {
         updateSettings({ taxRate: num });
      } else if (val === '') {
         updateSettings({ taxRate: 0 });
      }
    }
  };

  const isCash = (id: string) => id === 'cash';

  return (
    <div className="space-y-6">
        {/* Taxes Section */}
        <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
            <h2 className="text-lg font-bold text-text-primary mb-4">Taxes</h2>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-text-primary">Enable Sales Tax</p>
                        <p className="text-xs text-text-secondary">Apply tax to all orders automatically</p>
                    </div>
                    <label htmlFor="tax-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input 
                        type="checkbox" 
                        id="tax-toggle" 
                        className="sr-only peer"
                        checked={settings.taxEnabled} 
                        onChange={(e) => updateSettings({ taxEnabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                </div>
                
                {settings.taxEnabled && (
                <div className="animate-fadeIn">
                    <label htmlFor="taxRate" className="block text-sm font-medium text-text-secondary mb-1">Tax Rate (%)</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        id="taxRate"
                        value={taxRateInput}
                        onChange={handleTaxRateChange}
                        className="block w-full max-w-[150px] p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
                        placeholder="0"
                    />
                </div>
                )}
            </div>
        </div>

        {/* Payment Methods Section */}
        <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-text-primary">Payment Methods</h2>
                <button 
                    onClick={onAddPayment} 
                    className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors"
                >
                    <PlusIcon className="h-4 w-4"/> Add New
                </button>
            </div>
            <ul className="space-y-2">
                {paymentTypes.map(pt => (
                <li key={pt.id} className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                    <div className="flex items-center gap-3">
                        <PaymentMethodIcon iconName={pt.icon} className="h-6 w-6 text-text-secondary"/>
                        <span className="font-medium text-text-primary">{pt.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isCash(pt.id) && (
                            <button onClick={() => onRemovePayment(pt.id)} className="text-text-muted hover:text-red-500 transition-colors">
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        )}
                        <label htmlFor={`pt-toggle-${pt.id}`} className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id={`pt-toggle-${pt.id}`} className="sr-only peer" checked={pt.enabled} onChange={() => onTogglePayment(pt)} />
                            <div className="w-9 h-5 bg-gray-300 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                        </label>
                    </div>
                </li>
                ))}
            </ul>
        </div>
    </div>
  );
};

export default PaymentsTaxesCard;

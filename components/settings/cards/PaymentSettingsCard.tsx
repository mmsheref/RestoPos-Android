
import React, { useState, useEffect } from 'react';
import { AppSettings, PaymentType } from '../../../types';
import { PaymentMethodIcon, TrashIcon } from '../../../constants';

interface PaymentSettingsCardProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  paymentTypes: PaymentType[];
  onAddPaymentType: () => void;
  onTogglePaymentType: (pt: PaymentType) => void;
  onRemovePaymentType: (id: string) => void;
}

const PaymentSettingsCard: React.FC<PaymentSettingsCardProps> = ({ 
    settings, updateSettings, paymentTypes, onAddPaymentType, onTogglePaymentType, onRemovePaymentType 
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
      {/* Taxes */}
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Taxes</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                 <span className="block text-sm font-medium text-text-primary">Enable Tax Calculation</span>
                 <span className="text-xs text-text-secondary">Apply tax rate to order total</span>
              </div>
              <label htmlFor="tax-toggle" className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  id="tax-toggle" 
                  className="sr-only peer"
                  checked={settings.taxEnabled} 
                  onChange={(e) => updateSettings({ taxEnabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            {settings.taxEnabled && (
              <div>
                <label htmlFor="taxRate" className="block text-sm font-medium text-text-secondary">Default Tax Rate (%)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="taxRate"
                  value={taxRateInput}
                  onChange={handleTaxRateChange}
                  className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background max-w-xs"
                  placeholder="0"
                />
              </div>
            )}
          </div>
      </div>

      {/* Payment Types */}
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
          <div className="flex justify-between items-center mb-4">
            <div>
               <h2 className="text-xl font-semibold text-text-primary">Payment Methods</h2>
               <p className="text-sm text-text-secondary">Manage accepted payment types</p>
            </div>
            <button onClick={onAddPaymentType} className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover text-sm">+ Add New</button>
          </div>
          <ul className="space-y-3">
            {paymentTypes.map(pt => (
              <li key={pt.id} className="flex items-center justify-between p-3 bg-surface-muted rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-full border border-border">
                      <PaymentMethodIcon iconName={pt.icon} className="h-5 w-5 text-text-secondary"/>
                  </div>
                  <div>
                      <span className="block font-medium text-text-primary">{pt.name}</span>
                      <span className="text-xs text-text-secondary capitalize">{pt.type === 'cash' ? 'Cash Handling' : 'Standard'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isCash(pt.id) && (
                    <button onClick={() => onRemovePaymentType(pt.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors" title="Delete">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                  <label htmlFor={`pt-toggle-${pt.id}`} className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id={`pt-toggle-${pt.id}`} className="sr-only peer" checked={pt.enabled} onChange={() => onTogglePaymentType(pt)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </li>
            ))}
          </ul>
      </div>
    </div>
  );
};

export default PaymentSettingsCard;

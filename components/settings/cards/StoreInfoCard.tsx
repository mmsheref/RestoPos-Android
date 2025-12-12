
import React from 'react';
import { AppSettings } from '../../../types';

interface StoreInfoCardProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const StoreInfoCard: React.FC<StoreInfoCardProps> = ({ settings, updateSettings }) => {
  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-text-primary">Store Information</h2>
        </div>
      <div className="space-y-5">
        <div>
          <label htmlFor="storeName" className="block text-sm font-bold text-text-secondary mb-1">Store Name</label>
          <input
            type="text"
            id="storeName"
            value={settings.storeName || ''}
            onChange={(e) => updateSettings({ storeName: e.target.value })}
            className="w-full p-2.5 border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-primary transition-all"
            placeholder="e.g. My Awesome Cafe"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="currency" className="block text-sm font-bold text-text-secondary mb-1">Currency Symbol</label>
                <select 
                    id="currency"
                    value={settings.currencySymbol || '₹'}
                    onChange={(e) => updateSettings({ currencySymbol: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-lg shadow-sm bg-background text-text-primary"
                >
                    <option value="₹">₹ (INR)</option>
                    <option value="$">$ (USD)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="£">£ (GBP)</option>
                </select>
            </div>
            <div>
                 <label htmlFor="timezone" className="block text-sm font-bold text-text-secondary mb-1">Timezone</label>
                 <select 
                    id="timezone"
                    value={settings.timezone || 'Asia/Kolkata'}
                    onChange={(e) => updateSettings({ timezone: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-lg shadow-sm bg-background text-text-primary"
                >
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (US)</option>
                </select>
            </div>
        </div>

        {/* --- Shift Timings Section --- */}
        <div className="bg-surface-muted/50 p-4 rounded-lg border border-border">
            <h3 className="text-sm font-bold text-text-primary mb-3">Shift Timings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="morningStart" className="block text-xs font-semibold text-text-secondary mb-1">Morning Start</label>
                    <input 
                        type="time" 
                        id="morningStart"
                        value={settings.shiftMorningStart || '06:00'}
                        onChange={(e) => updateSettings({ shiftMorningStart: e.target.value })}
                        className="w-full p-2 border border-border rounded-md bg-background text-text-primary text-sm font-mono"
                    />
                </div>
                <div>
                    <label htmlFor="morningEnd" className="block text-xs font-semibold text-text-secondary mb-1">Morning End / Night Start</label>
                    <input 
                        type="time" 
                        id="morningEnd"
                        value={settings.shiftMorningEnd || '17:30'}
                        onChange={(e) => updateSettings({ shiftMorningEnd: e.target.value })}
                        className="w-full p-2 border border-border rounded-md bg-background text-text-primary text-sm font-mono"
                    />
                </div>
                <div>
                    <label htmlFor="nightEnd" className="block text-xs font-semibold text-text-secondary mb-1">Night End (Next Day)</label>
                    <input 
                        type="time" 
                        id="nightEnd"
                        value={settings.shiftNightEnd || '05:00'}
                        onChange={(e) => updateSettings({ shiftNightEnd: e.target.value })}
                        className="w-full p-2 border border-border rounded-md bg-background text-text-primary text-sm font-mono"
                    />
                </div>
            </div>
            <p className="text-[10px] text-text-muted mt-2">
                Shift timings affect how reports are filtered. Night shifts extending past midnight will be included in the starting date's report.
            </p>
        </div>

        <div>
          <label htmlFor="storeAddress" className="block text-sm font-bold text-text-secondary mb-1">Store Address</label>
          <textarea
            id="storeAddress"
            rows={3}
            value={settings.storeAddress || ''}
            onChange={(e) => updateSettings({ storeAddress: e.target.value })}
            className="w-full p-2.5 border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary bg-background text-text-primary"
            placeholder="e.g., 123 Food Street, Flavor Town, 12345"
          />
        </div>
        
        <div>
          <label htmlFor="receiptFooter" className="block text-sm font-bold text-text-secondary mb-1">Receipt Footer Message</label>
          <textarea
            id="receiptFooter"
            rows={2}
            value={settings.receiptFooter || ''}
            onChange={(e) => updateSettings({ receiptFooter: e.target.value })}
            className="w-full p-2.5 border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary bg-background text-text-primary"
            placeholder="e.g., Thank you! Follow us @yourshop"
          />
        </div>
      </div>
    </div>
  );
};

export default StoreInfoCard;

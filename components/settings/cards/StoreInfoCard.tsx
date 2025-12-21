
import React from 'react';
import { AppSettings } from '../../../types';

interface StoreInfoCardProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const StoreInfoCard: React.FC<StoreInfoCardProps> = ({ settings, updateSettings }) => {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-text-primary">Business Profile</h3>
        <p className="text-xs text-text-muted mt-1">These details appear on your printed receipts.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-text-secondary mb-2 ml-1">Store Name</label>
          <input
            type="text"
            value={settings.storeName || ''}
            onChange={(e) => updateSettings({ storeName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
            placeholder="e.g. Tasty Grill POS"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-text-secondary mb-2 ml-1">Address</label>
          <textarea
            rows={3}
            value={settings.storeAddress || ''}
            onChange={(e) => updateSettings({ storeAddress: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
            placeholder="Full business address..."
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-text-secondary mb-2 ml-1">Receipt Footer</label>
          <input
            type="text"
            value={settings.receiptFooter || ''}
            onChange={(e) => updateSettings({ receiptFooter: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
            placeholder="e.g. Thanks for visiting! Follow us @tastygrill"
          />
        </div>
      </div>
    </div>
  );
};

export default StoreInfoCard;

import React from 'react';
import { AppSettings } from '../../../types';
import { Link } from 'react-router-dom';

interface StoreInfoCardProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const StoreInfoCard: React.FC<StoreInfoCardProps> = ({ settings, updateSettings }) => {
  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-text-primary">Store Information</h2>
            <Link to="/advanced" className="text-sm text-primary hover:text-primary-hover font-medium">
                Advanced
            </Link>
        </div>
      <div className="space-y-4">
        <div>
          <label htmlFor="storeName" className="block text-sm font-medium text-text-secondary">Store Name</label>
          <input
            type="text"
            id="storeName"
            value={settings.storeName || ''}
            onChange={(e) => updateSettings({ storeName: e.target.value })}
            className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
          />
        </div>
        <div>
          <label htmlFor="receiptFooter" className="block text-sm font-medium text-text-secondary">Receipt Footer</label>
          <input
            type="text"
            id="receiptFooter"
            value={settings.receiptFooter || ''}
            onChange={(e) => updateSettings({ receiptFooter: e.target.value })}
            className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
          />
        </div>
      </div>
    </div>
  );
};

export default StoreInfoCard;
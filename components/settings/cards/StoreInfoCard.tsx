import React from 'react';
import { AppSettings } from '../../../types';
import { Link } from 'react-router-dom';

interface StoreInfoCardProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const StoreInfoCard: React.FC<StoreInfoCardProps> = ({ settings, updateSettings }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Store Information</h2>
            <Link to="/advanced" className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium">
                Advanced
            </Link>
        </div>
      <div className="space-y-4">
        <div>
          <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Store Name</label>
          <input
            type="text"
            id="storeName"
            value={settings.storeName || ''}
            onChange={(e) => updateSettings({ storeName: e.target.value })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="receiptFooter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Receipt Footer</label>
          <input
            type="text"
            id="receiptFooter"
            value={settings.receiptFooter || ''}
            onChange={(e) => updateSettings({ receiptFooter: e.target.value })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default StoreInfoCard;

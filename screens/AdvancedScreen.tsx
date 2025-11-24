
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { AppSettings } from '../types';
import { CheckIcon } from '../constants';

const AdvancedScreen: React.FC = () => {
  const { settings, updateSettings } = useAppContext();
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="p-6 pb-24 bg-background min-h-full">
      <h1 className="text-3xl font-bold mb-6 text-text-primary">Advanced Settings</h1>
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
          <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2 text-text-primary">Receipt Customization</h2>
          <p className="text-sm text-text-secondary mb-6">
            Customize the information that appears on your printed receipts.
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-text-secondary">Store Name</label>
              <input
                type="text"
                name="storeName"
                id="storeName"
                value={formData.storeName || ''}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
              />
            </div>
            <div>
              <label htmlFor="storeAddress" className="block text-sm font-medium text-text-secondary">Store Address</label>
              <textarea
                name="storeAddress"
                id="storeAddress"
                rows={3}
                value={formData.storeAddress || ''}
                onChange={handleChange}
                placeholder="e.g., 123 Food Street, Flavor Town, 12345"
                className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
              />
            </div>
            <div>
              <label htmlFor="receiptFooter" className="block text-sm font-medium text-text-secondary">Receipt Footer</label>
              <input
                type="text"
                name="receiptFooter"
                id="receiptFooter"
                value={formData.receiptFooter || ''}
                onChange={handleChange}
                placeholder="e.g., Thank you! Find us @yourshop"
                className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-content bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 w-28"
            >
              {isSaved ? <CheckIcon className="h-5 w-5" /> : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedScreen;

import React from 'react';
import { AppSettings } from '../../../types';

interface BusinessSettingsCardProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const BusinessSettingsCard: React.FC<BusinessSettingsCardProps> = ({ settings, updateSettings }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleDayChange = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    const currentHours = settings.businessHours || {};
    const dayHours = currentHours[day] || { open: '09:00', close: '17:00', closed: false };
    
    const newDayHours = { ...dayHours, [field]: value };
    const newHours = { ...currentHours, [day]: newDayHours };
    
    updateSettings({ businessHours: newHours });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-text-primary">Business Profile</h2>
          </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="storeName" className="block text-sm font-medium text-text-secondary">Business Name</label>
            <input
              type="text"
              id="storeName"
              value={settings.storeName || ''}
              onChange={(e) => updateSettings({ storeName: e.target.value })}
              className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
            />
          </div>
          <div>
            <label htmlFor="storeAddress" className="block text-sm font-medium text-text-secondary">Address</label>
            <textarea
              id="storeAddress"
              rows={3}
              value={settings.storeAddress || ''}
              onChange={(e) => updateSettings({ storeAddress: e.target.value })}
              className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
              placeholder="e.g., 123 Food Street, Flavor Town, 12345"
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-text-primary">Contact Information</h2>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="storePhone" className="block text-sm font-medium text-text-secondary">Phone</label>
            <input
              type="tel"
              id="storePhone"
              value={settings.storePhone || ''}
              onChange={(e) => updateSettings({ storePhone: e.target.value })}
              className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label htmlFor="storeEmail" className="block text-sm font-medium text-text-secondary">Email</label>
            <input
              type="email"
              id="storeEmail"
              value={settings.storeEmail || ''}
              onChange={(e) => updateSettings({ storeEmail: e.target.value })}
              className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
              placeholder="contact@business.com"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="storeWebsite" className="block text-sm font-medium text-text-secondary">Website</label>
            <input
              type="url"
              id="storeWebsite"
              value={settings.storeWebsite || ''}
              onChange={(e) => updateSettings({ storeWebsite: e.target.value })}
              className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
              placeholder="https://www.business.com"
            />
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-text-primary">Regional Settings</h2>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
            <label htmlFor="currency" className="block text-sm font-medium text-text-secondary">Currency</label>
            <select
              id="currency"
              value={settings.currency || 'USD'}
              onChange={(e) => updateSettings({ currency: e.target.value })}
              className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-text-secondary">Timezone</label>
             <select
              id="timezone"
              value={settings.timezone || 'UTC'}
              onChange={(e) => updateSettings({ timezone: e.target.value })}
              className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (US & Canada)</option>
              <option value="America/Chicago">Central Time (US & Canada)</option>
              <option value="America/Denver">Mountain Time (US & Canada)</option>
              <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Kolkata">Kolkata</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Business Hours */}
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-text-primary">Business Hours</h2>
          </div>
          <div className="space-y-3">
            {days.map(day => {
               const daySettings = settings.businessHours?.[day] || { open: '09:00', close: '17:00', closed: false };
               return (
                 <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-border last:border-0 gap-2">
                   <div className="w-24 font-medium text-text-primary">{day}</div>
                   <div className="flex items-center gap-4 flex-1">
                      <label className="flex items-center space-x-2 text-sm text-text-secondary cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={daySettings.closed}
                          onChange={(e) => handleDayChange(day, 'closed', e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span>Closed</span>
                      </label>
                      {!daySettings.closed && (
                        <div className="flex items-center gap-2">
                           <input 
                             type="time" 
                             value={daySettings.open}
                             onChange={(e) => handleDayChange(day, 'open', e.target.value)}
                             className="p-1 border border-border rounded bg-background text-sm"
                           />
                           <span className="text-text-secondary">-</span>
                           <input 
                             type="time" 
                             value={daySettings.close}
                             onChange={(e) => handleDayChange(day, 'close', e.target.value)}
                             className="p-1 border border-border rounded bg-background text-sm"
                           />
                        </div>
                      )}
                   </div>
                 </div>
               );
            })}
          </div>
      </div>

      {/* Footer */}
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-text-primary">Receipt Settings</h2>
        </div>
        <div>
          <label htmlFor="receiptFooter" className="block text-sm font-medium text-text-secondary">Receipt Footer Message</label>
          <textarea
            id="receiptFooter"
            rows={2}
            value={settings.receiptFooter || ''}
            onChange={(e) => updateSettings({ receiptFooter: e.target.value })}
            className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
            placeholder="e.g., Thank you! Find us @yourshop"
          />
        </div>
      </div>
    </div>
  );
};

export default BusinessSettingsCard;


import React from 'react';
import { AppSettings } from '../../../types';

interface NotificationSettingsCardProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const NotificationSettingsCard: React.FC<NotificationSettingsCardProps> = ({ settings, updateSettings }) => {
  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Notifications</h2>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-text-primary">Enable Notifications</h3>
              <p className="text-sm text-text-secondary">Receive alerts for important updates and system events.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.notificationsEnabled ?? true} 
                onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
        </div>
        
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-text-primary mb-3">Notify me about:</h3>
          <div className="space-y-3 pl-2">
             <div className="flex items-center">
               <input id="notify-sales" type="checkbox" disabled checked className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary" />
               <label htmlFor="notify-sales" className="ml-2 text-sm text-text-secondary">Daily Sales Summaries (Coming Soon)</label>
             </div>
             <div className="flex items-center">
               <input id="notify-stock" type="checkbox" disabled checked className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary" />
               <label htmlFor="notify-stock" className="ml-2 text-sm text-text-secondary">Low Stock Alerts (Coming Soon)</label>
             </div>
             <div className="flex items-center">
               <input id="notify-update" type="checkbox" checked={true} readOnly className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary" />
               <label htmlFor="notify-update" className="ml-2 text-sm text-text-primary">App Updates & Security</label>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsCard;

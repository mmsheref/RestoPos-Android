
import React, { useState } from 'react';
import { AppSettings } from '../../../types';
import { MailIcon } from '../../../constants';
import { requestNotificationPermission } from '../../../utils/notificationHelper';

interface NotificationsCardProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const NotificationsCard: React.FC<NotificationsCardProps> = ({ settings, updateSettings }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  
  const handleMasterToggle = async (checked: boolean) => {
      if (checked) {
          setIsRequesting(true);
          const granted = await requestNotificationPermission();
          setIsRequesting(false);
          if (!granted) {
              alert("Notification permission was denied. Please enable it in your device settings to receive alerts.");
              return;
          }
      }
      updateSettings({ notificationsEnabled: checked });
  };

  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600">
            <MailIcon className="h-6 w-6" />
        </div>
        <div>
            <h2 className="text-xl font-bold text-text-primary">Notifications</h2>
            <p className="text-xs text-text-secondary">Manage how you receive alerts.</p>
        </div>
      </div>

      {/* Master Toggle */}
      <div className="flex items-center justify-between py-4 border-b border-border">
        <div>
            <p className="text-sm font-bold text-text-primary">Enable Notifications</p>
            <p className="text-xs text-text-muted">Allow the app to send system alerts.</p>
        </div>
        <div className="flex items-center gap-3">
            {isRequesting && <span className="text-[10px] text-primary font-bold animate-pulse">Requesting...</span>}
            <label htmlFor="notif-master-toggle" className="relative inline-flex items-center cursor-pointer">
                <input 
                type="checkbox" 
                id="notif-master-toggle" 
                className="sr-only peer"
                disabled={isRequesting}
                checked={settings.notificationsEnabled ?? false} 
                onChange={(e) => handleMasterToggle(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
        </div>
      </div>

      {/* Specific Settings */}
      <div className={`mt-6 space-y-6 transition-opacity duration-300 ${!settings.notificationsEnabled ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          
          {/* Daily Summary */}
          <div className="flex justify-between items-start">
              <div>
                  <p className="text-sm font-medium text-text-primary">Daily Sales Summary</p>
                  <p className="text-xs text-text-secondary">Get a reminder to check reports.</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                  <label htmlFor="daily-summary-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input 
                        type="checkbox" 
                        id="daily-summary-toggle" 
                        className="sr-only peer"
                        checked={settings.notifyDailySummary ?? false} 
                        onChange={(e) => updateSettings({ notifyDailySummary: e.target.checked })}
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                  
                  {settings.notifyDailySummary && (
                      <div className="animate-fadeIn">
                        <input 
                            type="time" 
                            value={settings.dailySummaryTime || '22:00'}
                            onChange={(e) => updateSettings({ dailySummaryTime: e.target.value })}
                            className="p-1.5 border border-border rounded text-xs bg-background text-text-primary outline-none focus:border-primary shadow-inner"
                        />
                      </div>
                  )}
              </div>
          </div>

          {/* Low Stock */}
          <div className="flex justify-between items-start">
              <div>
                  <p className="text-sm font-medium text-text-primary">Low Stock Alerts</p>
                  <p className="text-xs text-text-secondary">Get notified when stock falls below threshold.</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                  <label htmlFor="low-stock-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input 
                        type="checkbox" 
                        id="low-stock-toggle" 
                        className="sr-only peer"
                        checked={settings.notifyLowStock ?? false} 
                        onChange={(e) => updateSettings({ notifyLowStock: e.target.checked })}
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>

                  {settings.notifyLowStock && (
                      <div className="flex items-center gap-2 animate-fadeIn bg-surface-muted/50 p-1 rounded-md border border-border/50">
                          <span className="text-[10px] text-text-secondary uppercase font-bold px-1">Limit</span>
                          <input 
                            type="number" 
                            min="0"
                            value={settings.lowStockThreshold || 10}
                            onChange={(e) => updateSettings({ lowStockThreshold: parseInt(e.target.value) || 0 })}
                            className="w-12 p-1 border-none rounded text-xs bg-transparent text-text-primary outline-none focus:ring-0 text-center font-bold"
                          />
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default NotificationsCard;

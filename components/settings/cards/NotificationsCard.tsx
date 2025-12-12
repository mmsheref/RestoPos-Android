
import React from 'react';
import { AppSettings } from '../../../types';
import { MailIcon } from '../../../constants';

interface NotificationsCardProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const NotificationsCard: React.FC<NotificationsCardProps> = ({ settings, updateSettings }) => {
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
        <label htmlFor="notif-master-toggle" className="relative inline-flex items-center cursor-pointer">
            <input 
            type="checkbox" 
            id="notif-master-toggle" 
            className="sr-only peer"
            checked={settings.notificationsEnabled} 
            onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
        </label>
      </div>

      {/* Specific Settings (Coming Soon) */}
      <div className={`mt-6 space-y-5 ${!settings.notificationsEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex justify-between items-start">
              <div>
                  <p className="text-sm font-medium text-text-primary">Daily Sales Summary</p>
                  <p className="text-xs text-text-secondary">Receive an email report at end of day.</p>
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded font-bold uppercase">Soon</span>
                  <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full opacity-60"></div>
              </div>
          </div>

          <div className="flex justify-between items-start">
              <div>
                  <p className="text-sm font-medium text-text-primary">Low Stock Alerts</p>
                  <p className="text-xs text-text-secondary">Get notified when items run low.</p>
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded font-bold uppercase">Soon</span>
                  <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full opacity-60"></div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default NotificationsCard;

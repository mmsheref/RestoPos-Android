
import React from 'react';
import { AppSettings } from '../../../types';

type Theme = 'light' | 'dark';

interface AppSettingsCardProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const AppSettingsCard: React.FC<AppSettingsCardProps> = ({ theme, setTheme, settings, updateSettings }) => {
  return (
    <div className="space-y-6">
       {/* Appearance */}
       <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold mb-4 text-text-primary">Appearance</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Theme Mode</label>
            <div className="flex rounded-md shadow-sm w-fit">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-border text-sm font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-primary text-white border-primary z-10'
                    : 'bg-surface text-text-primary hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`relative -ml-px inline-flex items-center px-4 py-2 rounded-r-md border border-border text-sm font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-primary text-white border-primary z-10'
                    : 'bg-surface text-text-primary hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Dark
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold mb-4 text-text-primary">Language & Region</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-text-secondary mb-2">App Language</label>
            <select
                id="language"
                value={settings.language || 'en'}
                onChange={(e) => updateSettings({ language: e.target.value })}
                className="block w-full max-w-xs p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
            >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="hi">Hindi (हिंदी)</option>
            </select>
            <p className="mt-1 text-xs text-text-secondary">Note: Translations may be incomplete in beta.</p>
          </div>
        </div>
      </div>

      {/* Sync */}
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold mb-4 text-text-primary">Data Synchronization</h2>
        <div className="space-y-4">
             <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-text-primary">Auto-Sync</h3>
                  <p className="text-sm text-text-secondary">Automatically sync data with cloud when online.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.autoSync ?? true} 
                    onChange={(e) => updateSettings({ autoSync: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AppSettingsCard;

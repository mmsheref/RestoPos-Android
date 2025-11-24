import React from 'react';

type Theme = 'light' | 'dark';

interface AppearanceCardProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const AppearanceCard: React.FC<AppearanceCardProps> = ({ theme, setTheme }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Appearance</h2>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
        <div className="flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium transition-colors ${
              theme === 'light'
                ? 'bg-indigo-600 text-white z-10'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`relative -ml-px inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-indigo-600 text-white z-10'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Dark
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceCard;

import React from 'react';

type Theme = 'light' | 'dark';

interface AppearanceCardProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const AppearanceCard: React.FC<AppearanceCardProps> = ({ theme, setTheme }) => {
  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">Appearance</h2>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-secondary">Theme</label>
        <div className="flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-border text-sm font-medium transition-colors ${
              theme === 'light'
                ? 'bg-primary text-primary-content z-10'
                : 'bg-surface text-text-primary hover:bg-surface-muted'
            }`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`relative -ml-px inline-flex items-center px-4 py-2 rounded-r-md border border-border text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-primary text-primary-content z-10'
                : 'bg-surface text-text-primary hover:bg-surface-muted'
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
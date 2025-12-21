
import React from 'react';
import { Theme } from '../../../types';

interface AppearanceCardProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const AppearanceCard: React.FC<AppearanceCardProps> = ({ theme, setTheme }) => {
  const options: { id: Theme, label: string, desc: string }[] = [
    { id: 'light', label: 'Light', desc: 'Classic bright look' },
    { id: 'dark', label: 'Dark', desc: 'Easy on the eyes' },
    { id: 'system', label: 'System', desc: 'Matches device' }
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h3 className="text-lg font-bold text-text-primary">Display Theme</h3>
        <p className="text-xs text-text-muted mt-1">Choose how the interface looks on this device.</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setTheme(opt.id)}
            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 ${
              theme === opt.id 
                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                : 'border-border hover:border-text-muted/30 bg-surface-muted/50'
            }`}
          >
            <div className="flex flex-col items-start">
              <span className={`font-bold ${theme === opt.id ? 'text-primary' : 'text-text-primary'}`}>{opt.label}</span>
              <span className="text-xs text-text-muted">{opt.desc}</span>
            </div>
            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${theme === opt.id ? 'border-primary bg-primary' : 'border-border'}`}>
              {theme === opt.id && <div className="h-2 w-2 rounded-full bg-white"></div>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AppearanceCard;

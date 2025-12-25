
import React from 'react';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from '../../../constants';
import { UserIcon } from '../../../constants'; // Fixed missing import

const AboutCard: React.FC = () => {
  
  const getPlatformLabel = () => {
    const platform = Capacitor.getPlatform();
    switch (platform) {
        case 'android': return 'Android App';
        case 'ios': return 'iOS App';
        case 'web': return 'Web (Browser)';
        default: return platform;
    }
  };

  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">About</h2>
      <div className="space-y-3 text-sm text-text-secondary">
        <div className="flex justify-between">
          <span className="font-medium text-text-primary">App Version</span>
          <span>{APP_VERSION}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text-primary">Environment</span>
          <span>{getPlatformLabel()}</span>
        </div>
      </div>
       <div className="mt-4 pt-4 border-t border-border text-xs text-text-muted text-center">
          <p>&copy; {new Date().getFullYear()} Restaurant POS. All Rights Reserved.</p>
       </div>
    </div>
  );
};

export default AboutCard;

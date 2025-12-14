
import React from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useStatusContext } from '../../../context/StatusContext';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from '../../../constants';
import { UserIcon } from '../../../constants'; // Fixed missing import

const AboutCard: React.FC = () => {
  const { pendingSyncCount, isOnline } = useStatusContext();
  
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
        <div className="flex justify-between items-center">
          <span className="font-medium text-text-primary">Data Status</span>
          <span className="flex items-center gap-2">
            {!isOnline ? (
                <>
                    <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Offline</span>
                </>
            ) : pendingSyncCount > 0 ? (
                <>
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">{pendingSyncCount} unsynced transaction{pendingSyncCount > 1 ? 's' : ''}</span>
                </>
            ) : (
                <>
                    <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-green-600 dark:text-green-400 font-medium">Online & Synced</span>
                </>
            )}
          </span>
        </div>
      </div>
       <div className="mt-4 pt-4 border-t border-border text-xs text-text-muted text-center">
          <p>&copy; {new Date().getFullYear()} Restaurant POS. All Rights Reserved.</p>
       </div>
    </div>
  );
};

export default AboutCard;

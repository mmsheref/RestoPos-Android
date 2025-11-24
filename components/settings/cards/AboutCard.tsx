import React from 'react';

const AboutCard: React.FC = () => {
  const appVersion = '2.1.0'; // Example version

  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">About</h2>
      <div className="space-y-3 text-sm text-text-secondary">
        <div className="flex justify-between">
          <span className="font-medium text-text-primary">App Version</span>
          <span>{appVersion}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text-primary">Environment</span>
          <span>Web (Browser)</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text-primary">Data Status</span>
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Online & Synced
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
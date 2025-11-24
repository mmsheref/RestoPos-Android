import React from 'react';

const AboutCard: React.FC = () => {
  const appVersion = '2.1.0'; // Example version

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">About</h2>
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex justify-between">
          <span className="font-medium text-gray-700 dark:text-gray-200">App Version</span>
          <span>{appVersion}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-700 dark:text-gray-200">Environment</span>
          <span>Web (Browser)</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-700 dark:text-gray-200">Data Status</span>
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Online & Synced
          </span>
        </div>
      </div>
       <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 text-center">
          <p>&copy; {new Date().getFullYear()} Restaurant POS. All Rights Reserved.</p>
       </div>
    </div>
  );
};

export default AboutCard;

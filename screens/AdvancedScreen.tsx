
import React from 'react';
import { AdvancedIcon } from '../constants';

const AdvancedScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <AdvancedIcon className="h-16 w-16 text-gray-400 mb-4" />
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Advanced Settings</h1>
      <p className="text-lg text-gray-500">
        This section is reserved for future advanced features, such as data import/export, integrations, and developer tools.
      </p>
    </div>
  );
};

export default AdvancedScreen;

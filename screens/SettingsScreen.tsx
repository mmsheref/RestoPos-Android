
import React from 'react';

const SettingsScreen: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Settings</h1>
      <div className="space-y-8 max-w-2xl mx-auto">
        
        {/* Printers Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Printers</h2>
          <div className="space-y-4">
            <p className="text-gray-600">
              Connect and manage your thermal receipt printers. This will typically involve Bluetooth pairing.
            </p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
              Find Printers
            </button>
            <div className="mt-4">
              <h3 className="font-semibold">Connected Printers:</h3>
              <p className="text-gray-500 italic mt-2">No printers connected.</p>
            </div>
          </div>
        </div>

        {/* General Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">General</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="store-name" className="text-gray-700">Store Name</label>
              <input id="store-name" type="text" defaultValue="My Restaurant" className="p-2 border rounded-md w-1/2" />
            </div>
            <div className="flex justify-between items-center">
              <label htmlFor="currency" className="text-gray-700">Currency</label>
              <input id="currency" type="text" defaultValue="USD" className="p-2 border rounded-md w-1/2" />
            </div>
            <div className="flex justify-between items-center">
              <label htmlFor="tax-rate" className="text-gray-700">Default Tax Rate (%)</label>
              <input id="tax-rate" type="number" defaultValue="8.5" className="p-2 border rounded-md w-1/2" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsScreen;

import React from 'react';

interface DataManagementCardProps {
  onExport: () => void;
  onImport: () => void;
}

const DataManagementCard: React.FC<DataManagementCardProps> = ({ onExport, onImport }) => {
  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">Data Management</h2>
      <p className="text-sm text-text-secondary mb-4">
        Export your app data as a JSON file for backup, or restore from a previous backup.
      </p>
      <div className="flex gap-4">
        <button onClick={onImport} className="flex-1 bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700">
          Import from Backup
        </button>
        <button onClick={onExport} className="flex-1 bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover">
          Export Backup
        </button>
      </div>
    </div>
  );
};

export default DataManagementCard;
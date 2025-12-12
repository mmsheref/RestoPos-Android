
import React from 'react';
import { DownloadIcon, DatabaseIcon } from '../../../constants';

interface DataBackupCardProps {
  onExport: () => void;
  onImport: () => void;
}

const DataBackupCard: React.FC<DataBackupCardProps> = ({ onExport, onImport }) => {
  return (
    <div className="space-y-6">
        <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Backup & Restore</h2>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            Create a full backup of your store data (Inventory, Settings, Receipts) as a JSON file. 
            You can restore this file on another device or keep it for safety.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div onClick={onExport} className="cursor-pointer group flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/30 rounded-xl hover:bg-primary/5 transition-all">
                <div className="p-3 bg-primary/10 rounded-full text-primary mb-3 group-hover:scale-110 transition-transform">
                   <DownloadIcon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-text-primary">Export Backup</h3>
                <p className="text-xs text-text-secondary mt-1">Save data to device</p>
             </div>

             <div onClick={onImport} className="cursor-pointer group flex flex-col items-center justify-center p-6 border-2 border-dashed border-green-500/30 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/10 transition-all">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400 mb-3 group-hover:scale-110 transition-transform">
                   <DatabaseIcon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-text-primary">Restore Data</h3>
                <p className="text-xs text-text-secondary mt-1">Load from JSON file</p>
             </div>
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <h4 className="text-blue-800 dark:text-blue-300 font-medium mb-1">Cloud Sync</h4>
            <p className="text-sm text-blue-600 dark:text-blue-400">
                Your data is also automatically synced to the cloud when you are online. 
                This manual backup is recommended before making major changes or switching devices.
            </p>
        </div>
    </div>
  );
};

export default DataBackupCard;

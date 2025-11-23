import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { TrashIcon } from '../constants';
import { Printer, BackupData, Item } from '../types';
import { testPrint } from '../utils/printerHelper';
import AddPrinterModal from '../components/settings/AddPrinterModal';
import ConfirmImportModal from '../components/modals/ConfirmImportModal';
import ConfirmCsvImportModal from '../components/modals/ConfirmCsvImportModal';
import { parseCsvToItems } from '../utils/csvHelper';

const SettingsScreen: React.FC = () => {
  const { 
      theme, setTheme, settings, updateSettings, 
      printers, addPrinter, removePrinter,
      exportData, restoreData,
      exportItemsCsv, replaceItemsAndCategories
  } = useAppContext();
  
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  
  // JSON import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCandidate, setImportCandidate] = useState<BackupData | null>(null);
  
  // CSV import state
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);
  const [csvImportCandidate, setCsvImportCandidate] = useState<{items: Item[], categories: string[]}>({ items: [], categories: [] });

  const [testingPrinterId, setTestingPrinterId] = useState<string | null>(null);
  
  // Refs for file inputs
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleTax = () => {
    updateSettings({ taxEnabled: !settings.taxEnabled });
  };

  const handleTaxRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      updateSettings({ taxRate: val });
    }
  };

  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      updateSettings({ storeName: e.target.value });
  };

  const handleRemovePrinter = (id: string) => {
    if (window.confirm("Remove this printer?")) {
      removePrinter(id);
    }
  };

  const handleTestPrinter = async (printer: Printer) => {
    setTestingPrinterId(printer.id);
    const result = await testPrint(printer);
    setTestingPrinterId(null);
    
    if (result.success) {
        alert("Test print sent successfully!");
    } else {
        alert(`Print Failed:\n\n${result.message}`);
    }
  };

  const handleImportClick = () => {
      jsonFileInputRef.current?.click();
  };

  const handleCsvImportClick = () => {
      csvFileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
            const json = event.target?.result as string;
            if (json) {
               const data: BackupData = JSON.parse(json);
               
               // Basic Validation
               if (!data.timestamp || !data.items || !Array.isArray(data.items)) {
                   throw new Error("Invalid backup file format.");
               }

               setImportCandidate(data);
               setIsImportModalOpen(true);
            }
          } catch (error) {
              console.error(error);
              alert("Failed to parse the backup file. Please ensure it is a valid JSON exported from this app.");
          } finally {
             // Reset input so same file can be selected again if needed
             if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
          }
      };
      
      try {
        reader.readAsText(file);
      } catch (err) {
        console.error("File reading error", err);
        alert("Could not read file.");
      }
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
            const csvContent = event.target?.result as string;
            if (csvContent) {
               const parsedData = parseCsvToItems(csvContent);
               if (parsedData.items.length === 0) {
                   throw new Error("No valid items found in the CSV file.");
               }
               setCsvImportCandidate(parsedData);
               setIsCsvImportModalOpen(true);
            }
          } catch (error: any) {
              console.error(error);
              alert(`Failed to parse CSV file: ${error.message}`);
          } finally {
             if (csvFileInputRef.current) csvFileInputRef.current.value = '';
          }
      };
      
      try {
        reader.readAsText(file);
      } catch (err) {
        console.error("File reading error", err);
        alert("Could not read file.");
      }
  };

  const handleConfirmImport = () => {
      if (importCandidate) {
          restoreData(importCandidate);
          setIsImportModalOpen(false);
          setImportCandidate(null);
          alert("Data restored successfully!");
      }
  };

  const handleConfirmCsvImport = () => {
      if (csvImportCandidate.items.length > 0) {
          replaceItemsAndCategories(csvImportCandidate.items, csvImportCandidate.categories);
          setIsCsvImportModalOpen(false);
          setCsvImportCandidate({ items: [], categories: [] });
          alert("Items imported successfully!");
      }
  };

  return (
    <div className="p-6 pb-24 dark:bg-gray-900 min-h-full">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Settings</h1>
      <div className="space-y-8 max-w-2xl mx-auto">
        
        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-700 pb-2 text-gray-800 dark:text-gray-100">Appearance</h2>
          <div className="flex items-center justify-between">
            <label htmlFor="dark-mode-toggle" className="text-gray-700 dark:text-gray-300">Dark Mode</label>
            <button
              id="dark-mode-toggle"
              onClick={toggleTheme}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Switch between light and dark themes.
          </p>
        </div>

        {/* Financial Section (Tax & Currency) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-700 pb-2 text-gray-800 dark:text-gray-100">Financial & Tax</h2>
          <div className="space-y-6">
            
            {/* Tax Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="tax-toggle" className="block text-gray-700 dark:text-gray-300 font-medium">Enable Tax (GST)</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Calculate tax on sales automatically.</p>
              </div>
              <button
                id="tax-toggle"
                onClick={toggleTax}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  settings.taxEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                    settings.taxEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Tax Rate Input (Only visible if tax is enabled) */}
            <div className={`transition-all duration-300 ${settings.taxEnabled ? 'opacity-100 max-h-20' : 'opacity-50 max-h-20 pointer-events-none grayscale'}`}>
                <div className="flex justify-between items-center">
                  <label htmlFor="tax-rate" className="text-gray-700 dark:text-gray-300">Tax Rate (%)</label>
                  <div className="relative w-1/2">
                    <input 
                      id="tax-rate" 
                      type="number" 
                      step="0.1"
                      min="0"
                      value={settings.taxRate}
                      onChange={handleTaxRateChange}
                      disabled={!settings.taxEnabled}
                      className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                  </div>
                </div>
            </div>

            <div className="flex justify-between items-center border-t dark:border-gray-700 pt-4">
              <label htmlFor="currency" className="text-gray-700 dark:text-gray-300">Currency Symbol</label>
              <input id="currency" type="text" defaultValue="₹" disabled className="p-2 border rounded-md w-1/2 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 cursor-not-allowed" />
            </div>
          </div>
        </div>
        
        {/* Data Management Section (Backup/Restore) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-blue-500">
           <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-700 pb-2 text-gray-800 dark:text-gray-100">Data Management</h2>
           <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
             Manage your app data using JSON for full backups or CSV for item management.
           </p>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {/* Full Backup */}
               <h3 className="sm:col-span-2 text-base font-medium text-gray-600 dark:text-gray-400 mt-2">Full Backup (JSON)</h3>
               <button 
                 onClick={exportData}
                 className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
               >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   Export All Data
               </button>
               <button 
                 onClick={handleImportClick}
                 className="w-full bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
               >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   Import All Data
               </button>
               <input 
                 type="file" 
                 accept="application/json, .json" 
                 ref={jsonFileInputRef} 
                 onChange={handleFileChange} 
                 className="hidden" 
               />

                {/* Item Management */}
                <h3 className="sm:col-span-2 text-base font-medium text-gray-600 dark:text-gray-400 mt-4 border-t dark:border-gray-700 pt-4">Item Management (CSV)</h3>
                <button 
                 onClick={exportItemsCsv}
                 className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
               >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   Export Items CSV
               </button>
               <button 
                 onClick={handleCsvImportClick}
                 className="w-full bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
               >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   Import Items CSV
               </button>
               <input 
                 type="file" 
                 accept=".csv, text/csv"
                 ref={csvFileInputRef} 
                 onChange={handleCsvFileChange} 
                 className="hidden" 
               />
           </div>
        </div>

        {/* Printers Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Printers</h2>
            <button 
              onClick={() => setIsPrinterModalOpen(true)}
              className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 transition-colors"
            >
              + Add Printer
            </button>
          </div>
          
          <div className="space-y-4">
            {printers.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <p className="text-gray-500 dark:text-gray-400">No printers connected.</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Tap "Add Printer" to configure a device.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {printers.map(printer => (
                  <li key={printer.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 flex-grow overflow-hidden">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                         </svg>
                      </div>
                      <div className="truncate">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{printer.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {printer.interfaceType} &bull; {printer.paperWidth}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleTestPrinter(printer)}
                            disabled={testingPrinterId === printer.id}
                            className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                        >
                            {testingPrinterId === printer.id ? 'Testing...' : 'Test'}
                        </button>
                        <button 
                          onClick={() => handleRemovePrinter(printer.id)}
                          className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* General Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-700 pb-2 text-gray-800 dark:text-gray-100">Store Info</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="store-name" className="text-gray-700 dark:text-gray-300">Store Name</label>
              <input 
                  id="store-name" 
                  type="text" 
                  value={settings.storeName || ''} 
                  onChange={handleStoreNameChange}
                  placeholder="My Restaurant" 
                  className="p-2 border rounded-md w-1/2 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" 
              />
            </div>
          </div>
        </div>

      </div>

      <AddPrinterModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        onSave={(newPrinter) => {
          addPrinter(newPrinter);
          setIsPrinterModalOpen(false);
        }}
      />

      <ConfirmImportModal 
        isOpen={isImportModalOpen}
        data={importCandidate}
        onClose={() => setIsImportModalOpen(false)}
        onConfirm={handleConfirmImport}
      />

      <ConfirmCsvImportModal
        isOpen={isCsvImportModalOpen}
        items={csvImportCandidate.items}
        categories={csvImportCandidate.categories}
        onClose={() => setIsCsvImportModalOpen(false)}
        onConfirm={handleConfirmCsvImport}
      />
    </div>
  );
};

export default SettingsScreen;

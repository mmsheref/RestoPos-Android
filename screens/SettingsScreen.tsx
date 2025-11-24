

import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { TrashIcon, PaymentMethodIcon } from '../constants';
import { Printer, BackupData, PaymentType } from '../types';
import { testPrint } from '../utils/printerHelper';
import AddPrinterModal from '../components/settings/AddPrinterModal';
import AddPaymentTypeModal from '../components/settings/AddPaymentTypeModal';
import ConfirmImportModal from '../components/modals/ConfirmImportModal';
import ConfirmModal from '../components/modals/ConfirmModal';

const SettingsScreen: React.FC = () => {
  const { 
      theme, setTheme, settings, updateSettings, 
      printers, addPrinter, removePrinter,
      paymentTypes, addPaymentType, updatePaymentType, removePaymentType,
      exportData, restoreData
  } = useAppContext();
  
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isPaymentTypeModalOpen, setIsPaymentTypeModalOpen] = useState(false);
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCandidate, setImportCandidate] = useState<BackupData | null>(null);
  
  const [testingPrinterId, setTestingPrinterId] = useState<string | null>(null);
  const [printerToRemove, setPrinterToRemove] = useState<Printer | null>(null);
  
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const handleTogglePaymentType = (pt: PaymentType) => {
    updatePaymentType({ ...pt, enabled: !pt.enabled });
  };

  const confirmRemovePrinter = () => {
    if (printerToRemove) {
      removePrinter(printerToRemove.id);
      setPrinterToRemove(null);
    }
  };

  const handleTestPrinter = async (printer: Printer) => {
    setTestingPrinterId(printer.id);
    const result = await testPrint(printer);
    setTestingPrinterId(null);
    if (result.success) alert("Test print sent successfully!");
    else alert(`Print Failed:\n\n${result.message}`);
  };

  const handleImportClick = () => jsonFileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
            const json = event.target?.result as string;
            if (json) {
               const data: BackupData = JSON.parse(json);
               if (!data.timestamp || !data.items || !Array.isArray(data.items)) throw new Error("Invalid backup file format.");
               setImportCandidate(data);
               setIsImportModalOpen(true);
            }
          } catch (error) {
              alert("Failed to parse the backup file. Please ensure it is a valid JSON exported from this app.");
          } finally {
             if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  const handleConfirmImport = () => {
      if (importCandidate) {
          restoreData(importCandidate);
          setIsImportModalOpen(false);
          setImportCandidate(null);
          alert("Data restored successfully!");
      }
  };

  return (
    <div className="p-6 pb-24 dark:bg-gray-900 min-h-full">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Settings</h1>
      <div className="space-y-8 max-w-2xl mx-auto">
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-700 pb-2 text-gray-800 dark:text-gray-100">Appearance</h2>
          <div className="flex items-center justify-between">
            <label className="text-gray-700 dark:text-gray-300">Dark Mode</label>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'}`}>
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-700 pb-2 text-gray-800 dark:text-gray-100">Financial & Tax</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium">Enable Tax (GST)</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Calculate tax on sales automatically.</p>
              </div>
              <button onClick={() => updateSettings({ taxEnabled: !settings.taxEnabled })} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${settings.taxEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${settings.taxEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className={`transition-all duration-300 ${settings.taxEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                <div className="flex justify-between items-center">
                  <label className="text-gray-700 dark:text-gray-300">Tax Rate (%)</label>
                  <input type="number" step="0.1" min="0" value={settings.taxRate} onChange={(e) => updateSettings({ taxRate: parseFloat(e.target.value) || 0 })} disabled={!settings.taxEnabled} className="w-1/2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
                </div>
            </div>
          </div>
        </div>
        
        {/* Payment Types Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Payment Types</h2>
            <button onClick={() => setIsPaymentTypeModalOpen(true)} className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 transition-colors">
              + Add Type
            </button>
          </div>
          <div className="space-y-2">
            {paymentTypes.map(pt => (
              <li key={pt.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <PaymentMethodIcon iconName={pt.icon} className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{pt.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleTogglePaymentType(pt)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ${pt.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${pt.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <button onClick={() => removePaymentType(pt.id)} className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400"><TrashIcon className="h-5 w-5" /></button>
                </div>
              </li>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Printers</h2>
            <button onClick={() => setIsPrinterModalOpen(true)} className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 transition-colors">
              + Add Printer
            </button>
          </div>
          <div className="space-y-4">
            {printers.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <p className="text-gray-500 dark:text-gray-400">No printers connected.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {printers.map(printer => (
                  <li key={printer.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="truncate">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{printer.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{printer.interfaceType} &bull; {printer.paperWidth}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleTestPrinter(printer)} disabled={testingPrinterId === printer.id} className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50">
                            {testingPrinterId === printer.id ? 'Testing...' : 'Test'}
                        </button>
                        <button onClick={() => setPrinterToRemove(printer)} className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-700 pb-2 text-gray-800 dark:text-gray-100">Store Info</h2>
          <div className="space-y-4">
            <div>
              <label className="text-gray-700 dark:text-gray-300">Store Name</label>
              <input type="text" value={settings.storeName || ''} onChange={e => updateSettings({ storeName: e.target.value })} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
            </div>
            <div>
              <label className="text-gray-700 dark:text-gray-300">Store Address</label>
              <textarea rows={2} value={settings.storeAddress || ''} onChange={e => updateSettings({ storeAddress: e.target.value })} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
            </div>
             <div>
              <label className="text-gray-700 dark:text-gray-300">Receipt Footer</label>
              <input type="text" value={settings.receiptFooter || ''} onChange={e => updateSettings({ receiptFooter: e.target.value })} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-blue-500">
           <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-700 pb-2 text-gray-800 dark:text-gray-100">Data Management</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <button onClick={exportData} className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">Export All Data</button>
               <button onClick={handleImportClick} className="w-full bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600 transition-colors flex items-center justify-center gap-2">Import All Data</button>
               <input type="file" accept="application/json, .json" ref={jsonFileInputRef} onChange={handleFileChange} className="hidden" />
           </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-700 pb-2 text-gray-800 dark:text-gray-100">About</h2>
          <div className="text-center text-gray-600 dark:text-gray-400 space-y-2">
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">Restaurant POS</p>
            <p className="text-sm">Version 2.1.0</p>
            <p className="mt-4 text-xs">Developed with ❤️ by Ameer</p>
          </div>
        </div>
      </div>

      <AddPrinterModal isOpen={isPrinterModalOpen} onClose={() => setIsPrinterModalOpen(false)} onSave={(newPrinter) => { addPrinter(newPrinter); setIsPrinterModalOpen(false); }} />
      <AddPaymentTypeModal isOpen={isPaymentTypeModalOpen} onClose={() => setIsPaymentTypeModalOpen(false)} onSave={(newType) => { addPaymentType(newType); setIsPaymentTypeModalOpen(false); }} />
      <ConfirmImportModal isOpen={isImportModalOpen} data={importCandidate} onClose={() => setIsImportModalOpen(false)} onConfirm={handleConfirmImport} />
      <ConfirmModal isOpen={!!printerToRemove} onClose={() => setPrinterToRemove(null)} onConfirm={confirmRemovePrinter} title="Confirm Removal" confirmText="Remove">
        <p>Are you sure you want to remove the printer "<strong>{printerToRemove?.name}</strong>"?</p>
      </ConfirmModal>
    </div>
  );
};

export default SettingsScreen;
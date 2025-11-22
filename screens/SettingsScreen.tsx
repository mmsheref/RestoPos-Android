
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { TrashIcon, CloseIcon } from '../constants';
import { Printer, PrinterInterfaceType, PrinterPaperWidth } from '../types';
import { requestAppPermissions } from '../utils/permissions';
import { testPrint } from '../utils/printerHelper';

// Add type definition for the plugin
declare global {
  interface Window {
    bluetoothSerial: any;
  }
}

const SettingsScreen: React.FC = () => {
  const { theme, setTheme, settings, updateSettings, printers, addPrinter, removePrinter } = useAppContext();
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);

  // Form State for New Printer
  const [printerName, setPrinterName] = useState('');
  const [printerInterface, setPrinterInterface] = useState<PrinterInterfaceType>('Bluetooth');
  const [paperWidth, setPaperWidth] = useState<PrinterPaperWidth>('58mm');
  const [printerAddress, setPrinterAddress] = useState(''); // For MAC or IP

  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [foundDevices, setFoundDevices] = useState<{name: string, address: string}[]>([]);

  // Testing State
  const [testingPrinterId, setTestingPrinterId] = useState<string | null>(null);

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

  const openAddPrinterModal = () => {
    setPrinterName('');
    setPrinterInterface('Bluetooth');
    setPaperWidth('58mm');
    setPrinterAddress('');
    setFoundDevices([]);
    setIsPrinterModalOpen(true);
  };

  const handleStartScan = async () => {
    if (printerInterface !== 'Bluetooth') return;
    
    setIsScanning(true);
    setFoundDevices([]);

    try {
      // 1. Request Runtime Permissions FIRST
      // We ask for permissions before checking for the plugin to ensure the app behaves correctly
      // regarding privacy prompts, even if the specific printer plugin is missing.
      const hasPermission = await requestAppPermissions();
      
      if (!hasPermission) {
        setIsScanning(false);
        alert("Bluetooth permissions were denied. Please enable them in your device settings to scan for printers.");
        return;
      }

      // 2. Check for Plugin & Scan
      if (window.bluetoothSerial) {
          // Real Device Logic: List Paired -> Then Discover Unpaired
          window.bluetoothSerial.list(
            (pairedDevices: any[]) => {
                const mapped = pairedDevices.map(d => ({ name: d.name || 'Unknown Device', address: d.address }));
                setFoundDevices(prev => {
                    const combined = [...prev];
                    mapped.forEach(m => {
                        if(!combined.find(d => d.address === m.address)) combined.push(m);
                    });
                    return combined;
                });

                // Start Discovery
                window.bluetoothSerial.discoverUnpaired(
                  (devices: any[]) => {
                    const mappedUnpaired = devices.map(d => ({ name: d.name || 'Unknown Device', address: d.address }));
                    setFoundDevices(prev => {
                       const newDevs = [...prev];
                       mappedUnpaired.forEach(m => {
                           if(!newDevs.find(d => d.address === m.address)) newDevs.push(m);
                       });
                       return newDevs;
                    });
                    setIsScanning(false);
                  },
                  (err: any) => {
                    console.warn("Discovery failed or stopped", err);
                    setIsScanning(false);
                  }
                );
            },
            (err: any) => {
              console.error("List failed", err);
              // If list fails, still try discover or stop
              setIsScanning(false); 
            }
          );
      } else {
          // 3. Fallback: Web/No-Plugin Simulation
          // If the plugin is missing (browser testing or plugin load error), we simulate a scan 
          // so you can test the UI flow without being blocked by an alert.
          console.warn("Bluetooth plugin not detected. Running in simulation mode.");
          
          setTimeout(() => {
            setFoundDevices([
                { name: "Test Printer (Simulated)", address: "00:11:22:33:44:55" }
            ]);
            setIsScanning(false);
          }, 2000);
      }

    } catch (error) {
      console.error("Scan error:", error);
      setIsScanning(false);
      alert("An error occurred while scanning: " + JSON.stringify(error));
    }
  };

  const handleSelectDevice = (device: { name: string, address: string }) => {
      setPrinterName(device.name);
      setPrinterAddress(device.address);
      setFoundDevices([]); // Clear list after selection
  };

  const handleSavePrinter = () => {
    if (!printerName.trim()) {
      alert("Please enter a printer name.");
      return;
    }

    const newPrinter: Printer = {
      id: `P${Date.now()}`,
      name: printerName,
      interfaceType: printerInterface,
      paperWidth: paperWidth,
      address: printerAddress
    };

    addPrinter(newPrinter);
    setIsPrinterModalOpen(false);
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
    
    if (!result.success) {
        alert(`Error: ${result.message}`);
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

        {/* Printers Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Printers</h2>
            <button 
              onClick={openAddPrinterModal}
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
                         {/* Printer Icon */}
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
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
              <input id="store-name" type="text" defaultValue="My Restaurant" className="p-2 border rounded-md w-1/2 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
            </div>
          </div>
        </div>

      </div>

      {/* Add Printer Modal */}
      {isPrinterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={() => setIsPrinterModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b dark:border-slate-700 pb-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Add Printer</h2>
              <button onClick={() => setIsPrinterModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Printer Name Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Printer Name</label>
                <input 
                  type="text" 
                  value={printerName}
                  onChange={(e) => setPrinterName(e.target.value)}
                  placeholder="e.g. Kitchen Printer"
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Interface</label>
                  <select 
                    value={printerInterface}
                    onChange={(e) => {
                        setPrinterInterface(e.target.value as PrinterInterfaceType);
                        setFoundDevices([]); 
                        setIsScanning(false);
                    }}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="Bluetooth">Bluetooth</option>
                    <option value="Ethernet">Ethernet</option>
                    <option value="USB">USB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Paper Width</label>
                  <select 
                    value={paperWidth}
                    onChange={(e) => setPaperWidth(e.target.value as PrinterPaperWidth)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="58mm">58mm</option>
                    <option value="80mm">80mm</option>
                  </select>
                </div>
              </div>

              {/* Interface Specific Fields */}
              {printerInterface === 'Bluetooth' && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                     <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Available Devices</label>
                        <button 
                           onClick={handleStartScan} 
                           disabled={isScanning}
                           className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white px-3 py-1.5 rounded font-medium hover:bg-blue-200 dark:hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                           {isScanning ? (
                               <>
                                <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></span>
                                Scanning...
                               </>
                           ) : (
                               <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                Scan for Devices
                               </>
                           )}
                        </button>
                     </div>

                     {/* Scanning Results List */}
                     {foundDevices.length > 0 ? (
                         <ul className="mb-4 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 max-h-32 overflow-y-auto">
                             {foundDevices.map((device) => (
                                 <li key={device.address}>
                                     <button 
                                        onClick={() => handleSelectDevice(device)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex justify-between items-center border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
                                     >
                                         <div className="truncate">
                                            <div className="font-medium text-slate-800 dark:text-slate-200">{device.name}</div>
                                            <div className="text-xs text-slate-500">{device.address}</div>
                                         </div>
                                         <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded">Select</span>
                                     </button>
                                 </li>
                             ))}
                         </ul>
                     ) : (
                        !isScanning && foundDevices.length === 0 && (
                            <div className="text-xs text-slate-400 italic mb-3 text-center">No devices found. Press scan to search.</div>
                        )
                     )}
                     
                     {/* Manual Entry Fallback */}
                     <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide mt-3">Manual Address</label>
                     <input 
                        type="text" 
                        value={printerAddress}
                        onChange={(e) => setPrinterAddress(e.target.value)}
                        placeholder="00:11:22:33:44:55"
                        className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white font-mono"
                     />
                     <p className="text-xs text-slate-500 mt-1">Select a device above or enter MAC address manually.</p>
                  </div>
              )}

              {printerInterface === 'Ethernet' && (
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">IP Address</label>
                     <input 
                        type="text" 
                        value={printerAddress}
                        onChange={(e) => setPrinterAddress(e.target.value)}
                        placeholder="192.168.1.100"
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white font-mono"
                     />
                  </div>
              )}

              <button 
                onClick={() => alert("Advanced printer settings (DPI, cut mode, drawer kick) coming soon.")}
                className="w-full text-left text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline pt-2"
              >
                Show Advanced Settings
              </button>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setIsPrinterModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSavePrinter}
                  className="flex-1 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-md"
                >
                  Save Printer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsScreen;

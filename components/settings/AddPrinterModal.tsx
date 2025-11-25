

import React, { useState } from 'react';
import { Printer, PrinterInterfaceType, PrinterPaperWidth } from '../../types';
import { CloseIcon } from '../../constants';
import { requestAppPermissions } from '../../utils/permissions';

// Add type definition for the plugin
declare global {
  interface Window {
    bluetoothSerial: any;
  }
}

interface AddPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (printer: Printer) => void;
}

const AddPrinterModal: React.FC<AddPrinterModalProps> = ({ isOpen, onClose, onSave }) => {
  const [printerName, setPrinterName] = useState('');
  const [printerInterface, setPrinterInterface] = useState<PrinterInterfaceType>('Bluetooth');
  const [paperWidth, setPaperWidth] = useState<PrinterPaperWidth>('58mm');
  const [printerAddress, setPrinterAddress] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [foundDevices, setFoundDevices] = useState<{ name: string, address: string }[]>([]);

  const handleStartScan = async () => {
    if (printerInterface !== 'Bluetooth') return;
    
    setIsScanning(true);
    setFoundDevices([]);

    try {
      const hasPermission = await requestAppPermissions();
      if (!hasPermission) {
        setIsScanning(false);
        alert("Bluetooth permissions were denied. Please enable them in your device settings to scan for printers.");
        return;
      }

      if (window.bluetoothSerial) {
          window.bluetoothSerial.list((pairedDevices: any[]) => {
              const mapped = pairedDevices.map(d => ({ name: d.name || 'Unknown Device', address: d.address }));
              setFoundDevices(prev => [...prev, ...mapped.filter(m => !prev.find(d => d.address === m.address))]);

              window.bluetoothSerial.discoverUnpaired((devices: any[]) => {
                  const mappedUnpaired = devices.map(d => ({ name: d.name || 'Unknown Device', address: d.address }));
                  setFoundDevices(prev => [...prev, ...mappedUnpaired.filter(m => !prev.find(d => d.address === m.address))]);
                  setIsScanning(false);
              }, (err: any) => { console.warn("Discovery failed", err); setIsScanning(false); });
          }, (err: any) => { console.error("List failed", err); setIsScanning(false); });
      } else {
          console.warn("Bluetooth plugin not detected. Running in simulation mode.");
          setTimeout(() => {
            setFoundDevices([{ name: "Test Printer (Simulated)", address: "00:11:22:33:44:55" }]);
            setIsScanning(false);
          }, 2000);
      }
    } catch (error) {
      console.error("Scan error:", error);
      setIsScanning(false);
      alert("An error occurred during scanning.");
    }
  };
  
  const handleSelectDevice = (device: { name: string, address: string }) => {
      setPrinterName(device.name);
      setPrinterAddress(device.address);
      setFoundDevices([]);
      setIsScanning(false);
  };

  const handleSavePrinter = () => {
    if (!printerName.trim()) {
      alert("Please enter a printer name.");
      return;
    }
    if (printerInterface !== 'USB' && !printerAddress.trim()) {
      alert("Please provide a printer address (MAC or IP).");
      return;
    }
    const newPrinter: Printer = {
      id: `P${Date.now()}`,
      name: printerName,
      interfaceType: printerInterface,
      paperWidth: paperWidth,
      address: printerAddress
    };
    onSave(newPrinter);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-lg p-6 shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
          <h2 className="text-xl font-bold text-text-primary">Add Printer</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Printer Name</label>
            <input type="text" value={printerName} onChange={(e) => setPrinterName(e.target.value)} placeholder="e.g. Kitchen Printer" className="w-full p-2 border border-border rounded-md focus:ring-2 focus:ring-primary bg-background text-text-primary" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Interface</label>
              <select value={printerInterface} onChange={(e) => { setPrinterInterface(e.target.value as PrinterInterfaceType); setFoundDevices([]); setIsScanning(false); }} className="w-full p-2 border border-border rounded-md focus:ring-2 focus:ring-primary bg-background text-text-primary">
                <option value="Bluetooth">Bluetooth</option>
                <option value="Ethernet">Ethernet</option>
                <option value="USB">USB</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Paper Width</label>
              <select value={paperWidth} onChange={(e) => setPaperWidth(e.target.value as PrinterPaperWidth)} className="w-full p-2 border border-border rounded-md focus:ring-2 focus:ring-primary bg-background text-text-primary">
                <option value="58mm">58mm</option>
                <option value="80mm">80mm</option>
              </select>
            </div>
          </div>
          {printerInterface === 'Bluetooth' && (
            <div className="bg-surface-muted rounded-lg p-3 border border-border">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-text-secondary">Available Devices</label>
                <button onClick={handleStartScan} disabled={isScanning} className="text-xs bg-primary/10 text-primary dark:bg-primary dark:text-primary-content px-3 py-1.5 rounded font-medium hover:bg-primary/20 dark:hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-1">
                  {isScanning ? (<><span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></span>Scanning...</>) : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>Scan</>)}
                </button>
              </div>
              {foundDevices.length > 0 ? (
                <ul className="mb-4 bg-surface rounded border border-border max-h-32 overflow-y-auto">
                  {foundDevices.map((device) => (
                    <li key={device.address}><button onClick={() => handleSelectDevice(device)} className="w-full text-left px-3 py-2 hover:bg-primary/10 flex justify-between items-center border-b border-border last:border-0 transition-colors"><div className="truncate"><div className="font-medium text-text-primary">{device.name}</div><div className="text-xs text-text-secondary">{device.address}</div></div><span className="text-xs text-primary font-medium px-2 py-1 bg-primary/10 rounded">Select</span></button></li>
                  ))}
                </ul>
              ) : (!isScanning && <div className="text-xs text-text-muted italic mb-3 text-center">No devices found. Press scan.</div>)}
              <label className="block text-xs font-medium text-text-muted mb-1 uppercase tracking-wide mt-3">Manual Address</label>
              <input type="text" value={printerAddress} onChange={(e) => setPrinterAddress(e.target.value)} placeholder="00:11:22:33:44:55" className="w-full p-2 text-sm border border-border rounded-md focus:ring-2 focus:ring-primary bg-background text-text-primary font-mono" />
            </div>
          )}
          {printerInterface === 'Ethernet' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">IP Address</label>
              <input type="text" value={printerAddress} onChange={(e) => setPrinterAddress(e.target.value)} placeholder="192.168.1.100" className="w-full p-2 border border-border rounded-md focus:ring-2 focus:ring-primary bg-background text-text-primary font-mono" />
            </div>
          )}
          <div className="pt-4 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2 bg-surface-muted text-text-secondary rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
            <button onClick={handleSavePrinter} className="flex-1 py-2 bg-primary text-primary-content font-semibold rounded-lg hover:bg-primary-hover shadow-md">Save Printer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPrinterModal;
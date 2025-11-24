
import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Printer, BackupData, PaymentType } from '../types';
import { testPrint } from '../utils/printerHelper';

// Modals
import AddPrinterModal from '../components/settings/AddPrinterModal';
import AddPaymentTypeModal from '../components/settings/AddPaymentTypeModal';
import ConfirmImportModal from '../components/modals/ConfirmImportModal';
import ConfirmModal from '../components/modals/ConfirmModal';

// Card Components
import AppearanceCard from '../components/settings/cards/AppearanceCard';
import FinancialCard from '../components/settings/cards/FinancialCard';
import PaymentTypesCard from '../components/settings/cards/PaymentTypesCard';
import PrintersCard from '../components/settings/cards/PrintersCard';
import StoreInfoCard from '../components/settings/cards/StoreInfoCard';
import DataManagementCard from '../components/settings/cards/DataManagementCard';
import AboutCard from '../components/settings/cards/AboutCard';


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
    <div className="p-6 pb-24 bg-background min-h-full">
      <h1 className="text-3xl font-bold mb-6 text-text-primary">Settings</h1>
      <div className="space-y-8 max-w-2xl mx-auto">
        
        <AppearanceCard theme={theme} setTheme={setTheme} />
        
        <FinancialCard settings={settings} updateSettings={updateSettings} />
        
        <PaymentTypesCard 
          paymentTypes={paymentTypes}
          onAdd={() => setIsPaymentTypeModalOpen(true)}
          onToggle={handleTogglePaymentType}
          onRemove={removePaymentType}
        />

        <PrintersCard 
          printers={printers}
          onAdd={() => setIsPrinterModalOpen(true)}
          onTest={handleTestPrinter}
          onRemove={setPrinterToRemove}
          testingPrinterId={testingPrinterId}
        />
        
        <StoreInfoCard settings={settings} updateSettings={updateSettings} />

        <DataManagementCard onExport={exportData} onImport={handleImportClick} />
        
        <AboutCard />
        
        {/* Hidden file input remains */}
        <input type="file" accept="application/json, .json" ref={jsonFileInputRef} onChange={handleFileChange} className="hidden" />

      </div>

      <AddPrinterModal isOpen={isPrinterModalOpen} onClose={() => setIsPrinterModalOpen(false)} onSave={(newPrinter) => { addPrinter(newPrinter); setIsPrinterModalOpen(false); }} />
      <AddPaymentTypeModal isOpen={isPaymentTypeModalOpen} onClose={() => setIsPaymentTypeModalOpen(false)} onSave={(newType) => { addPaymentType(newType); setIsPaymentTypeModalOpen(false); }} />
      <ConfirmImportModal 
        isOpen={isImportModalOpen} 
        data={importCandidate} 
        onClose={() => setIsImportModalOpen(false)} 
        onConfirm={handleConfirmImport} 
      />
      
      {printerToRemove && (
        <ConfirmModal
          isOpen={!!printerToRemove}
          onClose={() => setPrinterToRemove(null)}
          onConfirm={confirmRemovePrinter}
          title={`Delete ${printerToRemove.name}?`}
          confirmText="Delete Printer"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
        >
          <p>Are you sure you want to delete this printer? This action cannot be undone.</p>
        </ConfirmModal>
      )}

    </div>
  );
};

export default SettingsScreen;
import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SettingsCategory } from '../../screens/SettingsScreen';
import { Printer, BackupData, PaymentType, Table } from '../../types';
import { testPrint } from '../../utils/printerHelper';
import { ArrowLeftIcon } from '../../constants';

// Modals
import AddPrinterModal from './AddPrinterModal';
import AddPaymentTypeModal from './AddPaymentTypeModal';
import ConfirmImportModal from '../modals/ConfirmImportModal';
import ConfirmModal from '../modals/ConfirmModal';
import TableFormModal from '../modals/TableFormModal';

// Card Components
import AppearanceCard from './cards/AppearanceCard';
import FinancialCard from './cards/FinancialCard';
import PaymentTypesCard from './cards/PaymentTypesCard';
import PrintersCard from './cards/PrintersCard';
import StoreInfoCard from './cards/StoreInfoCard';
import DataManagementCard from './cards/DataManagementCard';
import AboutCard from './cards/AboutCard';
import TablesCard from './cards/TablesCard';

interface SettingsContentProps {
    activeCategory: SettingsCategory;
    onBack: () => void;
    detailTitle: string;
}

const SettingsContent: React.FC<SettingsContentProps> = ({ activeCategory, onBack, detailTitle }) => {
    const { 
      theme, setTheme, settings, updateSettings, 
      printers, addPrinter, removePrinter,
      paymentTypes, addPaymentType, updatePaymentType, removePaymentType,
      tables, addTable, updateTable, setTables, removeTable,
      exportData, restoreData
    } = useAppContext();

    // All modal and state logic from the old SettingsScreen is moved here
    const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
    const [isPaymentTypeModalOpen, setIsPaymentTypeModalOpen] = useState(false);
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<Table | null>(null);
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
    
    const handleOpenAddTableModal = () => {
        setEditingTable(null);
        setIsTableModalOpen(true);
    };

    const handleOpenEditTableModal = (table: Table) => {
        setEditingTable(table);
        setIsTableModalOpen(true);
    };

    const handleSaveTable = (name: string) => {
        if (editingTable) {
            updateTable({ ...editingTable, name });
        } else {
            addTable(name);
        }
        setIsTableModalOpen(false);
    };

    const renderContent = () => {
        switch (activeCategory) {
            case 'appearance': return <AppearanceCard theme={theme} setTheme={setTheme} />;
            case 'financial': return <FinancialCard settings={settings} updateSettings={updateSettings} />;
            case 'payment_types': return <PaymentTypesCard paymentTypes={paymentTypes} onAdd={() => setIsPaymentTypeModalOpen(true)} onToggle={handleTogglePaymentType} onRemove={removePaymentType} />;
            case 'tables': return <TablesCard tables={tables} setTables={setTables} onAdd={handleOpenAddTableModal} onEdit={handleOpenEditTableModal} onRemove={removeTable} />;
            case 'printers': return <PrintersCard printers={printers} onAdd={() => setIsPrinterModalOpen(true)} onTest={handleTestPrinter} onRemove={setPrinterToRemove} testingPrinterId={testingPrinterId} />;
            case 'store_info': return <StoreInfoCard settings={settings} updateSettings={updateSettings} />;
            case 'data': return <DataManagementCard onExport={exportData} onImport={handleImportClick} />;
            case 'about': return <AboutCard />;
            default: return null;
        }
    };

    return (
        <>
            <div className="flex-shrink-0 h-16 flex items-center px-4 md:px-6 border-b border-border bg-surface">
                <button onClick={onBack} className="p-2 -ml-2 text-text-secondary md:hidden">
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-semibold text-text-primary md:ml-0 ml-2">{detailTitle}</h1>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-2xl mx-auto space-y-8">
                    {renderContent()}
                </div>
                 <input type="file" accept="application/json, .json" ref={jsonFileInputRef} onChange={handleFileChange} className="hidden" />
            </div>

            {/* Modals are kept here as they are triggered from the content cards */}
            <AddPrinterModal isOpen={isPrinterModalOpen} onClose={() => setIsPrinterModalOpen(false)} onSave={(newPrinter) => { addPrinter(newPrinter); setIsPrinterModalOpen(false); }} />
            <AddPaymentTypeModal isOpen={isPaymentTypeModalOpen} onClose={() => setIsPaymentTypeModalOpen(false)} onSave={(newType) => { addPaymentType(newType); setIsPaymentTypeModalOpen(false); }} />
            <TableFormModal isOpen={isTableModalOpen} onClose={() => setIsTableModalOpen(false)} onSave={handleSaveTable} initialData={editingTable} />
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
        </>
    );
};

export default SettingsContent;
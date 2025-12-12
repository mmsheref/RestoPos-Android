
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
import TablesCard from './cards/TablesCard';
import SecurityCard from './cards/SecurityCard';

interface SettingsContentProps {
    activeCategory: SettingsCategory;
    onBack: () => void;
    detailTitle: string;
}

const PlaceholderCard: React.FC<{ title: string, message: string }> = ({ title, message }) => (
    <div className="bg-surface p-8 rounded-lg shadow-sm border border-border text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">{title}</h2>
        <p className="text-text-secondary">{message}</p>
        <div className="mt-6">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wide">Coming Soon</span>
        </div>
    </div>
);

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
      const result = await testPrint(printer, settings); // Passed settings here for design test
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
            case 'security': return <SecurityCard settings={settings} updateSettings={updateSettings} />;
            case 'data': return <DataManagementCard onExport={exportData} onImport={handleImportClick} />;
            // New Categories - Placeholders for now or simple implementations
            case 'staff': return <PlaceholderCard title="Staff Management" message="Manage user accounts, roles, and permissions." />;
            case 'notifications': return <PlaceholderCard title="Notifications" message="Configure email alerts for daily sales summaries and low stock." />;
            case 'preferences': return (
                <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
                    <h2 className="text-xl font-semibold mb-4 text-text-primary">App Preferences</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-text-secondary">Language</span>
                            <select 
                                value={settings.language || 'en'} 
                                onChange={e => updateSettings({ language: e.target.value })}
                                className="p-2 border border-border rounded-md bg-background text-text-primary"
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                            </select>
                        </div>
                    </div>
                </div>
            );
            default: return null;
        }
    };

    return (
        <>
            <div className="flex-shrink-0 h-16 flex items-center px-4 md:px-6 border-b border-border bg-surface">
                <button onClick={onBack} className="p-2 -ml-2 text-text-secondary md:hidden">
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-bold text-text-primary md:ml-0 ml-2">{detailTitle}</h1>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
                <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
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

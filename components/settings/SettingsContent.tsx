
import React, { useState } from 'react';
import { SettingsCategory } from '../../screens/SettingsScreen';
import { useAppContext } from '../../context/AppContext';
import { Printer, Table, PaymentType } from '../../types';

// Cards
import StoreInfoCard from './cards/StoreInfoCard';
import PaymentsTaxesCard from './cards/PaymentsTaxesCard';
import AccountStaffCard from './cards/AccountStaffCard';
import TablesCard from './cards/TablesCard';
import AppearanceCard from './cards/AppearanceCard';
import PrintersCard from './cards/PrintersCard';
import SecurityCard from './cards/SecurityCard';
import DataManagementCard from './cards/DataManagementCard';
import NotificationsCard from './cards/NotificationsCard';

// Modals
import AddPrinterModal from '../modals/AddPrinterModal';
import TableFormModal from '../modals/TableFormModal';
import AddPaymentTypeModal from '../modals/AddPaymentTypeModal';

// Utils
import { testPrint } from '../../utils/printerHelper';

interface SettingsContentProps {
    activeCategory: SettingsCategory;
}

const SettingsContent: React.FC<SettingsContentProps> = ({ activeCategory }) => {
    const { 
        settings, updateSettings, theme, setTheme, user, signOut, 
        paymentTypes, updatePaymentType, removePaymentType, addPaymentType,
        tables, setTables, addTable, updateTable, removeTable,
        printers, addPrinter, removePrinter,
        exportData 
    } = useAppContext();

    // State for modals and actions
    const [isAddPrinterModalOpen, setIsAddPrinterModalOpen] = useState(false);
    const [testingPrinterId, setTestingPrinterId] = useState<string | null>(null);
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<Table | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // --- Printer Handlers ---
    const handleTestPrinter = async (printer: Printer) => {
        setTestingPrinterId(printer.id);
        const result = await testPrint(printer, settings);
        if (!result.success) {
            alert(`Test Print Failed: ${result.message}`);
        }
        setTestingPrinterId(null);
    };

    const handleSavePrinter = (printer: Printer) => {
        addPrinter(printer);
        setIsAddPrinterModalOpen(false);
    };

    // --- Table Handlers ---
    const handleOpenAddTable = () => {
        setEditingTable(null);
        setIsTableModalOpen(true);
    };
    
    const handleOpenEditTable = (table: Table) => {
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
        setEditingTable(null);
    };
    
    // --- Payment Type Handlers ---
    const handleSavePaymentType = (paymentType: Omit<PaymentType, 'id' | 'enabled' | 'type'>) => {
        addPaymentType(paymentType);
        setIsPaymentModalOpen(false);
    };

    const wrapCard = (children: React.ReactNode) => (
        <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            {children}
        </div>
    );
    
    return (
        <>
            {(() => {
                switch (activeCategory) {
                    case 'store_info':
                        return wrapCard(<StoreInfoCard settings={settings} updateSettings={updateSettings} />);
                    case 'payments_taxes':
                        return wrapCard(
                            <PaymentsTaxesCard 
                                settings={settings} 
                                updateSettings={updateSettings} 
                                paymentTypes={paymentTypes}
                                onAddPayment={() => setIsPaymentModalOpen(true)}
                                onTogglePayment={(pt) => updatePaymentType({...pt, enabled: !pt.enabled})}
                                onRemovePayment={removePaymentType}
                            />
                        );
                    case 'account':
                        return wrapCard(<AccountStaffCard user={user} signOut={signOut} />);
                    case 'tables':
                        return wrapCard(
                            <TablesCard 
                                tables={tables} 
                                setTables={setTables} 
                                onAdd={handleOpenAddTable} 
                                onEdit={handleOpenEditTable} 
                                onRemove={removeTable} 
                            />
                        );
                    case 'appearance':
                        return wrapCard(<AppearanceCard theme={theme} setTheme={setTheme} />);
                    case 'printers':
                        return wrapCard(
                            <PrintersCard 
                                printers={printers} 
                                onAdd={() => setIsAddPrinterModalOpen(true)} 
                                onTest={handleTestPrinter} 
                                onRemove={(p) => removePrinter(p.id)} 
                                testingPrinterId={testingPrinterId} 
                            />
                        );
                    case 'security':
                        return wrapCard(<SecurityCard settings={settings} updateSettings={updateSettings} />);
                    case 'data':
                        return wrapCard(<DataManagementCard onExport={exportData} onImport={() => {}} />);
                    case 'notifications':
                        return wrapCard(<NotificationsCard settings={settings} updateSettings={updateSettings} />);
                    case 'preferences':
                        return wrapCard(
                            <div className="p-6">
                                <h3 className="text-lg font-bold mb-4">Regional Settings</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Currency</span>
                                        <span className="text-sm font-bold text-primary">{settings.currencySymbol || '₹'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Language</span>
                                        <span className="text-sm text-text-secondary">English (United Kingdom)</span>
                                    </div>
                                </div>
                            </div>
                        );
                    default:
                        return null;
                }
            })()}

            <AddPrinterModal 
                isOpen={isAddPrinterModalOpen}
                onClose={() => setIsAddPrinterModalOpen(false)}
                onSave={handleSavePrinter}
            />
            
            <TableFormModal
                isOpen={isTableModalOpen}
                onClose={() => setIsTableModalOpen(false)}
                onSave={handleSaveTable}
                initialData={editingTable}
            />

            <AddPaymentTypeModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSave={handleSavePaymentType}
            />
        </>
    );
};

export default SettingsContent;

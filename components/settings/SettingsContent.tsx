
import React from 'react';
import { SettingsCategory } from '../../screens/SettingsScreen';
import { useAppContext } from '../../context/AppContext';

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

    const wrapCard = (children: React.ReactNode) => (
        <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            {children}
        </div>
    );

    switch (activeCategory) {
        case 'store_info':
            return wrapCard(<StoreInfoCard settings={settings} updateSettings={updateSettings} />);
        case 'payments_taxes':
            return wrapCard(
                <PaymentsTaxesCard 
                    settings={settings} 
                    updateSettings={updateSettings} 
                    paymentTypes={paymentTypes}
                    onAddPayment={() => {}} // Should be implemented or handled via modal
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
                    onAdd={() => {}} 
                    onEdit={() => {}} 
                    onRemove={removeTable} 
                />
            );
        case 'appearance':
            return wrapCard(<AppearanceCard theme={theme} setTheme={setTheme} />);
        case 'printers':
            return wrapCard(
                <PrintersCard 
                    printers={printers} 
                    onAdd={() => {}} 
                    onTest={() => {}} 
                    onRemove={(p) => removePrinter(p.id)} 
                    testingPrinterId={null} 
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
};

export default SettingsContent;

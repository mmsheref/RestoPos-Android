
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
    MenuIcon, 
    ArrowLeftIcon, 
    StoreIcon, 
    DollarSignIcon, 
    UserIcon, 
    TableIcon, 
    PaintBrushIcon, 
    PrintIcon, 
    LockIcon, 
    DatabaseIcon, 
    BellIcon, 
    SettingsIcon 
} from '../constants';
import SettingsNav from '../components/settings/SettingsNav';
import SettingsContent from '../components/settings/SettingsContent';

export type SettingsCategory = 'store_info' | 'payments_taxes' | 'account' | 'tables' | 'appearance' | 'printers' | 'security' | 'data' | 'notifications' | 'preferences';

const SettingsScreen: React.FC = () => {
    const { openDrawer } = useAppContext();
    const [activeCategory, setActiveCategory] = useState<SettingsCategory>('store_info');
    const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

    const categoryMap: Record<SettingsCategory, { label: string, Icon: React.FC<any> }> = {
        store_info: { label: 'Store Information', Icon: StoreIcon },
        payments_taxes: { label: 'Payments & Taxes', Icon: DollarSignIcon },
        account: { label: 'Account & Staff', Icon: UserIcon },
        tables: { label: 'Tables & Orders', Icon: TableIcon },
        appearance: { label: 'Appearance', Icon: PaintBrushIcon },
        printers: { label: 'Printers', Icon: PrintIcon },
        security: { label: 'Security & Reports', Icon: LockIcon },
        data: { label: 'Data Management', Icon: DatabaseIcon },
        notifications: { label: 'Notifications', Icon: BellIcon },
        preferences: { label: 'App Preferences', Icon: SettingsIcon }
    };

    const handleSelectCategory = (category: SettingsCategory) => {
        setActiveCategory(category);
        setIsDetailViewOpen(true);
    };

    return (
        <div className="flex h-full bg-background overflow-hidden">
            {/* Left Nav Panel */}
            <div className={`w-full md:w-[320px] lg:w-[380px] flex-col border-r border-border bg-surface-muted/50 ${isDetailViewOpen ? 'hidden md:flex' : 'flex'}`}>
                <header className="h-16 flex items-center px-6 bg-surface border-b border-border flex-shrink-0 pt-safe-top h-auto min-h-[64px]">
                    <button onClick={openDrawer} className="p-2 -ml-3 text-text-secondary hover:text-primary transition-colors">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <h1 className="ml-4 text-xl font-extrabold text-text-primary tracking-tight">Settings</h1>
                </header>
                
                <div className="flex-1 overflow-y-auto pb-20">
                    <SettingsNav
                        activeCategory={activeCategory}
                        onSelectCategory={handleSelectCategory}
                    />
                </div>
            </div>

            {/* Right Content Panel */}
            <div className={`flex-1 flex-col bg-background transition-all duration-300 ${isDetailViewOpen ? 'flex' : 'hidden md:flex'}`}>
                <header className="h-16 flex items-center px-4 md:px-8 bg-surface border-b border-border flex-shrink-0 pt-safe-top h-auto min-h-[64px]">
                    <button 
                        onClick={() => setIsDetailViewOpen(false)} 
                        className="p-2 -ml-2 text-text-secondary hover:text-primary md:hidden"
                    >
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <div className="ml-2 md:ml-0 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary hidden md:block">
                            {React.createElement(categoryMap[activeCategory].Icon, { className: "h-5 w-5" })}
                        </div>
                        <h2 className="text-lg font-bold text-text-primary">
                            {categoryMap[activeCategory].label}
                        </h2>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-3xl mx-auto animate-fadeIn">
                        <SettingsContent activeCategory={activeCategory} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;

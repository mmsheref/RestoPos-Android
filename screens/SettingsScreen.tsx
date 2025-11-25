import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { MenuIcon } from '../constants';
import SettingsNav from '../components/settings/SettingsNav';
import SettingsContent from '../components/settings/SettingsContent';

export type SettingsCategory = 'appearance' | 'financial' | 'payment_types' | 'tables' | 'printers' | 'store_info' | 'data';

const SettingsScreen: React.FC = () => {
    const { openDrawer } = useAppContext();
    const [activeCategory, setActiveCategory] = useState<SettingsCategory>('appearance');
    
    // State to manage view on mobile (list vs detail)
    const [isDetailView, setIsDetailView] = useState(false);

    const handleSelectCategory = (category: SettingsCategory) => {
        setActiveCategory(category);
        setIsDetailView(true); // Switch to detail view on mobile
    };
    
    // Determine title for mobile header
    const categoryMap: Record<SettingsCategory, string> = {
        appearance: 'Appearance',
        financial: 'Financial',
        payment_types: 'Payment Types',
        tables: 'Tables & Quick Select',
        printers: 'Printers',
        store_info: 'Store Information',
        data: 'Data Management',
    };
    const detailTitle = categoryMap[activeCategory];

    return (
        <div className="flex h-full bg-background overflow-hidden">
            {/* Left Panel (Navigation) */}
            <div className={`w-full md:w-1/3 lg:w-1/4 flex-col border-r border-border ${isDetailView ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex-shrink-0 h-16 flex items-center px-4 border-b border-border bg-surface">
                    <button onClick={openDrawer} className="p-2 -ml-2 text-text-secondary hover:text-text-primary">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <div className="flex items-center gap-2 ml-4">
                        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <SettingsNav
                        activeCategory={activeCategory}
                        onSelectCategory={handleSelectCategory}
                    />
                </div>
            </div>

            {/* Right Panel (Content) */}
            <div className={`w-full md:w-2/3 lg:w-3/4 flex-col ${isDetailView ? 'flex' : 'hidden md:flex'}`}>
                <SettingsContent
                    activeCategory={activeCategory}
                    onBack={() => setIsDetailView(false)}
                    detailTitle={detailTitle}
                />
            </div>
        </div>
    );
};

export default SettingsScreen;
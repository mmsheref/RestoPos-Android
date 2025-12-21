
import React from 'react';
import { SettingsCategory } from '../../screens/SettingsScreen';
import { 
    StoreIcon, DollarSignIcon, UserIcon, TableIcon, 
    PaintBrushIcon, PrintIcon, LockIcon, DatabaseIcon, 
    BellIcon, SettingsIcon 
} from '../../constants';

interface SettingsNavProps {
    activeCategory: SettingsCategory;
    onSelectCategory: (category: SettingsCategory) => void;
}

const groups = [
    {
        title: 'Organization',
        items: [
            { id: 'store_info', label: 'Store Profile', Icon: StoreIcon },
            { id: 'account', label: 'Account & Staff', Icon: UserIcon },
            { id: 'tables', label: 'Tables & Layout', Icon: TableIcon },
        ]
    },
    {
        title: 'Finances',
        items: [
            { id: 'payments_taxes', label: 'Payments & Taxes', Icon: DollarSignIcon },
            { id: 'security', label: 'Security & PIN', Icon: LockIcon },
        ]
    },
    {
        title: 'System',
        items: [
            { id: 'printers', label: 'Hardware Printers', Icon: PrintIcon },
            { id: 'notifications', label: 'Alerts & Notifications', Icon: BellIcon },
            { id: 'appearance', label: 'Look & Feel', Icon: PaintBrushIcon },
            { id: 'data', label: 'Backup & Recovery', Icon: DatabaseIcon },
            { id: 'preferences', label: 'App Settings', Icon: SettingsIcon },
        ]
    }
];

const SettingsNav: React.FC<SettingsNavProps> = ({ activeCategory, onSelectCategory }) => {
    return (
        <div className="p-4 space-y-8">
            {groups.map((group) => (
                <div key={group.title}>
                    <h3 className="px-4 mb-3 text-[11px] font-black uppercase tracking-[0.15em] text-text-muted/70">
                        {group.title}
                    </h3>
                    <div className="space-y-1">
                        {group.items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onSelectCategory(item.id as SettingsCategory)}
                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                                    activeCategory === item.id
                                        ? 'bg-primary text-primary-content shadow-lg shadow-primary/20'
                                        : 'hover:bg-surface text-text-secondary hover:text-primary'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.Icon className={`h-5 w-5 ${activeCategory === item.id ? 'text-primary-content' : 'text-text-muted group-hover:text-primary'}`} />
                                    <span className="font-semibold text-sm">{item.label}</span>
                                </div>
                                {activeCategory !== item.id && (
                                    <span className="text-text-muted/40 text-xs">→</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SettingsNav;

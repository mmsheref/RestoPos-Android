
import React from 'react';
import { SettingsCategory } from '../../screens/SettingsScreen';
import { 
    PaintBrushIcon, 
    DollarSignIcon, 
    PrintIcon,
    StoreIcon,
    DatabaseIcon,
    TableIcon,
    LockIcon,
    UserIcon,
    MailIcon,
    SettingsIcon
} from '../../constants';

interface SettingsNavProps {
    activeCategory: SettingsCategory;
    onSelectCategory: (category: SettingsCategory) => void;
}

const navGroups: { title: string; items: { id: SettingsCategory; label: string; Icon: React.FC<{className?: string}> }[] }[] = [
    {
        title: "General",
        items: [
            { id: 'store_info', label: 'Store Information', Icon: StoreIcon },
            { id: 'account', label: 'Account & Staff', Icon: UserIcon },
            { id: 'preferences', label: 'Preferences', Icon: SettingsIcon },
        ]
    },
    {
        title: "Commerce",
        items: [
            { id: 'payments_taxes', label: 'Payments & Taxes', Icon: DollarSignIcon },
            { id: 'tables', label: 'Tables & Orders', Icon: TableIcon },
        ]
    },
    {
        title: "System",
        items: [
            { id: 'printers', label: 'Printers', Icon: PrintIcon },
            { id: 'notifications', label: 'Notifications', Icon: MailIcon },
            { id: 'security', label: 'Security', Icon: LockIcon },
            { id: 'data', label: 'Data Management', Icon: DatabaseIcon },
            { id: 'appearance', label: 'Appearance', Icon: PaintBrushIcon },
        ]
    }
];

const SettingsNav: React.FC<SettingsNavProps> = ({ activeCategory, onSelectCategory }) => {
    return (
        <nav className="p-3 pb-20">
            {navGroups.map((group, idx) => (
                <div key={idx} className="mb-6">
                    <h3 className="px-3 mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
                        {group.title}
                    </h3>
                    <ul className="space-y-1">
                        {group.items.map(({ id, label, Icon }) => (
                            <li key={id}>
                                <button
                                    onClick={() => onSelectCategory(id)}
                                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                                        activeCategory === id
                                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                            : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                                    }`}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    <span>{label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
};

export default SettingsNav;

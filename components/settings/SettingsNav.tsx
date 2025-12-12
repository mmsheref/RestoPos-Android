
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
    InfoIcon
} from '../../constants';

interface SettingsNavProps {
    activeCategory: SettingsCategory;
    onSelectCategory: (category: SettingsCategory) => void;
}

const navItems: { id: SettingsCategory; label: string; Icon: React.FC<{className?: string}> }[] = [
    { id: 'business', label: 'Business Profile', Icon: StoreIcon },
    { id: 'payment', label: 'Payment & Taxes', Icon: DollarSignIcon },
    { id: 'staff', label: 'Staff & Users', Icon: UserIcon },
    { id: 'notifications', label: 'Notifications', Icon: MailIcon },
    { id: 'tables', label: 'Tables & Layout', Icon: TableIcon },
    { id: 'printers', label: 'Printers', Icon: PrintIcon },
    { id: 'app_preferences', label: 'App Preferences', Icon: PaintBrushIcon },
    { id: 'security', label: 'Security', Icon: LockIcon },
    { id: 'data', label: 'Data & Backup', Icon: DatabaseIcon },
    { id: 'about', label: 'About', Icon: InfoIcon },
];

const SettingsNav: React.FC<SettingsNavProps> = ({ activeCategory, onSelectCategory }) => {
    return (
        <nav className="p-2">
            <ul>
                {navItems.map(({ id, label, Icon }) => (
                    <li key={id}>
                        <button
                            onClick={() => onSelectCategory(id)}
                            className={`w-full text-left flex items-center gap-4 px-4 py-3 my-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                                activeCategory === id
                                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                    : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary'
                            }`}
                        >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <span>{label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default SettingsNav;

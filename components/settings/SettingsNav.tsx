import React from 'react';
import { SettingsCategory } from '../../screens/SettingsScreen';
import { 
    PaintBrushIcon, 
    DollarSignIcon, 
    CreditCardIcon,
    PrintIcon,
    StoreIcon,
    DatabaseIcon,
    InfoIcon,
    TableIcon
} from '../../constants';

interface SettingsNavProps {
    activeCategory: SettingsCategory;
    onSelectCategory: (category: SettingsCategory) => void;
}

const navItems: { id: SettingsCategory; label: string; Icon: React.FC<{className?: string}> }[] = [
    { id: 'appearance', label: 'Appearance', Icon: PaintBrushIcon },
    { id: 'financial', label: 'Financial', Icon: DollarSignIcon },
    { id: 'payment_types', label: 'Payment Types', Icon: CreditCardIcon },
    { id: 'tables', label: 'Tables', Icon: TableIcon },
    { id: 'printers', label: 'Printers', Icon: PrintIcon },
    { id: 'store_info', label: 'Store Information', Icon: StoreIcon },
    { id: 'data', label: 'Data Management', Icon: DatabaseIcon },
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
                            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 my-1 rounded-md text-sm font-medium transition-colors duration-150 ${
                                activeCategory === id
                                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
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

import React from 'react';
import { MenuIcon } from '../constants';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  return (
    <header className="bg-surface shadow-sm w-full z-20 flex-shrink-0">
      <div className="h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-1">
            <button onClick={onMenuClick} className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-muted transition-colors">
                <MenuIcon className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-text-primary ml-2">{title}</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;

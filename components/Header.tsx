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
        <button onClick={onMenuClick} className="p-2 text-text-secondary hover:text-text-primary">
          <MenuIcon className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
        <div className="w-10"></div>
      </div>
    </header>
  );
};

export default Header;
import React from 'react';
import { MenuIcon } from '../constants';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  return (
    <header className="bg-white shadow-md w-full z-20 flex-shrink-0">
      <div className="h-16 flex items-center justify-between px-4">
        <button onClick={onMenuClick} className="p-2 text-gray-600 hover:text-gray-900">
          <MenuIcon className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        <div className="w-10"></div>
      </div>
    </header>
  );
};

export default Header;
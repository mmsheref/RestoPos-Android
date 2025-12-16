
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useStatusContext } from '../context/StatusContext';
import { MenuIcon, InfoIcon, UserIcon, ArrowLeftIcon } from '../constants';
import { APP_VERSION } from '../constants';
import { Capacitor } from '@capacitor/core';

type AboutSection = 'app_info' | 'developer';

const AboutScreen: React.FC = () => {
  const { openDrawer } = useAppContext();
  const { isOnline, pendingSyncCount } = useStatusContext();
  const [activeSection, setActiveSection] = useState<AboutSection>('app_info');
  const [isDetailView, setIsDetailView] = useState(false);

  const sections = [
    { id: 'app_info', label: 'App Information', icon: InfoIcon },
    { id: 'developer', label: 'Developer', icon: UserIcon },
  ];

  const handleSelectSection = (id: string) => {
    setActiveSection(id as AboutSection);
    setIsDetailView(true);
  };

  const getPlatformLabel = () => {
    const platform = Capacitor.getPlatform();
    switch (platform) {
        case 'android': return 'Android App';
        case 'ios': return 'iOS App';
        case 'web': return 'Web (Browser)';
        default: return platform; // e.g. 'electron'
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'app_info':
        return (
           <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
                <h2 className="text-xl font-semibold mb-4 text-text-primary">App Information</h2>
                <div className="space-y-4 text-sm text-text-secondary">
                    <div className="flex justify-between border-b border-border pb-2">
                        <span className="font-medium text-text-primary">App Version</span>
                        <span>{APP_VERSION}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                        <span className="font-medium text-text-primary">Environment</span>
                        <span>{getPlatformLabel()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="font-medium text-text-primary">Data Status</span>
                        <span className="flex items-center gap-2">
                            {!isOnline ? (
                                <>
                                    <span className="relative flex h-2 w-2">
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">Offline</span>
                                </>
                            ) : pendingSyncCount > 0 ? (
                                <>
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    <span className="text-amber-600 dark:text-amber-400 font-medium">{pendingSyncCount} unsynced</span>
                                </>
                            ) : (
                                <>
                                    <span className="relative flex h-2 w-2">
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span className="text-green-600 dark:text-green-400 font-medium">Synced</span>
                                </>
                            )}
                        </span>
                    </div>
                </div>
                <div className="mt-8 text-center">
                     <p className="text-xs text-text-muted">&copy; {new Date().getFullYear()} Restaurant POS. All Rights Reserved.</p>
                </div>
           </div>
        );
      case 'developer':
        return (
            <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
                <h2 className="text-xl font-semibold mb-6 text-text-primary">Developer</h2>
                <div className="flex flex-col items-center justify-center py-8">
                     <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <UserIcon className="h-10 w-10 text-primary" />
                     </div>
                     <h3 className="text-2xl font-bold text-text-primary">Muhammed sheref</h3>
                     <p className="text-text-secondary mt-2">Senior Frontend Engineer</p>
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">
        {/* Left Panel (Navigation) */}
        <div className={`w-full md:w-1/3 lg:w-1/4 flex-col border-r border-border ${isDetailView ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex-shrink-0 bg-surface border-b border-border">
                <div className="h-16 flex items-center px-4">
                    <button onClick={openDrawer} className="p-2 -ml-2 text-text-secondary hover:text-text-primary">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-semibold text-text-primary ml-4">About</h1>
                </div>
            </div>
             <nav className="p-2 flex-1 overflow-y-auto">
                <ul>
                    {sections.map((section) => (
                        <li key={section.id}>
                            <button
                                onClick={() => handleSelectSection(section.id)}
                                className={`w-full text-left flex items-center gap-3 px-3 py-3 my-1 rounded-md text-sm font-medium transition-colors duration-150 ${
                                    activeSection === section.id
                                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                        : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                                }`}
                            >
                                <section.icon className="h-5 w-5 flex-shrink-0" />
                                <span>{section.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>

        {/* Right Panel (Content) */}
        <div className={`w-full md:w-2/3 lg:w-3/4 flex-col ${isDetailView ? 'flex' : 'hidden md:flex'}`}>
             <div className="flex-shrink-0 bg-surface border-b border-border">
                <div className="h-16 flex items-center px-4 md:px-6">
                    <button onClick={() => setIsDetailView(false)} className="p-2 -ml-2 text-text-secondary md:hidden">
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-semibold text-text-primary md:ml-0 ml-2">
                        {sections.find(s => s.id === activeSection)?.label}
                    </h1>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
                <div className="max-w-2xl mx-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AboutScreen;

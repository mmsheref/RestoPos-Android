
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { StatusContextType } from '../types';

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export const StatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pendingSyncCount, setPendingSyncCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <StatusContext.Provider value={{ pendingSyncCount, setPendingSyncCount, isOnline }}>
            {children}
        </StatusContext.Provider>
    );
};

export const useStatusContext = (): StatusContextType => {
    const context = useContext(StatusContext);
    if (!context) throw new Error('useStatusContext must be used within a StatusProvider');
    return context;
};

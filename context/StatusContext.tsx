
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { StatusContextType } from '../types';

interface ExtendedStatusContextType extends StatusContextType {
    lastSyncTime: Date | null;
    setLastSyncTime: (date: Date) => void;
}

const StatusContext = createContext<ExtendedStatusContextType | undefined>(undefined);

export const StatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pendingSyncCount, setPendingSyncCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
        const saved = localStorage.getItem('pos_last_sync');
        return saved ? new Date(saved) : null;
    });

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

    // Update localStorage when lastSyncTime changes
    useEffect(() => {
        if (lastSyncTime) {
            localStorage.setItem('pos_last_sync', lastSyncTime.toISOString());
        }
    }, [lastSyncTime]);

    // Automatically update lastSyncTime when pending count drops to 0 while online
    useEffect(() => {
        if (isOnline && pendingSyncCount === 0) {
            setLastSyncTime(new Date());
        }
    }, [isOnline, pendingSyncCount]);

    return (
        <StatusContext.Provider value={{ 
            pendingSyncCount, 
            setPendingSyncCount, 
            isOnline, 
            lastSyncTime, 
            setLastSyncTime 
        }}>
            {children}
        </StatusContext.Provider>
    );
};

export const useStatusContext = (): ExtendedStatusContextType => {
    const context = useContext(StatusContext);
    if (!context) throw new Error('useStatusContext must be used within a StatusProvider');
    return context;
};

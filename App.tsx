
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { StatusProvider } from './context/StatusContext';
import Layout from './components/Layout';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { StoreIcon } from './constants';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

const AppRoutes: React.FC = () => {
    const { user, isLoading, showOnboarding, theme } = useAppContext();

    // --- Status Bar Configuration ---
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            const configStatusBar = async () => {
                try {
                    // On Android, disabling overlay ensures the webview sits BELOW the status bar,
                    // preventing content from being hidden behind it.
                    if (Capacitor.getPlatform() === 'android') {
                        await StatusBar.setOverlaysWebView({ overlay: false });
                    }

                    // Sync Status Bar style with App Theme
                    const style = theme === 'dark' ? Style.Dark : Style.Light;
                    await StatusBar.setStyle({ style });

                    // Set Background Color for Android (Matches standard app background)
                    if (Capacitor.getPlatform() === 'android') {
                        // Dark: neutral-800 (#262626) | Light: white (#FFFFFF)
                        const color = theme === 'dark' ? '#262626' : '#FFFFFF';
                        await StatusBar.setBackgroundColor({ color });
                    }
                } catch (e) {
                    console.warn('StatusBar config failed', e);
                }
            };
            configStatusBar();
        }
    }, [theme]);

    if (showOnboarding) {
        return <OnboardingScreen />;
    }

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-surface-muted">
               <div className="flex flex-col items-center">
                   <div className="relative mb-6">
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                        <div className="relative bg-surface p-4 rounded-full shadow-lg">
                             <StoreIcon className="h-10 w-10 text-primary" />
                        </div>
                   </div>
                   <h2 className="text-lg font-bold text-text-primary">Restaurant POS</h2>
                   <p className="text-sm text-text-secondary mt-1">Loading your workspace...</p>
               </div>
            </div>
        );
    }

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/signup" element={<SignupScreen />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    // With the new persistent layout, we render the Layout component for all authenticated routes.
    // The Layout component itself will handle showing/hiding screens based on the path.
    return (
        <Routes>
           <Route path="/*" element={<Layout />} />
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <HashRouter>
      <StatusProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </StatusProvider>
    </HashRouter>
  );
};

export default App;


import React, { useEffect, useState, ReactNode, Component, ErrorInfo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { StoreIcon } from './constants';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * FAIL-SAFE ERROR BOUNDARY
 * If a component crashes due to corrupt data, this prevents the whole app from going white.
 */
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// FIX: The ErrorBoundary class component was updated to use class property initializers and explicit type annotations for state and props. This resolves the TypeScript errors where 'state' and 'props' properties were not being correctly inherited or recognized by the compiler on the ErrorBoundary instance in some environments.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-6 text-center">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Something went wrong</h2>
            <p className="text-text-secondary mb-8">The app encountered an unexpected error. Don't worry, your data is safe.</p>
            <button 
                onClick={() => window.location.reload()} 
                className="w-full bg-primary text-primary-content font-bold py-4 rounded-xl shadow-lg"
            >
                Restart Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppRoutes: React.FC = () => {
    const { user, isLoading, showOnboarding, theme } = useAppContext();

    // --- Native Status Bar Sync ---
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            const configStatusBar = async () => {
                try {
                    if (Capacitor.getPlatform() === 'android') {
                        await StatusBar.setOverlaysWebView({ overlay: false });
                    }
                    const style = theme === 'dark' ? Style.Dark : Style.Light;
                    await StatusBar.setStyle({ style });
                    if (Capacitor.getPlatform() === 'android') {
                        const color = theme === 'dark' ? '#262626' : '#FFFFFF';
                        await StatusBar.setBackgroundColor({ color });
                    }
                } catch (e) {
                    // Fail silently for non-critical native features
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

    return (
        <Routes>
           <Route path="/*" element={<Layout />} />
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <ErrorBoundary>
        <HashRouter>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </HashRouter>
    </ErrorBoundary>
  );
};

export default App;

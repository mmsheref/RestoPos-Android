
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import SalesScreen from './screens/SalesScreen';
import ReceiptsScreen from './screens/ReceiptsScreen';
import ItemsScreen from './screens/ItemsScreen';
import SettingsScreen from './screens/SettingsScreen';
import AdvancedScreen from './screens/AdvancedScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import OnboardingScreen from './screens/OnboardingScreen';

const AppRoutes: React.FC = () => {
    const { user, isLoading, showOnboarding } = useAppContext();

    if (showOnboarding) {
        return <OnboardingScreen />;
    }

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
               <div className="text-center">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                   <p className="text-text-secondary">Authenticating...</p>
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
        <Layout>
            <Routes>
                <Route index element={<Navigate to="/sales" replace />} />
                <Route path="/" element={<Navigate to="/sales" replace />} />
                <Route path="/sales" element={<SalesScreen />} />
                <Route path="/receipts" element={<ReceiptsScreen />} />
                <Route path="/items" element={<ItemsScreen />} />
                <Route path="/settings" element={<SettingsScreen />} />
                <Route path="/advanced" element={<AdvancedScreen />} />
                <Route path="*" element={<Navigate to="/sales" replace />} />
            </Routes>
        </Layout>
    );
};


const App: React.FC = () => {
  return (
    <HashRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </HashRouter>
  );
};

export default App;
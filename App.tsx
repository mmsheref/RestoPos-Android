
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import SalesScreen from './screens/SalesScreen';
import ReceiptsScreen from './screens/ReceiptsScreen';
import ItemsScreen from './screens/ItemsScreen';
import SettingsScreen from './screens/SettingsScreen';
import AdvancedScreen from './screens/AdvancedScreen';

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/sales" element={<SalesScreen />} />
            <Route path="/receipts" element={<ReceiptsScreen />} />
            <Route path="/items" element={<ItemsScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/advanced" element={<AdvancedScreen />} />
            <Route path="*" element={<Navigate to="/sales" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
};

export default App;

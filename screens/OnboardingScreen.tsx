import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SalesIcon, ItemsIcon, OfflineIcon } from '../constants';

const OnboardingScreen: React.FC = () => {
  const { completeOnboarding } = useAppContext();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      <div className="w-full max-w-lg">
        <h1 className="text-4xl font-bold text-primary mb-4">Welcome to Your POS</h1>
        <p className="text-lg text-text-secondary mb-12">
          A fast, reliable, and easy-to-use Point of Sale system designed for your business.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 text-left">
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <SalesIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-text-primary mb-2">Fast Sales</h3>
            <p className="text-sm text-text-muted">Instantly add items to orders from a customizable grid.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <ItemsIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-text-primary mb-2">Easy Management</h3>
            <p className="text-sm text-text-muted">Manage your items, receipts, and settings all in one place.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <OfflineIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-text-primary mb-2">Works Offline</h3>
            <p className="text-sm text-text-muted">Continue working without an internet connection. Data syncs automatically.</p>
          </div>
        </div>

        <button
          onClick={completeOnboarding}
          className="w-full max-w-xs px-8 py-4 font-bold text-lg text-primary-content bg-primary rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default OnboardingScreen;

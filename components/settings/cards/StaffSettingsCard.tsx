
import React from 'react';
import { User } from 'firebase/auth';

interface StaffSettingsCardProps {
  user: User | null;
  signOut: () => void;
}

const StaffSettingsCard: React.FC<StaffSettingsCardProps> = ({ user, signOut }) => {
  return (
    <div className="space-y-6">
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-text-primary">Current User</h2>
            <button 
              onClick={signOut}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
            >
              Sign Out
            </button>
        </div>
        
        {user ? (
          <div className="flex items-center gap-4">
             <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
               {user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
             </div>
             <div>
               <h3 className="text-lg font-medium text-text-primary">{user.displayName || 'Staff Member'}</h3>
               <p className="text-text-secondary">{user.email}</p>
               <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                 Active Session
               </span>
             </div>
          </div>
        ) : (
          <p className="text-text-secondary">Not logged in.</p>
        )}
      </div>

      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border opacity-60">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-text-primary">Staff Management</h2>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Coming Soon</span>
        </div>
        <p className="text-text-secondary text-sm mb-4">
          Multi-user support and role-based access control (RBAC) will be available in a future update.
          You will be able to:
        </p>
        <ul className="list-disc list-inside text-sm text-text-secondary space-y-1 ml-2">
          <li>Create staff accounts with PIN login</li>
          <li>Assign roles (Manager, Cashier, Server)</li>
          <li>Track sales by staff member</li>
          <li>Restrict access to settings and reports</li>
        </ul>
      </div>
    </div>
  );
};

export default StaffSettingsCard;

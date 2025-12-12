
import React from 'react';
import { User } from 'firebase/auth';
import { UserIcon, SignOutIcon } from '../../../constants';

interface AccountStaffCardProps {
    user: User | null;
    signOut: () => void;
}

const AccountStaffCard: React.FC<AccountStaffCardProps> = ({ user, signOut }) => {
  return (
    <div className="space-y-6">
        {/* Current User Profile */}
        <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
            <h2 className="text-lg font-bold text-text-primary mb-4">Current Session</h2>
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <UserIcon className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-secondary uppercase tracking-wider font-bold">Logged in as</p>
                    <p className="text-lg font-bold text-text-primary truncate">{user?.email}</p>
                    <p className="text-xs text-text-muted mt-0.5">Administrator • {user?.uid.slice(0,8)}</p>
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex justify-end">
                <button 
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium text-sm"
                >
                    <SignOutIcon className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </div>

        {/* Staff Management (Coming Soon) */}
        <div className="bg-surface p-6 rounded-lg shadow-sm border border-border relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 opacity-50">
                <h2 className="text-lg font-bold text-text-primary">Staff Management</h2>
                <button disabled className="bg-surface-muted text-text-muted px-3 py-1 rounded text-xs font-bold">Add Staff</button>
            </div>
            
            <div className="space-y-3 opacity-40 blur-[1px] pointer-events-none select-none">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div>
                            <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                            <div className="h-3 w-16 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div>
                            <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                            <div className="h-3 w-12 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-surface/60 backdrop-blur-[1px]">
                <div className="bg-background border border-border shadow-lg rounded-xl px-4 py-2 flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wide">Coming Soon</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AccountStaffCard;

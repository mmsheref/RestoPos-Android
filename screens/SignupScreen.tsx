
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp, getFirebaseErrorMessage } from '../firebase';

const SignupScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await signUp(email, password);
            // The onAuthStateChanged listener in AppContext will handle navigation
        } catch (err) {
            setError(getFirebaseErrorMessage(err));
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Create an Account</h1>
                <form onSubmit={handleSignup} className="space-y-6">
                    <div>
                        <label htmlFor="email"  className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="password"  className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="confirm-password"  className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                        <input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
                    <div>
                        <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                           {isLoading ? 'Creating account...' : 'Sign Up'}
                        </button>
                    </div>
                </form>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default SignupScreen;

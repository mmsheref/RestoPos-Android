
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, getFirebaseErrorMessage } from '../firebase';

const LoginScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await signIn(email, password);
            // The onAuthStateChanged listener in AppContext will handle navigation
        } catch (err) {
            setError(getFirebaseErrorMessage(err));
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-text-primary">Login to POS</h1>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-text-secondary">Email</label>
                        <input 
                            id="email" 
                            type="email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background" 
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="text-sm font-medium text-text-secondary">Password</label>
                        <input 
                            id="password" 
                            type="password" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background" 
                        />
                    </div>
                    {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
                    <div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full px-4 py-2 font-medium text-primary-content bg-primary rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70"
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                </form>
                <p className="text-sm text-center text-text-secondary">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginScreen;
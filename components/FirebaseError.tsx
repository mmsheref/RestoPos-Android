import React from 'react';

interface FirebaseErrorProps {
  error: {
    title: string;
    message: string;
    instructions: string[];
    projectId: string;
  };
}

const FirebaseError: React.FC<FirebaseErrorProps> = ({ error }) => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 border-t-4 border-red-500">
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{error.title}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{error.message}</p>
        </div>

        <div className="mt-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">How to Fix:</h3>
            <ol className="mt-2 list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {error.instructions.map((step, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: step }}></li>
                ))}
            </ol>
        </div>
        
        <div className="mt-6 text-center">
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
                Refresh Page
            </button>
        </div>
      </div>
    </div>
  );
};

export default FirebaseError;

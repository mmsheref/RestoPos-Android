
import React, { useState } from 'react';
import { LockIcon, CloseIcon } from '../../constants';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface PinVerifyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
    message?: string;
    adminPin?: string;
}

const PinVerifyModal: React.FC<PinVerifyModalProps> = ({ isOpen, onClose, onSuccess, title = "Verify Identity", message, adminPin }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (!adminPin) {
            await Haptics.impact({ style: ImpactStyle.Medium });
            onSuccess();
            onClose();
            return;
        }
        
        if (pin === adminPin) {
            await Haptics.impact({ style: ImpactStyle.Medium });
            onSuccess();
            onClose();
            setPin('');
            setError('');
        } else {
            await Haptics.notification({ type: ImpactStyle.Heavy });
            setError('Incorrect PIN');
            setPin('');
        }
    };

    const handlePinChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val.length > pin.length) {
            await Haptics.impact({ style: ImpactStyle.Light });
        }
        setPin(val);
    };

    const handleClose = async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]" onClick={handleClose}>
            <div className="bg-surface rounded-lg p-6 shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                         <div className="bg-primary/10 p-2 rounded-full">
                            <LockIcon className="h-5 w-5 text-primary" />
                         </div>
                         <h2 className="text-xl font-bold text-text-primary">{title}</h2>
                    </div>
                    <button onClick={handleClose} className="text-text-muted hover:text-text-primary">
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-6">
                    {message && <p className="text-sm text-text-secondary mb-3">{message}</p>}
                    
                    {!adminPin ? (
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                             <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                                 Warning: No Admin PIN is set. Anyone can perform this action.
                             </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                             <label className="block text-sm font-medium text-text-secondary mb-1">Enter Admin PIN</label>
                             <input 
                                type="password" 
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={pin}
                                onChange={handlePinChange}
                                className="w-full text-center text-xl tracking-widest p-2 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary mb-2 font-mono"
                                placeholder="• • • •"
                                autoFocus
                            />
                            {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
                        </form>
                    )}
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handleClose} 
                        className="flex-1 py-2 bg-surface-muted text-text-secondary rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => handleSubmit()} 
                        className="flex-1 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary-hover font-bold shadow-sm"
                    >
                        {adminPin ? 'Verify' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PinVerifyModal;

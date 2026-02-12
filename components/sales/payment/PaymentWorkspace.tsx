
import React from 'react';
import { PaymentType } from '../../../types';
import { PaymentMethodIcon, ArrowLeftIcon, SplitIcon, UserIcon, TrashIcon } from '../../../constants';

interface PaymentWorkspaceProps {
    onBack: () => void;
    total: number;
    otherPaymentTypes: PaymentType[];
    cashPaymentType: PaymentType | undefined;
    inputRef: React.RefObject<HTMLInputElement>;
    cashTendered: string;
    handleFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
    handleCashChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleProcessCashPayment: () => void;
    handleProcessOtherPayment: (methodName: string) => void;
    uniqueQuickCash: number[];
    onProcessPayment: (method: string, tendered: number) => void;
    onSplitClick: () => void;
}

/**
 * The main interactive area for processing payments.
 * Allows selecting Cash, Custom Methods (UPI, Card), or switching to Split Payment.
 */
const PaymentWorkspace: React.FC<PaymentWorkspaceProps> = ({
    onBack, total, otherPaymentTypes, cashPaymentType,
    inputRef, cashTendered, handleFocus, handleCashChange, handleProcessCashPayment, handleProcessOtherPayment,
    uniqueQuickCash, onProcessPayment, onSplitClick
}) => {
    // Helper for numpad
    const appendNumber = (num: string) => {
        const setVal = (val: string) => {
            if (inputRef.current) {
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                nativeSetter?.call(inputRef.current, val);
                inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };

        if (cashTendered === '0' && num !== '.') {
            setVal(num);
        } else if (num === '.' && cashTendered.includes('.')) {
            return;
        } else if (num === '.' && !cashTendered) {
            setVal('0.');
        } else {
            // Check decimal limit (2 places)
            const parts = cashTendered.split('.');
            if (parts.length > 1 && parts[1].length >= 2) return;
            setVal(cashTendered + num);
        }
    };

    const backspace = () => {
        if (inputRef.current) {
            const newVal = cashTendered.slice(0, -1);
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            nativeSetter?.call(inputRef.current, newVal);
            inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      {/* Mobile Header */}
      <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 bg-surface border-b border-border md:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-semibold">
          <ArrowLeftIcon className="h-5 w-5" />
          Back
        </button>
        <span className="font-bold text-lg">Checkout</span>
        <button 
            onClick={onSplitClick} 
            className="flex items-center gap-1 bg-surface-muted text-text-primary px-3 py-1.5 rounded-lg border border-border hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-bold uppercase tracking-wide active:opacity-70"
        >
            <SplitIcon className="h-4 w-4" /> Split
        </button>
      </header>
      
      {/* Desktop Header */}
      <header className="hidden md:flex flex-shrink-0 h-16 items-center justify-between px-6 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-semibold px-3 py-1.5 rounded-lg hover:bg-surface-muted transition-colors active:opacity-80">
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Sales
            </button>
            <button 
                onClick={onSplitClick} 
                className="flex items-center gap-2 bg-white dark:bg-gray-800 text-text-primary px-4 py-2 rounded-lg border border-border hover:border-primary/50 hover:text-primary transition-all shadow-sm font-bold text-sm active:bg-surface-muted"
            >
                <SplitIcon className="h-4 w-4" />
                SPLIT PAYMENT
            </button>
        </div>
        <div className="flex items-center gap-2">
             <UserIcon className="h-5 w-5 text-text-muted" />
             <span className="text-sm text-text-secondary">Cashier</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
            {/* Total Display */}
            <div className="mb-6 text-center py-1">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1 font-bold">Total Payable Amount</p>
                <div className="flex items-baseline justify-center gap-1 text-5xl md:text-7xl font-bold font-mono text-text-primary tracking-tight">
                    <span className="text-3xl md:text-5xl text-text-muted font-normal">₹</span>
                    {total.toFixed(2)}
                </div>
            </div>

            <div className="w-full space-y-6">
                {/* 1. Other Methods Grid (Top Priority) */}
                <div>
                     <div className="grid grid-cols-1 gap-3">
                        {otherPaymentTypes.map(pt => (
                            <button 
                            key={pt.id} 
                            onClick={() => handleProcessOtherPayment(pt.name)} 
                            className="bg-emerald-500 text-white font-bold rounded-xl shadow-md hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:opacity-80 py-4 w-full"
                            >
                            <PaymentMethodIcon iconName={pt.icon} className="h-6 w-6 text-white/90"/>
                            <span>{pt.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                {cashPaymentType && otherPaymentTypes.length > 0 && (
                    <div className="flex items-center gap-4">
                        <hr className="flex-grow border-border" />
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">OR</span>
                        <hr className="flex-grow border-border" />
                    </div>
                )}

                {/* 2. Cash Section */}
                {cashPaymentType && (
                    <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm">
                        <label className="block text-sm font-bold text-text-secondary mb-2">Cash Payment</label>
                        <div className="flex flex-col md:flex-row items-stretch gap-3 mb-3">
                            <div className="relative flex-grow">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold text-xl">₹</span>
                                <input 
                                    ref={inputRef} 
                                    type="text" 
                                    inputMode="decimal" 
                                    value={cashTendered} 
                                    onFocus={handleFocus} 
                                    onChange={handleCashChange} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleProcessCashPayment()}
                                    className="w-full h-14 pl-10 pr-4 rounded-xl border border-border bg-background text-2xl font-bold font-mono focus:ring-2 focus:ring-primary focus:border-primary text-text-primary"
                                />
                            </div>
                            <button
                                onClick={handleProcessCashPayment}
                                className="bg-primary text-primary-content font-bold px-8 rounded-xl shadow-md hover:bg-primary-hover active:opacity-80 transition-opacity flex items-center justify-center min-h-[56px]"
                            >
                                Exact Cash
                            </button>
                        </div>

                        {/* Quick Cash Options */}
                        {uniqueQuickCash.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {uniqueQuickCash.map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => onProcessPayment('Cash', amount)}
                                        className="px-4 py-2 bg-surface-muted border border-border rounded-lg text-sm font-bold text-text-secondary hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors active:bg-primary/20"
                                    >
                                        ₹{amount}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Numpad */}
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => appendNumber(num.toString())}
                                    className="py-6 text-2xl font-bold bg-surface border border-border rounded-xl shadow-sm hover:bg-surface-muted active:bg-surface-muted/80 active:border-primary/50 transition-colors text-text-primary"
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                onClick={() => appendNumber('.')}
                                className="py-6 text-2xl font-bold bg-surface border border-border rounded-xl shadow-sm hover:bg-surface-muted active:bg-surface-muted/80 active:border-primary/50 transition-colors text-text-primary"
                            >
                                .
                            </button>
                            <button
                                onClick={() => appendNumber('0')}
                                className="py-6 text-2xl font-bold bg-surface border border-border rounded-xl shadow-sm hover:bg-surface-muted active:bg-surface-muted/80 active:border-primary/50 transition-colors text-text-primary"
                            >
                                0
                            </button>
                            <button
                                onClick={backspace}
                                className="py-6 text-xl font-bold bg-surface-muted border border-border rounded-xl shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 active:opacity-70 transition-opacity text-text-secondary flex items-center justify-center"
                            >
                                <TrashIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
    );
};

export default PaymentWorkspace;

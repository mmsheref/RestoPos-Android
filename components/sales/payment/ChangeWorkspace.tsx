import React from 'react';
import { AnimatedCheckIcon, PrintIcon, CheckIcon } from '../../../constants';

interface ChangeWorkspaceProps {
    paymentResult: { method: string, change: number, receiptId: string, date: Date };
    total: number;
    isPrinting: boolean;
    handlePrintReceipt: () => void;
    onNewSale: () => void;
}

/**
 * Displayed after a successful transaction.
 * Shows the "Success" animation, change due (if any), and options to Print or start New Sale.
 */
const ChangeWorkspace: React.FC<ChangeWorkspaceProps> = ({ paymentResult, total, isPrinting, handlePrintReceipt, onNewSale }) => {
    const change = paymentResult.change || 0;
    const amountTendered = total + change;
    
    return (
        <div className="flex-1 flex flex-col h-full bg-background relative">
            {/* Header */}
            <header className="flex-shrink-0 h-16 flex items-center justify-center md:justify-start px-4 md:px-6 bg-surface border-b border-border">
                 <h2 className="text-xl font-bold text-text-primary">Transaction Complete</h2>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-full space-y-8 min-h-[400px]">
                    {/* Success Icon & Message */}
                    <div className="text-center">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-fadeIn">
                            <AnimatedCheckIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-text-primary mb-2">Payment Successful</h2>
                        <p className="text-text-secondary font-mono">Receipt #{paymentResult.receiptId.slice(-4)}</p>
                    </div>

                    {/* Change Due Hero Display */}
                    {paymentResult.method === 'Cash' && change > 0 && (
                        <div className="text-center py-4 px-6 bg-surface-muted/50 rounded-2xl w-full border border-border">
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Change Due</p>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-2xl font-bold text-emerald-600/70 dark:text-emerald-400/70">₹</span>
                                <span className="text-5xl md:text-6xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{change.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {/* Details Summary Grid */}
                    <div className="w-full bg-surface rounded-xl border border-border p-6 shadow-sm">
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-4 border-b border-border pb-2">Transaction Details</h3>
                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                            <div className="text-text-secondary">Total Amount</div>
                            <div className="text-right font-bold text-text-primary">₹{total.toFixed(2)}</div>

                            <div className="text-text-secondary">{paymentResult.method === 'Cash' ? 'Cash Tendered' : 'Payment Method'}</div>
                            <div className="text-right font-medium text-text-primary">{paymentResult.method === 'Cash' ? `₹${amountTendered.toFixed(2)}` : paymentResult.method}</div>

                            <div className="text-text-secondary">Date & Time</div>
                            <div className="text-right text-text-primary">{paymentResult.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-border bg-surface z-20 pb-safe-bottom">
                <div className="flex gap-4 max-w-3xl mx-auto">
                    <button
                        onClick={handlePrintReceipt}
                        disabled={isPrinting}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 text-lg active:scale-[0.98] shadow-lg"
                    >
                        <PrintIcon className="h-6 w-6" />
                        {isPrinting ? 'Printing...' : 'Print Receipt'}
                    </button>
                    <button
                        onClick={onNewSale}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-primary-content font-bold text-lg rounded-xl hover:bg-primary-hover shadow-lg active:scale-[0.98] transition-all"
                    >
                        <CheckIcon className="h-6 w-6" />
                        New Sale
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangeWorkspace;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { OrderItem, PaymentType } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { printReceipt } from '../../utils/printerHelper';
import { UserIcon, ArrowLeftIcon, SplitIcon, CheckIcon, PrintIcon, MailIcon, AnimatedCheckIcon, PaymentMethodIcon } from '../../constants';

// --- Sub-components to prevent re-rendering ---

interface StaticTicketPanelProps {
  orderItems: OrderItem[];
  settings: { taxEnabled: boolean; taxRate: number };
  subtotal: number;
  tax: number;
  total: number;
}

const StaticTicketPanel: React.FC<StaticTicketPanelProps> = ({ orderItems, settings, subtotal, tax, total }) => (
    <div className="w-full md:w-[35%] bg-surface border-r border-border flex flex-col h-full">
        <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b border-border">
            <h2 className="text-xl font-semibold text-text-primary">Ticket</h2>
            <UserIcon className="h-6 w-6 text-text-muted" />
        </header>
        <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2 mb-6">
            {orderItems.map(item => (
                <li key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">{item.name} x {item.quantity}</span>
                <span className="font-mono text-text-primary">{(item.price * item.quantity).toFixed(2)}</span>
                </li>
            ))}
            </ul>
            <div className="pt-4 border-t border-border">
            <div className="space-y-1 text-sm">
                <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
                {settings.taxEnabled && <div className="flex justify-between text-text-secondary"><span>GST ({settings.taxRate}%)</span><span>{tax.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-lg text-text-primary pt-2 mt-1 border-t border-border"><span>Total</span><span>{total.toFixed(2)}</span></div>
            </div>
            </div>
        </div>
    </div>
);


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
}

const PaymentWorkspace: React.FC<PaymentWorkspaceProps> = ({
    onBack, total, otherPaymentTypes, cashPaymentType,
    inputRef, cashTendered, handleFocus, handleCashChange, handleProcessCashPayment, handleProcessOtherPayment,
    uniqueQuickCash, onProcessPayment
}) => (
    <>
      <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b border-border bg-surface">
        <button onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-semibold">
          <ArrowLeftIcon className="h-5 w-5" />
          Back
        </button>
        <button className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-semibold border border-border px-3 py-1.5 rounded-lg">
          <SplitIcon className="h-5 w-5" />
          Split
        </button>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-7xl font-bold font-mono text-text-primary mb-8">{total.toFixed(2)}</h1>
        <div className="w-full max-w-md space-y-4">
          {otherPaymentTypes.map(pt => (
            <button 
              key={pt.id} 
              onClick={() => handleProcessOtherPayment(pt.name)} 
              className="w-full p-4 bg-primary text-primary-content font-bold rounded-lg shadow-md text-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-3"
            >
              <PaymentMethodIcon iconName={pt.icon} className="h-6 w-6"/>
              <span>{pt.name}</span>
            </button>
          ))}
          
          {cashPaymentType && (
            <div className="flex items-center gap-2 pt-2">
              <div className="relative flex-grow">
                  <input ref={inputRef} type="text" inputMode="decimal" value={cashTendered} onFocus={handleFocus} onChange={handleCashChange} onKeyDown={(e) => e.key === 'Enter' && handleProcessCashPayment()} className="w-full p-4 text-lg font-mono bg-surface rounded-lg shadow-md border border-border focus:ring-2 focus:ring-primary" />
              </div>
              <button onClick={handleProcessCashPayment} className="p-4 bg-emerald-500 text-white font-bold rounded-lg shadow-md text-lg hover:bg-emerald-600 transition-colors">
                {cashPaymentType.name}
              </button>
            </div>
          )}
        </div>
        
        {cashPaymentType && (
            <div className="flex gap-3 mt-6 flex-wrap justify-center">
                <button onClick={() => onProcessPayment(cashPaymentType.name, total)} className="px-6 py-3 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors">
                    Exact Cash
                </button>
                {uniqueQuickCash.map(amount => (
                    <button key={amount} onClick={() => onProcessPayment(cashPaymentType.name, amount)} className="px-6 py-3 bg-surface-muted text-text-secondary font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        {amount.toFixed(2)}
                    </button>
                ))}
            </div>
        )}
      </div>
    </>
);


interface ChangeWorkspaceProps {
    paymentResult: { method: string, change: number, receiptId: string };
    total: number;
    isPrinting: boolean;
    handlePrintReceipt: () => void;
    onNewSale: () => void;
}

const ChangeWorkspace: React.FC<ChangeWorkspaceProps> = ({ paymentResult, total, isPrinting, handlePrintReceipt, onNewSale }) => {
    const change = paymentResult.change || 0;
    const amountTendered = total + change;
    return (
        <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 bg-background">
            <div className="w-full max-w-sm bg-surface rounded-xl shadow-2xl p-6 text-center animate-fadeIn">
                <AnimatedCheckIcon className="h-16 w-16 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-text-primary">Transaction Complete</h2>
                <div className="my-6 space-y-2 text-sm">
                    <div className="flex justify-between text-text-secondary"><span>Total:</span><span className="font-mono font-medium text-text-primary">{total.toFixed(2)}</span></div>
                    <div className="flex justify-between text-text-secondary"><span>{paymentResult.method === 'Cash' ? 'Tendered:' : 'Paid:'}</span><span className="font-mono font-medium text-text-primary">{amountTendered.toFixed(2)}</span></div>
                </div>
                {paymentResult.method === 'Cash' && change > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4">
                        <label className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Change</label>
                        <p className="text-4xl sm:text-5xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 break-all">{change.toFixed(2)}</p>
                    </div>
                )}
                <div className="mt-8 space-y-3">
                    <button onClick={handlePrintReceipt} disabled={isPrinting} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-border text-text-primary font-bold rounded-lg hover:bg-surface-muted transition-colors disabled:opacity-50">
                        <PrintIcon className="h-5 w-5" /> {isPrinting ? 'Printing...' : 'Print Receipt'}
                    </button>
                    <button onClick={onNewSale} className="w-full flex items-center justify-center gap-2 p-4 bg-emerald-500 text-white font-bold text-lg rounded-lg hover:bg-emerald-600 shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98]">
                        <CheckIcon className="h-6 w-6" /> New Sale
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Component ---

interface ChargeScreenProps {
  orderItems: OrderItem[];
  total: number;
  tax: number;
  subtotal: number;
  onBack: () => void;
  onProcessPayment: (method: string, tendered: number) => void;
  onNewSale: () => void;
  paymentResult: { method: string, change: number, receiptId: string } | null;
}

const ChargeScreen: React.FC<ChargeScreenProps> = ({ orderItems, total, tax, subtotal, onBack, onProcessPayment, onNewSale, paymentResult }) => {
  const { settings, printers, paymentTypes } = useAppContext();
  const [cashTendered, setCashTendered] = useState(total.toFixed(2));
  const [isPrinting, setIsPrinting] = useState(false);
  const hasBeenFocused = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // FIX: Guarantees a default 'Cash' payment type is always available unless explicitly disabled by the user.
  // This prevents the cash option from disappearing if the payment types haven't loaded from Firestore yet or are missing.
  const cashPaymentType = useMemo(() => {
    const config = paymentTypes.find(p => p.id === 'cash');
    // If 'cash' is explicitly configured and disabled, hide it.
    if (config && !config.enabled) {
      return undefined;
    }
    // If 'cash' is configured and enabled, use that configuration.
    if (config) {
      return config;
    }
    // If 'cash' is not configured at all (e.g., new user, data issue), provide a default fallback.
    return {
      id: 'cash',
      name: 'Cash',
      icon: 'cash',
      type: 'cash',
      enabled: true,
    };
  }, [paymentTypes]);

  const otherPaymentTypes = useMemo(() => paymentTypes.filter(p => p.id !== 'cash' && p.enabled), [paymentTypes]);


  const uniqueQuickCash = useMemo(() => {
    const suggestions = new Set<number>();
    const notes = [10, 20, 50, 100, 200, 500];
    if (total > 10) suggestions.add(Math.ceil(total / 10) * 10);
    if (total > 50) suggestions.add(Math.ceil(total / 50) * 50);
    suggestions.add(Math.ceil(total / 100) * 100);
    const nextNote = notes.find(n => n >= total);
    if (nextNote) suggestions.add(nextNote);
    if (nextNote) {
        const noteAfter = notes.find(n => n > nextNote);
        if (noteAfter) suggestions.add(noteAfter);
    }
    return Array.from(suggestions).filter(amount => amount > total).sort((a, b) => a - b).slice(0, 3);
  }, [total]);
    
  useEffect(() => {
    setCashTendered(total.toFixed(2));
    hasBeenFocused.current = false;
  }, [total]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!hasBeenFocused.current) {
        e.target.select();
        hasBeenFocused.current = true;
    }
  };

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value === '' || /^\d*\.?\d{0,2}$/.test(e.target.value)) {
          setCashTendered(e.target.value);
      }
  };

  const handleProcessCashPayment = () => {
      if (!cashPaymentType) return;
      onProcessPayment(cashPaymentType.name, parseFloat(cashTendered) || 0);
  };
  
  const handleProcessOtherPayment = (methodName: string) => {
      onProcessPayment(methodName, total);
  };

  const handlePrintReceipt = async () => {
    if (!paymentResult || isPrinting) return;
    setIsPrinting(true);
    const printer = printers.find(p => p.interfaceType === 'Bluetooth') || printers[0];
    const result = await printReceipt({ items: orderItems, total, subtotal, tax, receiptId: paymentResult.receiptId, paymentMethod: paymentResult.method, settings, printer });
    setIsPrinting(false);
    if (!result.success) alert(`Print Failed: ${result.message}`);
  };
  
  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-background">
      <StaticTicketPanel 
        orderItems={orderItems} 
        settings={settings}
        subtotal={subtotal}
        tax={tax}
        total={total}
      />
      <div className="w-full md:w-[65%] flex flex-col h-full">
        {paymentResult ? (
          <ChangeWorkspace 
            paymentResult={paymentResult}
            total={total}
            isPrinting={isPrinting}
            handlePrintReceipt={handlePrintReceipt}
            onNewSale={onNewSale}
          />
        ) : (
          <PaymentWorkspace
            onBack={onBack}
            total={total}
            otherPaymentTypes={otherPaymentTypes}
            cashPaymentType={cashPaymentType}
            inputRef={inputRef}
            cashTendered={cashTendered}
            handleFocus={handleFocus}
            handleCashChange={handleCashChange}
            handleProcessCashPayment={handleProcessCashPayment}
            handleProcessOtherPayment={handleProcessOtherPayment}
            uniqueQuickCash={uniqueQuickCash}
            onProcessPayment={onProcessPayment}
          />
        )}
      </div>
    </div>
  );
};

export default ChargeScreen;

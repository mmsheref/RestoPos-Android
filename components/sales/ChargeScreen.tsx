

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { OrderItem } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { printReceipt } from '../../utils/printerHelper';
import { UserIcon, ArrowLeftIcon, SplitIcon, CheckIcon, PrintIcon, MailIcon, AnimatedCheckIcon, PaymentMethodIcon } from '../../constants';

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
  
  const enabledPaymentTypes = useMemo(() => paymentTypes.filter(p => p.enabled), [paymentTypes]);
  const cashPaymentType = useMemo(() => enabledPaymentTypes.find(p => p.type === 'cash'), [enabledPaymentTypes]);
  const otherPaymentTypes = useMemo(() => enabledPaymentTypes.filter(p => p.type !== 'cash'), [enabledPaymentTypes]);

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
    return Array.from(suggestions).filter(amount => amount > total).sort((a, b) => a - b).slice(0, 4);
  }, [total]);
    
  useEffect(() => {
    setCashTendered(total.toFixed(2));
    hasBeenFocused.current = false;
    const timer = setTimeout(() => { inputRef.current?.focus(); }, 100);
    return () => clearTimeout(timer);
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
  
  const StaticTicketPanel = () => (
    <div className="w-full md:w-[35%] bg-white dark:bg-slate-800 border-r dark:border-slate-700 flex flex-col h-full">
      <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b dark:border-slate-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100">Ticket</h2>
        <UserIcon className="h-6 w-6 text-gray-400 dark:text-slate-500" />
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2 mb-6">
          {orderItems.map(item => (
            <li key={item.id} className="flex justify-between items-center text-sm">
              <span className="text-slate-700 dark:text-slate-300">{item.name} x {item.quantity}</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
            {settings.taxEnabled && <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>GST ({settings.taxRate}%)</span><span>{tax.toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-lg text-slate-800 dark:text-slate-100 pt-2 mt-1 border-t border-slate-100 dark:border-slate-700/50"><span>Total</span><span>{total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  const PaymentWorkspace = () => (
    <>
      <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b dark:border-slate-700 bg-white dark:bg-slate-800">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold">
          <ArrowLeftIcon className="h-5 w-5" />
          Back
        </button>
        <button className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg">
          <SplitIcon className="h-5 w-5" />
          Split
        </button>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-7xl font-bold font-mono text-slate-800 dark:text-slate-100 mb-8">{total.toFixed(2)}</h1>
        <div className="w-full max-w-md space-y-4">
          {/* Other Payment Methods */}
          {otherPaymentTypes.map(pt => (
            <button key={pt.id} onClick={() => handleProcessOtherPayment(pt.name)} className="w-full text-left p-4 bg-white dark:bg-slate-700 rounded-lg shadow-md border dark:border-slate-600 flex items-center justify-between hover:ring-2 hover:ring-indigo-500 transition-all">
              <span className="flex items-center gap-3 font-bold text-lg text-slate-800 dark:text-slate-200">
                <PaymentMethodIcon iconName={pt.icon} className="h-6 w-6"/>
                {pt.name}
              </span>
              <span className="text-sm font-medium text-white bg-indigo-500 px-3 py-1 rounded-full">Pay</span>
            </button>
          ))}
          
          {/* Cash Entry */}
          {cashPaymentType && (
            <div className="flex items-center gap-2 pt-2">
              <div className="relative flex-grow">
                  <input ref={inputRef} type="text" inputMode="decimal" value={cashTendered} onFocus={handleFocus} onChange={handleCashChange} onKeyDown={(e) => e.key === 'Enter' && handleProcessCashPayment()} className="w-full p-4 text-lg font-mono bg-white dark:bg-slate-700 rounded-lg shadow-md border dark:border-slate-600 focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={handleProcessCashPayment} className="p-4 bg-emerald-500 text-white font-bold rounded-lg shadow-md text-lg hover:bg-emerald-600 transition-colors">
                {cashPaymentType.name}
              </button>
            </div>
          )}
        </div>
        
        {cashPaymentType && (
            <div className="flex gap-3 mt-6 flex-wrap justify-center">
                {uniqueQuickCash.map(amount => (
                    <button key={amount} onClick={() => onProcessPayment('Cash', amount)} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                        {amount.toFixed(2)}
                    </button>
                ))}
            </div>
        )}
      </div>
    </>
  );

  const ChangeWorkspace = () => {
    const change = paymentResult?.change || 0;
    const amountTendered = total + change;
    return (
        <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/50">
            <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 text-center animate-fadeIn">
                <AnimatedCheckIcon className="h-16 w-16 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Transaction Complete</h2>
                <div className="my-6 space-y-2 text-sm">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Total:</span><span className="font-mono font-medium text-slate-700 dark:text-slate-300">{total.toFixed(2)}</span></div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>{paymentResult?.method === 'Cash' ? 'Tendered:' : 'Paid:'}</span><span className="font-mono font-medium text-slate-700 dark:text-slate-300">{amountTendered.toFixed(2)}</span></div>
                </div>
                {paymentResult?.method === 'Cash' && change > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4">
                        <label className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Change</label>
                        <p className="text-4xl sm:text-5xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 break-all">{change.toFixed(2)}</p>
                    </div>
                )}
                <div className="mt-8 space-y-3">
                    <button onClick={handlePrintReceipt} disabled={isPrinting} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
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

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-slate-50 dark:bg-slate-900">
      <StaticTicketPanel />
      <div className="w-full md:w-[65%] flex flex-col h-full">
        {paymentResult ? <ChangeWorkspace /> : <PaymentWorkspace />}
      </div>
    </div>
  );
};

export default ChargeScreen;
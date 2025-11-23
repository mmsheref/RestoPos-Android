

import React, { useState, useEffect, useMemo } from 'react';
import type { OrderItem } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { printReceipt } from '../../utils/printerHelper';
import { UserIcon, ArrowLeftIcon, SplitIcon, CheckIcon, PrintIcon } from '../../constants';

interface ChargeScreenProps {
  orderItems: OrderItem[];
  total: number;
  tax: number;
  subtotal: number;
  onBack: () => void;
  onProcessPayment: (method: 'Cash' | 'QR', tendered: number) => void;
  onNewSale: () => void;
  paymentResult: { method: 'Cash' | 'QR', change: number, receiptId: string } | null;
}

const ChargeScreen: React.FC<ChargeScreenProps> = ({ orderItems, total, tax, subtotal, onBack, onProcessPayment, onNewSale, paymentResult }) => {
  const { settings, printers } = useAppContext();
  const [cashTendered, setCashTendered] = useState(total);
  
  // India-specific Smart Suggestions Logic
  const uniqueQuickCash = useMemo(() => {
    const suggestions = new Set<number>();
    const notes = [10, 20, 50, 100, 200, 500]; // Standard Indian Notes
    
    // 1. Multiples of 10, 50, 100, 500 relative to total
    // This covers cases like: Total 175 -> Suggest 180 (Nearest 10), 200 (Nearest 50/100)
    if (total > 10) suggestions.add(Math.ceil(total / 10) * 10);
    if (total > 50) suggestions.add(Math.ceil(total / 50) * 50);
    suggestions.add(Math.ceil(total / 100) * 100);
    if (total > 100) suggestions.add(Math.ceil(total / 500) * 500);

    // 2. Find the smallest single note that covers the bill
    const nextNote = notes.find(n => n >= total);
    if (nextNote) suggestions.add(nextNote);

    // 3. Find the next note after that (e.g. if 200 covers it, maybe they use 500)
    if (nextNote) {
        const noteAfter = notes.find(n => n > nextNote);
        if (noteAfter) suggestions.add(noteAfter);
    } else {
        // Total is huge (>500), maybe suggest next 500 multiple + 100? 
        // For simple logic, just ensure we have high value suggestions
    }

    return Array.from(suggestions)
        .filter(amount => amount > total) // Only suggest amounts greater than total (since exact is default)
        .sort((a, b) => a - b)
        .slice(0, 4); // Take top 4
  }, [total]);
    
  useEffect(() => {
    // Reset cash tendered when the total changes (new order)
    setCashTendered(total);
  }, [total]);

  const handlePrintReceipt = () => {
    if (!paymentResult) return;
    const printer = printers.find(p => p.interfaceType === 'Bluetooth') || printers[0];
    printReceipt({
        items: orderItems,
        total,
        subtotal,
        tax,
        receiptId: paymentResult.receiptId,
        paymentMethod: paymentResult.method,
        settings,
        printer,
    });
  };
  
  const StaticTicketPanel = () => (
    <div className="w-full md:w-[35%] bg-white dark:bg-slate-800 border-r dark:border-slate-700 flex flex-col h-full">
      <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b dark:border-slate-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100">Ticket</h2>
        <UserIcon className="h-6 w-6 text-gray-400 dark:text-slate-500" />
      </header>
      {/* Ticket Items */}
      <div className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2 mb-6">
          {orderItems.map(item => (
            <li key={item.id} className="flex justify-between items-center text-sm">
              <span className="text-slate-700 dark:text-slate-300">{item.name} x {item.quantity}</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        
        {/* Totals Section */}
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
          <button onClick={() => onProcessPayment('QR', total)} className="w-full text-left p-4 bg-white dark:bg-slate-700 rounded-lg shadow-md border dark:border-slate-600 flex items-center justify-between hover:ring-2 hover:ring-indigo-500 transition-all">
            <span className="font-bold text-lg text-slate-800 dark:text-slate-200">QR FEDERAL BANK</span>
            <span className="text-sm font-medium text-white bg-indigo-500 px-3 py-1 rounded-full">Pay</span>
          </button>
          
          {/* Cash Entry */}
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
                <input 
                  type="number"
                  inputMode="decimal"
                  value={cashTendered}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                  className="w-full p-4 text-lg font-mono bg-white dark:bg-slate-700 rounded-lg shadow-md border dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
            </div>
            <button onClick={() => onProcessPayment('Cash', cashTendered)} className="p-4 bg-emerald-500 text-white font-bold rounded-lg shadow-md text-lg hover:bg-emerald-600 transition-colors">
              CHARGE
            </button>
          </div>
        </div>
        
        {/* Smart Suggestions */}
        <div className="flex gap-3 mt-6 flex-wrap justify-center">
            {uniqueQuickCash.map(amount => (
                <button key={amount} onClick={() => { setCashTendered(amount); onProcessPayment('Cash', amount); }} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                    {amount.toFixed(2)}
                </button>
            ))}
        </div>
      </div>
    </>
  );

  const ChangeWorkspace = () => {
    const change = paymentResult?.change || 0;
    const amountTendered = total + change;
    
    return (
        <>
            <header className="flex-shrink-0 h-16 flex items-center justify-center px-4 border-b dark:border-slate-700 bg-white dark:bg-slate-800">
                 <h2 className="text-lg font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                    <CheckIcon className="h-5 w-5" />
                    Transaction Complete
                 </h2>
            </header>
            <div className="flex-1 flex flex-col justify-center items-center p-8">
                <div className="grid grid-cols-2 gap-8 text-center w-full max-w-lg mb-12">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Paid</label>
                        <p className="text-4xl md:text-5xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-2">{amountTendered.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Change</label>
                        <p className="text-4xl md:text-5xl font-bold font-mono text-emerald-500 mt-2">{change.toFixed(2)}</p>
                    </div>
                </div>
                <div className="w-full max-w-md space-y-4">
                    <div className="flex items-center gap-2">
                        <input type="email" placeholder="Enter email address" className="flex-grow p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                        <button className="px-4 py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors">Send</button>
                    </div>
                    <button onClick={handlePrintReceipt} className="w-full flex items-center justify-center gap-2 p-4 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-lg rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <PrintIcon className="h-6 w-6" />
                        Print Receipt
                    </button>
                    
                    <div className="pt-6">
                        <button onClick={onNewSale} className="w-full flex items-center justify-center gap-2 p-4 bg-emerald-500 text-white font-bold text-xl rounded-lg hover:bg-emerald-600 shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98]">
                            <CheckIcon className="h-6 w-6" />
                            New Sale
                        </button>
                    </div>
                </div>
            </div>
        </>
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

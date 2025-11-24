
import React, { useState, useEffect, useMemo } from 'react';
import type { OrderItem } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { printReceipt } from '../../utils/printerHelper';
import { UserIcon, ArrowLeftIcon, PlusIcon, CheckIcon, PrintIcon, MailIcon, AnimatedCheckIcon, CloseIcon } from '../../constants';

type PaymentMethod = 'Cash' | 'Card' | 'QR';

interface Payment {
  method: PaymentMethod;
  amount: number;
}

interface ChargeScreenProps {
  orderItems: OrderItem[];
  total: number;
  tax: number;
  subtotal: number;
  onBack: () => void;
  onProcessPayment: (payments: Payment[]) => void;
  onNewSale: () => void;
  paymentResult: { payments: Payment[], receiptId: string } | null;
}

const ChargeScreen: React.FC<ChargeScreenProps> = ({ orderItems, total, tax, subtotal, onBack, onProcessPayment, onNewSale, paymentResult }) => {
  const { settings, printers } = useAppContext();
  const [isPrinting, setIsPrinting] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + (p.amount || 0), 0), [payments]);
  const remaining = useMemo(() => total - totalPaid, [total, totalPaid]);
  const isFinalized = useMemo(() => Math.abs(remaining) < 0.01, [remaining]);

  useEffect(() => {
    if (!paymentResult) {
      setPayments([{ method: 'Cash', amount: total }]);
    }
  }, [total, paymentResult]);

  const handleUpdatePayment = (index: number, updatedPayment: Partial<Payment>) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], ...updatedPayment };

    // Auto-balancing logic for 2 payments
    if (newPayments.length === 2 && updatedPayment.amount !== undefined) {
        const otherIndex = index === 0 ? 1 : 0;
        const newAmount = updatedPayment.amount;
        const remainingForOther = total - newAmount;
        newPayments[otherIndex].amount = remainingForOther > 0 ? parseFloat(remainingForOther.toFixed(2)) : 0;
    }
    setPayments(newPayments);
  };

  const handleAddPayment = () => {
    const newPayments = [...payments];
    const remainingAmount = total - newPayments.reduce((sum, p) => sum + p.amount, 0);
    newPayments.push({ method: 'QR', amount: remainingAmount > 0 ? remainingAmount : 0 });

    // Redistribute evenly
    const newCount = newPayments.length;
    const splitAmount = parseFloat((total / newCount).toFixed(2));
    const balancedPayments = newPayments.map((p, i) => ({
      ...p,
      amount: i === newCount - 1 ? total - (splitAmount * (newCount - 1)) : splitAmount
    }));
    
    setPayments(balancedPayments);
  };

  const handleRemovePayment = (indexToRemove: number) => {
    if (payments.length <= 1) return;
    const newPayments = payments.filter((_, index) => index !== indexToRemove);
    
    // Redistribute total evenly among remaining
    const newCount = newPayments.length;
    const splitAmount = parseFloat((total / newCount).toFixed(2));
    const balancedPayments = newPayments.map((p, i) => ({
      ...p,
      amount: i === newCount - 1 ? total - (splitAmount * (newCount - 1)) : splitAmount
    }));

    setPayments(balancedPayments);
  };

  const handlePrintReceipt = async () => {
    if (!paymentResult || isPrinting) return;
    
    setIsPrinting(true);
    const printer = printers.find(p => p.interfaceType === 'Bluetooth') || printers[0];
    const result = await printReceipt({
        items: orderItems,
        total,
        subtotal,
        tax,
        receiptId: paymentResult.receiptId,
        payments: paymentResult.payments,
        settings,
        printer,
    });
    setIsPrinting(false);

    if (!result.success) {
      alert(`Print Failed: ${result.message}`);
    }
  };
  
  const StaticTicketPanel = () => (
    <div className="w-full md:w-[35%] bg-white dark:bg-slate-800 border-r dark:border-slate-700 flex flex-col h-full">
      <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b dark:border-slate-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100">Final Bill</h2>
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
      <header className="flex-shrink-0 h-16 flex items-center px-4 border-b dark:border-slate-700 bg-white dark:bg-slate-800">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold">
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Order
        </button>
      </header>
      <div className="flex-1 flex flex-col justify-between p-6">
        <div className="space-y-3">
            {payments.map((p, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-700/50 rounded-lg border dark:border-slate-600">
                    <select value={p.method} onChange={(e) => handleUpdatePayment(i, { method: e.target.value as PaymentMethod })} className="p-3 font-semibold border-r dark:border-slate-600 bg-transparent dark:text-white focus:outline-none">
                        <option>Cash</option>
                        <option>Card</option>
                        <option>QR</option>
                    </select>
                    <input 
                        type="number" 
                        value={p.amount}
                        onChange={e => handleUpdatePayment(i, { amount: parseFloat(e.target.value) || 0 })}
                        onFocus={e => e.target.select()}
                        className="w-full p-3 text-right font-mono text-xl dark:bg-transparent dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    {payments.length > 1 && (
                        <button onClick={() => handleRemovePayment(i)} className="p-2 text-slate-400 hover:text-red-500">
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            ))}
            <button onClick={handleAddPayment} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <PlusIcon className="h-5 w-5" /> Add Payment Method
            </button>
        </div>
        
        <div className="mt-6">
            <div className="space-y-2 text-lg mb-4">
                <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Total Due:</span><span className="font-mono">{total.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Total Paid:</span><span className="font-mono">{totalPaid.toFixed(2)}</span></div>
                <div className={`flex justify-between font-bold ${isFinalized ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-500'}`}>
                    <span>{remaining >= 0 ? 'Remaining:' : 'Overpaid:'}</span>
                    <span className="font-mono">{Math.abs(remaining).toFixed(2)}</span>
                </div>
            </div>
            <button onClick={() => onProcessPayment(payments)} disabled={!isFinalized} className="w-full text-center p-5 bg-emerald-500 text-white font-bold text-xl rounded-lg shadow-lg hover:bg-emerald-600 transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
                PROCESS PAYMENT
            </button>
        </div>
      </div>
    </>
  );

  const ChangeWorkspace = () => {
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleEmailReceipt = () => {
        if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
            alert("Please enter a valid email address."); return;
        }
        setIsSending(true);
        setTimeout(() => {
            setIsSending(false);
            alert(`Receipt sent to ${email}`);
            setEmail('');
        }, 1500);
    };
    
    return (
        <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/50">
            <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 text-center animate-fadeIn">
                <AnimatedCheckIcon className="h-16 w-16 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Transaction Complete</h2>

                <div className="my-6 space-y-2 text-sm text-left">
                    {paymentResult?.payments.map((p, i) => (
                        <div key={i} className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>Paid ({p.method}):</span>
                            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{p.amount.toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold border-t dark:border-slate-600 pt-2 mt-2">
                        <span>Total Paid:</span>
                        <span className="font-mono">{total.toFixed(2)}</span>
                    </div>
                </div>
                
                <div className="mt-8 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-grow">
                             <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                             <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email receipt..." className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700/50 focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                        </div>
                        <button onClick={handleEmailReceipt} disabled={isSending || !email} className="px-4 py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors disabled:bg-indigo-300 dark:disabled:bg-indigo-800/50 disabled:cursor-not-allowed flex-shrink-0">
                            {isSending ? '...' : 'Send'}
                        </button>
                    </div>
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

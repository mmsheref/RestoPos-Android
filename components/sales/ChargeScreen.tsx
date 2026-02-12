
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { OrderItem, PaymentType, SplitPaymentDetail } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { printReceipt } from '../../utils/printerHelper';

// Import extracted components for better readability
import OrderSummaryPanel from './payment/OrderSummaryPanel';
import PaymentWorkspace from './payment/PaymentWorkspace';
import SplitPaymentWorkspace from './payment/SplitPaymentWorkspace';
import ChangeWorkspace from './payment/ChangeWorkspace';

interface ChargeScreenProps {
  orderItems: OrderItem[];
  total: number;
  tax: number;
  subtotal: number;
  onBack: () => void;
  onProcessPayment: (method: string, tendered: number, splitDetails?: SplitPaymentDetail[]) => void;
  onNewSale: () => void;
  paymentResult: { method: string, change: number, receiptId: string, date: Date } | null;
}

const ChargeScreen: React.FC<ChargeScreenProps> = ({ orderItems, total, tax, subtotal, onBack, onProcessPayment, onNewSale, paymentResult }) => {
  const { settings, printers, paymentTypes, openAddPrinterModal } = useAppContext();
  const [cashTendered, setCashTendered] = useState(total.toFixed(2));
  const [isPrinting, setIsPrinting] = useState(false);
  
  // View State: 'standard' | 'split'
  const [viewMode, setViewMode] = useState<'standard' | 'split'>('standard');

  const hasBeenFocused = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Prepare Payment Types Config
  const cashPaymentType = useMemo(() => {
    const config = paymentTypes.find(p => p.id === 'cash');
    if (config && !config.enabled) return undefined;
    if (config) return config;
    return { id: 'cash', name: 'Cash', icon: 'cash', type: 'cash', enabled: true } as PaymentType;
  }, [paymentTypes]);

  const otherPaymentTypes = useMemo(() => paymentTypes.filter(p => p.id !== 'cash' && p.enabled), [paymentTypes]);

  // Memoize the combined list passed to the Split Workspace to prevent infinite re-renders
  const splitPaymentTypes = useMemo(() => {
      return [...(cashPaymentType ? [cashPaymentType] : []), ...otherPaymentTypes];
  }, [cashPaymentType, otherPaymentTypes]);

  // Smart Cash Suggestions Logic
  const uniqueQuickCash = useMemo(() => {
    const denominations = [10, 20, 50, 100, 200, 500, 2000];
    const suggestions = new Set<number>();

    // 1. Add next available notes greater than total
    denominations.forEach(denom => { if (denom > total) suggestions.add(denom); });

    // 2. Add rounding suggestions (nearest 10s/100s)
    suggestions.add(Math.ceil(total / 10) * 10);
    suggestions.add(Math.ceil(total / 100) * 100);

    return Array.from(suggestions)
      .filter(amount => amount > total) // Ensure only strictly greater amounts
      .sort((a, b) => a - b)
      .slice(0, 6);
  }, [total]);
    
  useEffect(() => {
    setCashTendered(total.toFixed(2));
    hasBeenFocused.current = false;
  }, [total]);

  // Handlers
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
    
    if (printers.length === 0) {
        openAddPrinterModal();
        return;
    }
    
    setIsPrinting(true);
    const printer = printers.find(p => p.interfaceType === 'Bluetooth') || printers[0];
    const result = await printReceipt({ items: orderItems, total, subtotal, tax, receiptId: paymentResult.receiptId, paymentMethod: paymentResult.method, settings, printer, date: paymentResult.date });
    setIsPrinting(false);
    if (!result.success) alert(`Print Failed: ${result.message}`);
  };
  
  const handleSplitConfirm = (details: SplitPaymentDetail[]) => {
      const methodString = `Split (${details.map(d => d.method).join(', ')})`;
      onProcessPayment(methodString, total, details);
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-background overflow-hidden">
      {/* Left Column: Order Summary (Always visible in split view) */}
      <OrderSummaryPanel 
        orderItems={orderItems} 
        settings={settings}
        subtotal={subtotal}
        tax={tax}
        total={total}
      />
      
      {/* Right Column: Payment Logic */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {paymentResult ? (
          <ChangeWorkspace 
            paymentResult={paymentResult}
            total={total}
            isPrinting={isPrinting}
            handlePrintReceipt={handlePrintReceipt}
            onNewSale={onNewSale}
          />
        ) : viewMode === 'split' ? (
            <SplitPaymentWorkspace 
                total={total}
                paymentTypes={splitPaymentTypes} 
                onBack={() => setViewMode('standard')}
                onComplete={handleSplitConfirm}
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
                onSplitClick={() => setViewMode('split')}
            />
        )}
      </div>
    </div>
  );
};

export default ChargeScreen;

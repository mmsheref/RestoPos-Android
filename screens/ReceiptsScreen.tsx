import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Receipt, PaymentTypeIcon } from '../types';
import { useAppContext } from '../context/AppContext';
import { SearchIcon, PrintIcon, MailIcon, RefundIcon, ArrowLeftIcon, ReceiptIcon as ReceiptIconPlaceholder, MenuIcon, ThreeDotsIcon, PaymentMethodIcon, SyncIcon, OfflineIcon } from '../constants';
import { printReceipt } from '../utils/printerHelper';
import { useDebounce } from '../hooks/useDebounce';

const ReceiptsScreen: React.FC = () => {
  const { receipts, openDrawer, settings, printers, loadMoreReceipts, hasMoreReceipts, paymentTypes, syncState } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isDetailView, setIsDetailView] = useState(false); // For mobile view switching
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const paymentTypeIconMap = useMemo(() => {
    const map = new Map<string, PaymentTypeIcon>();
    paymentTypes.forEach(pt => map.set(pt.name, pt.icon));
    return map;
  }, [paymentTypes]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreReceipts && !debouncedSearchTerm) {
          loadMoreReceipts();
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMoreReceipts, loadMoreReceipts, debouncedSearchTerm]);

  const filteredReceipts = useMemo(() => {
    return receipts
      .filter(receipt => receipt.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [debouncedSearchTerm, receipts]);

  const groupedReceipts = useMemo(() => {
    return filteredReceipts.reduce((acc: Record<string, Receipt[]>, receipt) => {
      const dateStr = receipt.date.toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(receipt);
      return acc;
    }, {} as Record<string, Receipt[]>);
  }, [filteredReceipts]);

  useEffect(() => {
    if (filteredReceipts.length > 0 && !filteredReceipts.some(r => r.id === selectedReceipt?.id)) {
        if (window.innerWidth >= 768) setSelectedReceipt(filteredReceipts[0]);
    } else if (filteredReceipts.length === 0) {
        setSelectedReceipt(null);
    }
  }, [filteredReceipts.length]);

  const handleSelectReceipt = (receipt: Receipt) => {
      setSelectedReceipt(receipt);
      setIsDetailView(true);
  };

  const ReceiptDetailView = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePrintReceipt = async () => {
        if (!selectedReceipt || isPrinting) return;
        if (printers.length === 0) {
            alert("No printer configured. Please go to Settings to add a printer.");
            return;
        }
        setIsPrinting(true);
        try {
            const subtotal = selectedReceipt.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const tax = settings.taxEnabled ? subtotal * (settings.taxRate / 100) : 0;
            const printerToUse = printers[0];
            const result = await printReceipt({ items: selectedReceipt.items, total: selectedReceipt.total, subtotal, tax, receiptId: selectedReceipt.id, paymentMethod: selectedReceipt.paymentMethod, settings, printer: printerToUse });
            if (!result.success) alert(`Print Failed: ${result.message}`);
            else setIsMenuOpen(false);
        } catch (error: any) {
             alert(`An unexpected error occurred during printing: ${error.message || 'Unknown error'}`);
        } finally {
            setIsPrinting(false);
        }
    };
    
    return selectedReceipt ? (
      <>
        <div className="flex-shrink-0 h-16 flex justify-between items-center px-4 md:px-6 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsDetailView(false)} className="p-2 -ml-2 text-text-secondary md:hidden">
                <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-semibold text-text-primary">Receipt #{selectedReceipt.id}</h2>
          </div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-2 text-text-muted hover:bg-surface-muted rounded-full">
              <ThreeDotsIcon className="h-5 w-5" />
            </button>
            {isMenuOpen && (
               <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-white/10 z-20">
                 <div className="py-1" role="menu" aria-orientation="vertical">
                   <button onClick={handlePrintReceipt} disabled={isPrinting} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-surface-muted disabled:opacity-50" role="menuitem">
                     <PrintIcon className="h-5 w-5" /> {isPrinting ? 'Printing...' : 'Print'}
                   </button>
                   <button className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-surface-muted" role="menuitem">
                     <MailIcon className="h-5 w-5" /> Email
                   </button>
                   <button className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-surface-muted" role="menuitem">
                     <RefundIcon className="h-5 w-5" /> Refund
                   </button>
                 </div>
               </div>
            )}
          </div>
        </div>
        <main className="flex-1 flex justify-center items-start p-4 md:p-8 overflow-y-auto bg-background">
          <div className="w-full max-w-md bg-surface shadow-lg rounded-lg p-6 md:p-8 font-sans">
            <p className="text-4xl md:text-5xl font-bold text-center text-text-primary">₹{selectedReceipt.total.toFixed(2)}</p>
            <div className="flex justify-between text-sm text-text-muted mt-4">
              <span>Cashier: Admin</span>
              <span>Terminal: POS 1</span>
            </div>
            <hr className="my-6 border-border" />
            <ul className="space-y-3">
              {selectedReceipt.items.map(item => (
                <li key={item.id} className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-text-primary">{item.name}</p>
                    <p className="text-sm text-text-secondary">{item.quantity} x ₹{item.price.toFixed(2)}</p>
                  </div>
                  <p className="font-semibold text-text-primary">₹{(item.quantity * item.price).toFixed(2)}</p>
                </li>
              ))}
            </ul>
            <hr className="my-6 border-border" />
            <div className="space-y-2 text-sm text-text-secondary">
              <div className="flex justify-between"><p>Payment Method</p><p className="font-medium text-text-primary">{selectedReceipt.paymentMethod}</p></div>
              <div className="flex justify-between"><p>Date</p><p>{selectedReceipt.date.toLocaleDateString()}</p></div>
              <div className="flex justify-between"><p>Time</p><p>{selectedReceipt.date.toLocaleTimeString()}</p></div>
              <div className="flex justify-between"><p>Receipt ID</p><p>#{selectedReceipt.id}</p></div>
            </div>
          </div>
        </main>
      </>
    ) : (
      <div className="hidden md:flex flex-col flex-1">
        <div className="flex-shrink-0 h-16 flex justify-between items-center px-4 md:px-6 border-b border-border bg-surface" />
        <div className="flex flex-1 justify-center items-center text-center text-text-muted">
            <div>
            <ReceiptIconPlaceholder className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-lg">Select a receipt to view details</p>
            {receipts.length === 0 && <p className="mt-2 text-sm">There are no receipts to show.</p>}
            </div>
        </div>
      </div>
    )
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">
      <div className={`w-full md:w-1/3 flex-col border-r border-border ${isDetailView ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex-shrink-0 h-16 flex items-center px-4 border-b border-border bg-surface">
            <button onClick={openDrawer} className="p-2 -ml-2 text-text-secondary hover:text-text-primary">
                <MenuIcon className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2 ml-4">
              {syncState === 'syncing' && <SyncIcon className="h-5 w-5 text-primary" title="Syncing pending changes..." />}
              {syncState === 'offline' && <OfflineIcon className="h-5 w-5 text-red-500" title="Offline: Changes are saved locally." />}
              <h1 className="text-xl font-semibold text-text-primary">Receipts</h1>
            </div>
        </div>
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-5 w-5" />
            <input type="text" placeholder="Search by Receipt ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-surface border-border text-text-primary focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {Object.keys(groupedReceipts).length > 0 ? (
             <>
                {Object.entries(groupedReceipts).map(([date, receiptsInGroup]) => {
                    const receipts = receiptsInGroup as Receipt[];
                    return (
                        <div key={date}>
                        <h3 className="px-4 py-2 text-sm font-semibold text-green-700 dark:text-green-400 bg-surface-muted/50 sticky top-0 z-10">{date}</h3>
                        <ul>
                            {receipts.map((receipt) => (
                            <li key={receipt.id}>
                                <button onClick={() => handleSelectReceipt(receipt)} className={`w-full text-left p-4 border-b border-border flex justify-between items-center transition-colors duration-150 ${selectedReceipt?.id === receipt.id ? 'bg-indigo-50 dark:bg-slate-700/50' : 'hover:bg-surface-muted'}`}>
                                <div className="flex items-center gap-3">
                                    <PaymentMethodIcon iconName={paymentTypeIconMap.get(receipt.paymentMethod)} className="h-6 w-6 text-text-secondary" />
                                    <div>
                                        <p className="font-bold text-lg text-text-primary">₹{receipt.total.toFixed(2)}</p>
                                        <p className="text-sm text-text-secondary">{receipt.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-text-muted font-mono">#{receipt.id}</p>
                                </button>
                            </li>
                            ))}
                        </ul>
                        </div>
                    );
                })}
                {!debouncedSearchTerm && hasMoreReceipts && (
                    <div ref={loadMoreRef} className="py-6 text-center text-text-muted">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                        <span className="ml-2 text-sm">Loading more...</span>
                    </div>
                )}
             </>
          ) : (
            <div className="flex justify-center items-center h-full text-center text-text-muted p-4">
                <p>No receipts found for your search.</p>
            </div>
          )}
        </div>
      </div>
      <div className={`w-full md:w-2/3 flex-col ${isDetailView ? 'flex' : 'hidden md:flex'}`}>
        <ReceiptDetailView />
      </div>
    </div>
  );
};

export default ReceiptsScreen;
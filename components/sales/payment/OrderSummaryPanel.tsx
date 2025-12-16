
import React, { useState } from 'react';
import { OrderItem } from '../../../types';
import { ItemsIcon } from '../../../constants';

interface OrderSummaryPanelProps {
  orderItems: OrderItem[];
  settings: { taxEnabled: boolean; taxRate: number };
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Displays the readonly list of items in the current transaction.
 * Responsive: Shows as a sidebar on Desktop, and a collapsible accordion on Mobile.
 */
const OrderSummaryPanel: React.FC<OrderSummaryPanelProps> = React.memo(({ orderItems, settings, subtotal, tax, total }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    // --- Desktop View (Side Panel) ---
    const DesktopView = (
        <div className="hidden md:flex md:w-1/3 lg:w-1/4 bg-surface border-r border-border flex-col h-full flex-shrink-0">
            <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b border-border bg-surface">
                <h2 className="text-xl font-semibold text-text-primary">Order Summary</h2>
                <span className="bg-surface-muted px-2 py-1 rounded text-sm text-text-secondary font-bold">{orderItems.length} Items</span>
            </header>
            <div className="flex-1 overflow-y-auto p-4 bg-background/50">
                <ul className="space-y-3 mb-6">
                {orderItems.map(item => (
                    <li key={item.lineItemId} className="flex justify-between items-start text-sm border-b border-border/50 pb-2 last:border-0">
                        <div className="flex flex-col">
                            <span className="text-text-primary font-medium">{item.name}</span>
                            <span className="text-text-secondary text-xs">{item.quantity} x {item.price.toFixed(2)}</span>
                        </div>
                        <span className="font-mono text-text-primary font-bold">{(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                ))}
                </ul>
            </div>
            <div className="flex-shrink-0 p-4 bg-surface border-t border-border">
                <div className="space-y-2 text-sm">
                    {settings.taxEnabled && (
                        <>
                            <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-text-secondary"><span>GST ({settings.taxRate}%)</span><span>{tax.toFixed(2)}</span></div>
                        </>
                    )}
                    <div className={`flex justify-between font-bold text-xl text-text-primary ${settings.taxEnabled ? 'pt-3 mt-1 border-t border-border' : ''}`}><span>Total</span><span>{total.toFixed(2)}</span></div>
                </div>
            </div>
        </div>
    );

    // --- Mobile View (Collapsible Accordion) ---
    const MobileView = (
        <div className="md:hidden w-full bg-surface border-b border-border flex-shrink-0 z-10 shadow-sm">
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full p-4 flex justify-between items-center active:bg-surface-muted transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full text-primary">
                        <ItemsIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="font-semibold text-text-primary text-sm">Order Summary</span>
                        <span className="text-xs text-text-secondary">{orderItems.length} items</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-primary">₹{total.toFixed(2)}</span>
                    <span className={`text-text-muted transform transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}>▼</span>
                </div>
            </button>
            
            {!isCollapsed && (
                <div className="px-4 pb-4 animate-fadeIn bg-surface-muted/30 border-t border-border">
                     <ul className="space-y-2 py-3 max-h-48 overflow-y-auto">
                        {orderItems.map(item => (
                            <li key={item.lineItemId} className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary truncate pr-4"><span className="font-bold text-text-primary">{item.quantity}</span> x {item.name}</span>
                                <span className="font-mono text-text-primary">{(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                    {settings.taxEnabled && (
                        <div className="flex justify-between text-xs text-text-muted border-t border-border pt-2">
                            <span>Subtotal: {subtotal.toFixed(2)}</span>
                            <span>Tax: {tax.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <>
            {DesktopView}
            {MobileView}
        </>
    );
});

export default OrderSummaryPanel;


import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { LockIcon, MenuIcon, DollarSignIcon, ChartIcon, CheckIcon, DownloadIcon, CloseIcon, ArrowLeftIcon } from '../constants';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { idb } from '../utils/indexedDB';
import { Receipt } from '../types';

// --- TYPES ---
type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'custom';
type ShiftFilter = 'all' | 'morning' | 'night';
type ReportTab = 'overview' | 'items' | 'orders'; 
type SortConfig = { key: string; direction: 'asc' | 'desc' };

interface GraphDataPoint {
    label: string; // "14:00" or "Oct 12"
    value: number;
    fullDate: Date;
    type: 'hourly' | 'daily';
}

interface Metrics {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  paymentMethods: Record<string, number>;
  topItems: { name: string, count: number, revenue: number }[];
  allItems: { name: string, count: number, revenue: number, category: string }[];
  graphData: GraphDataPoint[];
  salesByCategory: Record<string, number>;
}

// --- COMPONENT: REPORT STAT CARD ---
const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, colorClass: string }> = ({ title, value, icon, colorClass }) => (
    <div className="bg-surface p-5 rounded-2xl shadow-sm border border-border flex items-center gap-4 transition-transform hover:scale-[1.01]">
        <div className={`p-3 rounded-xl ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-text-primary tracking-tight">{value}</p>
        </div>
    </div>
);

// --- COMPONENT: SALES ACTIVITY CHART ---
const SalesActivityChart: React.FC<{ data: GraphDataPoint[] }> = ({ data }) => {
    // Determine max value for Y-axis scaling
    const values = data.map(d => d.value);
    const maxValue = Math.max(...values, 1); 

    // Helper to format labels based on type
    const formatLabel = (point: GraphDataPoint, isTooltip = false) => {
        if (point.type === 'daily') {
            return point.fullDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
        // Hourly
        if (isTooltip) {
            const endHour = new Date(point.fullDate);
            endHour.setHours(endHour.getHours() + 1);
            return `${point.label} - ${endHour.toLocaleTimeString([], { hour: 'numeric', hour12: true })}`;
        }
        return point.fullDate.toLocaleTimeString([], { hour: 'numeric', hour12: true }).replace(' ', '');
    };

    if (data.length === 0) {
        return (
            <div className="w-full h-80 bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col items-center justify-center text-text-muted">
                <p>No data for this period</p>
            </div>
        );
    }

    return (
        <div className="w-full h-80 bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-text-primary">Sales Activity</h3>
                <span className="text-xs font-medium text-text-secondary bg-surface-muted px-2 py-1 rounded-md">
                    {formatLabel(data[0])} - {formatLabel(data[data.length-1])}
                </span>
            </div>
            
            <div className="flex-1 relative w-full min-h-0">
                {/* Y-Axis Grid Lines Background */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 pb-6">
                    {[1, 0.75, 0.5, 0.25, 0].map((tick, i) => (
                        <div key={tick} className="w-full border-t border-dashed border-border/50 relative">
                             {i < 4 && (
                                <span className="absolute -top-3 left-0 text-[10px] text-text-muted bg-surface pr-1">
                                    {Math.round(maxValue * tick)}
                                </span>
                             )}
                        </div>
                    ))}
                </div>

                {/* Bars Container */}
                <div className="absolute inset-0 flex items-end justify-between gap-1 pt-2 pb-6 pl-6 z-10">
                    {data.map((point, idx) => {
                        const heightPct = (point.value / maxValue) * 100;
                        const isNonZero = point.value > 0;
                        
                        return (
                            <div 
                                key={idx} 
                                className="relative flex-1 h-full flex items-end group"
                            >
                                {/* The Bar */}
                                <div 
                                    className={`w-full rounded-t-sm transition-all duration-500 ease-out min-h-[4px] ${isNonZero ? 'bg-primary hover:bg-primary-hover' : 'bg-surface-muted hover:bg-border'}`}
                                    style={{ height: `${heightPct}%` }}
                                ></div>
                                
                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none transition-opacity duration-200">
                                    <div className="bg-neutral-900 text-white text-xs py-1.5 px-3 rounded-lg whitespace-nowrap shadow-xl border border-neutral-700">
                                        <div className="font-bold mb-0.5">{formatLabel(point, true)}</div>
                                        <div className="text-emerald-400 font-mono text-sm">₹{point.value.toFixed(0)}</div>
                                    </div>
                                    {/* Arrow */}
                                    <div className="w-2 h-2 bg-neutral-900 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1 border-r border-b border-neutral-700"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* X-Axis Labels (Dynamic: Start, Middle, End) */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between pl-6 text-[10px] text-text-secondary font-medium uppercase tracking-wide">
                    <span>{formatLabel(data[0])}</span>
                    {data.length > 4 && <span>{formatLabel(data[Math.floor(data.length / 2)])}</span>}
                    <span>{formatLabel(data[data.length - 1])}</span>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: PAGINATION CONTROLS ---
const PaginationControls: React.FC<{ 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    
    return (
        <div className="flex justify-between items-center p-4 border-t border-border bg-surface">
            <button
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Previous
            </button>
            <span className="text-sm text-text-secondary font-medium">
                Page {currentPage} of {totalPages}
            </span>
            <button
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Next
            </button>
        </div>
    );
};

// --- COMPONENT: SECURITY OVERLAY ---
const SecurityOverlay: React.FC<{ onUnlock: (pin: string) => boolean }> = ({ onUnlock }) => {
    const [pin, setPin] = useState('');
    const [isError, setIsError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = onUnlock(pin);
        if (!success) {
            setIsError(true);
            setPin('');
            setTimeout(() => setIsError(false), 500); // Reset shake animation
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-surface-muted/30 backdrop-blur-sm relative overflow-hidden">
            <div className={`w-full max-w-sm bg-surface p-8 rounded-2xl shadow-2xl border border-border text-center relative z-10 transition-transform ${isError ? 'animate-shake' : ''}`}>
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LockIcon className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">Reports Locked</h2>
                <p className="text-text-secondary mb-8 text-sm">Enter your security PIN to view sales data.</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        inputMode="numeric" 
                        pattern="[0-9]*"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className={`w-full text-center text-3xl tracking-[0.5em] py-3 border-b-2 bg-transparent text-text-primary focus:outline-none transition-colors font-mono ${isError ? 'border-red-500 text-red-500' : 'border-border focus:border-primary'}`}
                        placeholder="••••"
                        autoFocus
                        maxLength={6}
                    />
                    {isError && <p className="text-xs text-red-500 font-bold animate-fadeIn">Incorrect PIN</p>}
                    
                    <button 
                        type="submit"
                        className="w-full py-3.5 bg-primary text-primary-content font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 mt-4 active:scale-[0.98]"
                    >
                        Unlock Dashboard
                    </button>
                </form>
            </div>
            {/* Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                 <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-3xl"></div>
                 <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500 blur-3xl"></div>
            </div>
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
            `}</style>
        </div>
    );
};

const ReportsScreen: React.FC = () => {
    const { openDrawer, receipts: contextReceipts, settings, isReportsUnlocked, setReportsUnlocked, paymentTypes } = useAppContext();
    
    // Instead of holding ALL receipts, we only hold receipts for the current view
    const [fetchedReceipts, setFetchedReceipts] = useState<Receipt[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Filters State
    const [filter, setFilter] = useState<DateFilter>('today');
    const [shiftFilter, setShiftFilter] = useState<ShiftFilter>('all');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
    const [customStartDate, setCustomStartDate] = useState(() => new Date().toISOString().slice(0, 16));
    const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().slice(0, 16));
    const [activeTab, setActiveTab] = useState<ReportTab>('overview');
    
    // Sorting State
    const [orderSortConfig, setOrderSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
    const [itemSortConfig, setItemSortConfig] = useState<SortConfig>({ key: 'revenue', direction: 'desc' });

    // Pagination State
    const ITEMS_PER_PAGE = 50;
    const [currentPage, setCurrentPage] = useState(1);

    // Reset pagination when tab or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, filter, shiftFilter, paymentMethodFilter, orderSortConfig, itemSortConfig]);

    // Determine the effective date range based on filter
    const dateRange = useMemo<{ start: Date, end: Date }>(() => {
        let startTime: Date;
        let endTime: Date;

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        // Helper to adjust time based on "HH:MM" string
        const setTime = (baseDate: Date, timeStr: string | undefined, defaultTime: string): Date => {
            const [hours, minutes] = (timeStr || defaultTime).split(':').map(Number);
            const newDate = new Date(baseDate);
            newDate.setHours(hours, minutes, 0, 0);
            return newDate;
        };

        if (filter === 'custom') {
            startTime = new Date(customStartDate);
            endTime = new Date(customEndDate);
        } else {
            let anchorDayStart = new Date(todayStart);
            let anchorDayEnd = new Date(todayEnd);

            if (filter === 'yesterday') {
                anchorDayStart.setDate(todayStart.getDate() - 1);
                anchorDayEnd = new Date(anchorDayStart);
                anchorDayEnd.setHours(23, 59, 59, 999);
            } else if (filter === 'week') {
                anchorDayStart.setDate(todayStart.getDate() - 6);
                anchorDayEnd = todayEnd;
            } else if (filter === 'month') {
                anchorDayStart.setDate(todayStart.getDate() - 29);
                anchorDayEnd = todayEnd;
            }

            // Apply Shift Logic ONLY for 'today' and 'yesterday'
            if (filter === 'today' || filter === 'yesterday') {
                const morningStartStr = settings.shiftMorningStart || '06:00';
                const morningEndStr = settings.shiftMorningEnd || '17:30';
                const nightEndStr = settings.shiftNightEnd || '05:00';

                if (shiftFilter === 'morning') {
                    startTime = setTime(anchorDayStart, morningStartStr, '06:00');
                    endTime = setTime(anchorDayStart, morningEndStr, '17:30');
                } else if (shiftFilter === 'night') {
                    startTime = setTime(anchorDayStart, morningEndStr, '17:30');
                    endTime = setTime(anchorDayStart, nightEndStr, '05:00');
                    endTime.setDate(endTime.getDate() + 1); // Next day
                } else {
                    // shiftFilter === 'all' (All Day)
                    // Configured to cover the full business day: Morning Start -> Night End (Next Day)
                    startTime = setTime(anchorDayStart, morningStartStr, '06:00');
                    endTime = setTime(anchorDayStart, nightEndStr, '05:00');
                    endTime.setDate(endTime.getDate() + 1); // Next day
                }
            } else {
                startTime = anchorDayStart;
                endTime = anchorDayEnd;
            }
        }
        return { start: startTime, end: endTime };
    }, [filter, shiftFilter, customStartDate, customEndDate, settings]);

    // Fetch data whenever date range changes
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                // Fetch only the range we need from IndexedDB
                const rangeData = await idb.getReceiptsByDateRange(dateRange.start, dateRange.end);
                
                // Merge with context receipts (recent unsaved data might be in context)
                const map = new Map<string, Receipt>();
                rangeData.forEach(r => map.set(r.id, r));
                
                // Overlay any matching receipts from the lightweight context
                for (const r of contextReceipts) {
                    const rDate = new Date(r.date);
                    if (rDate < dateRange.start) {
                        break; 
                    }
                    if (rDate <= dateRange.end) {
                        map.set(r.id, r);
                    }
                }

                setFetchedReceipts(Array.from(map.values()));
            } catch (error) {
                console.error("Error fetching reports data:", error);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchData();
    }, [dateRange, contextReceipts]);

    // --- ANALYTICS LOGIC (Runs on the fetched subset) ---
    const { filteredReceipts, metrics } = useMemo(() => {
        // Apply Payment Method Filter
        const filtered = fetchedReceipts.filter(r => {
            return paymentMethodFilter === 'all' || r.paymentMethod === paymentMethodFilter;
        });
        
        // Sort Data (Orders)
        const sorted = [...filtered].sort((a, b) => {
             if (orderSortConfig.key === 'date') {
                 const timeA = new Date(a.date).getTime();
                 const timeB = new Date(b.date).getTime();
                 return orderSortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
             }
             if (orderSortConfig.key === 'total') {
                 return orderSortConfig.direction === 'asc' ? a.total - b.total : b.total - a.total;
             }
             return 0;
        });

        // Aggregate Metrics
        let totalSales = 0;
        let totalOrders = sorted.length;
        const paymentMethods: Record<string, number> = {};
        const itemsSold: Record<string, { count: number, revenue: number, category: string }> = {};
        const salesByCategory: Record<string, number> = {};

        // --- GRAPH BUCKETING ---
        // Decision: Hourly (Today/Yesterday) vs Daily (Week/Month)
        // If range > 48 hours, switch to daily bucketing.
        const durationHours = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60);
        const isDailyMode = durationHours > 48;
        
        let graphData: GraphDataPoint[] = [];

        if (isDailyMode) {
            // --- DAILY BUCKETING ---
            // Aggregate based on "Business Day" (Shift Start)
            const [shiftH, shiftM] = (settings.shiftMorningStart || '06:00').split(':').map(Number);
            const dailyMap = new Map<string, { date: Date, value: number }>();

            // 1. Initialize buckets for continuity (Last 7 or 30 days)
            let pointer = new Date(dateRange.start);
            // Normalize pointer to start of day to avoid skipping
            pointer.setHours(0,0,0,0); 
            
            while(pointer <= dateRange.end) {
                const key = pointer.toISOString().split('T')[0];
                dailyMap.set(key, { date: new Date(pointer), value: 0 });
                pointer.setDate(pointer.getDate() + 1);
            }

            // 2. Aggregate Sales
            sorted.forEach(r => {
                const rDate = new Date(r.date);
                // Adjust to Business Date: Subtract Shift Start Time
                // e.g. If shift starts at 6AM, a 4AM receipt belongs to previous day.
                rDate.setHours(rDate.getHours() - shiftH);
                rDate.setMinutes(rDate.getMinutes() - shiftM);
                
                const key = rDate.toISOString().split('T')[0];
                if (dailyMap.has(key)) {
                    dailyMap.get(key)!.value += r.total;
                }
            });

            graphData = Array.from(dailyMap.values()).map(d => ({
                label: d.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
                value: d.value,
                fullDate: d.date,
                type: 'daily'
            }));

        } else {
            // --- HOURLY BUCKETING ---
            // Construct graph buckets based on dateRange.start -> dateRange.end
            let bucketPointer = new Date(dateRange.start);
            let iterations = 0;
            const maxIterations = 48;
            
            const now = new Date();
            const cutoffTime = filter === 'today' ? now : new Date(8640000000000000); 

            while (bucketPointer < dateRange.end && iterations < maxIterations) {
                iterations++;
                const bucketStart = new Date(bucketPointer);
                const bucketEnd = new Date(bucketPointer);
                bucketEnd.setHours(bucketEnd.getHours() + 1);
                
                if (bucketStart <= cutoffTime) {
                    const label = bucketStart.getHours().toString().padStart(2, '0') + ":00";
                    const bucketSales = sorted.reduce((sum, r) => {
                        const rDate = new Date(r.date);
                        if (rDate >= bucketStart && rDate < bucketEnd) {
                            return sum + r.total;
                        }
                        return sum;
                    }, 0);

                    graphData.push({
                        label,
                        value: bucketSales,
                        fullDate: bucketStart,
                        type: 'hourly'
                    });
                }
                bucketPointer = bucketEnd;
            }
        }
        // --- END GRAPH ---

        sorted.forEach(r => {
            totalSales += r.total;
            paymentMethods[r.paymentMethod] = (paymentMethods[r.paymentMethod] || 0) + r.total;
            
            r.items.forEach((item: any) => {
                if (!itemsSold[item.name]) itemsSold[item.name] = { count: 0, revenue: 0, category: item.category || 'Uncategorized' };
                itemsSold[item.name].count += item.quantity;
                itemsSold[item.name].revenue += (item.price * item.quantity);
                
                const cat = item.category || 'Uncategorized';
                salesByCategory[cat] = (salesByCategory[cat] || 0) + (item.price * item.quantity);
            });
        });

        const allItems = Object.entries(itemsSold)
            .map(([name, data]) => ({ name, ...data }));

        return {
            filteredReceipts: sorted,
            metrics: {
                totalSales,
                totalOrders,
                avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
                paymentMethods,
                topItems: allItems.sort((a,b) => b.revenue - a.revenue).slice(0, 5),
                allItems,
                salesByHour: {}, // Deprecated
                graphData,
                salesByCategory
            }
        };
    }, [fetchedReceipts, paymentMethodFilter, orderSortConfig, dateRange, filter, settings]);

    // Derived state for Sorted Items List
    const sortedItems = useMemo(() => {
        const items = [...metrics.allItems];
        return items.sort((a, b) => {
            let valA: any = a[itemSortConfig.key as keyof typeof a];
            let valB: any = b[itemSortConfig.key as keyof typeof b];
            
            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
                if (valA < valB) return itemSortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return itemSortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            }
            
            return itemSortConfig.direction === 'asc' ? valA - valB : valB - valA;
        });
    }, [metrics.allItems, itemSortConfig]);

    const isLocked = !!settings.reportsPIN && !isReportsUnlocked;

    const handleUnlock = (pin: string) => {
        if (pin === settings.reportsPIN) {
            setReportsUnlocked(true);
            return true;
        }
        return false;
    };
    
    // Sort Handlers
    const handleOrderSort = (key: string) => {
        setOrderSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handleItemSort = (key: string) => {
        setItemSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };
    
    const OrderSortIcon = ({ colKey }: { colKey: string }) => {
        if (orderSortConfig.key !== colKey) return <span className="text-text-muted opacity-30 ml-1">⇅</span>;
        return <span className="text-primary ml-1">{orderSortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    const ItemSortIcon = ({ colKey }: { colKey: string }) => {
        if (itemSortConfig.key !== colKey) return <span className="text-text-muted opacity-30 ml-1">⇅</span>;
        return <span className="text-primary ml-1">{itemSortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    const handleExport = async () => {
        let csv = `REPORT,${new Date().toLocaleString()}\nFilter,${filter}\nTotal Sales,${metrics.totalSales}\n\n`;
        csv += "ID,Date,Method,Total\n";
        filteredReceipts.forEach(r => csv += `${r.id},${new Date(r.date).toLocaleString()},${r.paymentMethod},${r.total}\n`);
        
        const fileName = `sales_report_${Date.now()}.csv`;
        try {
            if (Capacitor.isNativePlatform()) {
                const res = await Filesystem.writeFile({ path: fileName, data: csv, directory: Directory.Documents, encoding: Encoding.UTF8 });
                await Share.share({ url: res.uri });
            } else {
                const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
            }
        } catch (e) { alert("Export failed"); }
    };

    const handleClearFilters = () => {
        setFilter('today');
        setShiftFilter('all');
        setPaymentMethodFilter('all');
    };

    const isFilterActive = filter !== 'today' || shiftFilter !== 'all' || paymentMethodFilter !== 'all';

    const CompactSummary: React.FC = () => (
        <div className="flex flex-wrap gap-4 mb-4">
            <div className="bg-surface px-4 py-3 rounded-xl border border-border shadow-sm flex-1 min-w-[140px] flex justify-between items-center">
                <div>
                    <p className="text-xs text-text-secondary uppercase font-bold tracking-wider">Total Sales</p>
                    <p className="text-xl font-bold text-primary tracking-tight">₹{metrics.totalSales.toFixed(2)}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <DollarSignIcon className="h-5 w-5" />
                </div>
            </div>
            <div className="bg-surface px-4 py-3 rounded-xl border border-border shadow-sm flex-1 min-w-[140px] flex justify-between items-center">
                <div>
                    <p className="text-xs text-text-secondary uppercase font-bold tracking-wider">Total Orders</p>
                    <p className="text-xl font-bold text-text-primary tracking-tight">{metrics.totalOrders}</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                    <ChartIcon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );

    // Pagination Logic: Slice data for current page
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedItems.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedItems, currentPage]);

    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredReceipts.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredReceipts, currentPage]);

    const totalItemPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE);
    const totalOrderPages = Math.ceil(filteredReceipts.length / ITEMS_PER_PAGE);

    return (
        <div className="flex h-full flex-col bg-background overflow-hidden font-sans">
            {/* --- HEADER --- */}
            <header className="flex-shrink-0 bg-surface border-b border-border z-20">
                <div className="h-16 flex items-center justify-between px-4">
                    <div className="flex items-center">
                        <button onClick={openDrawer} className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-muted transition-colors">
                            <MenuIcon className="h-6 w-6" />
                        </button>
                        <h1 className="text-xl font-bold text-text-primary ml-3 tracking-tight">Reports</h1>
                    </div>
                    
                    {!isLocked && (
                        <button onClick={handleExport} className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold">
                            <DownloadIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                    )}
                </div>

                {/* Filters Bar */}
                {!isLocked && (
                    <div className="px-4 pb-3 flex flex-wrap gap-2 items-center justify-between overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2">
                            {/* Date Filter */}
                            <div className="flex bg-surface-muted p-1 rounded-lg">
                                {(['today', 'yesterday', 'week', 'month', 'custom'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${filter === f ? 'bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Shift Filter (Only visible for single days) */}
                            {(filter === 'today' || filter === 'yesterday') && (
                                <div className="flex bg-surface-muted p-1 rounded-lg">
                                    {(['all', 'morning', 'night'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setShiftFilter(s)}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${shiftFilter === s ? 'bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                                        >
                                            {s === 'all' ? 'All Day' : s}
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {isFilterActive && (
                                <button 
                                    onClick={handleClearFilters}
                                    className="p-2 text-text-muted hover:text-red-500 bg-surface-muted hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                    title="Clear Filters"
                                >
                                    <CloseIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {filter === 'custom' && (
                                <div className="flex items-center gap-1 bg-surface-muted px-2 py-1 rounded-lg border border-border text-xs">
                                    <input type="datetime-local" value={customStartDate} onChange={e=>setCustomStartDate(e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 text-text-primary" />
                                    <span className="text-text-muted">-</span>
                                    <input type="datetime-local" value={customEndDate} onChange={e=>setCustomEndDate(e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 text-text-primary" />
                                </div>
                            )}
                            <select
                                value={paymentMethodFilter}
                                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                                className="bg-surface-muted border border-border text-text-primary text-xs font-medium rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            >
                                <option value="all">All Methods</option>
                                {paymentTypes.filter(p => p.enabled).map(pt => (
                                    <option key={pt.id} value={pt.name}>{pt.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </header>

            {/* --- CONTENT AREA --- */}
            {isLocked ? (
                <SecurityOverlay onUnlock={handleUnlock} />
            ) : isLoadingData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                    <p className="text-sm">Calculating reports...</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Navigation Tabs */}
                    <div className="px-4 border-b border-border bg-surface flex-shrink-0">
                        <nav className="flex gap-6">
                            {[
                                { id: 'overview', label: 'Overview' },
                                { id: 'items', label: 'Items Sold' },
                                { id: 'orders', label: 'Order Log' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as ReportTab)}
                                    className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-surface-muted/30">
                        {activeTab === 'overview' && (
                            <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
                                {/* Scorecards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <StatCard 
                                        title="Total Sales" 
                                        value={`₹${metrics.totalSales.toFixed(2)}`} 
                                        icon={<DollarSignIcon className="h-6 w-6 text-emerald-600" />} 
                                        colorClass="bg-emerald-100 dark:bg-emerald-900/30"
                                    />
                                    <StatCard 
                                        title="Total Orders" 
                                        value={metrics.totalOrders.toString()} 
                                        icon={<ChartIcon className="h-6 w-6 text-blue-600" />} 
                                        colorClass="bg-blue-100 dark:bg-blue-900/30"
                                    />
                                    <StatCard 
                                        title="Avg. Order Value" 
                                        value={`₹${metrics.avgOrderValue.toFixed(2)}`} 
                                        icon={<CheckIcon className="h-6 w-6 text-purple-600" />} 
                                        colorClass="bg-purple-100 dark:bg-purple-900/30"
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Sales Activity Chart (Hourly or Daily) */}
                                    <SalesActivityChart data={metrics.graphData} />

                                    {/* Payment Methods Breakdown */}
                                    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
                                        <h3 className="text-lg font-bold text-text-primary mb-4">Payment Methods</h3>
                                        <div className="space-y-4">
                                            {Object.entries(metrics.paymentMethods).map(([method, value]) => (
                                                <div key={method}>
                                                    <div className="flex justify-between text-sm mb-1.5">
                                                        <span className="font-medium text-text-primary">{method}</span>
                                                        <span className="text-text-secondary font-mono">₹{(value as number).toFixed(0)}</span>
                                                    </div>
                                                    <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden">
                                                        <div 
                                                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                                                            style={{ width: `${((value as number) / metrics.totalSales) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                            {Object.keys(metrics.paymentMethods).length === 0 && <p className="text-text-muted text-sm text-center italic">No data available</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'items' && (
                            <div className="space-y-4 animate-fadeIn">
                                <CompactSummary />
                                <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead className="bg-surface-muted">
                                            <tr>
                                                <th 
                                                    className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors select-none group"
                                                    onClick={() => handleItemSort('name')}
                                                >
                                                    Item Name <ItemSortIcon colKey="name" />
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Category</th>
                                                <th 
                                                    className="px-6 py-3 text-right text-xs font-bold text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors select-none group"
                                                    onClick={() => handleItemSort('count')}
                                                >
                                                    Sold <ItemSortIcon colKey="count" />
                                                </th>
                                                <th 
                                                    className="px-6 py-3 text-right text-xs font-bold text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors select-none group"
                                                    onClick={() => handleItemSort('revenue')}
                                                >
                                                    Revenue <ItemSortIcon colKey="revenue" />
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-surface divide-y divide-border">
                                            {paginatedItems.map((item) => (
                                                <tr key={item.name} className="hover:bg-surface-muted/50 transition-colors">
                                                    <td className="px-6 py-3.5 whitespace-nowrap text-sm font-medium text-text-primary">{item.name}</td>
                                                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-text-secondary">{item.category}</td>
                                                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-text-secondary text-right font-mono">{item.count}</td>
                                                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-text-primary font-bold text-right font-mono">₹{item.revenue.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            {sortedItems.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-text-muted">No items found for this period.</td></tr>}
                                        </tbody>
                                    </table>
                                    <PaginationControls 
                                        currentPage={currentPage} 
                                        totalPages={totalItemPages} 
                                        onPageChange={setCurrentPage} 
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="space-y-4 animate-fadeIn">
                                <CompactSummary />
                                <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead className="bg-surface-muted">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Receipt ID</th>
                                                <th 
                                                    className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors select-none group"
                                                    onClick={() => handleOrderSort('date')}
                                                >
                                                    Date <OrderSortIcon colKey="date"/>
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Payment</th>
                                                <th 
                                                    className="px-6 py-3 text-right text-xs font-bold text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors select-none group"
                                                    onClick={() => handleOrderSort('total')}
                                                >
                                                    Total <OrderSortIcon colKey="total"/>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-surface divide-y divide-border">
                                            {paginatedOrders.map((r) => (
                                                <tr key={r.id} className="hover:bg-surface-muted/50 transition-colors">
                                                    <td className="px-6 py-3.5 text-xs font-mono text-text-secondary">#{r.id.slice(-6)}</td>
                                                    <td className="px-6 py-3.5 text-sm text-text-primary">{new Date(r.date).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                                                    <td className="px-6 py-3.5 text-sm text-text-secondary capitalize">{r.paymentMethod}</td>
                                                    <td className="px-6 py-3.5 text-sm font-bold text-text-primary text-right font-mono">₹{r.total.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            {filteredReceipts.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-text-muted">No orders found for this period.</td></tr>}
                                        </tbody>
                                    </table>
                                    <PaginationControls 
                                        currentPage={currentPage} 
                                        totalPages={totalOrderPages} 
                                        onPageChange={setCurrentPage} 
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsScreen;

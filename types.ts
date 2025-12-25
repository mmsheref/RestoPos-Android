
import { User } from 'firebase/auth';

// ==========================================
// DOMAIN: GLOBAL
// ==========================================

export type Theme = 'light' | 'dark' | 'system';

// ==========================================
// DOMAIN: INVENTORY & ITEMS
// ==========================================

/**
 * Represents a single sellable product in the inventory.
 * @property {string} id - Unique identifier (e.g., 'I12345').
 * @property {string} name - Display name of the item.
 * @property {number} price - Unit price in the currency.
 * @property {number} stock - Current inventory count.
 * @property {string} imageUrl - Base64 string or URL of the item image.
 * @property {string} [category] - Optional grouping tag (e.g., 'Drinks').
 */
export interface Item {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  category?: string;
}

/**
 * Represents an item currently inside a shopping cart or order.
 * Extends the base Item with quantity and a unique line ID.
 */
export interface OrderItem extends Item {
  /** Quantity of this item in the cart */
  quantity: number;
  /** 
   * A unique ID for this specific line in the cart. 
   * Essential for distinguishing between two separate lines of the same item 
   * (e.g., one "Burger" with no onions, one "Burger" with extra cheese).
   */
  lineItemId: string;
}

// ==========================================
// DOMAIN: PAYMENT & TRANSACTIONS
// ==========================================

/**
 * Defines the visual icon used for a payment button.
 */
export type PaymentTypeIcon = 'cash' | 'upi' | 'card' | 'generic';

/**
 * Defines the behavior of a payment method.
 * - 'cash': Triggers change calculation.
 * - 'other': Assumes exact amount payment.
 */
export type PaymentMethodType = 'cash' | 'other';

/**
 * Configuration for a payment method available in the app.
 */
export interface PaymentType {
  id: string;
  name: string;
  icon: PaymentTypeIcon;
  type: PaymentMethodType;
  enabled: boolean;
}

/**
 * Detail for a single part of a split payment.
 * Used when a bill is paid using multiple methods (e.g., ₹100 Cash + ₹50 Card).
 */
export interface SplitPaymentDetail {
  method: string;
  amount: number;
}

/**
 * Represents a completed, immutable transaction record.
 */
export interface Receipt {
  id: string;
  date: Date;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  /** If the payment was split, details are stored here. */
  splitDetails?: SplitPaymentDetail[];
}

/**
 * Represents an order temporarily saved to the "Open Tickets" list.
 * Useful for restaurant table management.
 */
export interface SavedTicket {
  id: string;
  name: string;
  items: OrderItem[];
  /** Timestamp of when the ticket was last updated */
  lastModified?: number;
}

/**
 * Configuration for a quick-select table button (e.g., "Table 1").
 */
export interface Table {
  id: string;
  name: string;
  order: number;
}

// ==========================================
// DOMAIN: HARDWARE & CONFIG
// ==========================================

export type PrinterInterfaceType = 'Bluetooth' | 'Ethernet' | 'USB';
export type PrinterPaperWidth = '58mm' | '80mm';

/**
 * Configuration for a thermal receipt printer.
 */
export interface Printer {
  id:string;
  name: string;
  interfaceType: PrinterInterfaceType;
  paperWidth: PrinterPaperWidth;
  address?: string; // MAC address (BT) or IP (Ethernet)
}

/**
 * Global application settings.
 */
export interface AppSettings {
  taxEnabled: boolean;
  taxRate: number;
  storeName?: string;
  storeAddress?: string;
  receiptFooter?: string;
  /** Encrypted or plain-text PIN for accessing restricted areas */
  reportsPIN?: string;
  
  // New Fields for V2.3
  currencySymbol?: string;
  timezone?: string;
  language?: string;
  
  // Notifications
  notificationsEnabled?: boolean;
  notifyLowStock?: boolean;
  lowStockThreshold?: number;
  notifyDailySummary?: boolean;
  dailySummaryTime?: string; // "HH:MM"

  // Shift Configuration
  shiftMorningStart?: string; // e.g. "06:00"
  shiftMorningEnd?: string;   // e.g. "17:30" (Also acts as Night Start)
  shiftNightEnd?: string;     // e.g. "05:00" (Next Day)
}

/**
 * Represents a customizable grid layout for the Sales screen.
 */
export interface CustomGrid {
  id: string;
  name: string;
  /** 
   * An array representing the 5x4 grid slots. 
   * Contains Item IDs or null for empty slots.
   */
  itemIds: (string | null)[];
  order?: number;
}

/**
 * Structure for the full JSON backup file.
 */
export interface BackupData {
  version: string;
  timestamp: string;
  settings: AppSettings;
  items: Item[];
  printers: Printer[];
  receipts: Receipt[];
  savedTickets?: SavedTicket[];
  customGrids?: CustomGrid[];
  paymentTypes?: PaymentType[];
  tables?: Table[];
}

// ==========================================
// DOMAIN: STATE MANAGEMENT
// ==========================================

/**
 * The Shape of the Global App Context.
 * Contains all state and actions available throughout the application.
 */
export interface AppContextType {
  // --- Authentication ---
  user: User | null;
  signOut: () => void;
  
  // --- UI State ---
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  headerTitle: string;
  setHeaderTitle: (title: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  showOnboarding: boolean;
  completeOnboarding: () => Promise<boolean>;
  isLoading: boolean;

  // --- Configuration ---
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  // --- Hardware ---
  printers: Printer[];
  addPrinter: (printer: Printer) => void;
  removePrinter: (printerId: string) => void;

  // --- Master Data (CRUD) ---
  paymentTypes: PaymentType[];
  addPaymentType: (paymentType: Omit<PaymentType, 'id' | 'enabled' | 'type'>) => void;
  updatePaymentType: (paymentType: PaymentType) => void;
  removePaymentType: (paymentTypeId: string) => void;
  
  receipts: Receipt[];
  addReceipt: (receipt: Receipt) => void;
  loadMoreReceipts: () => Promise<void>;
  hasMoreReceipts: boolean;
  deleteReceipt: (id: string) => Promise<void>;
  
  items: Item[];
  addItem: (item: Item) => void;
  updateItem: (item: Item) => void;
  deleteItem: (id: string) => void;

  savedTickets: SavedTicket[];
  saveTicket: (ticket: SavedTicket) => void;
  removeTicket: (ticketId: string) => void;
  mergeTickets: (ticketIds: string[], newName: string) => Promise<void>;

  customGrids: CustomGrid[];
  addCustomGrid: (grid: CustomGrid) => void;
  updateCustomGrid: (grid: CustomGrid) => void;
  deleteCustomGrid: (id: string) => void;
  setCustomGrids: (grids: CustomGrid[]) => void;

  tables: Table[];
  addTable: (name: string) => void;
  updateTable: (table: Table) => void;
  setTables: (tables: Table[]) => void;
  removeTable: (tableId: string) => void;

  // --- Sales Screen State ---
  activeGridId: string;
  setActiveGridId: (id: string) => void;

  // --- Cart / Ticket Logic ---
  currentOrder: OrderItem[];
  addToOrder: (item: Item) => void;
  removeFromOrder: (lineItemId: string) => void;
  deleteLineItem: (lineItemId: string) => void;
  updateOrderItemQuantity: (lineItemId: string, newQuantity: number) => void;
  clearOrder: () => void;
  loadOrder: (items: OrderItem[]) => void;
  
  // --- Security ---
  isReportsUnlocked: boolean;
  setReportsUnlocked: (unlocked: boolean) => void;

  // --- Backup & Utilities ---
  exportData: () => void;
  restoreData: (data: BackupData) => void;
  exportItemsCsv: () => void;
  replaceItems: (items: Item[]) => void;
}

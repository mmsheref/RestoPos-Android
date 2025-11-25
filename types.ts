import { User } from 'firebase/auth';

/**
 * Represents a single sellable item in the inventory.
 */
export interface Item {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  /** Optional category for filtering and organization. */
  category?: string;
}

/**
 * Represents an item that has been added to the current order, including its quantity.
 * A unique lineItemId allows for multiple lines of the same item in an order.
 */
export interface OrderItem extends Item {
  quantity: number;
  /** A unique identifier for this specific line item in the order. Essential for allowing multiple lines of the same item. */
  lineItemId: string;
}

/**
 * Defines the available icons for different payment types.
 */
export type PaymentTypeIcon = 'cash' | 'upi' | 'card' | 'generic';

/**
 * Defines the behavior of a payment type.
 * 'cash' types are used for transactions where change may be calculated.
 * 'other' types are for exact-amount payments (e.g., card, UPI).
 */
export type PaymentMethodType = 'cash' | 'other';

/**
 * Represents a configurable payment method in the system.
 */
export interface PaymentType {
  id: string;
  name: string;
  icon: PaymentTypeIcon;
  type: PaymentMethodType;
  enabled: boolean;
}


/**
 * Represents a completed transaction record.
 */
export interface Receipt {
  id: string;
  date: Date;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
}

/**
 * Represents an order that has been saved to be recalled later.
 */
export interface SavedTicket {
  id: string;
  name: string;
  items: OrderItem[];
}

/**
 * Represents a configurable table for quick-saving tickets.
 */
export interface Table {
  id: string;
  name: string;
  order: number;
}

/** Defines the connection interface type for a printer. */
export type PrinterInterfaceType = 'Bluetooth' | 'Ethernet' | 'USB';
/** Defines the paper width for a receipt printer. */
export type PrinterPaperWidth = '58mm' | '80mm';

/**
 * Represents a configured printer device.
 */
export interface Printer {
  id:string;
  name: string;
  interfaceType: PrinterInterfaceType;
  paperWidth: PrinterPaperWidth;
  address?: string; // MAC address (BT) or IP (Ethernet)
}

/**
 * Represents the application's configurable settings.
 */
export interface AppSettings {
  taxEnabled: boolean;
  taxRate: number;
  storeName?: string;
  storeAddress?: string;
  receiptFooter?: string;
  instagramHandle?: string;
}

/**
 * Represents a custom grid layout for the sales screen.
 */
export interface CustomGrid {
  id: string;
  name: string;
  /** An array of 20 item IDs or nulls representing the 5x4 grid layout. */
  itemIds: (string | null)[];
  /** The display order of the grid tab. */
  order?: number;
}

/**
 * Defines the structure for a full application data backup.
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


/**
 * The shape of the global application context.
 * Provides state and actions to all components.
 */
export interface AppContextType {
  user: User | null;
  signOut: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  headerTitle: string;
  setHeaderTitle: (title: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Onboarding
  showOnboarding: boolean;
  completeOnboarding: () => void;

  // Data
  isLoading: boolean;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  printers: Printer[];
  addPrinter: (printer: Printer) => void;
  removePrinter: (printerId: string) => void;

  paymentTypes: PaymentType[];
  addPaymentType: (paymentType: Omit<PaymentType, 'id' | 'enabled' | 'type'>) => void;
  updatePaymentType: (paymentType: PaymentType) => void;
  removePaymentType: (paymentTypeId: string) => void;
  
  receipts: Receipt[];
  addReceipt: (receipt: Receipt) => void;
  loadMoreReceipts: () => Promise<void>;
  hasMoreReceipts: boolean;
  
  items: Item[];
  addItem: (item: Item) => void;
  updateItem: (item: Item) => void;
  deleteItem: (id: string) => void;

  savedTickets: SavedTicket[];
  saveTicket: (ticket: SavedTicket) => void;
  removeTicket: (ticketId: string) => void;

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

  // --- START: Global Ticket State ---
  // The active order, managed globally to persist across UI changes like theme switching.
  currentOrder: OrderItem[];
  addToOrder: (item: Item) => void;
  removeFromOrder: (lineItemId: string) => void;
  deleteLineItem: (lineItemId: string) => void;
  updateOrderItemQuantity: (lineItemId: string, newQuantity: number) => void;
  clearOrder: () => void;
  loadOrder: (items: OrderItem[]) => void;
  // --- END: Global Ticket State ---

  // Backup
  exportData: () => void;
  restoreData: (data: BackupData) => void;
  exportItemsCsv: () => void;
  replaceItems: (items: Item[]) => void;
}
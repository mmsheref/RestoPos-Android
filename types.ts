
export interface Item {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  // FIX: Add optional category property to be used in filtering and management.
  category?: string;
}

export interface OrderItem extends Item {
  quantity: number;
}

export type PaymentTypeIcon = 'cash' | 'qr' | 'card' | 'generic';
export type PaymentMethodType = 'cash' | 'other';

export interface PaymentType {
  id: string;
  name: string;
  icon: PaymentTypeIcon;
  type: PaymentMethodType;
  enabled: boolean;
}


export interface Receipt {
  id: string;
  date: Date;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
}

export interface SavedTicket {
  id: string;
  name: string;
  items: OrderItem[];
}

export type PrinterInterfaceType = 'Bluetooth' | 'Ethernet' | 'USB';
export type PrinterPaperWidth = '58mm' | '80mm';

export interface Printer {
  id: string;
  name: string;
  interfaceType: PrinterInterfaceType;
  paperWidth: PrinterPaperWidth;
  address?: string; // MAC address (BT) or IP (Ethernet)
}

export interface AppSettings {
  taxEnabled: boolean;
  taxRate: number;
  storeName?: string;
  storeAddress?: string;
  receiptFooter?: string;
}

export interface CustomGrid {
  id: string;
  name: string;
  itemIds: (string | null)[]; // Array of 20 items (5x4 grid), null for empty
  order?: number;
}

export interface BackupData {
  version: string;
  timestamp: string;
  settings: AppSettings;
  items: Item[];
  categories: string[];
  printers: Printer[];
  receipts: Receipt[];
  savedTickets?: SavedTicket[];
  customGrids?: CustomGrid[];
  paymentTypes?: PaymentType[];
}
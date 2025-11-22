
export interface Item {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
}

export interface OrderItem extends Item {
  quantity: number;
}

export interface Receipt {
  id: string;
  date: Date;
  items: OrderItem[];
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'QR';
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
}

export interface BackupData {
  version: string;
  timestamp: string;
  settings: AppSettings;
  items: Item[];
  categories: string[];
  printers: Printer[];
  receipts: Receipt[];
}

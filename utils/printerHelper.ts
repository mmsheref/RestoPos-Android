
/**
 * PRINTER HELPER
 * 
 * Required Plugins for Native Device functionality:
 * 
 * 1. Bluetooth Serial (for printing)
 *    > npm install cordova-plugin-bluetooth-serial
 * 
 * 2. Android Permissions (for Android 12+ Bluetooth scan permissions)
 *    > npm install cordova-plugin-android-permissions
 * 
 * After installing, run:
 *    > npx cap sync
 */

import { AppSettings, OrderItem, Printer } from '../types';
import { requestAppPermissions } from './permissions';

declare global {
  interface Window {
    bluetoothSerial: any;
  }
}

// Basic ESC/POS Commands
const ESC = '\x1b';
const GS = '\x1d';
const COMMANDS = {
  INIT: ESC + '@',
  CENTER: ESC + 'a' + '\x01',
  LEFT: ESC + 'a' + '\x00',
  RIGHT: ESC + 'a' + '\x02',
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  CUT: GS + 'V' + '\x41' + '\x00',
  
  // Font Sizing (ESC ! n)
  // n = 0 (Normal)
  // n = 16 (Double Height)
  // n = 32 (Double Width)
  // n = 48 (Double Width + Double Height)
  TXT_NORMAL: ESC + '!' + '\x00',
  TXT_2HEIGHT: ESC + '!' + '\x10',
  TXT_2WIDTH: ESC + '!' + '\x20',
  TXT_4SQUARE: ESC + '!' + '\x30', 
};

/**
 * Connects to a specific Bluetooth device.
 */
const connectToPrinter = (address: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    window.bluetoothSerial.connect(
      address,
      () => {
        console.log("Printer Connected:", address);
        resolve();
      },
      (err: any) => {
        console.error("Connection failed:", err);
        reject(new Error(`Could not connect to printer. Please ensure it is turned on and in range.`));
      }
    );
  });
};

/**
 * Disconnects from the currently connected device.
 */
const disconnectFromPrinter = (): Promise<void> => {
    return new Promise((resolve) => {
        if (window.bluetoothSerial) {
            window.bluetoothSerial.disconnect(
                () => {
                    console.log("Printer Disconnected.");
                    resolve();
                },
                () => {
                    console.warn("Failed to disconnect, or was not connected.");
                    resolve(); 
                }
            );
        } else {
            resolve();
        }
    });
};

/**
 * Checks if Bluetooth is enabled on the device.
 */
const checkBluetoothEnabled = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.bluetoothSerial) {
        // If plugin is missing (web), assume enabled/simulated
        resolve();
        return;
    }
    window.bluetoothSerial.isEnabled(
      () => resolve(),
      () => reject(new Error("Bluetooth is disabled. Please enable it in Settings."))
    );
  });
};

/**
 * Creates a smart row with Left and Right alignment.
 * Automatically truncates the Left text if it overlaps with the Right text.
 * Puts at least 1 space between them.
 */
const createRow = (left: string, right: string, width: number): string => {
    const minSpace = 1;
    const maxLeftLen = width - right.length - minSpace;
    
    let cleanLeft = left;
    if (cleanLeft.length > maxLeftLen) {
        cleanLeft = cleanLeft.substring(0, maxLeftLen - 1) + '.';
    }
    
    const spaceCount = width - cleanLeft.length - right.length;
    return cleanLeft + ' '.repeat(Math.max(0, spaceCount)) + right + '\n';
};

const createDivider = (width: number): string => '-'.repeat(width) + '\n';

const formatCurrency = (amount: number) => amount.toFixed(2);

/**
 * Consolidates multiple lines of the same item into a single line with summed quantity.
 * This now uses a composite key to correctly handle variable-priced items.
 */
const consolidateItems = (items: OrderItem[]): OrderItem[] => {
    const consolidated = new Map<string, OrderItem>();
    items.forEach(item => {
        const key = `${item.id}-${item.price}`; // Use composite key for accuracy
        const existing = consolidated.get(key);
        if (existing) {
            consolidated.set(key, { ...existing, quantity: existing.quantity + item.quantity });
        } else {
            consolidated.set(key, { ...item }); 
        }
    });
    return Array.from(consolidated.values());
};


interface PrintBillArgs {
  items: OrderItem[];
  total: number;
  subtotal: number;
  tax: number;
  ticketName?: string;
  settings: AppSettings;
  printer?: Printer;
}

export interface PrintReceiptArgs extends PrintBillArgs {
    receiptId: string;
    paymentMethod: string;
    date: Date;
}

const sendToPrinter = async (data: string, printer: Printer): Promise<{ success: boolean; message: string }> => {
    // Web Fallback
    if (!window.bluetoothSerial) {
        console.log("--- SIMULATED PRINT ---");
        console.log(data.replace(/[\x1b\x1d]/g, '')); 
        //alert(`Simulated Print to ${printer.name}`);
        return { success: true, message: "Simulated print successful" };
    }

    // Native Logic
    if (printer.interfaceType !== 'Bluetooth' || !printer.address) {
        return { success: false, message: "Only Bluetooth printers with a valid MAC address are supported." };
    }

    try {
        // 1. Check Permissions
        const hasPermission = await requestAppPermissions();
        if (!hasPermission) return { success: false, message: "Bluetooth permissions denied." };

        // 2. Check Enabled Status (Prevent Crash)
        await checkBluetoothEnabled();

        // 3. Connect
        await connectToPrinter(printer.address);

        // 4. Write
        await new Promise<void>((resolve, reject) => {
            window.bluetoothSerial.write(data, 
                () => resolve(), 
                (err: any) => {
                    console.error("Bluetooth write failed:", err);
                    const message = typeof err === 'string' ? err : (err?.message || 'Unknown write error');
                    reject(new Error(message));
                }
            );
        });

        return { success: true, message: "Data sent to printer." };
    } catch (error: any) {
        return { success: false, message: error.message || "An unknown printing error occurred." };
    } finally {
        await disconnectFromPrinter();
    }
}


export const testPrint = async (printer: Printer, settings?: AppSettings): Promise<{ success: boolean; message: string }> => {
    let data = COMMANDS.INIT;
    data += COMMANDS.TXT_2WIDTH;
    data += COMMANDS.CENTER + COMMANDS.BOLD_ON + "TEST PRINT\n" + COMMANDS.BOLD_OFF + COMMANDS.TXT_NORMAL;
    data += "If you can read this,\nprinter is configured.\n";
    data += "\n\n" + COMMANDS.CUT;
    return sendToPrinter(data, printer);
};

export const printBill = async (args: PrintBillArgs): Promise<{ success: boolean; message: string }> => {
    const { items, total, settings, printer, ticketName } = args;

    if (!printer) {
      return { success: false, message: "No printer configured." };
    }
    
    // Config
    const width = printer.paperWidth === '80mm' ? 48 : 32;
    const consolidatedItems = consolidateItems(items);
    
    const newLine = '\n\n';

    // 1. Init & Header
    let data = COMMANDS.INIT + COMMANDS.CENTER;
    
    if(settings.storeName) {
        const safeName = settings.storeName.replace(/[\r\n]+/g, ' ').trim().toUpperCase();
        data += COMMANDS.TXT_2WIDTH;
        data += COMMANDS.BOLD_ON + safeName + '\n' + COMMANDS.BOLD_OFF + COMMANDS.TXT_NORMAL;
    }
    data += "ESTIMATE / BILL\n";
    
    if (ticketName) {
        data += `Ticket: ${ticketName}\n`;
    }
    
    data += COMMANDS.LEFT;
    data += createDivider(width);

    // 2. Items (Compact Format)
    consolidatedItems.forEach(item => {
        const lineTotal = formatCurrency(item.price * item.quantity);
        // Format: "50 x 2 Burger ............ 100.00"
        const leftText = `${item.price.toFixed(0)} x ${item.quantity} ${item.name}`;
        data += createRow(leftText, lineTotal, width);
    });
    data += createDivider(width);

    // 3. Totals
    data += COMMANDS.CENTER + COMMANDS.BOLD_ON + COMMANDS.TXT_4SQUARE;
    data += "TOTAL: " + formatCurrency(total);
    data += COMMANDS.TXT_NORMAL + COMMANDS.BOLD_OFF + "\n";
    
    data += newLine + COMMANDS.CUT;
    
    return sendToPrinter(data, printer);
};

export const printReceipt = async (args: PrintReceiptArgs): Promise<{ success: boolean; message: string }> => {
    const { items, total, subtotal, tax, receiptId, paymentMethod, settings, printer, date } = args;
    
    if (!printer) {
      return { success: false, message: "No printer configured." };
    }
    
    const width = printer.paperWidth === '80mm' ? 48 : 32;
    const consolidatedItems = consolidateItems(items);
    const receiptDate = date; // Use the provided date
    const dateStr = receiptDate.toLocaleDateString();
    const timeStr = receiptDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const newLine = '\n\n';

    // 1. Init & Header
    let data = COMMANDS.INIT + COMMANDS.CENTER;
    
    if (settings.storeName) {
        const safeName = settings.storeName.replace(/[\r\n]+/g, ' ').trim().toUpperCase();
        data += COMMANDS.TXT_2WIDTH;
        data += COMMANDS.BOLD_ON + safeName + '\n' + COMMANDS.BOLD_OFF + COMMANDS.TXT_NORMAL;
    }
    
    if (settings.storeAddress) {
        const safeAddr = settings.storeAddress.replace(/[\r\n]+/g, ' ').trim();
        data += safeAddr + '\n';
    }
    
    data += '\n'; // Spacer
    
    // 2. Meta
    data += COMMANDS.LEFT;
    
    const metaLeft = `${dateStr} ${timeStr}`;
    const metaRight = `#${receiptId.slice(-4)}`;
    data += createRow(metaLeft, metaRight, width);

    data += createDivider(width);
    
    // 3. Items
    consolidatedItems.forEach(item => {
        const lineTotal = formatCurrency(item.price * item.quantity);
        // Format: "50 x 2 Burger ............ 100.00"
        const leftText = `${item.price.toFixed(0)} x ${item.quantity} ${item.name}`;
        data += createRow(leftText, lineTotal, width);
    });
    data += createDivider(width);
    
    // 4. Totals
    if (settings.taxEnabled) {
         data += createRow('Subtotal', formatCurrency(subtotal), width);
         data += createRow(`Tax (${settings.taxRate}%)`, formatCurrency(tax), width);
         data += createDivider(width);
    }
    
    data += COMMANDS.CENTER + COMMANDS.BOLD_ON + COMMANDS.TXT_4SQUARE;
    data += "TOTAL: " + formatCurrency(total) + "\n";
    data += COMMANDS.TXT_NORMAL + COMMANDS.BOLD_OFF + COMMANDS.LEFT; // Reset
    
    data += '\n';
    data += createRow('Paid via:', paymentMethod, width);

    // 5. Footer
    data += createDivider(width);
    data += COMMANDS.CENTER;
    if(settings.receiptFooter) {
        const safeFooter = settings.receiptFooter.replace(/[\r\n]+/g, ' ').trim();
        data += safeFooter + '\n';
    }
    data += "Thank you for visiting!\n";
    
    // Cut command usually needs a few line feeds to push paper out
    data += newLine + COMMANDS.CUT;
    
    return sendToPrinter(data, printer);
};

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
 * This is crucial to run after every print job to avoid stale connections.
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
                    // Failure to disconnect is usually not critical, as it might already be disconnected.
                    console.warn("Failed to disconnect, or was not connected.");
                    resolve(); 
                }
            );
        } else {
            resolve();
        }
    });
};

const createLine = (left: string, right: string, width: number): string => {
    const space = width - left.length - right.length;
    return left + ' '.repeat(Math.max(0, space)) + right + '\n';
};

const createDivider = (width: number): string => '-'.repeat(width) + '\n';

// --- NEW Bill/Receipt Interfaces ---
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
    // FIX: Changed type from specific literals to string to support custom payment methods.
    paymentMethod: string;
}

// Refactors the core printing logic to be reusable
const sendToPrinter = async (data: string, printer: Printer): Promise<{ success: boolean; message: string }> => {
    // Web Fallback
    if (!window.bluetoothSerial) {
        console.log("--- SIMULATED PRINT ---");
        console.log(data.replace(/[\x1b\x1d]/g, '')); // Log cleaned data for readability
        alert(`Simulated Print to ${printer.name}`);
        return { success: true, message: "Simulated print successful" };
    }

    // Native Logic
    if (printer.interfaceType !== 'Bluetooth' || !printer.address) {
        return { success: false, message: "Only Bluetooth printers with a valid MAC address are supported." };
    }

    try {
        const hasPermission = await requestAppPermissions();
        if (!hasPermission) return { success: false, message: "Bluetooth permissions denied." };

        await connectToPrinter(printer.address);

        await new Promise<void>((resolve, reject) => {
            window.bluetoothSerial.write(data, 
                () => resolve(), 
                // FIX: Do not JSON.stringify the raw error object from the plugin, as it may contain circular references.
                // Instead, safely extract a message for propagation.
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


/**
 * Sends a small test print to verify configuration and connectivity.
 */
export const testPrint = async (printer: Printer): Promise<{ success: boolean; message: string }> => {
    const paperWidthChars = printer.paperWidth === '80mm' ? 48 : 32;
    const divider = createDivider(paperWidthChars);
    
    let data = COMMANDS.INIT;
    data += COMMANDS.CENTER + COMMANDS.BOLD_ON + "TEST PRINT\n" + COMMANDS.BOLD_OFF;
    data += divider;
    data += COMMANDS.LEFT;
    data += `Device: ${printer.name}\n`;
    if(printer.address) data += `Addr: ${printer.address}\n`;
    data += "Status: Connected\n";
    data += divider;
    data += COMMANDS.CENTER + "It Works!\n";
    data += "\n\n\n" + COMMANDS.CUT;

    return sendToPrinter(data, printer);
};

// New function for pre-payment bills
export const printBill = async (args: PrintBillArgs): Promise<{ success: boolean; message: string }> => {
    const { items, total, subtotal, tax, ticketName, settings, printer } = args;

    if (!printer) {
      alert("No printer configured. Please add a printer in Settings.");
      return { success: false, message: "No printer configured." };
    }
    
    const paperWidthChars = printer.paperWidth === '80mm' ? 48 : 32;
    const divider = createDivider(paperWidthChars);

    let data = COMMANDS.INIT;
    if(settings.storeName) data += COMMANDS.CENTER + COMMANDS.BOLD_ON + settings.storeName.toUpperCase() + '\n' + COMMANDS.BOLD_OFF;
    if(settings.storeAddress) data += COMMANDS.CENTER + settings.storeAddress + '\n';
    data += '\n';
    data += COMMANDS.LEFT + `Cashier: Admin\nPOS: 1\n`;
    if(ticketName) data += `Ticket: ${ticketName}\n`;
    data += divider;

    items.forEach(item => {
        const lineTotal = (item.price * item.quantity).toFixed(2);
        const namePart = item.name.length > (paperWidthChars - 10) ? item.name.substring(0, paperWidthChars - 10) : item.name;
        data += createLine(namePart, `${lineTotal}`, paperWidthChars);
        data += `  ${item.quantity} x ${item.price.toFixed(2)}\n`;
    });
    data += divider;

    data += createLine('Subtotal', `${subtotal.toFixed(2)}`, paperWidthChars);
    if (settings.taxEnabled) data += createLine(`GST (${settings.taxRate}%)`, `${tax.toFixed(2)}`, paperWidthChars);
    data += COMMANDS.BOLD_ON + createLine('TOTAL', `${total.toFixed(2)}`, paperWidthChars) + COMMANDS.BOLD_OFF;
    
    data += '\n' + COMMANDS.CENTER + '--- THIS IS NOT A RECEIPT ---\n';
    data += "\n\n\n" + COMMANDS.CUT;
    
    return sendToPrinter(data, printer);
};

// Re-implement printReceipt with full customization
export const printReceipt = async (args: PrintReceiptArgs): Promise<{ success: boolean; message: string }> => {
    const { items, total, subtotal, tax, receiptId, paymentMethod, settings, printer } = args;
    
    if (!printer) {
      alert("No printer configured. Please add a printer in Settings.");
      return { success: false, message: "No printer configured." };
    }
    
    const paperWidthChars = printer.paperWidth === '80mm' ? 48 : 32;
    const divider = createDivider(paperWidthChars);
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    // 1. Header
    let data = COMMANDS.INIT;
    if (settings.storeName) data += COMMANDS.CENTER + COMMANDS.BOLD_ON + settings.storeName.toUpperCase() + '\n' + COMMANDS.BOLD_OFF;
    if (settings.storeAddress) data += COMMANDS.CENTER + settings.storeAddress.replace(/[\r\n]+/g, ' ') + '\n';
    data += '\n';
    
    // 2. Meta
    data += COMMANDS.LEFT + `Cashier: Admin\nPOS: 1\n`;
    data += divider;
    
    // 3. Items
    items.forEach(item => {
        const lineTotal = (item.price * item.quantity).toFixed(2);
        const namePart = item.name.length > (paperWidthChars - 12) ? item.name.substring(0, paperWidthChars - 12) : item.name;
        data += createLine(namePart, `${lineTotal}`, paperWidthChars);
        data += `  ${item.quantity} x ${item.price.toFixed(2)}\n`;
    });
    data += divider;
    
    // 4. Totals
    data += createLine('Subtotal', `${subtotal.toFixed(2)}`, paperWidthChars);
    if (settings.taxEnabled) data += createLine(`GST (${settings.taxRate}%)`, `${tax.toFixed(2)}`, paperWidthChars);
    data += COMMANDS.BOLD_ON + createLine('TOTAL', `${total.toFixed(2)}`, paperWidthChars) + COMMANDS.BOLD_OFF;
    data += '\n';
    
    // 5. Payment
    // FIX: Use the actual paymentMethod string instead of hardcoded logic.
    data += createLine(paymentMethod, `${total.toFixed(2)}`, paperWidthChars);
    
    // 6. Footer
    if(settings.receiptFooter) data += '\n' + COMMANDS.CENTER + settings.receiptFooter + '\n';
    data += COMMANDS.CENTER + 'Thank you for your visit!\n';
    data += '\n';
    data += createLine(formattedDate, receiptId, paperWidthChars);

    data += "\n\n\n" + COMMANDS.CUT;
    
    return sendToPrinter(data, printer);
};
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

import { OrderItem, Printer } from '../types';
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

/**
 * Sends a small test print to verify configuration and connectivity.
 * Follows a robust connect -> write -> disconnect pattern.
 */
export const testPrint = async (printer: Printer): Promise<{ success: boolean; message: string }> => {
  // 1. Web Fallback
  if (!window.bluetoothSerial) {
    console.log(`Test Print for ${printer.name} (${printer.address})`);
    alert(`Simulated Test Print:\n\n[PRINTER: ${printer.name}]\n[INTERFACE: ${printer.interfaceType}]\n\nConnection Successful!`);
    return { success: true, message: "Simulated test print successful" };
  }

  // 2. Native Logic
  if (printer.interfaceType !== 'Bluetooth' || !printer.address) {
    return { success: false, message: "Only Bluetooth printers with a valid MAC address are supported for native printing." };
  }

  try {
    const hasPermission = await requestAppPermissions();
    if (!hasPermission) {
      return { success: false, message: "Bluetooth permissions were denied." };
    }

    await connectToPrinter(printer.address);

    let data = COMMANDS.INIT;
    data += COMMANDS.CENTER + COMMANDS.BOLD_ON + "TEST PRINT\n" + COMMANDS.BOLD_OFF;
    data += "--------------------------------\n";
    data += COMMANDS.LEFT;
    data += `Device: ${printer.name}\n`;
    data += `Addr: ${printer.address}\n`;
    data += "Status: Connected\n";
    data += "--------------------------------\n";
    data += COMMANDS.CENTER + "It Works!\n";
    data += "\n\n\n" + COMMANDS.CUT;

    await new Promise<void>((resolve, reject) => {
      window.bluetoothSerial.write(
        data,
        () => resolve(),
        (err: any) => reject(new Error(`Failed to send data to printer: ${JSON.stringify(err)}`))
      );
    });

    return { success: true, message: "Test print sent successfully." };

  } catch (error: any) {
    return { success: false, message: error.message || "An unknown printing error occurred." };
  } finally {
    await disconnectFromPrinter(); // CRITICAL: Always disconnect after the operation.
  }
};

export const printReceipt = async (items: OrderItem[], total: number, printer?: Printer) => {
  if (!printer) {
    alert("No printer configured. Please add a printer in Settings.");
    return;
  }

  // 1. Native Bluetooth Printing
  if (printer.interfaceType === 'Bluetooth' && window.bluetoothSerial && printer.address) {
    try {
      const hasPermission = await requestAppPermissions();
      if (!hasPermission) {
        alert("Bluetooth permissions denied. Cannot print.");
        return;
      }

      await connectToPrinter(printer.address);

      let data = COMMANDS.INIT;
      data += COMMANDS.CENTER + COMMANDS.BOLD_ON + "RESTAURANT POS\n" + COMMANDS.BOLD_OFF;
      data += "123 Food Street, City\n";
      data += "--------------------------------\n";
      data += COMMANDS.LEFT;

      items.forEach(item => {
        const lineTotal = (item.price * item.quantity).toFixed(2);
        const name = item.name.length > 16 ? item.name.substring(0, 16) : item.name.padEnd(16);
        const qty = `${item.quantity}x`.padEnd(4);
        data += `${qty}${name} ${lineTotal.padStart(8)}\n`;
      });

      data += "--------------------------------\n";
      data += COMMANDS.RIGHT + COMMANDS.BOLD_ON + `TOTAL: ${total.toFixed(2)}\n` + COMMANDS.BOLD_OFF;
      data += "\n\n\n" + COMMANDS.CUT;

      await new Promise<void>((resolve, reject) => {
          window.bluetoothSerial.write(data, 
            () => resolve(), 
            (err: any) => reject(new Error(JSON.stringify(err)))
          );
      });

    } catch (error: any) {
      alert(`Print Error: ${error.message}`);
    } finally {
        await disconnectFromPrinter();
    }
  } 
  // 2. Web/Simulation Fallback
  else {
    const billText = items.map(i => `${i.quantity}x ${i.name.padEnd(20)} ${(i.price * i.quantity).toFixed(2)}`).join('\n');
    const mode = window.bluetoothSerial ? "Native (Plugin Found)" : "Web Simulation";
    alert(`🖨️ [${mode}] Printing to ${printer.name}:\n\n${billText}\n\n----------------\nTotal: ₹${total.toFixed(2)}`);
  }
};
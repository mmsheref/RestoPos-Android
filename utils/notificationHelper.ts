
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Helper to check if we are on a platform that supports local notifications properly
const isNative = Capacitor.isNativePlatform();

/**
 * Requests notification permissions from the OS.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNative) return true; // Web handling or mock
  
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (e) {
    console.error("Error requesting notification permissions", e);
    return false;
  }
};

/**
 * Schedules a daily recurring notification.
 * Used for "Daily Sales Summary" reminders.
 * ID: 1001 (Reserved for Daily Summary)
 */
export const scheduleDailySummary = async (timeStr: string) => {
  if (!isNative) return;

  // Cancel existing first to update time
  await cancelDailySummary();

  const [hour, minute] = timeStr.split(':').map(Number);
  if (isNaN(hour) || isNaN(minute)) return;

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Daily Sales Summary',
          body: 'Don\'t forget to close your register and check today\'s reports.',
          id: 1001,
          schedule: { 
            on: { hour, minute },
            allowWhileIdle: true 
          },
          actionTypeId: "",
          extra: null
        }
      ]
    });
    console.log(`Daily summary scheduled for ${timeStr}`);
  } catch (e) {
    console.error("Failed to schedule daily summary", e);
  }
};

/**
 * Cancels the daily summary notification.
 */
export const cancelDailySummary = async () => {
  if (!isNative) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.some(n => n.id === 1001)) {
        await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
    }
  } catch (e) {
    console.error("Failed to cancel daily summary", e);
  }
};

/**
 * Sends an immediate notification.
 * Used for "Low Stock" alerts.
 */
export const sendLowStockAlert = async (itemName: string, currentStock: number) => {
  if (!isNative) return;

  // Generate a unique ID based on time to avoid collisions
  const notifId = Math.floor(Date.now() / 1000) % 100000 + 2000; 

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Low Stock Alert',
          body: `${itemName} is running low. Only ${currentStock} remaining.`,
          id: notifId,
          schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
          smallIcon: 'ic_stat_icon_config_sample', // Android resource if available
          actionTypeId: "",
          extra: null
        }
      ]
    });
  } catch (e) {
    console.error("Failed to send low stock alert", e);
  }
};

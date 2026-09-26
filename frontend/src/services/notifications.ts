import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { API_BASE_URL } from './api';

// Configure foreground presentation behavior (native only)
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn('[Notifications] setNotificationHandler skipped on web:', e);
  }
}

export const notifications = {
  /**
   * Requests native push notification permissions and configures channels.
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission not granted');
        return false;
      }

      // Android specific high-priority channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('expensio_default', {
          name: 'Expensio Financial Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00E5A8',
        });
      }

      return true;
    } catch (e) {
      console.warn('[Notifications] Error requesting permissions:', e);
      return false;
    }
  },

  /**
   * Retrieves the device push token and registers it with the Expensio backend.
   */
  async registerPushToken(): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    try {
      // Android remote push notifications via expo-notifications are not available in Expo Go (SDK 53+)
      if (isRunningInExpoGo()) {
        console.log('[Notifications] Push token registration skipped in Expo Go');
        return null;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
      if (!tokenData || !tokenData.data) return null;

      const token = tokenData.data;

      // Register with backend
      await fetch(`${API_BASE_URL}/notifications/register-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, platform: Platform.OS }),
      }).catch((err) => {
        console.warn('[Notifications] Backend token registration fallback:', err);
      });

      return token;
    } catch (e) {
      console.warn('[Notifications] Error registering push token:', e);
      return null;
    }
  },

  /**
   * Schedules a daily reminder at 21:00 (9:00 PM) to log expenses.
   */
  async scheduleDailyExpenseReminder(): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      // Cancel previous scheduled reminders to avoid duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Expensio Daily Ledger ⚡',
          body: "Don't forget to track today's expenses and keep your budget on target!",
          data: { screen: 'Expenses' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 21,
          minute: 0,
        },
      });
      console.log('⏰ Daily 9:00 PM expense reminder scheduled successfully');
    } catch (e) {
      console.warn('[Notifications] Failed to schedule daily reminder:', e);
    }
  },

  /**
   * Fires an instant local push notification for actions (e.g. Split Settled, New Expense).
   */
  async sendInstantNotification(title: string, body: string, data?: Record<string, any>): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        trigger: null, // triggers immediately
      });
    } catch (e) {
      console.warn('[Notifications] Failed to send instant notification:', e);
    }
  },
};

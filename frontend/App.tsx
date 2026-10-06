import React, { useState, useEffect, useRef } from 'react';
import { Platform, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

LogBox.ignoreAllLogs();
import { RootNavigator } from './src/navigation';
import { notifications } from './src/services/notifications';
import { ThemeProvider, useTheme } from './src/theme';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isDark } = useTheme();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // 1. Initialize Native Push Notifications & Daily Expense Reminders (Native only)
    if (Platform.OS !== 'web') {
      async function initNotifications() {
        try {
          await notifications.requestPermissions();
          await notifications.registerPushToken();
          await notifications.scheduleDailyExpenseReminder();
        } catch (e) {
          console.warn('Notifications init error:', e);
        }
      }
      initNotifications();

      try {
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
          console.log('🔔 Foreground Notification Received:', notification.request.content.title);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
          console.log('👉 Notification tapped:', response.notification.request.content.data);
        });
      } catch (e) {
        console.warn('Notification listener setup error:', e);
      }
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator
        isAuthenticated={isAuthenticated}
        onAuthenticated={() => setIsAuthenticated(true)}
        onLogout={() => setIsAuthenticated(false)}
      />
    </SafeAreaProvider>
  );
}

import { FinanceProvider } from './src/hooks/FinanceContext';

export default function App() {
  return (
    <ThemeProvider>
      <FinanceProvider>
        <AppContent />
      </FinanceProvider>
    </ThemeProvider>
  );
}

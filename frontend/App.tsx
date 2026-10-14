import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { Feather } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/theme';
import { OnboardingJourneyScreen, LoginScreen, HomeScreen } from './src/screens';
import { storage } from './src/services/storage';

ExpoSplashScreen.hideAsync().catch(() => {});

function MainApp() {
  const { colors, isDark } = useTheme();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    ExpoSplashScreen.hideAsync().catch(() => {});
    async function checkStatus() {
      try {
        const completed = await storage.get('@expensio_onboarding_completed', false);
        setHasCompletedOnboarding(!!completed);
        const savedUser = await storage.get('auth_user', null);
        if (savedUser) {
          setUser(savedUser);
        }
      } catch (e) {
        // fallback
      } finally {
        setIsInitializing(false);
      }
    }
    checkStatus();
  }, []);

  if (isInitializing) {
    return null;
  }

  // 1. First-time onboarding journey (4 steps)
  if (!hasCompletedOnboarding) {
    return (
      <OnboardingJourneyScreen
        onComplete={() => setHasCompletedOnboarding(true)}
      />
    );
  }

  // 2. Authentication: Mobile Number -> OTP -> Login
  if (!user) {
    return (
      <LoginScreen
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
        }}
        onBackToOnboarding={async () => {
          await storage.set('@expensio_onboarding_completed', false);
          setHasCompletedOnboarding(false);
        }}
      />
    );
  }

  // 3. Authenticated Home Dashboard
  return (
    <HomeScreen
      user={user}
      onLogout={async () => {
        await storage.set('auth_user', null);
        setUser(null);
      }}
      onReplayOnboarding={async () => {
        await storage.set('@expensio_onboarding_completed', false);
        await storage.set('auth_user', null);
        setHasCompletedOnboarding(false);
        setUser(null);
      }}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <MainApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1864FF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    width: '100%',
    justifyContent: 'center',
  },
  replayButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';
import { MobileLoginScreen } from '../screens/auth/MobileLoginScreen';
import { AuthEntryScreen } from '../screens/auth/AuthEntryScreen';
import { EmailAuthScreen } from '../screens/auth/EmailAuthScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { ProfileSetupScreen } from '../screens/setup/ProfileSetupScreen';
import { MainTabs } from './MainTabs';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  restoring: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorButton: {
    minHeight: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorButtonText: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  errorContent: {
    alignItems: 'center',
    paddingHorizontal: 28,
    gap: 16,
  },
});

export function RootNavigator() {
  const { authPhase, restoreError, retryRestore } = useApp();

  if (restoreError) {
    return (
      <View style={styles.restoring}>
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>Could not load saved data</Text>
          <Text style={styles.errorMessage}>{restoreError}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retry loading saved data" onPress={retryRestore} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (authPhase === 'restoring') {
    return (
      <View style={styles.restoring}>
        <ActivityIndicator accessibilityLabel="Loading saved profile and preferences" color={colors.accent} />
      </View>
    );
  }

  switch (authPhase) {
    case 'login':
      return <AuthEntryScreen />;
    case 'mobile':
      return <MobileLoginScreen />;
    case 'email':
      return <EmailAuthScreen />;
    case 'otp':
      return <OtpScreen />;
    case 'setup':
      return <ProfileSetupScreen />;
    case 'main':
      return (
        <NavigationContainer
          theme={{
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              background: colors.background,
              card: colors.surface,
              text: colors.textPrimary,
              border: colors.border,
              primary: colors.accent,
            },
          }}
        >
          <MainTabs />
        </NavigationContainer>
      );
    case 'onboarding':
    default:
      return <OnboardingScreen />;
  }

}

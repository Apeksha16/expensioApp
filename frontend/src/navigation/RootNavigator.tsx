import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenStatusBar } from '../components/ScreenStatusBar';
import { useApp } from '../context/AppContext';
import { AUDIT_TARGET } from '../dev/auditTarget';
import { AuditPreview } from '../dev/AuditPreview';
import { AuthEntryScreen } from '../screens/auth/AuthEntryScreen';
import { EmailAuthScreen } from '../screens/auth/EmailAuthScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { MobileLoginScreen } from '../screens/auth/MobileLoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { ProfileSetupScreen } from '../screens/setup/ProfileSetupScreen';
import { colors, spacing, typography } from '../theme';
import { MainTabs } from './MainTabs';

const styles = StyleSheet.create({
  restoring: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});

export function RootNavigator() {
  const { authPhase, restoreError, retryRestore } = useApp();

  if (__DEV__ && AUDIT_TARGET !== null) {
    return <AuditPreview target={AUDIT_TARGET} />;
  }

  if (restoreError) {
    return (
      <View style={styles.restoring}>
        <ScreenStatusBar surface="light" />
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>Could not load saved data</Text>
          <Text style={styles.errorMessage}>{restoreError}</Text>
          <PrimaryButton
            title="Try again"
            accessibilityLabel="Retry loading saved data"
            onPress={retryRestore}
          />
        </View>
      </View>
    );
  }

  if (authPhase === 'restoring') {
    return (
      <View style={styles.restoring}>
        <ScreenStatusBar surface="light" />
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
    case 'forgot_password':
      return <ForgotPasswordScreen />;
    case 'reset_password':
      return <ResetPasswordScreen />;
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

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
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  restoring: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

export function RootNavigator() {
  const { authPhase } = useApp();

  if (authPhase === 'restoring') {
    return (
      <View style={styles.restoring}>
        <ActivityIndicator color={colors.accent} />
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

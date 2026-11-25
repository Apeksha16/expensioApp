import { createNavigationContainerRef, DarkTheme, NavigationContainer } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenStatusBar } from '../components/ScreenStatusBar';
import { FRIENDS_CONFIG } from '../config/friendsConfig';
import { useApp } from '../context/AppContext';
import { AuthEntryScreen } from '../screens/auth/AuthEntryScreen';
import { EmailAuthScreen } from '../screens/auth/EmailAuthScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { MobileLoginScreen } from '../screens/auth/MobileLoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { ProfileSetupScreen } from '../screens/setup/ProfileSetupScreen';
import { colors, spacing, typography } from '../theme';
import { parseSafeDeepLink, resolveDeepLinkNavigation, type ParsedDeepLink } from '../utils/deepLink';
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

const navigationRef = createNavigationContainerRef();

export function RootNavigator() {
  const { authPhase, setAuthPhase, setPendingResetToken, splits, restoreError, retryRestore } = useApp();
  const pendingDeepLinkRef = useRef<ParsedDeepLink | null>(null);
  const prevAuthPhaseRef = useRef(authPhase);

  const ownedSplitIds = useMemo(() => new Set(splits.map((s) => s.id)), [splits]);

  const dispatchResolvedLink = useCallback(
    (rawOrParsed: string | ParsedDeepLink | null) => {
      const resolution = resolveDeepLinkNavigation(rawOrParsed, {
        isAuthenticated: authPhase === 'main',
        friendsEnabled: FRIENDS_CONFIG.FRIENDS_ENABLED,
        ownedSplitIds,
      });
      if (resolution.kind === 'ignore') return;
      if (resolution.kind === 'queue') {
        pendingDeepLinkRef.current = resolution.link;
        return;
      }
      if (resolution.kind === 'auth_phase') {
        if (resolution.token) {
          setPendingResetToken(resolution.token);
        }
        setAuthPhase(resolution.phase);
        return;
      }
      if (resolution.kind === 'navigate_main') {
        if (!navigationRef.isReady()) {
          pendingDeepLinkRef.current =
            typeof rawOrParsed === 'string' ? parseSafeDeepLink(rawOrParsed) : rawOrParsed;
          return;
        }
        (navigationRef.navigate as (name: string, params?: unknown) => void)(
          resolution.screen,
          resolution.params,
        );
      }
    },
    [authPhase, ownedSplitIds, setAuthPhase, setPendingResetToken],
  );

  useEffect(() => {
    if (prevAuthPhaseRef.current === 'main' && authPhase !== 'main') {
      // Clear any queued deep link when session ends so it never leaks to another account
      pendingDeepLinkRef.current = null;
    }
    prevAuthPhaseRef.current = authPhase;
  }, [authPhase]);

  useEffect(() => {
    let active = true;
    Linking.getInitialURL()
      .then((initialUrl) => {
        if (active && initialUrl) {
          dispatchResolvedLink(initialUrl);
        }
      })
      .catch(() => {});

    const subscription = Linking.addEventListener('url', ({ url }) => {
      dispatchResolvedLink(url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [dispatchResolvedLink]);

  useEffect(() => {
    if (authPhase === 'main' && pendingDeepLinkRef.current && navigationRef.isReady()) {
      const queued = pendingDeepLinkRef.current;
      pendingDeepLinkRef.current = null;
      dispatchResolvedLink(queued);
    }
  }, [authPhase, dispatchResolvedLink]);

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
          ref={navigationRef}
          onReady={() => {
            if (pendingDeepLinkRef.current) {
              const queued = pendingDeepLinkRef.current;
              pendingDeepLinkRef.current = null;
              dispatchResolvedLink(queued);
            }
          }}
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

import {
  createNavigationContainerRef,
  DarkTheme,
  NavigationContainer,
  StackActions,
  type NavigationState,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { AuthEntryScreen } from '../screens/auth/AuthEntryScreen';
import { EmailAuthScreen } from '../screens/auth/EmailAuthScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { MobileLoginScreen } from '../screens/auth/MobileLoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { ProfileSetupScreen } from '../screens/setup/ProfileSetupScreen';
import { colors } from '../theme';
import type { AuthPhase } from '../types';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Mobile: undefined;
  Email: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Otp: undefined;
  Setup: undefined;
};

export type AuthStackPhase = Exclude<AuthPhase, 'restoring' | 'main'>;

const PHASE_TO_ROUTE: Record<AuthStackPhase, keyof AuthStackParamList> = {
  onboarding: 'Onboarding',
  login: 'Login',
  mobile: 'Mobile',
  email: 'Email',
  forgot_password: 'ForgotPassword',
  reset_password: 'ResetPassword',
  otp: 'Otp',
  setup: 'Setup',
};

const ROUTE_TO_PHASE: Record<keyof AuthStackParamList, AuthStackPhase> = {
  Onboarding: 'onboarding',
  Login: 'login',
  Mobile: 'mobile',
  Email: 'email',
  ForgotPassword: 'forgot_password',
  ResetPassword: 'reset_password',
  Otp: 'otp',
  Setup: 'setup',
};

const Stack = createNativeStackNavigator<AuthStackParamList>();
const authNavigationRef = createNavigationContainerRef<AuthStackParamList>();

type AuthStackProps = {
  phase: AuthStackPhase;
};

function syncAuthRoute(target: keyof AuthStackParamList) {
  if (!authNavigationRef.isReady()) return;

  const current = authNavigationRef.getCurrentRoute()?.name;
  if (current === target) return;

  const state = authNavigationRef.getRootState();
  const existingIndex = state?.routes.findIndex((route) => route.name === target) ?? -1;

  if (state && existingIndex >= 0) {
    const popCount = state.index - existingIndex;
    if (popCount > 0) {
      authNavigationRef.dispatch(StackActions.pop(popCount));
    }
    return;
  }

  authNavigationRef.dispatch(StackActions.push(target));
}

export function AuthStack({ phase }: AuthStackProps) {
  const { setAuthPhase } = useApp();
  const initialRouteName = PHASE_TO_ROUTE[phase];
  const lastSyncedPhaseRef = useRef(phase);

  useEffect(() => {
    if (phase === lastSyncedPhaseRef.current) return;
    lastSyncedPhaseRef.current = phase;
    syncAuthRoute(PHASE_TO_ROUTE[phase]);
  }, [phase]);

  const handleStateChange = (state: NavigationState | undefined) => {
    const routeName = state?.routes[state.index]?.name as keyof AuthStackParamList | undefined;
    if (!routeName) return;
    const nextPhase = ROUTE_TO_PHASE[routeName];
    if (!nextPhase || nextPhase === lastSyncedPhaseRef.current) return;
    lastSyncedPhaseRef.current = nextPhase;
    setAuthPhase(nextPhase);
  };

  return (
    <NavigationContainer
      ref={authNavigationRef}
      onReady={() => {
        syncAuthRoute(PHASE_TO_ROUTE[lastSyncedPhaseRef.current]);
      }}
      onStateChange={handleStateChange}
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
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen
          name="Login"
          component={AuthEntryScreen}
          options={{ gestureEnabled: false, fullScreenGestureEnabled: false }}
        />
        <Stack.Screen name="Mobile" component={MobileLoginScreen} />
        <Stack.Screen name="Email" component={EmailAuthScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="Setup" component={ProfileSetupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export function isAuthStackPhase(phase: AuthPhase): phase is AuthStackPhase {
  return phase !== 'restoring' && phase !== 'main';
}

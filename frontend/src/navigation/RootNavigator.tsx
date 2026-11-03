import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { useApp } from '../context/AppContext';
import { MobileLoginScreen } from '../screens/auth/MobileLoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { ProfileSetupScreen } from '../screens/setup/ProfileSetupScreen';
import { MainTabs } from './MainTabs';

export function RootNavigator() {
  const { authPhase } = useApp();

  switch (authPhase) {
    case 'login':
      return <MobileLoginScreen />;
    case 'otp':
      return <OtpScreen />;
    case 'setup':
      return <ProfileSetupScreen />;
    case 'main':
      return (
        <NavigationContainer>
          <MainTabs />
        </NavigationContainer>
      );
    case 'onboarding':
    default:
      return <OnboardingScreen />;
  }
}

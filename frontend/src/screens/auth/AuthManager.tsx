import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SignInScreen } from './SignInScreen';
import { MpinScreen } from './MpinScreen';
import { ForgotMpinFlow } from './ForgotMpinFlow';
import { RegistrationFlow } from './RegistrationFlow';

export type AuthMode = 'SIGN_IN' | 'MPIN' | 'FORGOT_MPIN' | 'REGISTER';

interface AuthManagerProps {
  onLoginSuccess: (user: any) => void;
  onBackToOnboarding?: () => void;
}

export function AuthManager({ onLoginSuccess, onBackToOnboarding }: AuthManagerProps) {
  const [mode, setMode] = useState<AuthMode>('SIGN_IN');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [prefillRegistration, setPrefillRegistration] = useState<{
    phone?: string;
    email?: string;
    name?: string;
    type: 'phone' | 'google';
  }>({ type: 'phone' });

  // 1. Existing user discovered -> Navigate to MPIN screen
  const handleExistingUserFound = (user: any) => {
    setSelectedUser(user);
    setMode('MPIN');
  };

  // 2. New mobile or Google user discovered -> Navigate to Registration flow
  const handleNewUserDiscovered = (prefill: {
    phone?: string;
    email?: string;
    name?: string;
    type: 'phone' | 'google';
  }) => {
    setPrefillRegistration(prefill);
    setMode('REGISTER');
  };

  // 3. User taps Forgot MPIN
  const handleForgotMpin = () => {
    setMode('FORGOT_MPIN');
  };

  // 4. Return to Sign In
  const handleBackToSignIn = () => {
    setMode('SIGN_IN');
    setSelectedUser(null);
  };

  return (
    <View style={styles.container}>
      {mode === 'SIGN_IN' && (
        <SignInScreen
          onExistingUserFound={handleExistingUserFound}
          onNewUserDiscovered={handleNewUserDiscovered}
          onBackToOnboarding={onBackToOnboarding}
        />
      )}

      {mode === 'MPIN' && selectedUser && (
        <MpinScreen
          user={selectedUser}
          onLoginSuccess={onLoginSuccess}
          onForgotMpin={handleForgotMpin}
          onBackToSignIn={handleBackToSignIn}
        />
      )}

      {mode === 'FORGOT_MPIN' && selectedUser && (
        <ForgotMpinFlow
          user={selectedUser}
          onSuccess={onLoginSuccess}
          onCancel={() => setMode('MPIN')}
        />
      )}

      {mode === 'REGISTER' && (
        <RegistrationFlow
          initialData={prefillRegistration}
          onSuccess={onLoginSuccess}
          onCancel={handleBackToSignIn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

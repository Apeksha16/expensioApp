import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { authenticateEmail } from '../../services/authApi';
import { colors, spacing, typography } from '../../theme';
import { validatePasswordPolicy } from '../../utils/validation';

export function EmailAuthScreen() {
  const insets = useSafeAreaInsets();
  const { setAuthPhase, applyAuthSession, beginVerification } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const submit = async () => {
    if (loading || isSubmittingRef.current) return;
    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter a valid email address');
      return;
    }
    if (mode === 'register') {
      if (name.trim().length < 2) {
        setError('Name must be at least 2 characters');
        return;
      }
      const passwordError = validatePasswordPolicy(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    } else {
      if (!password) {
        setError('Password is required');
        return;
      }
    }

    isSubmittingRef.current = true;
    setError('');
    setLoading(true);
    try {
      const result = await authenticateEmail(trimmedEmail, password, mode, name.trim());
      if (mode === 'register') {
        // Backend registerEmail already generated and dispatched the OTP challenge
        await beginVerification(result, 'email', trimmedEmail);
      } else {
        await applyAuthSession({ ...result, verifiedChannel: 'email' });
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable onPress={() => setAuthPhase('login')} hitSlop={10}><Text style={styles.back}>← Back</Text></Pressable>
        <View style={styles.copy}><Text style={styles.kicker}>SECURE ACCESS</Text><Text style={styles.title}>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</Text><Text style={styles.subtitle}>Use your email to securely access your Expensio account.</Text></View>
        <View style={styles.form}>
          {mode === 'register' ? (
            <InputField
              label="Full Name"
              value={name}
              onChangeText={(value) => { setName(value); setError(''); }}
              placeholder="e.g. John Doe"
              autoCapitalize="words"
            />
          ) : null}
          <InputField label="Email address" value={email} onChangeText={(value) => { setEmail(value); setError(''); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          <InputField label="Password" value={password} onChangeText={(value) => { setPassword(value); setError(''); }} placeholder={mode === 'register' ? 'Min 8 chars, uppercase, number & symbol' : 'Your password'} secureTextEntry textContentType="password" />
          {mode === 'register' ? (
            <InputField label="Confirm password" value={confirmPassword} onChangeText={(value) => { setConfirmPassword(value); setError(''); }} placeholder="Re-enter your password" secureTextEntry textContentType="password" />
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton title={mode === 'login' ? 'Log in' : 'Create account'} onPress={submit} loading={loading} />
          <Pressable onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            <Text style={styles.switch}>{mode === 'login' ? 'New to Expensio? Create an account' : 'Already have an account? Log in'}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg, maxWidth: 520, width: '100%', alignSelf: 'center' },
  back: { ...typography.bodyMedium, color: colors.accent },
  copy: { marginTop: spacing.xxxl },
  kicker: { ...typography.label, color: colors.accent, letterSpacing: 1.4 },
  title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 23 },
  form: { marginTop: spacing.xxl, gap: spacing.md },
  error: { ...typography.caption, color: colors.expense },
  switch: { ...typography.bodyMedium, color: colors.accent, textAlign: 'center', paddingVertical: spacing.sm },
});

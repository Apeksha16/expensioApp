import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { authenticateEmail, sendEmailOtp } from '../../services/authApi';
import { colors, spacing, typography } from '../../theme';

export function EmailAuthScreen() {
  const insets = useSafeAreaInsets();
  const { setAuthPhase, applyAuthSession, beginVerification, markVerified } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (mode === 'register' && password !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await authenticateEmail(email.trim().toLowerCase(), password, mode);
      if (mode === 'register') {
        await sendEmailOtp(email.trim().toLowerCase());
        beginVerification(result, 'email', email.trim().toLowerCase());
      } else {
        markVerified('email');
        applyAuthSession(result);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable onPress={() => setAuthPhase('login')} hitSlop={10}><Text style={styles.back}>← Back</Text></Pressable>
        <View style={styles.copy}><Text style={styles.kicker}>SECURE ACCESS</Text><Text style={styles.title}>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</Text><Text style={styles.subtitle}>Use your email to securely access your Expensio account.</Text></View>
        <View style={styles.form}>
          <InputField label="Email address" value={email} onChangeText={(value) => { setEmail(value); setError(''); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          <InputField label="Password" value={password} onChangeText={(value) => { setPassword(value); setError(''); }} placeholder="At least 8 characters" secureTextEntry textContentType="password" />
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

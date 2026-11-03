import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OtpInput } from '../../components/OtpInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { MOCK_OTP, OTP_RESEND_SECONDS } from '../../data/config';
import { colors, spacing, typography } from '../../theme';
import { maskPhone } from '../../utils/format';

export function OtpScreen() {
  const insets = useSafeAreaInsets();
  const {
    phone,
    countryCode,
    setAuthPhase,
    isExistingUser,
    completeSetup,
  } = useApp();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(OTP_RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const verify = () => {
    if (otp.length < 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (otp !== MOCK_OTP) {
        setError('Invalid OTP. Use 123456 for demo.');
        return;
      }
      setError('');
      if (isExistingUser) {
        completeSetup({
          name: 'Apeksha',
          userId: '@apeksha',
          monthlyIncome: 85000,
          cashInHand: 12500,
          savings: 112000,
        });
      } else {
        setAuthPhase('setup');
      }
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <Pressable onPress={() => setAuthPhase('login')} hitSlop={8}>
          <Text style={styles.back}>← Change number</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to {maskPhone(countryCode, phone)}
          </Text>
        </View>

        <OtpInput
          value={otp}
          onChange={(value) => {
            setOtp(value);
            if (error) setError('');
          }}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.resendRow}>
          {seconds > 0 ? (
            <Text style={styles.resendMuted}>Resend OTP in {seconds}s</Text>
          ) : (
            <Pressable onPress={() => setSeconds(OTP_RESEND_SECONDS)}>
              <Text style={styles.resend}>Resend OTP</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <PrimaryButton
            title="Verify & Continue"
            onPress={verify}
            loading={loading}
            disabled={otp.length < 6}
          />
          <Text style={styles.hint}>Demo OTP: {MOCK_OTP}</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  back: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.expense,
    marginTop: spacing.sm,
  },
  resendRow: {
    marginTop: spacing.lg,
  },
  resendMuted: {
    ...typography.captionMedium,
    color: colors.textTertiary,
  },
  resend: {
    ...typography.bodyMedium,
    color: colors.accent,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    gap: spacing.md,
  },
  hint: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});

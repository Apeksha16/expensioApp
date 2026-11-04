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
import { OTP_RESEND_SECONDS } from '../../data/config';
import { colors, radius, spacing, typography } from '../../theme';
import { maskPhone } from '../../utils/format';

export function OtpScreen() {
  const insets = useSafeAreaInsets();
  const {
    phone,
    countryCode,
    setAuthPhase,
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
      setError('');
      setAuthPhase('setup');
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
        <Pressable onPress={() => setAuthPhase('login')} hitSlop={8} style={styles.backRow}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.back}>Change number</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.otpIcon}>
            <Text style={styles.otpEmoji}>🔐</Text>
          </View>
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            Code sent to{' '}
            <Text style={styles.phone}>{maskPhone(countryCode, phone)}</Text>
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
            <Text style={styles.resendMuted}>Resend code in <Text style={styles.resendTimer}>{seconds}s</Text></Text>
          ) : (
            <Pressable onPress={() => setSeconds(OTP_RESEND_SECONDS)}>
              <Text style={styles.resend}>Resend OTP →</Text>
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginBottom: spacing.xl,
    alignSelf: 'flex-start',
  },
  backArrow: {
    ...typography.h3,
    color: colors.accent,
    lineHeight: 22,
  },
  back: {
    ...typography.bodyMedium,
    color: colors.accent,
  },
  header: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  otpIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  otpEmoji: {
    fontSize: 26,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  phone: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
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
  resendTimer: {
    color: colors.accent,
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
});

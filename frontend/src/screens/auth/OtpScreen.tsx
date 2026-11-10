import { Ionicons } from '@expo/vector-icons';
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
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { maskPhone } from '../../utils/format';
import { sendEmailOtp, sendOtp, verifyEmailOtp, verifyOtp } from '../../services/authApi';

export function OtpScreen() {
  const insets = useSafeAreaInsets();
  const { phone, countryCode, verificationChannel, verificationTarget, setAuthPhase, applyAuthSession, markVerified } = useApp();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(OTP_RESEND_SECONDS);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const verify = () => {
    if (otp.length < 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    const request = verificationChannel === 'email'
      ? verifyEmailOtp(verificationTarget, otp)
      : verifyOtp(phone, otp);
    void request
      .then((response) => {
        markVerified(verificationChannel);
        if (verificationChannel === 'email') setAuthPhase('setup');
        else applyAuthSession(response);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to verify OTP');
      })
      .finally(() => {
      setLoading(false);
      });
  };

  const resend = async () => {
    setResending(true);
    setError('');
    try {
      if (verificationChannel === 'email') await sendEmailOtp(verificationTarget);
      else await sendOtp(phone);
      setSeconds(OTP_RESEND_SECONDS);
      setOtp('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.md },
        ]}
      >
        <Pressable onPress={() => setAuthPhase('login')} hitSlop={10} style={styles.backRow}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.back}>Change number</Text>
        </Pressable>

        <View style={styles.content}>
          <View style={styles.iconTile}>
            <Ionicons name="key-outline" size={32} color={colors.accent} />
          </View>
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            Code sent to <Text style={styles.phone}>{maskPhone(countryCode, phone)}</Text>
          </Text>

          <View style={styles.codeSection}>
            <OtpInput
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (error) setError('');
              }}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <View style={styles.resendRow}>
            {seconds > 0 ? (
              <Text style={styles.resendMuted}>
                Resend code in <Text style={styles.resendTimer}>{seconds}s</Text>
              </Text>
            ) : (
              <Pressable onPress={() => void resend()} disabled={resending}>
                <Text style={styles.resend}>Resend OTP →</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title="Verify & Continue"
            onPress={verify}
            loading={loading}
            disabled={otp.length < 6}
            style={styles.verify}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backArrow: {
    color: colors.accent,
    fontSize: 28,
    lineHeight: 28,
  },
  back: {
    ...typography.bodyMedium,
    color: colors.accent,
  },
  content: {
    marginTop: spacing.xxl,
  },
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    fontSize: 38,
    lineHeight: 43,
    color: colors.textPrimary,
    letterSpacing: -1.2,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 18,
    marginTop: spacing.sm,
  },
  phone: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  codeSection: {
    marginTop: spacing.xxl,
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
    ...typography.bodyMedium,
    color: colors.textTertiary,
    fontSize: 16,
  },
  resendTimer: {
    color: colors.accent,
  },
  resend: {
    ...typography.bodyMedium,
    color: colors.accent,
  },
  footer: {
    marginTop: spacing.lg,
  },
  verify: {
    height: 60,
    borderRadius: radius.full,
  },
});

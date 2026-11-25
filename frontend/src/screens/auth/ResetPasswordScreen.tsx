import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthHeroShell } from '../../components/AuthHeroShell';
import { InputField } from '../../components/InputField';
import { OtpInput } from '../../components/OtpInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useApp } from '../../context/AppContext';
import { OTP_RESEND_SECONDS } from '../../data/config';
import { requestPasswordReset, submitPasswordReset } from '../../services/authApi';
import { colors, layout, radius, spacing, typography } from '../../theme';
import { formatCountdown, normalizeAuthError } from '../../utils/errorNormalization';
import { maskEmail } from '../../utils/format';
import { getPasswordRequirementChecks, validatePasswordPolicy } from '../../utils/validation';

type RecoveryCredentialMode = 'otp' | 'token';

export function ResetPasswordScreen() {
  const {
    passwordResetEmail,
    setAuthPhase,
    showToast,
  } = useApp();

  const [credentialMode, setCredentialMode] = useState<RecoveryCredentialMode>('token');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(OTP_RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const [resentNotice, setResentNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    return () => {
      setOtp('');
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
    };
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const passwordChecks = useMemo(() => getPasswordRequirementChecks(newPassword), [newPassword]);
  const confirmMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const hasValidCodeOrToken = credentialMode === 'otp'
    ? otp.length === 6
    : resetToken.trim().length >= 8;
  const isReady = hasValidCodeOrToken
    && validatePasswordPolicy(newPassword) === null
    && newPassword === confirmPassword;

  const handleResend = async () => {
    if (resending || seconds > 0 || !passwordResetEmail) return;
    setResending(true);
    setError('');
    setResentNotice(false);
    try {
      await requestPasswordReset(passwordResetEmail);
      setSeconds(OTP_RESEND_SECONDS);
      setOtp('');
      setResentNotice(true);
    } catch (err) {
      const normalized = normalizeAuthError(err, 'recovery');
      if (normalized.retryAfterSeconds) {
        setSeconds(normalized.retryAfterSeconds);
      }
      setError(normalized.message);
    } finally {
      setResending(false);
    }
  };

  const handleReset = async () => {
    if (loading || isSubmittingRef.current) return;
    if (!hasValidCodeOrToken) {
      setError(credentialMode === 'otp' ? 'Enter the 6-digit code.' : 'Enter the reset token from your email.');
      return;
    }
    const pwdError = validatePasswordPolicy(newPassword);
    if (pwdError) {
      setError(pwdError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError('');
    try {
      await submitPasswordReset(
        credentialMode === 'otp'
          ? { email: passwordResetEmail, otp, newPassword }
          : { token: resetToken.trim(), newPassword },
      );
      showToast('success', 'Password reset. Sign in with your new password.');
      setAuthPhase('email');
    } catch (err) {
      setError(normalizeAuthError(err, 'recovery').message);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const masked = passwordResetEmail ? maskEmail(passwordResetEmail) : 'your email';

  return (
    <AuthHeroShell
      onBack={() => setAuthPhase('forgot_password')}
      backAccessibilityLabel="Back to forgot password"
      step={2}
      totalSteps={2}
      icon="shield-checkmark-outline"
      titleLine1="Set a new"
      titleAccent="password"
      subtitle={`If an account exists for ${masked}, enter the verification code or reset token from your email.`}
      footer={(
        <PrimaryButton
          title="Reset password"
          variant="lime"
          surface="dark"
          loading={loading}
          disabled={!isReady || loading}
          onPress={() => void handleReset()}
          style={styles.ctaButton}
        />
      )}
    >
      <SegmentedControl
        options={[
          { key: 'otp' as const, label: '6-digit code' },
          { key: 'token' as const, label: 'Reset token' },
        ]}
        value={credentialMode}
        variant="primary"
        onChange={(next) => {
          setCredentialMode(next);
          setError('');
        }}
      />

      {credentialMode === 'otp' ? (
        <View style={styles.codeSection}>
          <Text style={styles.codeLabel}>VERIFICATION CODE</Text>
          <OtpInput
            value={otp}
            hasError={Boolean(error)}
            onChange={(value) => {
              setOtp(value);
              if (error) setError('');
            }}
          />
          <View style={styles.resendRow}>
            {seconds > 0 ? (
              <Text style={styles.resendMuted}>
                Resend in <Text style={styles.seconds}>{formatCountdown(seconds)}</Text>
              </Text>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Resend reset instructions"
                onPress={() => void handleResend()}
                disabled={resending}
                style={styles.resendButton}
              >
                <Text style={styles.resendLink}>{resending ? 'Sending…' : 'Resend instructions'}</Text>
              </Pressable>
            )}
            {resentNotice ? <Text style={styles.codeSentTag}>Code sent</Text> : null}
          </View>
        </View>
      ) : (
        <InputField
          label="Reset token"
          value={resetToken}
          onChangeText={(value) => { setResetToken(value.slice(0, 128)); setError(''); }}
          placeholder="Paste the token from your reset email"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={128}
        />
      )}

      <InputField
        label="New password"
        value={newPassword}
        onChangeText={(value) => { setNewPassword(value.slice(0, 128)); setError(''); }}
        placeholder="Create a strong password"
        secureTextEntry
        showPasswordToggle
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        maxLength={128}
      />

      <View style={styles.checklist} accessibilityLabel="Password requirements">
        {passwordChecks.map((item) => (
          <View key={item.id} style={styles.checkRow}>
            <Ionicons
              name={item.met ? 'checkmark-circle' : 'ellipse-outline'}
              size={15}
              color={item.met ? colors.income : colors.textTertiary}
            />
            <Text style={[styles.checkLabel, item.met && styles.checkLabelMet]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      <InputField
        label="Confirm new password"
        value={confirmPassword}
        onChangeText={(value) => { setConfirmPassword(value.slice(0, 128)); setError(''); }}
        placeholder="Re-enter your new password"
        secureTextEntry
        showPasswordToggle
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        maxLength={128}
        error={confirmMismatch ? 'Passwords do not match.' : undefined}
        onSubmitEditing={() => void handleReset()}
      />

      {error ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={18} color={colors.expense} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </AuthHeroShell>
  );
}

const styles = StyleSheet.create({
  codeSection: {
    gap: spacing.xs,
  },
  codeLabel: {
    ...typography.eyebrow,
    color: colors.textSecondary,
  },
  resendRow: {
    minHeight: layout.headerButtonSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resendMuted: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  seconds: {
    ...typography.captionMedium,
    color: colors.accentDark,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  resendButton: {
    minHeight: layout.headerButtonSize,
    justifyContent: 'center',
  },
  resendLink: {
    ...typography.captionMedium,
    color: colors.accent,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  codeSentTag: {
    ...typography.micro,
    color: colors.income,
    fontWeight: '700',
  },
  checklist: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.sm,
    gap: spacing.xxs,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  checkLabelMet: {
    color: colors.accentDark,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.expense,
    flex: 1,
  },
  ctaButton: {
    minHeight: layout.authButtonHeight,
  },
});

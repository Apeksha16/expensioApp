import Ionicons from '@expo/vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InputField } from '../../components/InputField';
import { OtpInput } from '../../components/OtpInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenStatusBar } from '../../components/ScreenStatusBar';
import { useApp } from '../../context/AppContext';
import { OTP_RESEND_SECONDS } from '../../data/config';
import type { MainTabParamList } from '../../navigation/MainTabs';
import { EMAIL_CHANGE_ENABLED, emailVerificationService } from '../../services/emailChangeService';
import { colors, layout, radius, spacing, typography } from '../../theme';
import { formatCountdown, normalizeAuthError } from '../../utils/errorNormalization';

type Props = BottomTabScreenProps<MainTabParamList, 'EmailChange'>;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailChangeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { profileState, updateProfileEmail, showToast } = useApp();
  const currentEmail = profileState.email;
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [completed, setCompleted] = useState(false);
  const sendingRef = useRef(false);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (!expiresAt && !cooldownUntil) return undefined;
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (expiresAt && currentTime >= expiresAt) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, cooldownUntil]);

  useEffect(() => () => {
    setOtp('');
  }, []);

  const codeExpired = expiresAt !== null && now >= expiresAt;
  const resendSeconds = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : 0;
  const expirySeconds = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0;

  const sendCode = async (resend = false) => {
    if (!EMAIL_CHANGE_ENABLED) {
      const notice = 'Email updates are temporarily unavailable in this build.';
      setError(notice);
      showToast('error', notice);
      return;
    }
    if (sendingRef.current) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      const notice = 'Enter a valid email address.';
      setError(notice);
      showToast('error', notice);
      return;
    }
    if (normalizedEmail === currentEmail.trim().toLowerCase()) {
      const notice = 'Enter an email address different from your current one.';
      setError(notice);
      showToast('error', notice);
      return;
    }
    if (resend && resendSeconds > 0) return;

    sendingRef.current = true;
    setSending(true);
    setError('');
    setSuccess('');
    try {
      const { expiresAt: expiry, resendCooldownSeconds } = await emailVerificationService.requestCode(normalizedEmail);
      const cooldown = resendCooldownSeconds ?? OTP_RESEND_SECONDS;
      setCodeSent(true);
      setExpiresAt(expiry);
      setCooldownUntil(Date.now() + cooldown * 1000);
      setNow(Date.now());
      setOtp('');
    } catch (requestError) {
      const notice = normalizeAuthError(requestError, 'otp').message;
      setError(notice);
      showToast('error', notice);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const verifyCode = async (code = otp) => {
    if (!EMAIL_CHANGE_ENABLED) {
      const notice = 'Email updates are temporarily unavailable in this build.';
      setError(notice);
      showToast('error', notice);
      return;
    }
    if (verifyingRef.current) return;
    if (!codeSent) {
      const notice = 'Request a verification code first.';
      setError(notice);
      showToast('error', notice);
      return;
    }
    if (codeExpired) {
      const notice = 'This code has expired. Request a new one.';
      setError(notice);
      showToast('error', notice);
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      const notice = 'Enter the six-digit verification code.';
      setError(notice);
      showToast('error', notice);
      return;
    }
    verifyingRef.current = true;
    setVerifying(true);
    setError('');
    setSuccess('');
    try {
      await emailVerificationService.verifyCode(email, code);
      await updateProfileEmail(email);
      setCompleted(true);
      setOtp('');
      const successMessage = 'Email verified and updated on your profile.';
      setSuccess(successMessage);
      showToast('success', successMessage);
      setCodeSent(false);
      setExpiresAt(null);
      setCooldownUntil(null);
      await emailVerificationService.complete().catch(() => {});
    } catch (verifyError) {
      const msg = normalizeAuthError(verifyError, 'otp').message;
      setError(msg);
      showToast('error', msg);
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  };

  const cancel = async () => {
    setError('');
    setOtp('');
    try {
      await emailVerificationService.cancel();
      navigation.navigate('Profile');
    } catch (cancelError) {
      const notice = cancelError instanceof Error ? cancelError.message : 'Unable to cancel verification.';
      setError(notice);
      showToast('error', notice);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xs }]}>
      <ScreenStatusBar surface="light" focused={isFocused} />

      <View style={styles.headerWrap}>
        <ScreenHeader
          tone="light"
          title={completed ? 'Email updated' : 'Change email'}
          onBack={() => void cancel()}
          backAccessibilityLabel="Back to Profile"
        />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <View style={styles.headingIcon}>
            <Ionicons name="mail-unread-outline" size={24} color={colors.accent} />
          </View>
          <Text style={styles.subtitle}>
            {completed
              ? 'Your new address is saved to your Expensio profile.'
              : 'Verify the new address before replacing the one on your profile.'}
          </Text>
        </View>

        <View style={styles.currentEmailCard}>
          <Text style={styles.currentEmailLabel}>CURRENT EMAIL</Text>
          <Text numberOfLines={1} style={styles.currentEmail}>{currentEmail || 'Email not added'}</Text>
        </View>

        {!EMAIL_CHANGE_ENABLED ? (
          <View style={styles.formCard}>
            <Text style={styles.subtitle}>
              Verified email updates require server support and are temporarily disabled in this build so your profile always stays synced with your account.
            </Text>
            <PrimaryButton title="Back to Profile" onPress={() => navigation.navigate('Profile')} />
          </View>
        ) : !completed ? (
          <View style={styles.formCard}>
            <InputField
              label="New email address"
              value={email}
              onChangeText={(value) => {
                if (codeSent) {
                  setCodeSent(false);
                  setExpiresAt(null);
                  setCooldownUntil(null);
                  setOtp('');
                }
                setEmail(value.slice(0, 254));
                setError('');
                setSuccess('');
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              maxLength={254}
              editable={!sending && !verifying}
              accessibilityLabel="New email address"
            />

            {!codeSent ? (
              <PrimaryButton title="Send verification code" onPress={() => void sendCode()} loading={sending} />
            ) : (
              <>
                <View style={styles.otpWrap}>
                  <View style={styles.otpHeader}>
                    <Text style={styles.otpLabel}>SIX-DIGIT CODE</Text>
                    <Text style={styles.expiryText}>
                      {codeExpired ? 'Expired' : `Expires in ${formatCountdown(expirySeconds)}`}
                    </Text>
                  </View>
                  <OtpInput
                    value={otp}
                    hasError={Boolean(error)}
                    disabled={verifying || codeExpired}
                    onChange={(value) => {
                      setOtp(value);
                      if (error) setError('');
                    }}
                    onComplete={(code) => {
                      if (!verifying && !codeExpired) void verifyCode(code);
                    }}
                  />
                </View>

                <View style={styles.resendRow}>
                  {resendSeconds > 0 ? (
                    <Text style={styles.resendText}>Resend in {formatCountdown(resendSeconds)}</Text>
                  ) : (
                    <Pressable accessibilityRole="button" onPress={() => void sendCode(true)} disabled={sending} style={styles.resendButton}>
                      <Text style={styles.resendLink}>Resend code</Text>
                    </Pressable>
                  )}
                  {codeExpired ? <Text style={styles.expiredLabel}>Expired</Text> : null}
                </View>

                <PrimaryButton
                  title="Verify and update email"
                  onPress={() => void verifyCode()}
                  loading={verifying}
                  disabled={codeExpired || otp.length !== 6}
                />
              </>
            )}

            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {success ? <Text accessibilityRole="alert" style={styles.success}>{success}</Text> : null}
            <Pressable accessibilityRole="button" onPress={() => void cancel()} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel verification</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.completedState}>
            {success ? <Text accessibilityRole="alert" style={styles.success}>{success}</Text> : null}
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <PrimaryButton title="Back to Profile" onPress={() => navigation.navigate('Profile')} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerWrap: { paddingHorizontal: layout.screenMargin },
  content: { paddingHorizontal: layout.screenMargin, paddingTop: spacing.sm, gap: spacing.md },
  heading: { gap: spacing.xs },
  headingIcon: {
    width: layout.iconTileSize,
    height: layout.iconTileSize,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  subtitle: { ...typography.body, color: colors.textSecondary },
  currentEmailCard: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  currentEmailLabel: { ...typography.micro, color: colors.textTertiary, letterSpacing: 0.7 },
  currentEmail: { ...typography.bodySemibold, color: colors.textPrimary, marginTop: spacing.xxs },
  formCard: {
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  completedState: { gap: spacing.md },
  otpWrap: { gap: spacing.xs },
  otpHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  otpLabel: { ...typography.eyebrow, color: colors.textSecondary },
  expiryText: { ...typography.micro, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  resendRow: { minHeight: layout.headerButtonSize, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resendText: { ...typography.captionMedium, color: colors.textSecondary },
  resendButton: { minHeight: layout.headerButtonSize, justifyContent: 'center', paddingHorizontal: spacing.xs },
  resendLink: { ...typography.bodySemibold, color: colors.accent, textDecorationLine: 'underline' },
  expiredLabel: { ...typography.captionMedium, color: colors.expense },
  error: { ...typography.caption, color: colors.expense },
  success: { ...typography.caption, color: colors.income },
  cancelButton: { minHeight: layout.headerButtonSize, alignItems: 'center', justifyContent: 'center' },
  cancelText: { ...typography.captionMedium, color: colors.textSecondary },
});

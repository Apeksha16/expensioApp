import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { InputField } from '../../components/InputField';
import { useApp } from '../../context/AppContext';
import type { MainTabParamList } from '../../navigation/MainTabs';
import { emailVerificationService } from '../../services/emailChangeService';
import { colors, radius, spacing, typography } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'EmailChange'>;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 30;

export function EmailChangeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profileState, updateProfileEmail, showToast } = useApp();
  const currentEmail = profileState.email;
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [developmentOtp, setDevelopmentOtp] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!expiresAt && !cooldownUntil) return undefined;
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (expiresAt && currentTime >= expiresAt) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, cooldownUntil]);

  const codeExpired = expiresAt !== null && now >= expiresAt;
  const resendSeconds = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : 0;
  const expirySeconds = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0;
  const codeSent = Boolean(developmentOtp);

  const sendCode = async (resend = false) => {
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

    setSending(true);
    setError('');
    setSuccess('');
    try {
      const { developmentOtp: code, expiresAt: expiry } = await emailVerificationService.requestCode(normalizedEmail);
      setDevelopmentOtp(code);
      setExpiresAt(expiry);
      setCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
      setNow(Date.now());
      setOtp('');
    } catch (requestError) {
      const notice = requestError instanceof Error ? requestError.message : 'Unable to create a local verification code.';
      setError(notice);
      showToast('error', notice);
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
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
    if (!/^\d{6}$/.test(otp)) {
      const notice = 'Enter the six-digit verification code.';
      setError(notice);
      showToast('error', notice);
      return;
    }
    setVerifying(true);
    setError('');
    setSuccess('');
    try {
      await emailVerificationService.verifyCode(email, otp);
      await updateProfileEmail(email);
      setCompleted(true);
      const successMessage = 'Email verified and updated on this device. No email was sent.';
      setSuccess(successMessage);
      showToast('success', 'Email verified and updated.');
      setDevelopmentOtp('');
      setExpiresAt(null);
      setCooldownUntil(null);
      try {
        await emailVerificationService.complete();
      } catch (cleanupError) {
        setError(cleanupError instanceof Error
          ? `Email updated, but the temporary verification code could not be cleared: ${cleanupError.message}`
          : 'Email updated, but the temporary verification code could not be cleared.');
      }
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Unable to verify this code.');
      showToast('error', verifyError instanceof Error ? verifyError.message : 'Unable to verify this code.');
    } finally {
      setVerifying(false);
    }
  };

  const cancel = async () => {
    setError('');
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
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Profile"
          onPress={() => void cancel()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={21} color={colors.textPrimary} />
          <Text style={styles.backText}>Profile</Text>
        </Pressable>

        <View style={styles.heading}>
          <View style={styles.headingIcon}><Ionicons name="mail-unread-outline" size={25} color={colors.accent} /></View>
          <Text style={styles.title}>{completed ? 'Email updated' : 'Change email'}</Text>
          <Text style={styles.subtitle}>
            {completed ? 'Your new address is saved in your local profile.' : 'Verify the new address before replacing the one on your profile.'}
          </Text>
        </View>

        <View style={styles.currentEmailCard}>
          <Text style={styles.currentEmailLabel}>CURRENT EMAIL</Text>
          <Text numberOfLines={1} style={styles.currentEmail}>{currentEmail || 'Email not added'}</Text>
        </View>

        {!completed ? (
          <View style={styles.formCard}>
            <InputField
              label="New email address"
              value={email}
              onChangeText={(value) => {
                if (codeSent) {
                  setDevelopmentOtp('');
                  setExpiresAt(null);
                  setCooldownUntil(null);
                  setOtp('');
                }
                setEmail(value);
                setError('');
                setSuccess('');
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!sending && !verifying}
              accessibilityLabel="New email address"
            />

            {!codeSent ? (
              <PrimaryButton title="Send verification code" onPress={() => void sendCode()} loading={sending} />
            ) : (
              <>
                <View style={styles.devPanel}>
                  <View style={styles.devPanelHeading}>
                    <Ionicons name="construct-outline" size={18} color={colors.warning} />
                    <Text style={styles.devPanelTitle}>Development-only test verification</Text>
                  </View>
                  <Text style={styles.devPanelCopy}>
                    No email is sent in this frontend-only flow. Use this temporary code to test verification:
                  </Text>
                  <Text selectable style={styles.testCode}>{developmentOtp}</Text>
                  <Text style={styles.expiryText}>
                    {codeExpired ? 'Code expired.' : `Code expires in ${Math.floor(expirySeconds / 60)}:${String(expirySeconds % 60).padStart(2, '0')}.`}
                  </Text>
                </View>
                <View style={styles.otpWrap}>
                  <Text style={styles.otpLabel}>SIX-DIGIT CODE</Text>
                  <TextInput
                    accessibilityLabel="Six-digit email verification code"
                    value={otp}
                    onChangeText={(value) => { setOtp(value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    maxLength={6}
                    editable={!verifying && !codeExpired}
                    placeholder="000000"
                    placeholderTextColor={colors.textTertiary}
                    style={styles.otpInput}
                  />
                </View>
                <View style={styles.resendRow}>
                  {resendSeconds > 0 ? (
                    <Text style={styles.resendText}>Resend code in {resendSeconds}s</Text>
                  ) : (
                    <Pressable accessibilityRole="button" onPress={() => void sendCode(true)} disabled={sending} style={styles.resendButton}>
                      <Text style={styles.resendLink}>Resend code</Text>
                    </Pressable>
                  )}
                  {codeExpired ? <Text style={styles.expiredLabel}>Expired</Text> : null}
                </View>
                <PrimaryButton title="Verify and update email" onPress={() => void verifyCode()} loading={verifying} disabled={codeExpired} />
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
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  backButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingRight: spacing.sm },
  backText: { ...typography.bodyMedium, color: colors.textPrimary },
  heading: { gap: spacing.xs, marginTop: spacing.sm },
  headingIcon: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft, marginBottom: spacing.xs },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, lineHeight: 23 },
  currentEmailCard: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  currentEmailLabel: { ...typography.micro, color: colors.textTertiary, letterSpacing: 0.7 },
  currentEmail: { ...typography.bodySemibold, color: colors.textPrimary, marginTop: 4 },
  formCard: { padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  completedState: { gap: spacing.md },
  devPanel: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: '#EBD6B2', gap: spacing.xs },
  devPanelHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  devPanelTitle: { ...typography.captionMedium, color: colors.textPrimary, flex: 1 },
  devPanelCopy: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  testCode: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.md, backgroundColor: colors.surface, color: colors.accentDark, fontSize: 24, fontWeight: '800', letterSpacing: 4 },
  expiryText: { ...typography.micro, color: colors.textSecondary },
  otpWrap: { gap: spacing.xs },
  otpLabel: { ...typography.label, color: colors.textSecondary, letterSpacing: 1 },
  otpInput: { minHeight: 56, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, backgroundColor: colors.background, color: colors.textPrimary, fontSize: 22, fontWeight: '700', letterSpacing: 8 },
  resendRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resendText: { ...typography.captionMedium, color: colors.textSecondary },
  resendButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.xs },
  resendLink: { ...typography.bodySemibold, color: colors.accent, textDecorationLine: 'underline' },
  expiredLabel: { ...typography.captionMedium, color: colors.expense },
  error: { ...typography.caption, color: colors.expense },
  success: { ...typography.caption, color: colors.income, lineHeight: 19 },
  cancelButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  cancelText: { ...typography.captionMedium, color: colors.textSecondary },
});

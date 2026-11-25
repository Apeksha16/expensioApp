import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AuthHeroShell } from '../../components/AuthHeroShell';
import { OtpInput } from '../../components/OtpInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { OTP_RESEND_SECONDS } from '../../data/config';
import { countryCodes } from '../../data/mock';
import { sendEmailOtp, sendOtp, verifyEmailOtp, verifyOtp } from '../../services/authApi';
import { fontFamilies, colors, layout, radius, spacing, typography } from '../../theme';
import { formatCountdown, normalizeAuthError } from '../../utils/errorNormalization';
import { maskEmail, maskPhone } from '../../utils/format';

interface OtpAuditPreview {
  otp?: string;
  error?: string;
  seconds?: number;
  codeSent?: boolean;
}

export function OtpScreen({ auditPreview }: { auditPreview?: OtpAuditPreview } = {}) {
  const {
    verificationChannel,
    verificationTarget,
    verificationReturnPhase,
    otpCooldownSeconds,
    phone,
    countryCode,
    setAuthPhase,
    applyAuthSession,
  } = useApp();

  const isEmail = verificationChannel === 'email';
  const initialCooldown = otpCooldownSeconds ?? OTP_RESEND_SECONDS;
  const [otp, setOtp] = useState(auditPreview?.otp ?? '');
  const [error, setError] = useState(auditPreview?.error ?? '');
  const [lockedOut, setLockedOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(auditPreview?.seconds ?? initialCooldown);
  const [resending, setResending] = useState(false);
  const [codeSent, setCodeSent] = useState(auditPreview?.codeSent ?? false);

  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const isVerifyingRef = useRef(false);
  const lockedOutRef = useRef(false);
  const isResendingRef = useRef(false);
  const countryIso = countryCodes.find((item) => item.dial === countryCode)?.code;

  // Clear sensitive OTP state on target change or unmount (§2, J3)
  useEffect(() => {
    if (auditPreview) return;
    setOtp('');
    setError('');
    lockedOutRef.current = false;
    setLockedOut(false);
    setCodeSent(false);
    setSeconds(otpCooldownSeconds ?? OTP_RESEND_SECONDS);

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => {
      clearTimeout(timer);
      setOtp('');
      setError('');
    };
  }, [auditPreview, otpCooldownSeconds, verificationChannel, verificationTarget]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const verify = useCallback(async (value = otp) => {
    if (loading || isVerifyingRef.current || lockedOutRef.current) return;
    if (value.length !== 6) {
      const msg = 'Enter the 6-digit verification code.';
      setError(msg);
      AccessibilityInfo.announceForAccessibility?.(msg);
      return;
    }

    isVerifyingRef.current = true;
    setLoading(true);
    setError('');
    try {
      const response = isEmail
        ? await verifyEmailOtp(verificationTarget, value)
        : await verifyOtp(phone || verificationTarget, value, countryIso);
      setOtp('');
      await applyAuthSession(response);
    } catch (requestError) {
      const normalized = normalizeAuthError(requestError, 'otp');
      setError(normalized.message);
      if (normalized.isLockedOut) {
        lockedOutRef.current = true;
        setLockedOut(true);
      }
      AccessibilityInfo.announceForAccessibility?.(normalized.message);
    } finally {
      setLoading(false);
      isVerifyingRef.current = false;
      if (!lockedOutRef.current) {
        inputRef.current?.focus();
      }
    }
  }, [applyAuthSession, countryIso, isEmail, loading, otp, phone, verificationTarget]);

  const resend = async () => {
    if (isResendingRef.current || resending || seconds > 0) return;
    isResendingRef.current = true;
    setResending(true);
    setError('');
    setCodeSent(false);
    try {
      let cooldown = OTP_RESEND_SECONDS;
      if (isEmail) {
        const res = await sendEmailOtp(verificationTarget);
        if (res.resendCooldownSeconds) cooldown = res.resendCooldownSeconds;
      } else {
        const rawPhone = (phone || verificationTarget || '').trim();
        const activePhone = rawPhone.replace(/\D/g, '');
        const res = await sendOtp(activePhone || rawPhone, countryIso);
        if (res.resendCooldownSeconds) cooldown = res.resendCooldownSeconds;
      }
      setSeconds(cooldown);
      setOtp('');
      lockedOutRef.current = false;
      setLockedOut(false);
      setCodeSent(true);
      AccessibilityInfo.announceForAccessibility?.('A new verification code has been sent.');
      inputRef.current?.focus();
    } catch (requestError) {
      const normalized = normalizeAuthError(requestError, 'otp');
      if (normalized.retryAfterSeconds) {
        setSeconds(normalized.retryAfterSeconds);
      }
      setError(normalized.message);
      AccessibilityInfo.announceForAccessibility?.(normalized.message);
    } finally {
      isResendingRef.current = false;
      setResending(false);
    }
  };

  const maskedTarget = isEmail
    ? maskEmail(verificationTarget)
    : maskPhone(countryCode, phone || verificationTarget);

  const editAction = () => {
    setOtp('');
    setError('');
    setAuthPhase(verificationReturnPhase);
  };

  return (
    <AuthHeroShell
      onBack={editAction}
      backAccessibilityLabel={isEmail ? 'Change email address' : 'Change mobile number'}
      step={2}
      totalSteps={2}
      icon={isEmail ? 'mail-outline' : 'key-outline'}
      titleLine1={isEmail ? 'Check your' : 'Verify your'}
      titleAccent={isEmail ? 'email' : 'number'}
      subtitle={isEmail ? 'Enter the 6-digit code we sent to' : 'Enter the 6-digit code we texted to'}
      heroExtra={(
        <View style={styles.heroExtra}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isEmail ? 'Edit email address' : 'Edit mobile number'}
            onPress={editAction}
            style={({ pressed }) => [styles.contactChip, pressed && styles.chipPressed]}
          >
            <Text style={styles.targetText} numberOfLines={1}>{maskedTarget}</Text>
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={13} color={colors.surprise} />
            </View>
          </Pressable>

          <View style={styles.trustNote}>
            <Ionicons name="shield-checkmark-outline" size={17} color={colors.heroTextSubtle} />
            <Text style={styles.trustText}>
              This code only confirms it&apos;s you. We never ask for it by phone or email.
            </Text>
          </View>
        </View>
      )}
      footer={(
        <PrimaryButton
          title="Verify & Continue"
          variant="lime"
          surface="dark"
          loading={loading}
          disabled={otp.length !== 6 || loading || lockedOut}
          onPress={() => void verify()}
          style={styles.verifyButton}
        />
      )}
    >
      <Text style={styles.codeLabel}>VERIFICATION CODE</Text>

      <OtpInput
        value={otp}
        hasError={Boolean(error)}
        disabled={loading || lockedOut}
        inputRef={inputRef}
        onChange={(value) => {
          setOtp(value);
          if (error) setError('');
          if (codeSent) setCodeSent(false);
        }}
        onComplete={(code) => {
          if (!loading && !lockedOut) void verify(code);
        }}
      />

      {error ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={18} color={colors.expense} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {isEmail ? (
        <Text style={styles.helper}>
          Can&apos;t find it? Check your spam or promotions folder.
        </Text>
      ) : null}

      <View style={styles.resendRow}>
        {seconds > 0 ? (
          <Text style={styles.resendMuted}>
            Resend in <Text style={styles.seconds}>{formatCountdown(seconds)}</Text>
          </Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Resend verification code"
            accessibilityState={{ disabled: resending, busy: resending }}
            onPress={() => void resend()}
            disabled={resending}
            style={styles.resendButton}
          >
            <Text style={styles.resendLink}>{resending ? 'Sending…' : 'Resend code'}</Text>
          </Pressable>
        )}

        {codeSent ? (
          <View style={styles.sentPill}>
            <Ionicons name="checkmark-circle" size={14} color={colors.income} />
            <Text style={styles.sentPillText}>Code sent</Text>
          </View>
        ) : null}
      </View>
    </AuthHeroShell>
  );
}

const styles = StyleSheet.create({
  heroExtra: {
    gap: spacing.md,
    marginTop: spacing.xxs,
  },
  contactChip: {
    height: 38,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xxs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.heroBorder,
    backgroundColor: colors.heroChipBg,
  },
  chipPressed: {
    opacity: 0.85,
  },
  targetText: {
    ...typography.bodyMedium,
    color: colors.heroText,
    fontFamily: fontFamilies.bold,
  },
  editBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.heroIconBg,
  },
  trustNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trustText: {
    flex: 1,
    ...typography.caption,
    color: colors.heroTextSubtle,
  },
  codeLabel: {
    ...typography.eyebrow,
    color: colors.textSecondary,
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
  helper: {
    ...typography.caption,
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
    fontFamily: fontFamilies.extrabold,
    fontVariant: ['tabular-nums'],
  },
  resendButton: {
    minHeight: layout.headerButtonSize,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  resendLink: {
    ...typography.captionMedium,
    color: colors.accentDark,
    fontFamily: fontFamilies.extrabold,
    textDecorationLine: 'underline',
  },
  sentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  sentPillText: {
    ...typography.micro,
    color: colors.accentDark,
    fontFamily: fontFamilies.bold,
  },
  verifyButton: {
    minHeight: layout.buttonHeight,
  },
});

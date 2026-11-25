import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthHeroShell } from '../../components/AuthHeroShell';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useApp } from '../../context/AppContext';
import { DEFAULT_COUNTRY_DIAL } from '../../data/config';
import { countryCodes } from '../../data/mock';
import { sendEmailOtp, sendOtp } from '../../services/authApi';
import { colors, layout, radius, spacing, typography } from '../../theme';
import { normalizeAuthError } from '../../utils/errorNormalization';
import { isValidIndianMobile } from '../../utils/validation';

type Mode = 'mobile' | 'email';

function IndiaFlag() {
  return (
    <View style={styles.flag}>
      <View style={styles.flagSaffron} />
      <View style={styles.flagWhite}><View style={styles.flagWheel} /></View>
      <View style={styles.flagGreen} />
    </View>
  );
}

export function MobileLoginScreen() {
  const insets = useSafeAreaInsets();
  const {
    setAuthPhase,
    setPhoneCredentials,
    setVerification,
    verificationChannel,
    verificationTarget,
    phone: savedPhone,
    countryCode: savedCountryCode,
    onboardingDraft,
  } = useApp();

  const rawSavedPhone = savedPhone || (verificationChannel === 'phone' ? verificationTarget : '') || onboardingDraft.phone || '';
  const initialDial = savedCountryCode || DEFAULT_COUNTRY_DIAL;
  const dialDigits = initialDial.replace(/\D/g, '');
  const digitsOnly = rawSavedPhone.replace(/\D/g, '');
  const cleanPrefilledPhone = dialDigits && digitsOnly.startsWith(dialDigits) && digitsOnly.length > dialDigits.length
    ? digitsOnly.slice(dialDigits.length)
    : digitsOnly;

  const [mode, setMode] = useState<Mode>(verificationChannel === 'email' ? 'email' : 'mobile');
  const [dial, setDial] = useState(initialDial);
  const [phone, setPhone] = useState(cleanPrefilledPhone);
  const [email, setEmail] = useState(verificationChannel === 'email' ? verificationTarget : (onboardingDraft.email || ''));
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (cleanPrefilledPhone && !phone) {
      setPhone(cleanPrefilledPhone);
    }
    if (initialDial && dial !== initialDial) {
      setDial(initialDial);
    }
  }, [cleanPrefilledPhone, dial, initialDial, phone]);

  const selected = countryCodes.find((item) => item.dial === dial) ?? countryCodes[0];
  const phoneDigits = phone.replace(/\D/g, '');
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isReady = mode === 'mobile'
    ? (dial === '+91' ? isValidIndianMobile(phoneDigits, dial) : /^\d{8,15}$/.test(phoneDigits))
    : validEmail;

  const switchMode = (nextMode: Mode) => {
    if (loading || nextMode === mode) return;
    setMode(nextMode);
    setError('');
    setFocused(false);
  };

  const onPhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, dial === '+91' ? 10 : 15);
    setPhone(digits);
    if (error) setError('');
  };

  const onEmailChange = (value: string) => {
    setEmail(value.slice(0, 254));
    if (error) setError('');
  };

  const onInputChange = (value: string) => {
    if (mode === 'mobile') {
      onPhoneChange(value);
    } else {
      onEmailChange(value);
    }
  };

  const submit = async () => {
    if (loading || isSubmittingRef.current) return;
    if (!isReady) {
      setError(mode === 'mobile'
        ? dial === '+91' ? 'Enter a valid 10-digit mobile number.' : 'Enter a valid mobile number.'
        : 'Enter a valid email address.');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError('');
    try {
      if (mode === 'mobile') {
        const cleanPhone = phone.replace(/\D/g, '');
        await sendOtp(cleanPhone, selected.code);
        setPhoneCredentials(dial, cleanPhone);
        setVerification('phone', cleanPhone);
      } else {
        const target = email.trim().toLowerCase();
        await sendEmailOtp(target);
        setVerification('email', target);
      }
      setAuthPhase('otp');
    } catch (requestError) {
      setError(normalizeAuthError(requestError, 'otp').message);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const segmentOptions = [
    { key: 'mobile' as const, label: 'Mobile' },
    { key: 'email' as const, label: 'Email' },
  ];

  return (
    <>
      <AuthHeroShell
        onBack={() => setAuthPhase('login')}
        backAccessibilityLabel="Back to auth options"
        step={1}
        totalSteps={2}
        icon={mode === 'mobile' ? 'phone-portrait-outline' : 'mail-outline'}
        titleLine1="Your money,"
        titleAccent="made simpler"
        subtitle="Log in with a one-time code. No password to remember."
        footer={(
          <>
            <PrimaryButton
              title="Send OTP"
              variant="lime"
              surface="dark"
              loading={loading}
              disabled={!isReady || loading}
              onPress={() => void submit()}
              style={styles.sendButton}
            />
            <Text style={styles.terms}>
              By continuing, you agree to our{' '}
              <Text accessibilityRole="link" style={styles.termLink}>Terms</Text>
              {' '}and{' '}
              <Text accessibilityRole="link" style={styles.termLink}>Privacy Policy</Text>.
            </Text>
          </>
        )}
      >
        <SegmentedControl
          options={segmentOptions}
          value={mode}
          variant="primary"
          onChange={switchMode}
        />

        <View style={styles.formGroup}>
          <Text nativeID="login-field-label" style={styles.label}>
            {mode === 'mobile' ? 'Mobile number' : 'Email address'}
          </Text>
          <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
            {mode === 'mobile' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select country code"
                onPress={() => setPickerOpen(true)}
                style={styles.countrySection}
              >
                {dial === '+91' ? <IndiaFlag /> : <Text style={styles.countryEmoji}>{selected.flag}</Text>}
                <Text style={styles.dial}>{dial}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.accentDark} />
              </Pressable>
            ) : null}
            <TextInput
              key={mode}
              accessibilityLabel={mode === 'mobile' ? 'Mobile number' : 'Email address'}
              accessibilityLabelledBy="login-field-label"
              value={mode === 'mobile' ? phone : email}
              onChangeText={onInputChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onSubmitEditing={() => void submit()}
              keyboardType={mode === 'mobile' ? 'number-pad' : 'email-address'}
              autoComplete={mode === 'mobile' ? 'tel' : 'email'}
              textContentType={mode === 'mobile' ? 'telephoneNumber' : 'emailAddress'}
              maxLength={mode === 'mobile' ? (dial === '+91' ? 10 : 15) : 254}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              placeholder={mode === 'mobile' ? '9876543210' : 'you@example.com'}
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />
          </View>
          <Text style={styles.helper}>
            {mode === 'mobile'
              ? "We'll text you a 6-digit code."
              : "We'll email you a 6-digit code. No password needed."}
          </Text>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        </View>
      </AuthHeroShell>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setPickerOpen(false)}>
          <View style={[styles.picker, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            <View style={styles.handle} />
            <Text style={styles.pickerTitle}>Select country</Text>
            {countryCodes.map((item) => (
              <Pressable
                key={item.code}
                accessibilityRole="button"
                accessibilityLabel={`${item.name} ${item.dial}`}
                style={styles.pickerRow}
                onPress={() => {
                  setDial(item.dial);
                  setPhone('');
                  setPickerOpen(false);
                }}
              >
                <Text style={styles.countryEmoji}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.pickerDial}>{item.dial}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  formGroup: {
    gap: spacing.xs,
  },
  label: {
    ...typography.captionMedium,
    color: colors.accentDark,
    fontWeight: '700',
  },
  inputRow: {
    height: layout.authButtonHeight,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputRowFocused: {
    borderColor: colors.accentDark,
  },
  countrySection: {
    height: '100%',
    paddingHorizontal: spacing.sm,
    borderRightWidth: 1.5,
    borderRightColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flag: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  flagSaffron: { flex: 1, backgroundColor: colors.unexpected },
  flagWhite: { flex: 1, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  flagGreen: { flex: 1, backgroundColor: colors.income },
  flagWheel: { width: 8, height: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.toneSlateFg },
  countryEmoji: { ...typography.h2 },
  dial: { ...typography.h3, color: colors.accentDark, fontWeight: '700' },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingHorizontal: spacing.md,
    color: colors.accentDark,
    ...typography.h3,
  },
  helper: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.expense,
  },
  sendButton: {
    minHeight: layout.authButtonHeight,
  },
  terms: {
    ...typography.caption,
    color: colors.heroTextSubtle,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  termLink: {
    color: colors.heroText,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  picker: {
    backgroundColor: colors.heroCardBg,
    padding: spacing.lg,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.xxs,
    alignSelf: 'center',
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  pickerTitle: {
    ...typography.h2,
    color: colors.accentDark,
    marginBottom: spacing.sm,
  },
  pickerRow: {
    minHeight: layout.headerButtonSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  countryName: {
    flex: 1,
    ...typography.body,
    color: colors.accentDark,
  },
  pickerDial: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { DEFAULT_COUNTRY_DIAL } from '../../data/config';
import { countryCodes } from '../../data/mock';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { isValidIndianMobile } from '../../utils/validation';
import { sendOtp } from '../../services/authApi';

export function MobileLoginScreen() {
  const insets = useSafeAreaInsets();
  const { setAuthPhase, setPhoneCredentials } = useApp();
  const [dial, setDial] = useState(DEFAULT_COUNTRY_DIAL);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const selected = countryCodes.find((item) => item.dial === dial) ?? countryCodes[0];

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  const onPhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, dial === '+91' ? 10 : 15);
    setPhone(dial === '+91' ? digits.replace(/^(\d{5})(\d)/, '$1 $2') : digits);
    if (error) setError('');
  };

  const submit = async () => {
    if (!isValidIndianMobile(phone, dial)) {
      setError(dial === '+91' ? 'Enter a valid 10-digit number' : 'Enter a valid mobile number');
      return;
    }
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\s/g, '');
      await sendOtp(cleanPhone);
      setPhoneCredentials(dial, cleanPhone);
      setAuthPhase('otp');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send OTP');
    } finally {
      setLoading(false);
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
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.sm },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => setAuthPhase('login')} hitSlop={10} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>e</Text></View>
            <Text style={styles.brand}>expensio</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.intro}>
          <Text style={styles.kicker}>WELCOME BACK</Text>
          <Text style={styles.title}>Your money,{"\n"}made simpler.</Text>
          <Text style={styles.subtitle}>Sign in to pick up where you left off.</Text>
        </View>

        <View style={styles.visual}>
          <View style={styles.visualGlow} />
          <View style={styles.visualCard}>
            <View style={styles.visualTop}>
              <Text style={styles.visualLabel}>YOUR MONEY</Text>
              <View style={styles.visualDot} />
            </View>
            <Text style={styles.visualAmount}>₹1,24,500</Text>
            <View style={styles.visualBars}>
              {[28, 42, 34, 54, 68].map((height, index) => (
                <View key={height} style={[styles.visualBar, { height }, index === 4 && styles.visualBarAccent]} />
              ))}
            </View>
          </View>
          <View style={styles.sparkle}><Text style={styles.sparkleText}>✦</Text></View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Log in with OTP</Text>
          <Text style={styles.formSubtitle}>Enter your mobile number to receive a one-time password.</Text>
          <Text style={styles.label}>Mobile number</Text>
          <View style={[styles.phoneField, error && styles.phoneFieldError]}>
            <Pressable style={styles.country} onPress={() => setPickerOpen(true)}>
              <Text style={styles.flag}>{selected.flag}</Text>
              <Text style={styles.dial}>{selected.dial}</Text>
              <Text style={styles.chevron}>⌄</Text>
            </Pressable>
            <View style={styles.divider} />
            <TextInput
              ref={inputRef}
              accessibilityLabel="Mobile number"
              autoComplete="tel"
              value={phone}
              onChangeText={onPhoneChange}
              onSubmitEditing={submit}
              keyboardType="number-pad"
              placeholder="Enter mobile number"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="done"
              selectionColor={colors.accent}
              textContentType="telephoneNumber"
              style={styles.input}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton title="Send OTP  →" onPress={submit} loading={loading} style={styles.cta} />
          <Text style={styles.legal}>By continuing, you agree to our <Text style={styles.link}>Terms & Privacy Policy.</Text></Text>
        </View>
      </View>

      <Modal visible={pickerOpen} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setPickerOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select country</Text>
            {countryCodes.map((item) => (
              <Pressable
                key={item.code}
                style={styles.sheetRow}
                onPress={() => {
                  setDial(item.dial);
                  setPickerOpen(false);
                }}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={styles.sheetName}>{item.name}</Text>
                <Text style={styles.dial}>{item.dial}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { width: 42 },
  backText: { color: colors.accentDark, fontSize: 40, lineHeight: 40, fontWeight: '300' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: colors.white, fontSize: 22, fontWeight: '800' },
  brand: { color: colors.accentDark, fontSize: 23, fontWeight: '800', letterSpacing: -0.8 },
  headerSpacer: { width: 42 },
  intro: { marginTop: spacing.lg },
  kicker: { ...typography.label, color: colors.accent, letterSpacing: 1.4, marginBottom: spacing.xs },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    lineHeight: 35,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  visual: {
    height: 152,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  visualGlow: {
    position: 'absolute',
    width: 230,
    height: 130,
    borderRadius: 100,
    backgroundColor: colors.accentSoft,
  },
  visualCard: {
    width: 190,
    height: 112,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.accent,
    padding: spacing.sm,
    transform: [{ rotate: '-6deg' }],
    ...shadows.card,
  },
  visualTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  visualLabel: { ...typography.micro, color: colors.textTertiary, letterSpacing: 1 },
  visualDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  visualAmount: { color: colors.accentDark, fontSize: 22, fontWeight: '800', marginTop: spacing.xs },
  visualBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 40, marginTop: spacing.xs },
  visualBar: { width: 18, borderRadius: 5, backgroundColor: colors.accentMuted },
  visualBarAccent: { backgroundColor: colors.surprise },
  sparkle: {
    position: 'absolute',
    bottom: 8,
    left: '18%',
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surprise,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
  },
  sparkleText: { color: colors.accentDark, fontSize: 25 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    ...shadows.soft,
  },
  formTitle: { ...typography.h2, fontSize: 25, color: colors.textPrimary },
  formSubtitle: { ...typography.body, color: colors.textSecondary, lineHeight: 21, marginTop: spacing.xs, marginBottom: spacing.md },
  label: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs },
  phoneField: {
    height: 58,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  phoneFieldError: { borderColor: colors.expense },
  country: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs },
  flag: { fontSize: 19 },
  dial: { ...typography.bodyMedium, color: colors.textPrimary },
  chevron: { color: colors.textSecondary, fontSize: 19, marginTop: -4 },
  divider: { width: 1, height: 30, backgroundColor: colors.border, marginHorizontal: spacing.xs },
  input: { flex: 1, ...typography.body, color: colors.textPrimary, paddingVertical: spacing.sm },
  error: { ...typography.caption, color: colors.expense, marginTop: spacing.xs },
  cta: { height: 56, borderRadius: radius.full, marginTop: spacing.md },
  legal: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginTop: spacing.md },
  link: { color: colors.accentDark, textDecorationLine: 'underline' },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.lg, paddingBottom: spacing.xxl },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  sheetTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  sheetName: { ...typography.body, color: colors.textPrimary, flex: 1 },
});

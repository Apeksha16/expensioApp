import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { DEFAULT_COUNTRY_DIAL } from '../../data/config';
import { countryCodes } from '../../data/mock';
import { colors, radius, spacing, typography } from '../../theme';
import { isValidIndianMobile } from '../../utils/validation';

export function MobileLoginScreen() {
  const insets = useSafeAreaInsets();
  const { setAuthPhase, setPhoneCredentials } = useApp();
  const [dial, setDial] = useState(DEFAULT_COUNTRY_DIAL);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const selected = countryCodes.find((c) => c.dial === dial) ?? countryCodes[0];

  const onContinue = () => {
    if (!isValidIndianMobile(phone, dial)) {
      setError(
        dial === '+91'
          ? 'Enter a valid 10-digit mobile number'
          : 'Enter a valid mobile number',
      );
      return;
    }
    setError('');
    setPhoneCredentials(dial, phone.replace(/\s/g, ''));
    setAuthPhase('otp');
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
        <Pressable onPress={() => setAuthPhase('onboarding')} hitSlop={8} style={styles.backRow}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.back}>Back</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.brandTag}>expensio</Text>
          <Text style={styles.title}>Welcome back 👋</Text>
          <Text style={styles.subtitle}>Enter your mobile number to continue.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Mobile number</Text>
          <View style={styles.phoneRow}>
            <Pressable style={styles.country} onPress={() => setPickerOpen(true)}>
              <Text style={styles.flag}>{selected.flag}</Text>
              <Text style={styles.dial}>{selected.dial}</Text>
              <Text style={styles.chevron}>▾</Text>
            </Pressable>
            <View style={styles.phoneInput}>
              <InputField
                value={phone}
                onChangeText={(text) => {
                  setPhone(text.replace(/[^\d\s]/g, ''));
                  if (error) setError('');
                }}
                keyboardType="phone-pad"
                placeholder="98765 43210"
                maxLength={dial === '+91' ? 11 : 16}
                error={error}
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton title="Continue" onPress={onContinue} />
          <Text style={styles.legal}>
            By continuing, you agree to our Terms & Privacy Policy.
          </Text>
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
                style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}
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
    marginBottom: spacing.xxl,
    gap: spacing.xs,
  },
  brandTag: {
    ...typography.captionMedium,
    color: colors.accent,
    letterSpacing: 0.5,
    textTransform: 'lowercase',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  label: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  country: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flag: { fontSize: 18 },
  dial: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  chevron: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  phoneInput: {
    flex: 1,
  },
  footer: {
    gap: spacing.md,
  },
  legal: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetRowPressed: {
    backgroundColor: colors.background,
  },
  sheetName: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
});

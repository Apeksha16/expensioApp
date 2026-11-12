import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrencyInput } from '../../components/CurrencyInput';
import { InputField } from '../../components/InputField';
import { JourneyTimeline } from '../../components/JourneyTimeline';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { completeOnboarding, sendEmailOtp, sendOtp } from '../../services/authApi';
import { colors, radius, spacing, typography } from '../../theme';

const employment = [
  { value: 'salaried', label: 'Salaried', icon: 'briefcase-outline', income: 'Monthly salary' },
  { value: 'business', label: 'Business', icon: 'storefront-outline', income: 'Monthly minimum income' },
  { value: 'student', label: 'Student', icon: 'school-outline', income: 'Monthly pocket money' },
  { value: 'retired', label: 'Retired', icon: 'sunny-outline', income: 'Monthly pension' },
  { value: 'homemaker', label: 'Housemaker', icon: 'home-outline', income: 'Monthly household budget' },
] as const;

const money = (value: string) => value.replace(/\D/g, '');

export function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const {
    setAuthPhase, phone, countryCode, verificationChannel, setVerification,
    phoneVerified, emailVerified, onboardingDraft, updateOnboardingDraft,
    applyAuthSession, onboardingStep, setOnboardingStep,
  } = useApp();
  const [step, setStepState] = useState(onboardingStep);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setStep = (nextStep: number) => {
    setStepState(nextStep);
    setOnboardingStep(nextStep);
  };

  const selectedEmployment = useMemo(
    () => employment.find((item) => item.value === onboardingDraft.employmentType) ?? employment[0],
    [onboardingDraft.employmentType],
  );

  const goToVerification = async (channel: 'phone' | 'email', target: string) => {
    setLoading(true);
    try {
      if (channel === 'phone') await sendOtp(target);
      else await sendEmailOtp(target);
      setVerification(channel, target);
      setAuthPhase('otp');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const next = async () => {
    setError('');
    if (step === 1) {
      if (onboardingDraft.firstName.trim().length < 2 || onboardingDraft.lastName.trim().length < 2) {
        setError('Enter your first and last name');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(onboardingDraft.email)) {
        setError('Enter a valid email address');
        return;
      }
      if (!onboardingDraft.phone || onboardingDraft.phone.replace(/\D/g, '').length < 8) {
        setError('Enter a valid mobile number');
        return;
      }
      if (!phoneVerified) {
        await goToVerification('phone', onboardingDraft.phone);
        return;
      }
      if (!emailVerified) {
        await goToVerification('email', onboardingDraft.email);
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!onboardingDraft.employmentType) {
        setError('Select your employment type');
        return;
      }
      if (!onboardingDraft.incomeRupees) {
        setError(`Enter your ${selectedEmployment.income.toLowerCase()}`);
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      if (onboardingDraft.cashRupees.trim() === '') {
        setError('Enter your cash balance, or 0 if you have none');
        return;
      }
      setStep(4);
      return;
    }
    if (onboardingDraft.cashRupees.trim() === '') {
      setError('Enter your cash balance, or 0 if you have none');
      return;
    }
    setLoading(true);
    try {
      const response = await completeOnboarding({
        firstName: onboardingDraft.firstName.trim(),
        lastName: onboardingDraft.lastName.trim(),
        email: onboardingDraft.email.trim().toLowerCase(),
        phone: onboardingDraft.phone,
        employmentType: onboardingDraft.employmentType as Exclude<typeof onboardingDraft.employmentType, ''>,
        incomeAmountMinor: `${onboardingDraft.incomeRupees}00`,
        cashBalanceMinor: `${onboardingDraft.cashRupees}00`,
        savingsAmountMinor: `${onboardingDraft.savingsRupees || '0'}00`,
      });
      applyAuthSession(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to complete your account');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 1) {
      setAuthPhase(verificationChannel === 'email' ? 'email' : 'mobile');
    } else {
      setStep(step - 1);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable onPress={goBack} hitSlop={8}><Text style={styles.back}>← Back</Text></Pressable>
        <JourneyTimeline steps={[{ label: 'Profile' }, { label: 'Work' }, { label: 'Money' }, { label: 'Review' }]} current={step} />
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {step === 1 ? (
            <View style={styles.section}>
              <Text style={styles.kicker}>YOUR PROFILE</Text>
              <Text style={styles.title}>Let’s make it yours.</Text>
              <Text style={styles.subtitle}>Verified contacts are locked for your security.</Text>
              <InputField label="First name" value={onboardingDraft.firstName} onChangeText={(value) => updateOnboardingDraft({ firstName: value })} placeholder="Alan" autoCapitalize="words" />
              <InputField label="Last name" value={onboardingDraft.lastName} onChangeText={(value) => updateOnboardingDraft({ lastName: value })} placeholder="Doe" autoCapitalize="words" />
              <InputField label="Email" value={onboardingDraft.email} editable={!emailVerified} onChangeText={(value) => updateOnboardingDraft({ email: value })} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
              <InputField label="Mobile number" value={onboardingDraft.phone || `${countryCode} ${phone}`} editable={!phoneVerified} onChangeText={(value) => updateOnboardingDraft({ phone: value.replace(/\D/g, '') })} placeholder="Mobile number" keyboardType="phone-pad" />
              <Text style={styles.verified}>{emailVerified ? '✓ Email verified' : phoneVerified ? '✓ Mobile verified' : 'Both contacts require verification'}</Text>
            </View>
          ) : null}
          {step === 2 ? (
            <View style={styles.section}>
              <Text style={styles.kicker}>YOUR WORK</Text>
              <Text style={styles.title}>What best describes you?</Text>
              <Text style={styles.subtitle}>This chooses the right income label for your account.</Text>
              <View style={styles.employmentGrid}>
                {employment.map((item) => (
                  <Pressable key={item.value} onPress={() => updateOnboardingDraft({ employmentType: item.value })} style={[styles.employmentCard, onboardingDraft.employmentType === item.value && styles.employmentActive]}>
                    <Text style={styles.employmentIcon}>{item.icon === 'briefcase-outline' ? '▣' : item.icon === 'school-outline' ? '◇' : '◌'}</Text>
                    <Text style={[styles.employmentLabel, onboardingDraft.employmentType === item.value && styles.activeText]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
              <CurrencyInput label={selectedEmployment.income} value={Number(onboardingDraft.incomeRupees) || 0} onChangeValue={(value) => updateOnboardingDraft({ incomeRupees: String(Math.max(0, Math.trunc(value))) })} />
            </View>
          ) : null}
          {step === 3 ? (
            <View style={styles.section}>
              <Text style={styles.kicker}>YOUR STARTING POINT</Text>
              <Text style={styles.title}>Set your money baseline.</Text>
              <Text style={styles.subtitle}>These are your declared balances, not verified bank balances.</Text>
              <CurrencyInput label="Cash balance" value={Number(onboardingDraft.cashRupees) || 0} onChangeValue={(value) => updateOnboardingDraft({ cashRupees: String(Math.max(0, Math.trunc(value))) })} />
              <CurrencyInput label="Savings amount" value={Number(onboardingDraft.savingsRupees) || 0} onChangeValue={(value) => updateOnboardingDraft({ savingsRupees: String(Math.max(0, Math.trunc(value))) })} />
              <Text style={styles.currencyNote}>Currency: INR (₹)</Text>
            </View>
          ) : null}
          {step === 4 ? (
            <View style={styles.section}>
              <Text style={styles.kicker}>REVIEW</Text>
              <Text style={styles.title}>Ready to make it official?</Text>
              <Text style={styles.subtitle}>Review your details before creating your account.</Text>
              <View style={styles.reviewCard}>
                <Text style={styles.reviewHeading}>Profile</Text>
                <Text style={styles.reviewValue}>{onboardingDraft.firstName} {onboardingDraft.lastName}</Text>
                <Text style={styles.reviewValue}>{onboardingDraft.email}</Text>
                <Text style={styles.reviewValue}>{onboardingDraft.phone}</Text>
                <Pressable onPress={() => setStep(1)}><Text style={styles.edit}>Edit profile</Text></Pressable>
                <Text style={styles.reviewHeading}>Work and money</Text>
                <Text style={styles.reviewValue}>{selectedEmployment.label} · ₹{onboardingDraft.incomeRupees || '0'} / month</Text>
                <Text style={styles.reviewValue}>Cash ₹{onboardingDraft.cashRupees || '0'} · Savings ₹{onboardingDraft.savingsRupees || '0'}</Text>
                <Pressable onPress={() => setStep(2)}><Text style={styles.edit}>Edit work and money</Text></Pressable>
              </View>
            </View>
          ) : null}
        </ScrollView>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton title={step === 4 ? 'Create account' : 'Continue'} onPress={() => void next()} loading={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg, maxWidth: 520, width: '100%', alignSelf: 'center' },
  back: { ...typography.bodyMedium, color: colors.accent, marginBottom: spacing.lg },
  scroll: { paddingVertical: spacing.xl, gap: spacing.md, paddingBottom: spacing.lg },
  section: { gap: spacing.md },
  kicker: { ...typography.label, color: colors.accent, letterSpacing: 1.4 },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  verified: { ...typography.captionMedium, color: colors.income },
  employmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  employmentCard: { width: '30%', minHeight: 84, padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'space-between' },
  employmentActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  employmentIcon: { fontSize: 24, color: colors.accent },
  employmentLabel: { ...typography.captionMedium, color: colors.textPrimary },
  activeText: { color: colors.white },
  currencyNote: { ...typography.caption, color: colors.textTertiary },
  error: { ...typography.caption, color: colors.expense, marginBottom: spacing.sm },
  reviewCard: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  reviewHeading: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: spacing.sm },
  reviewValue: { ...typography.caption, color: colors.textSecondary },
  edit: { ...typography.captionMedium, color: colors.accent, marginTop: spacing.xs },
});

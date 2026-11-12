import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrencyInput } from '../../components/CurrencyInput';
import { JourneyTimeline } from '../../components/JourneyTimeline';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { completeOnboarding } from '../../services/authApi';
import { colors, radius, spacing, typography } from '../../theme';

const employment = [
  { value: 'salaried', label: 'Salaried', icon: 'briefcase-outline', income: 'Monthly salary' },
  { value: 'business', label: 'Business', icon: 'storefront-outline', income: 'Monthly minimum income' },
  { value: 'student', label: 'Student', icon: 'school-outline', income: 'Monthly pocket money' },
  { value: 'retired', label: 'Retired', icon: 'sunny-outline', income: 'Monthly pension' },
  { value: 'homemaker', label: 'Housemaker', icon: 'home-outline', income: 'Monthly household budget' },
] as const;

export function ProfileSetupScreen() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const insets = useSafeAreaInsets();
  const {
    setAuthPhase, phone, countryCode, verificationChannel, verificationTarget,
    onboardingDraft, updateOnboardingDraft,
    applyAuthSession, onboardingStep, setOnboardingStep,
  } = useApp();
  const [step, setStepState] = useState(onboardingStep);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);

  const setStep = (nextStep: number) => {
    setStepState(nextStep);
    setOnboardingStep(nextStep);
  };

  const selectedEmployment = useMemo(
    () => employment.find((item) => item.value === onboardingDraft.employmentType) ?? employment[0],
    [onboardingDraft.employmentType],
  );

  const next = async () => {
    setError('');
    if (step === 1) {
      if (!onboardingDraft.firstName.trim() || !onboardingDraft.lastName.trim()) {
        setError('Enter your first and last name');
        return;
      }
      if (!onboardingDraft.phone && phone) updateOnboardingDraft({ phone });
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
      await applyAuthSession(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to complete your account');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 1) {
      setAuthPhase('otp');
    } else {
      setStep(step - 1);
    }
  };

  const chooseProfilePhoto = () => {
    Alert.alert('Profile photo', 'Choose a photo source.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Photo library', onPress: () => void pickProfilePhoto('library') },
      { text: 'Camera', onPress: () => void pickProfilePhoto('camera') },
    ]);
  };

  const pickProfilePhoto = async (source: 'camera' | 'library') => {
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          `Allow Expensio to access your ${source === 'camera' ? 'camera' : 'photo library'} to add a profile photo.`,
        );
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled) setProfilePhotoUri(result.assets[0]?.uri ?? null);
    } catch {
      Alert.alert('Unable to add photo', 'Please try selecting a profile photo again.');
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.fontLoading}>
        <ActivityIndicator color="#C8F169" />
      </View>
    );
  }

  if (step === 1) {
    const rawPhone = onboardingDraft.phone || phone;
    const phoneDigits = rawPhone.replace(/\D/g, '');
    const dialDigits = countryCode.replace(/\D/g, '');
    const localPhone = dialDigits && phoneDigits.startsWith(dialDigits)
      ? phoneDigits.slice(dialDigits.length)
      : phoneDigits;
    const phoneValue = localPhone
      ? `${countryCode} ${localPhone.slice(0, 5)} ${localPhone.slice(5)}`
      : '';
    const emailValue = onboardingDraft.email || (verificationChannel === 'email' ? verificationTarget : '');
    const canContinue = Boolean(onboardingDraft.firstName.trim() && onboardingDraft.lastName.trim());

    return (
      <KeyboardAvoidingView style={styles.profileScreen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View pointerEvents="none" style={styles.decoration}>
          <View style={styles.outerRing} />
          <View style={styles.middleRing} />
        </View>
        <View style={styles.profileFrame}>
          <View style={[styles.profileTop, { paddingTop: insets.top + 8 }]}>
            <View style={styles.profileHeader}>
              <Pressable
                onPress={goBack}
                accessibilityRole="button"
                accessibilityLabel="Back to verification"
                hitSlop={8}
                style={styles.profileBackButton}
              >
                <Ionicons name="chevron-back" size={22} color="#F3F1E7" />
              </Pressable>
              <View style={styles.brandLockup}>
                <View style={styles.brandMark}>
                  <Text style={styles.brandMarkText}>e</Text>
                </View>
                <Text style={styles.brandText}>expensio</Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>

            <View
              style={styles.progressWrap}
              accessibilityRole="progressbar"
              accessibilityLabel={`Onboarding steps, step ${step} of 4: ${['Profile', 'Work', 'Money', 'Review'][step - 1]}`}
            >
              <View style={styles.progressDots}>
                {['Profile', 'Work', 'Money', 'Review'].map((label, index) => {
                  const stepNumber = index + 1;
                  const complete = stepNumber < step;
                  const active = stepNumber === step;
                  return (
                    <React.Fragment key={label}>
                      <View style={[
                        styles.progressNode,
                        active && styles.progressNodeActive,
                        complete && styles.progressNodeComplete,
                      ]}>
                        {complete ? (
                          <Ionicons name="checkmark" size={15} color="#0B2B1F" />
                        ) : (
                          <Text style={[styles.progressNumber, active && styles.progressNumberActive]}>
                            {stepNumber}
                          </Text>
                        )}
                      </View>
                      {index < 3 ? <View style={[styles.progressConnector, complete && styles.progressConnectorComplete]} /> : null}
                    </React.Fragment>
                  );
                })}
              </View>
              <View style={styles.progressLabels}>
                {['Profile', 'Work', 'Money', 'Review'].map((label, index) => (
                  <Text key={label} style={[styles.progressLabel, index + 1 === step && styles.progressLabelActive]}>
                    {label}
                  </Text>
                ))}
              </View>
            </View>

            <View style={styles.profileHero}>
              <View style={styles.profileHeadline}>
                <Text style={styles.profileTitle}>Let&apos;s make it</Text>
                <View style={styles.titleHighlight}>
                  <Text style={styles.profileTitleHighlight}>yours.</Text>
                </View>
              </View>
              <Text style={styles.profileSubtitle}>
                Takes under a minute. Verified contacts stay locked for your security.
              </Text>
            </View>
          </View>

          <View style={styles.profilePanel}>
            <View style={styles.profileAvatarArea}>
              <View style={styles.avatar}>
                {profilePhotoUri ? (
                  <Image source={{ uri: profilePhotoUri }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarLetter}>
                    {(onboardingDraft.firstName.trim()[0] || 'A').toUpperCase()}
                  </Text>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add or edit profile photo"
                  onPress={chooseProfilePhoto}
                  style={styles.cameraBadge}
                >
                  <View style={styles.cameraBadgeIcon}>
                    <Ionicons name="camera-outline" size={14} color="#0B2B1F" />
                  </View>
                </Pressable>
              </View>
              <Text style={styles.photoHint}>Add a profile photo</Text>
            </View>

            <ScrollView
              style={styles.profileFormScroll}
              contentContainerStyle={[styles.profileForm, { paddingBottom: Math.max(insets.bottom, 24) }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.nameRow}>
                <ProfileNameField
                  label="First name"
                  value={onboardingDraft.firstName}
                  placeholder="Apeksha"
                  accessibilityLabel="First name"
                  onChangeText={(value) => {
                    updateOnboardingDraft({ firstName: value });
                    setError('');
                  }}
                />
                <ProfileNameField
                  label="Last name"
                  value={onboardingDraft.lastName}
                  placeholder="Doe"
                  accessibilityLabel="Last name"
                  onChangeText={(value) => {
                    updateOnboardingDraft({ lastName: value });
                    setError('');
                  }}
                />
              </View>

              <View style={styles.verifiedFields}>
                <ContactField label="EMAIL" value={emailValue} />
                <ContactField label="MOBILE NUMBER" value={phoneValue} />
              </View>

              {error ? <Text style={styles.profileError}>{error}</Text> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue to Work"
                accessibilityState={{ disabled: !canContinue, busy: loading }}
                disabled={!canContinue || loading}
                onPress={() => void next()}
                style={({ pressed }) => [
                  styles.profileContinue,
                  canContinue && styles.profileContinueEnabled,
                  pressed && canContinue && styles.profileContinuePressed,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={canContinue ? '#0B2B1F' : '#8FA698'} />
                ) : (
                  <View style={styles.continueContents}>
                    <Text style={[styles.profileContinueText, canContinue && styles.profileContinueTextEnabled]}>
                      Continue
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color={canContinue ? '#0B2B1F' : '#8FA698'} />
                  </View>
                )}
              </Pressable>
              <Text style={styles.profileFooterHint}>
                You can change this anytime in Settings.
              </Text>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable onPress={goBack} hitSlop={8}><Text style={styles.back}>← Back</Text></Pressable>
        <JourneyTimeline steps={[{ label: 'Profile' }, { label: 'Work' }, { label: 'Money' }, { label: 'Review' }]} current={step} />
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
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
  fontLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B2B1F' },
  profileScreen: { flex: 1, backgroundColor: '#0B2B1F' },
  decoration: { position: 'absolute', width: 340, height: 340, top: 10, right: -170 },
  outerRing: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 170, borderWidth: 1.5, borderColor: 'rgba(200,241,105,0.14)' },
  middleRing: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 1.5, borderColor: 'rgba(200,241,105,0.1)', left: 50, top: 50 },
  profileFrame: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', boxSizing: 'border-box' },
  profileTop: { paddingHorizontal: 20, gap: 22, paddingBottom: 22 },
  profileHeader: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileBackButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#2B5644', alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 44, height: 44 },
  brandLockup: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  brandMark: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#C8F169', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#0B2B1F', fontSize: 17, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  brandText: { color: '#F3F1E7', fontSize: 19, fontWeight: '700', letterSpacing: -0.3, fontFamily: 'PlusJakartaSans_700Bold' },
  progressWrap: { gap: 10 },
  progressDots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressNode: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#132E22', borderWidth: 1.5, borderColor: '#2B5644', alignItems: 'center', justifyContent: 'center' },
  progressNodeActive: { backgroundColor: '#C8F169', borderColor: '#C8F169', shadowColor: '#C8F169', shadowOpacity: 0.65, shadowRadius: 4, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  progressNodeComplete: { backgroundColor: '#C8F169', borderColor: '#C8F169' },
  progressConnector: { flex: 1, height: 2, marginHorizontal: 6, backgroundColor: '#2B5644' },
  progressConnectorComplete: { backgroundColor: '#C8F169' },
  progressNumber: { color: '#7D9387', fontSize: 12, fontWeight: '600', fontFamily: 'PlusJakartaSans_600SemiBold' },
  progressNumberActive: { color: '#0B2B1F', fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#5D7266', fontSize: 12, fontWeight: '600', fontFamily: 'PlusJakartaSans_600SemiBold' },
  progressLabelActive: { color: '#C8F169', fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  profileHero: { gap: 10 },
  profileHeadline: { alignItems: 'flex-start' },
  profileTitle: { color: '#F3F1E7', fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -1.2, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  titleHighlight: { alignSelf: 'flex-start', marginTop: -1, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8, backgroundColor: '#C8F169', transform: [{ rotate: '-2deg' }] },
  profileTitleHighlight: { color: '#0B2B1F', fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -1.2, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  profileSubtitle: { color: '#B7C9BC', fontSize: 15, lineHeight: 22, fontWeight: '500', fontFamily: 'PlusJakartaSans_500Medium' },
  profilePanel: { flex: 1, minHeight: 0, backgroundColor: '#F3F1E7', borderTopLeftRadius: 28, borderTopRightRadius: 28, shadowColor: '#000000', shadowOffset: { width: 0, height: -18 }, shadowOpacity: 0.35, shadowRadius: 25, elevation: 14 },
  profileAvatarArea: { height: 38, zIndex: 2, alignItems: 'center' },
  avatar: { position: 'absolute', top: -38, width: 76, height: 76, borderRadius: 38, backgroundColor: '#0B2B1F', borderWidth: 3, borderColor: '#C8F169', alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 38 },
  avatarLetter: { color: '#C8F169', fontSize: 30, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  cameraBadge: { position: 'absolute', right: -11, bottom: -11, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cameraBadgeIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#C8F169', borderWidth: 3, borderColor: '#F3F1E7', alignItems: 'center', justifyContent: 'center' },
  photoHint: { position: 'absolute', top: 43, color: '#1F6B3D', fontSize: 13, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  profileFormScroll: { flex: 1, minHeight: 0 },
  profileForm: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 46, paddingBottom: 24, gap: 18 },
  nameRow: { flexDirection: 'row', gap: 12 },
  nameFieldWrap: { flex: 1, minWidth: 0, gap: 8 },
  nameLabel: { color: '#0B2B1F', fontSize: 13, lineHeight: 18, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  nameInputWrap: { height: 56, justifyContent: 'center', borderRadius: 16, borderWidth: 1.5, borderColor: '#CBD2C2', backgroundColor: '#FFFFFF' },
  nameInputWrapFocused: { borderColor: '#0B2B1F', shadowColor: '#C8F169', shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  nameInputIcon: { position: 'absolute', left: 16, zIndex: 1 },
  nameInput: { flex: 1, height: '100%', paddingLeft: 44, paddingRight: 10, color: '#0B2B1F', fontSize: 16, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  nameInputPlaceholder: { fontWeight: '500', fontFamily: 'PlusJakartaSans_500Medium' },
  verifiedFields: { gap: 10 },
  contactField: { minHeight: 64, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E6E9DB', flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#E6EADA', alignItems: 'center', justifyContent: 'center' },
  contactCopy: { flex: 1, minWidth: 0, gap: 1 },
  contactLabel: { color: '#74837A', fontSize: 11.5, lineHeight: 15, fontWeight: '700', letterSpacing: 0.6, fontFamily: 'PlusJakartaSans_700Bold' },
  contactValue: { color: '#0B2B1F', fontSize: 15, lineHeight: 20, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  verifiedBadge: { height: 24, borderRadius: 999, backgroundColor: 'rgba(31,107,61,0.1)', flexDirection: 'row', alignItems: 'center', gap: 3, paddingLeft: 7, paddingRight: 9 },
  verifiedText: { color: '#1F6B3D', fontSize: 11.5, lineHeight: 16, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  profileError: { color: '#B3261E', fontSize: 12, lineHeight: 17, fontFamily: 'PlusJakartaSans_500Medium' },
  profileContinue: { height: 60, borderRadius: 30, backgroundColor: '#1E4132', alignItems: 'center', justifyContent: 'center' },
  profileContinueEnabled: { backgroundColor: '#C8F169' },
  profileContinuePressed: { opacity: 0.9 },
  continueContents: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  profileContinueText: { color: '#8FA698', fontSize: 17, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  profileContinueTextEnabled: { color: '#0B2B1F' },
  profileFooterHint: { color: '#8C9A8F', fontSize: 12, lineHeight: 17, textAlign: 'center', fontFamily: 'PlusJakartaSans_400Regular' },
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

interface ContactFieldProps {
  label: string;
  value: string;
}

function ContactField({ label, value }: ContactFieldProps) {
  return (
    <View style={styles.contactField}>
      <View style={styles.contactIcon}>
        <Ionicons name="lock-closed-outline" size={16} color="#4B5A50" />
      </View>
      <View style={styles.contactCopy}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue} numberOfLines={1} ellipsizeMode="tail">
          {value || '—'}
        </Text>
      </View>
      <View style={styles.verifiedBadge}>
        <Ionicons name="checkmark" size={12} color="#1F6B3D" />
        <Text style={styles.verifiedText}>Verified</Text>
      </View>
    </View>
  );
}

interface ProfileNameFieldProps {
  label: string;
  value: string;
  placeholder: string;
  accessibilityLabel: string;
  onChangeText: (value: string) => void;
}

function ProfileNameField({
  label,
  value,
  placeholder,
  accessibilityLabel,
  onChangeText,
}: ProfileNameFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.nameFieldWrap}>
      <Text style={styles.nameLabel}>{label}</Text>
      <View style={[styles.nameInputWrap, focused && styles.nameInputWrapFocused]}>
        <Ionicons
          name="person-outline"
          size={16}
          color="#74837A"
          style={styles.nameInputIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#74837A"
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel={accessibilityLabel}
          style={[styles.nameInput, !value && styles.nameInputPlaceholder]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

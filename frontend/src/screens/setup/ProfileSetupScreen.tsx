import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
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
  const firstNameDraft = useRef(onboardingDraft.firstName);
  const lastNameDraft = useRef(onboardingDraft.lastName);

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
      const firstName = firstNameDraft.current.trim();
      const lastName = lastNameDraft.current.trim();
      updateOnboardingDraft({ firstName, lastName });
      if (!firstName || !lastName) {
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
    const canContinue = true;

    return (
      <KeyboardAvoidingView style={styles.profileScreen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.profileFrame}>
          <ScrollView
            style={styles.profileFormScroll}
            contentContainerStyle={[styles.profileContent, { paddingTop: insets.top + 10 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profileHeader}>
              <Pressable
                onPress={goBack}
                accessibilityRole="button"
                accessibilityLabel="Back to verification"
                hitSlop={8}
                style={styles.profileBackButton}
              >
                <Ionicons name="chevron-back" size={21} color="#0B2B1F" />
              </Pressable>
              <View style={styles.brandLockup}>
                <View style={styles.brandMark}>
                  <Text style={styles.brandMarkText}>e</Text>
                </View>
                <Text style={styles.brandText}>expensio</Text>
              </View>
              <View style={styles.stepCount}>
                <Text style={styles.stepCountText}>01</Text>
                <Text style={styles.stepCountDivider}>/</Text>
                <Text style={styles.stepCountMuted}>04</Text>
              </View>
            </View>

            <View
              style={styles.progressWrap}
              accessibilityRole="progressbar"
              accessibilityLabel={`Onboarding steps, step ${step} of 4: ${['Profile', 'Work', 'Money', 'Review'][step - 1]}`}
            >
              <View style={styles.progressMeta}>
                <Text style={styles.progressEyebrow}>YOUR SETUP</Text>
                <Text style={styles.progressCurrent}>PROFILE</Text>
              </View>
              <View style={styles.progressSegments}>
                {['Profile', 'Work', 'Money', 'Review'].map((label, index) => (
                  <View
                    key={label}
                    style={[styles.progressSegment, index < step && styles.progressSegmentActive]}
                  />
                ))}
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
              <View style={styles.heroAccent}>
                <Ionicons name="sparkles" size={13} color="#0B2B1F" />
                <Text style={styles.heroAccentText}>A FRESH START</Text>
              </View>
              <Text style={styles.profileTitle}>First, the basics.</Text>
              <Text style={styles.profileSubtitle}>
                A few details help us make your money space feel like yours.
              </Text>
            </View>

            <View style={styles.profileCard}>
              <View style={styles.photoRow}>
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
                    <Ionicons name="camera" size={16} color="#0B2B1F" />
                  </Pressable>
                </View>
                <View style={styles.photoCopy}>
                  <Text style={styles.photoTitle}>Your profile photo</Text>
                  <Text style={styles.photoHint}>Add a little personality to your account.</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose a profile photo"
                  onPress={chooseProfilePhoto}
                  style={styles.photoAction}
                >
                  <Ionicons name="add" size={19} color="#0B2B1F" />
                </Pressable>
              </View>

              <View style={styles.formDivider} />
              <Text style={styles.formSectionTitle}>What should we call you?</Text>
              <View style={styles.nameRow}>
                <ProfileNameField
                  label="First name"
                  value={onboardingDraft.firstName}
                  placeholder="Apeksha"
                  accessibilityLabel="First name"
                  onChangeText={(value) => { firstNameDraft.current = value; }}
                  onCommit={(value) => updateOnboardingDraft({ firstName: value })}
                />
                <ProfileNameField
                  label="Last name"
                  value={onboardingDraft.lastName}
                  placeholder="Doe"
                  accessibilityLabel="Last name"
                  onChangeText={(value) => { lastNameDraft.current = value; }}
                  onCommit={(value) => updateOnboardingDraft({ lastName: value })}
                />
              </View>

              <View style={styles.contactSectionHeading}>
                <Text style={styles.formSectionTitle}>Verified contacts</Text>
                <Text style={styles.contactSectionHint}>Locked for your security</Text>
              </View>
              <View style={styles.verifiedFields}>
                <ContactField label="EMAIL" value={emailValue} />
                <ContactField label="MOBILE NUMBER" value={phoneValue} />
              </View>
            </View>
          </ScrollView>

          <View style={[styles.profileFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {error ? <Text accessibilityRole="alert" style={styles.profileError}>{error}</Text> : null}
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
                    Continue to Work
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color={canContinue ? '#0B2B1F' : '#8FA698'} />
                </View>
              )}
            </Pressable>
            <Text style={styles.profileFooterHint}>Your details stay private and secure.</Text>
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
  fontLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  profileScreen: { flex: 1, backgroundColor: '#F4F3EC' },
  profileFrame: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  profileContent: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 18, gap: 24 },
  profileHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileBackButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E8DE', alignItems: 'center', justifyContent: 'center' },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#C8F169', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#0B2B1F', fontSize: 16, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  brandText: { color: '#0B2B1F', fontSize: 17, fontWeight: '800', letterSpacing: -0.5, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  stepCount: { minWidth: 56, height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 12, backgroundColor: '#E8EDDF' },
  stepCountText: { color: '#0B2B1F', fontSize: 12, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  stepCountDivider: { color: '#9AA99B', fontSize: 12 },
  stepCountMuted: { color: '#849187', fontSize: 12, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  progressWrap: { gap: 10 },
  progressMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressEyebrow: { color: '#718177', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  progressCurrent: { color: '#1F6B3D', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  progressSegments: { flexDirection: 'row', gap: 6 },
  progressSegment: { flex: 1, height: 5, borderRadius: 5, backgroundColor: '#DDE3D8' },
  progressSegmentActive: { backgroundColor: '#1F6B3D' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#89958B', fontSize: 10, fontWeight: '600', fontFamily: 'PlusJakartaSans_600SemiBold' },
  progressLabelActive: { color: '#0B2B1F', fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  profileHero: { gap: 9 },
  heroAccent: { alignSelf: 'flex-start', height: 25, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, borderRadius: 9, backgroundColor: '#DDF3A4' },
  heroAccentText: { color: '#31532B', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  profileTitle: { color: '#0B2B1F', fontSize: 32, lineHeight: 39, fontWeight: '800', letterSpacing: -1.1, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  profileSubtitle: { maxWidth: 330, color: '#68766D', fontSize: 14, lineHeight: 21, fontWeight: '500', fontFamily: 'PlusJakartaSans_500Medium' },
  profileCard: { padding: 18, borderRadius: 25, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7EAE1', gap: 17, shadowColor: '#143A2C', shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 3 },
  photoRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 68, height: 68, borderRadius: 23, backgroundColor: '#0B2B1F', borderWidth: 2, borderColor: '#C8F169', alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 21 },
  avatarLetter: { color: '#C8F169', fontSize: 27, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  cameraBadge: { position: 'absolute', right: -7, bottom: -7, width: 34, height: 34, borderRadius: 12, borderWidth: 3, borderColor: '#FFFFFF', backgroundColor: '#C8F169', alignItems: 'center', justifyContent: 'center' },
  photoCopy: { flex: 1, minWidth: 0, gap: 4 },
  photoTitle: { color: '#0B2B1F', fontSize: 14, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  photoHint: { color: '#7A887F', fontSize: 11, lineHeight: 16, fontWeight: '500', fontFamily: 'PlusJakartaSans_500Medium' },
  photoAction: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#EFF3E9', alignItems: 'center', justifyContent: 'center' },
  formDivider: { height: 1, backgroundColor: '#EEF0E9' },
  formSectionTitle: { color: '#173B2C', fontSize: 14, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  contactSectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  contactSectionHint: { color: '#8B978D', fontSize: 10, fontWeight: '600', fontFamily: 'PlusJakartaSans_600SemiBold' },
  profileFooter: { paddingHorizontal: 22, paddingTop: 12, gap: 10, backgroundColor: '#F4F3EC', borderTopWidth: 1, borderTopColor: '#E7E9E1' },
  profileFormScroll: { flex: 1, minHeight: 0 },
  nameRow: { flexDirection: 'row', gap: 10 },
  nameFieldWrap: { flex: 1, minWidth: 0, gap: 7 },
  nameLabel: { color: '#44584B', fontSize: 11, lineHeight: 16, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  nameInputWrap: { height: 54, justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#E0E5DC', backgroundColor: '#F9FAF7' },
  nameInputWrapFocused: { borderColor: '#1F6B3D', shadowColor: '#C8F169', shadowOpacity: 0.8, shadowRadius: 4, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  nameInputIcon: { position: 'absolute', left: 12, zIndex: 1 },
  nameInput: { flex: 1, height: '100%', paddingLeft: 36, paddingRight: 8, color: '#0B2B1F', fontSize: 14, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  nameInputPlaceholder: { fontWeight: '500', fontFamily: 'PlusJakartaSans_500Medium' },
  verifiedFields: { gap: 8 },
  contactField: { minHeight: 58, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 14, backgroundColor: '#F9FAF7', borderWidth: 1, borderColor: '#E8ECE4', flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#E8F0E2', alignItems: 'center', justifyContent: 'center' },
  contactCopy: { flex: 1, minWidth: 0, gap: 1 },
  contactLabel: { color: '#87938A', fontSize: 9, lineHeight: 13, fontWeight: '800', letterSpacing: 0.7, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  contactValue: { color: '#173B2C', fontSize: 13, lineHeight: 18, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  verifiedBadge: { height: 23, borderRadius: 999, backgroundColor: '#E5F3DC', flexDirection: 'row', alignItems: 'center', gap: 3, paddingLeft: 7, paddingRight: 8 },
  verifiedText: { color: '#1F6B3D', fontSize: 10, lineHeight: 14, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  profileError: { color: '#B3261E', fontSize: 12, lineHeight: 17, fontFamily: 'PlusJakartaSans_500Medium' },
  profileContinue: { height: 56, borderRadius: 18, backgroundColor: '#DCE3D9', alignItems: 'center', justifyContent: 'center' },
  profileContinueEnabled: { backgroundColor: '#0B3D2B' },
  profileContinuePressed: { opacity: 0.9 },
  continueContents: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  profileContinueText: { color: '#8A958B', fontSize: 15, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  profileContinueTextEnabled: { color: '#F4F3EC' },
  profileFooterHint: { color: '#87938A', fontSize: 10, lineHeight: 15, textAlign: 'center', fontFamily: 'PlusJakartaSans_500Medium' },
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
  onCommit: (value: string) => void;
}

function ProfileNameField({
  label,
  value,
  placeholder,
  accessibilityLabel,
  onChangeText,
  onCommit,
}: ProfileNameFieldProps) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(value);
  const textRef = useRef(value);

  return (
    <View style={styles.nameFieldWrap}>
      <Text style={styles.nameLabel}>{label}</Text>
      <View style={[styles.nameInputWrap, focused && styles.nameInputWrapFocused]}>
        <Ionicons
          name="person-outline"
          size={16}
          color="#74837A"
          pointerEvents="none"
          style={styles.nameInputIcon}
        />
        <TextInput
          value={text}
          onChangeText={(nextValue) => {
            textRef.current = nextValue;
            setText(nextValue);
            onChangeText(nextValue);
          }}
          placeholder={placeholder}
          placeholderTextColor="#74837A"
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel={accessibilityLabel}
          style={[styles.nameInput, !text && styles.nameInputPlaceholder]}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onCommit(textRef.current);
          }}
        />
      </View>
    </View>
  );
}

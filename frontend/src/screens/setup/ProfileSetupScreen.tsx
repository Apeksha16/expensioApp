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
  { value: 'salaried', label: 'Salaried', detail: 'A regular paycheck', icon: 'briefcase-outline', income: 'Monthly salary' },
  { value: 'business', label: 'Business', detail: 'Self-employed income', icon: 'storefront-outline', income: 'Monthly minimum income' },
  { value: 'student', label: 'Student', detail: 'Allowance or stipend', icon: 'school-outline', income: 'Monthly pocket money' },
  { value: 'retired', label: 'Retired', detail: 'Pension or retirement income', icon: 'sunny-outline', income: 'Monthly pension' },
  { value: 'homemaker', label: 'Homemaker', detail: 'Household income', icon: 'home-outline', income: 'Monthly household budget' },
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
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={goBack}
          hitSlop={8}
          style={styles.journeyBack}
        >
          <Ionicons name="arrow-back" size={18} color={colors.accent} />
          <Text style={styles.back}>Back</Text>
          <View style={styles.journeyStepCount}>
            <Text style={styles.journeyStepCountText}>{String(step).padStart(2, '0')} / 04</Text>
          </View>
        </Pressable>
        <JourneyTimeline steps={[{ label: 'Profile' }, { label: 'Work' }, { label: 'Money' }, { label: 'Review' }]} current={step} />
        <ScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="none" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {step === 2 ? (
            <View style={styles.workSection}>
              <View style={styles.workIntro}>
                <View style={styles.workEyebrowRow}>
                  <View style={styles.workEyebrowIcon}>
                    <Ionicons name="sparkles" size={13} color={colors.accentDark} />
                  </View>
                  <Text style={styles.kicker}>YOUR WORK</Text>
                </View>
                <Text style={styles.title}>How do you earn?</Text>
                <Text style={styles.subtitle}>Choose what fits best. You can update this any time.</Text>
              </View>

              <View style={styles.employmentGrid}>
                {employment.map((item) => {
                  const selected = onboardingDraft.employmentType === item.value;
                  return (
                    <Pressable
                      key={item.value}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => {
                        setError('');
                        updateOnboardingDraft({ employmentType: item.value });
                      }}
                      style={[styles.employmentCard, selected && styles.employmentActive]}
                    >
                      <View style={styles.employmentCardTop}>
                        <View style={[styles.employmentIconWrap, selected && styles.employmentIconWrapActive]}>
                          <Ionicons name={item.icon} size={20} color={selected ? colors.white : colors.accent} />
                        </View>
                        <View style={[styles.employmentSelection, selected && styles.employmentSelectionActive]}>
                          {selected ? <Ionicons name="checkmark" size={12} color={colors.white} /> : null}
                        </View>
                      </View>
                      <Text style={[styles.employmentLabel, selected && styles.activeText]}>{item.label}</Text>
                      <Text style={[styles.employmentDetail, selected && styles.employmentDetailActive]}>{item.detail}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.incomePanel}>
                <View style={styles.incomePanelHeading}>
                  <View style={styles.incomeHeadingCopy}>
                    <Text style={styles.incomeEyebrow}>A QUICK ESTIMATE</Text>
                    <Text style={styles.incomeTitle}>Your typical monthly income</Text>
                  </View>
                  <View style={styles.incomeAccent}>
                    <Ionicons name="trending-up" size={18} color={colors.accentDark} />
                  </View>
                </View>
                <CurrencyInput
                  label={selectedEmployment.income}
                  value={Number(onboardingDraft.incomeRupees) || 0}
                  onChangeValue={(value) => updateOnboardingDraft({ incomeRupees: String(Math.max(0, Math.trunc(value))) })}
                  variant="card"
                />
                <Text style={styles.incomeHint}>An estimate is all you need to get started.</Text>
              </View>
            </View>
          ) : null}
          {step === 3 ? (
            <View style={styles.moneySection}>
              <View style={styles.moneyIntro}>
                <View style={styles.workEyebrowRow}>
                  <View style={styles.workEyebrowIcon}>
                    <Ionicons name="wallet-outline" size={13} color={colors.accentDark} />
                  </View>
                  <Text style={styles.kicker}>YOUR STARTING POINT</Text>
                </View>
                <Text style={styles.title}>Start with what you have.</Text>
                <Text style={styles.subtitle}>Add your current cash and savings to give your money a clear starting point.</Text>
              </View>

              <View style={styles.moneyPrivacyNote}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.accent} />
                <Text style={styles.moneyPrivacyText}>Your balances are self-reported and editable.</Text>
              </View>

              <View style={styles.moneyFields}>
                <CurrencyInput
                  label="Cash balance"
                  value={Number(onboardingDraft.cashRupees) || 0}
                  onChangeValue={(value) => updateOnboardingDraft({ cashRupees: String(Math.max(0, Math.trunc(value))) })}
                  variant="card"
                  icon="cash-outline"
                />
                <CurrencyInput
                  label="Savings amount"
                  value={Number(onboardingDraft.savingsRupees) || 0}
                  onChangeValue={(value) => updateOnboardingDraft({ savingsRupees: String(Math.max(0, Math.trunc(value))) })}
                  variant="card"
                  icon="leaf-outline"
                />
              </View>

              <View style={styles.currencyBadge}>
                <Text style={styles.currencyBadgeSymbol}>₹</Text>
                <Text style={styles.currencyBadgeText}>All amounts in Indian Rupees (INR)</Text>
              </View>
            </View>
          ) : null}
          {step === 4 ? (
            <View style={styles.reviewSection}>
              <View style={styles.reviewIntro}>
                <View style={styles.workEyebrowRow}>
                  <View style={styles.workEyebrowIcon}>
                    <Ionicons name="checkmark" size={14} color={colors.accentDark} />
                  </View>
                  <Text style={styles.kicker}>FINAL CHECK</Text>
                </View>
                <Text style={styles.title}>Your money, your way.</Text>
                <Text style={styles.subtitle}>Take a quick look. You can go back and change anything before you begin.</Text>
              </View>

              <View style={styles.reviewProfileCard}>
                <View style={styles.reviewProfileTop}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>
                      {`${onboardingDraft.firstName.trim()[0] || ''}${onboardingDraft.lastName.trim()[0] || ''}`.toUpperCase() || 'E'}
                    </Text>
                  </View>
                  <View style={styles.reviewProfileIdentity}>
                    <Text style={styles.reviewProfileEyebrow}>YOUR PROFILE</Text>
                    <Text style={styles.reviewProfileName}>
                      {onboardingDraft.firstName} {onboardingDraft.lastName}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Edit profile details"
                    onPress={() => setStep(1)}
                    style={styles.reviewEditButton}
                  >
                    <Ionicons name="create-outline" size={17} color={colors.white} />
                  </Pressable>
                </View>
                <View style={styles.reviewProfileDivider} />
                <View style={styles.reviewContactRow}>
                  <Ionicons name="mail-outline" size={15} color={colors.surprise} />
                  <Text style={styles.reviewContactText} numberOfLines={1}>{onboardingDraft.email || 'No email provided'}</Text>
                </View>
                <View style={styles.reviewContactRow}>
                  <Ionicons name="call-outline" size={15} color={colors.surprise} />
                  <Text style={styles.reviewContactText} numberOfLines={1}>{onboardingDraft.phone || phone || 'No mobile number provided'}</Text>
                </View>
              </View>

              <View style={styles.reviewMoneyCard}>
                <View style={styles.reviewMoneyHeader}>
                  <View style={styles.reviewMoneyIcon}>
                    <Ionicons name="briefcase-outline" size={17} color={colors.accent} />
                  </View>
                  <View style={styles.reviewMoneyHeaderCopy}>
                    <Text style={styles.reviewMoneyTitle}>Work & income</Text>
                    <Text style={styles.reviewMoneySubtitle}>{selectedEmployment.label}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Edit work and income"
                    onPress={() => setStep(2)}
                    style={styles.reviewTextAction}
                  >
                    <Text style={styles.reviewTextActionLabel}>Edit</Text>
                  </Pressable>
                </View>
                <View style={styles.reviewIncomeAmount}>
                  <Text style={styles.reviewAmountLabel}>{selectedEmployment.income}</Text>
                  <Text style={styles.reviewAmountValue}>₹{onboardingDraft.incomeRupees || '0'}<Text style={styles.reviewAmountSuffix}> / month</Text></Text>
                </View>
                <View style={styles.reviewBalanceRow}>
                  <View style={styles.reviewBalanceTile}>
                    <Ionicons name="cash-outline" size={16} color={colors.accent} />
                    <Text style={styles.reviewBalanceLabel}>Cash</Text>
                    <Text style={styles.reviewBalanceValue}>₹{onboardingDraft.cashRupees || '0'}</Text>
                  </View>
                  <View style={styles.reviewBalanceTile}>
                    <Ionicons name="leaf-outline" size={16} color={colors.accent} />
                    <Text style={styles.reviewBalanceLabel}>Savings</Text>
                    <Text style={styles.reviewBalanceValue}>₹{onboardingDraft.savingsRupees || '0'}</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}
        </ScrollView>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          title={step === 4 ? 'Create account' : step === 2 ? 'Continue to Money' : 'Continue to Review'}
          onPress={() => void next()}
          loading={loading}
        />
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
  journeyBack: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  back: { ...typography.bodyMedium, color: colors.accent },
  journeyStepCount: { marginLeft: 'auto', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.surfaceMuted },
  journeyStepCountText: { ...typography.micro, color: colors.textSecondary, fontWeight: '700' },
  scroll: { paddingVertical: spacing.xl, gap: spacing.md, paddingBottom: spacing.lg },
  section: { gap: spacing.md },
  workSection: { gap: spacing.lg },
  workIntro: { gap: spacing.sm },
  workEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  workEyebrowIcon: { width: 24, height: 24, borderRadius: radius.full, backgroundColor: colors.surprise, alignItems: 'center', justifyContent: 'center' },
  kicker: { ...typography.label, color: colors.accent, letterSpacing: 1.4 },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, lineHeight: 23, maxWidth: 330 },
  verified: { ...typography.captionMedium, color: colors.income },
  employmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  employmentCard: { width: '48%', minHeight: 118, padding: spacing.sm, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'space-between' },
  employmentActive: { backgroundColor: colors.accentDark, borderColor: colors.accentDark },
  employmentCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  employmentIconWrap: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  employmentIconWrapActive: { backgroundColor: 'rgba(255,255,255,0.16)' },
  employmentSelection: { width: 20, height: 20, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  employmentSelectionActive: { backgroundColor: colors.surprise, borderColor: colors.surprise },
  employmentLabel: { ...typography.bodySemibold, color: colors.textPrimary, marginTop: spacing.sm },
  employmentDetail: { ...typography.micro, color: colors.textSecondary, lineHeight: 16 },
  employmentDetailActive: { color: 'rgba(255,255,255,0.72)' },
  activeText: { color: colors.white },
  incomePanel: { padding: spacing.md, gap: spacing.sm, borderRadius: radius.xl, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.borderLight },
  incomePanelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  incomeHeadingCopy: { flex: 1, gap: spacing.xxs },
  incomeEyebrow: { ...typography.micro, color: colors.accent, fontWeight: '700', letterSpacing: 0.9 },
  incomeTitle: { ...typography.h3, color: colors.textPrimary },
  incomeAccent: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.unexpected, alignItems: 'center', justifyContent: 'center' },
  incomeHint: { ...typography.caption, color: colors.textSecondary },
  moneySection: { gap: spacing.lg },
  moneyIntro: { gap: spacing.sm },
  moneyPrivacyNote: { minHeight: 44, paddingHorizontal: spacing.sm, borderRadius: radius.md, backgroundColor: colors.accentSoft, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  moneyPrivacyText: { ...typography.captionMedium, color: colors.accentDark, flex: 1 },
  moneyFields: { gap: spacing.sm },
  currencyBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.surface },
  currencyBadgeSymbol: { ...typography.captionMedium, color: colors.accent },
  currencyBadgeText: { ...typography.caption, color: colors.textSecondary },
  reviewSection: { gap: spacing.lg },
  reviewIntro: { gap: spacing.sm },
  reviewProfileCard: { padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.accentDark, gap: spacing.sm },
  reviewProfileTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewAvatar: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.surprise, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { ...typography.h3, color: colors.accentDark },
  reviewProfileIdentity: { flex: 1, minWidth: 0, gap: spacing.xxs },
  reviewProfileEyebrow: { ...typography.micro, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.9 },
  reviewProfileName: { ...typography.h3, color: colors.white },
  reviewEditButton: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  reviewProfileDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.16)', marginVertical: spacing.xxs },
  reviewContactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  reviewContactText: { ...typography.caption, color: 'rgba(255,255,255,0.88)', flex: 1 },
  reviewMoneyCard: { padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  reviewMoneyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewMoneyIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  reviewMoneyHeaderCopy: { flex: 1, gap: 2 },
  reviewMoneyTitle: { ...typography.bodySemibold, color: colors.textPrimary },
  reviewMoneySubtitle: { ...typography.caption, color: colors.textSecondary },
  reviewTextAction: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.accentSoft },
  reviewTextActionLabel: { ...typography.captionMedium, color: colors.accentDark },
  reviewIncomeAmount: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, gap: spacing.xxs },
  reviewAmountLabel: { ...typography.caption, color: colors.textSecondary },
  reviewAmountValue: { ...typography.h2, color: colors.accentDark },
  reviewAmountSuffix: { ...typography.captionMedium, color: colors.textSecondary },
  reviewBalanceRow: { flexDirection: 'row', gap: spacing.sm },
  reviewBalanceTile: { flex: 1, minWidth: 0, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.background, gap: spacing.xxs },
  reviewBalanceLabel: { ...typography.caption, color: colors.textSecondary },
  reviewBalanceValue: { ...typography.bodySemibold, color: colors.textPrimary },
  currencyNote: { ...typography.caption, color: colors.textTertiary },
  error: { ...typography.caption, color: colors.expense, marginBottom: spacing.sm },
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
          defaultValue={value}
          onChangeText={(nextValue) => {
            textRef.current = nextValue;
            onChangeText(nextValue);
          }}
          placeholder={placeholder}
          placeholderTextColor="#74837A"
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel={accessibilityLabel}
          style={styles.nameInput}
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

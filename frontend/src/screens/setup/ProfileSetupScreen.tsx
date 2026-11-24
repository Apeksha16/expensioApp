import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrencyInput } from '../../components/CurrencyInput';
import { CartoonAvatar, DEFAULT_CARTOON_AVATAR_ID } from '../../components/CartoonAvatar';
import { AvatarPickerBottomSheet } from '../../components/AvatarPickerBottomSheet';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../services/api/apiClient';
import { onboardingApi } from '../../services/api/onboardingApi';
import { completeOnboarding } from '../../services/authApi';
import type { OnboardingConfigResponse, OnboardingStatusResponse } from '../../types/api';
import { formatINRInput } from '../../utils/format';

interface EmploymentOption {
  value: string;
  backendType: string;
  label: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  income: string;
}

const DEFAULT_EMPLOYMENT_METADATA: Record<
  string,
  { label: string; detail: string; icon: keyof typeof Ionicons.glyphMap; income: string }
> = {
  SALARIED: { label: 'Salaried', detail: 'A regular paycheck', icon: 'briefcase-outline', income: 'Monthly salary' },
  BUSINESS: { label: 'Business', detail: 'Self-employed income', icon: 'storefront-outline', income: 'Monthly minimum income' },
  STUDENT: { label: 'Student', detail: 'Allowance or stipend', icon: 'school-outline', income: 'Monthly pocket money' },
  RETIRED: { label: 'Retired', detail: 'Pension or retirement income', icon: 'sunny-outline', income: 'Monthly pension' },
  HOMEMAKER: { label: 'Homemaker', detail: 'Household income', icon: 'home-outline', income: 'Monthly household budget' },
};

const DEFAULT_EMPLOYMENT_OPTIONS: EmploymentOption[] = [
  { value: 'salaried', backendType: 'SALARIED', label: 'Salaried', detail: 'A regular paycheck', icon: 'briefcase-outline', income: 'Monthly salary' },
  { value: 'business', backendType: 'BUSINESS', label: 'Business', detail: 'Self-employed income', icon: 'storefront-outline', income: 'Monthly minimum income' },
  { value: 'student', backendType: 'STUDENT', label: 'Student', detail: 'Allowance or stipend', icon: 'school-outline', income: 'Monthly pocket money' },
  { value: 'retired', backendType: 'RETIRED', label: 'Retired', detail: 'Pension or retirement income', icon: 'sunny-outline', income: 'Monthly pension' },
  { value: 'homemaker', backendType: 'HOMEMAKER', label: 'Homemaker', detail: 'Household income', icon: 'home-outline', income: 'Monthly household budget' },
];

function getCurrencySymbol(currency: string): string {
  switch (currency?.toUpperCase()) {
    case 'INR': return '₹';
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return currency || '₹';
  }
}

interface SequentialProgressBarProps {
  activeStep: number;
  stepMeta: Array<{ label: string; name: string }>;
}

function SequentialProgressBar({ activeStep, stepMeta }: SequentialProgressBarProps) {
  const fillAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const prevStepRef = useRef<number>(0);
  const isInitialRef = useRef<boolean>(true);

  useEffect(() => {
    const prev = prevStepRef.current;
    const current = activeStep;

    if (isInitialRef.current || prev === 0) {
      isInitialRef.current = false;
      // Sequential entrance: fill bars 1 by 1 from index 0 to current - 1
      const stepDuration = Math.max(180, Math.min(260, 720 / Math.max(current, 1)));
      const animations: Animated.CompositeAnimation[] = [];

      for (let i = 0; i < current; i++) {
        fillAnims[i].setValue(0);
        animations.push(
          Animated.timing(fillAnims[i], {
            toValue: 1,
            duration: stepDuration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          })
        );
      }
      for (let i = current; i < 4; i++) {
        fillAnims[i].setValue(0);
      }

      Animated.sequence(animations).start();
    } else if (current > prev) {
      // Forward transition: smoothly fill newly activated segments sequentially
      const stepDuration = 260;
      const animations: Animated.CompositeAnimation[] = [];
      for (let i = prev; i < current; i++) {
        animations.push(
          Animated.timing(fillAnims[i], {
            toValue: 1,
            duration: stepDuration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          })
        );
      }
      Animated.sequence(animations).start();
    } else if (current < prev) {
      // Backward transition: smoothly drain deactivated segments in reverse
      const stepDuration = 220;
      const animations: Animated.CompositeAnimation[] = [];
      for (let i = prev - 1; i >= current; i--) {
        animations.push(
          Animated.timing(fillAnims[i], {
            toValue: 0,
            duration: stepDuration,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: false,
          })
        );
      }
      Animated.sequence(animations).start();
    }

    prevStepRef.current = current;
  }, [activeStep, fillAnims]);

  return (
    <View
      style={styles.progressWrap}
      accessibilityRole="progressbar"
      accessibilityLabel={`Onboarding steps, step ${activeStep} of 4: ${stepMeta[activeStep - 1]?.label}`}
    >
      <View style={styles.progressMeta}>
        <Text style={styles.progressEyebrow}>YOUR SETUP</Text>
        <Text style={styles.progressCurrent}>{stepMeta[activeStep - 1]?.name}</Text>
      </View>
      <View style={styles.progressSegments}>
        {stepMeta.map((item, index) => {
          const width = fillAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          });
          return (
            <View key={item.label} style={styles.progressSegmentTrack}>
              <Animated.View style={[styles.progressSegmentFill, { width }]} />
            </View>
          );
        })}
      </View>
      <View style={styles.progressLabels}>
        {stepMeta.map((item, index) => (
          <Text
            key={item.label}
            style={[
              styles.progressLabel,
              index + 1 === activeStep && styles.progressLabelActive,
            ]}
          >
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

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
    emailVerified, phoneVerified, avatarId, saveAvatarPreference,
  } = useApp();

  const rawFirstName = onboardingDraft.firstName.trim();
  const initialFirstName = rawFirstName.toLowerCase() === 'expensio' ? '' : rawFirstName;
  const rawLastName = onboardingDraft.lastName.trim();
  const initialLastName = rawLastName.toLowerCase() === 'user' ? '' : rawLastName;
  const hasRealName = Boolean(initialFirstName && initialLastName);

  const [step, setStepState] = useState(() => onboardingStep || 1);
  const [config, setConfig] = useState<OnboardingConfigResponse | null>(null);
  const [serverStatus, setServerStatus] = useState<OnboardingStatusResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(
    () => avatarId || DEFAULT_CARTOON_AVATAR_ID
  );
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  const firstNameDraft = useRef(initialFirstName);
  const lastNameDraft = useRef(initialLastName);
  const hasLoadedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const scrollLayoutHeight = useRef(0);
  const scrollContentHeight = useRef(0);
  const scrollOffsetY = useRef(0);

  const checkScroll = (offsetY: number, layoutHeight: number, contentHeight: number) => {
    const isScrollable = contentHeight > layoutHeight + 25;
    const isAtBottom = offsetY >= contentHeight - layoutHeight - 35;
    setCanScrollDown(isScrollable && !isAtBottom);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    scrollOffsetY.current = 0;
    setCanScrollDown(false);
    setError('');
  }, [step]);

  // Load dynamic onboarding configuration and user's server-side progress
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    let isMounted = true;

    async function loadOnboardingData() {
      try {
        const [configRes, statusRes] = await Promise.allSettled([
          onboardingApi.getConfig(),
          onboardingApi.getStatus(),
        ]);

        if (!isMounted) return;

        if (configRes.status === 'fulfilled' && configRes.value.data) {
          setConfig(configRes.value.data);
        }

        if (statusRes.status === 'fulfilled' && statusRes.value.data) {
          const status = statusRes.value.data;
          setServerStatus(status);
          if (status.isProfileComplete) {
            setAuthPhase('main');
            return;
          }

          const serverUpdates: Record<string, string> = {};
          if (status.employment) {
            if (status.employment.employmentType) {
              serverUpdates.employmentType = status.employment.employmentType.toLowerCase();
            }
            if (status.employment.monthlyIncomeMinor !== undefined && status.employment.monthlyIncomeMinor !== null) {
              serverUpdates.incomeRupees = String(Math.round(status.employment.monthlyIncomeMinor / 100));
            }
          }
          if (status.financialProfile) {
            if (status.financialProfile.cashBalanceMinor !== undefined && status.financialProfile.cashBalanceMinor !== null) {
              serverUpdates.cashRupees = String(Math.round(status.financialProfile.cashBalanceMinor / 100));
            }
            if (status.financialProfile.savingsBalanceMinor !== undefined && status.financialProfile.savingsBalanceMinor !== null) {
              serverUpdates.savingsRupees = String(Math.round(status.financialProfile.savingsBalanceMinor / 100));
            }
          }
          if (status.profile?.name) {
            const parts = status.profile.name.trim().split(/\s+/);
            if (parts[0] && !onboardingDraft.firstName) serverUpdates.firstName = parts[0];
            if (parts.slice(1).join(' ') && !onboardingDraft.lastName) serverUpdates.lastName = parts.slice(1).join(' ');
          }
          if (Object.keys(serverUpdates).length > 0) {
            updateOnboardingDraft(serverUpdates);
          }

          let serverStep = 1;
          if (status.currentStep === 'EMPLOYMENT') {
            serverStep = 2;
          } else if (status.currentStep === 'FINANCIAL_PROFILE') {
            serverStep = 3;
          } else if (status.currentStep === 'READY_TO_COMPLETE') {
            serverStep = 4;
          }

          const currentLocalStep = onboardingStep || serverStep || 1;
          const targetStep = hasRealName ? currentLocalStep : 1;

          setStepState((current) => (current !== targetStep ? targetStep : current));
          setOnboardingStep(targetStep);
        }
      } catch {
        // Fallback to local session state if network is unreachable
      }
    }

    void loadOnboardingData();
    return () => { isMounted = false; };
  }, [hasRealName, setAuthPhase, setOnboardingStep]);

  const setStep = (nextStep: number) => {
    setStepState(nextStep);
    setOnboardingStep(nextStep);
  };

  const currencyCode = config?.defaultCurrency || 'INR';
  const currencySymbol = useMemo(() => getCurrencySymbol(currencyCode), [currencyCode]);

  // Dynamically map employment options from backend config
  const employmentOptions = useMemo<EmploymentOption[]>(() => {
    if (config?.employmentTypes?.length) {
      return config.employmentTypes.map((item) => {
        const typeKey = item.type.toUpperCase();
        const meta = DEFAULT_EMPLOYMENT_METADATA[typeKey] || {
          label: item.fieldLabel.split(' ')[0] || item.type,
          detail: `${item.fieldLabel} income`,
          icon: 'briefcase-outline' as const,
          income: item.fieldLabel,
        };
        return {
          value: item.type.toLowerCase(),
          backendType: typeKey,
          label: meta.label,
          detail: meta.detail,
          icon: meta.icon,
          income: item.fieldLabel || meta.income,
        };
      });
    }
    return DEFAULT_EMPLOYMENT_OPTIONS;
  }, [config]);

  const selectedEmployment = useMemo(
    () =>
      employmentOptions.find(
        (item) =>
          item.value === onboardingDraft.employmentType ||
          item.backendType === onboardingDraft.employmentType?.toUpperCase()
      ) ?? employmentOptions[0],
    [employmentOptions, onboardingDraft.employmentType],
  );

  const next = async () => {
    if (loading || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setError('');

    // Step 1: Profile information
    if (step === 1) {
      const firstName = firstNameDraft.current.trim();
      const lastName = lastNameDraft.current.trim();
      updateOnboardingDraft({ firstName, lastName });
      if (!firstName || !lastName) {
        setError('Enter your first and last name');
        isSubmittingRef.current = false;
        return;
      }
      const emailToSubmit = onboardingDraft.email.trim().toLowerCase() || (verificationChannel === 'email' ? verificationTarget : '');
      const phoneToSubmit = onboardingDraft.phone || (verificationChannel === 'phone' ? verificationTarget : phone);

      setLoading(true);
      try {
        await onboardingApi.updateProfile({
          firstName,
          lastName,
          email: emailToSubmit || undefined,
          phone: phoneToSubmit || undefined,
          countryCode: countryCode || undefined,
        });
        setStep(2);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.isNetworkError) {
          setStep(2);
        } else {
          setError(requestError instanceof Error ? requestError.message : 'Unable to update profile');
        }
      } finally {
        setLoading(false);
        isSubmittingRef.current = false;
      }
      return;
    }

    // Step 2: Employment and income
    if (step === 2) {
      if (!onboardingDraft.employmentType) {
        setError('Select your employment type');
        isSubmittingRef.current = false;
        return;
      }
      if (!onboardingDraft.incomeRupees) {
        setError(`Enter your ${selectedEmployment.income.toLowerCase()}`);
        isSubmittingRef.current = false;
        return;
      }
      const incomeRupees = Number(onboardingDraft.incomeRupees) || 0;
      const maxLimit = config?.maxAmountMinor ? Math.floor(config.maxAmountMinor / 100) : 1000000000;
      if (incomeRupees > maxLimit) {
        setError(`Income cannot exceed ${currencySymbol}${maxLimit.toLocaleString()}`);
        isSubmittingRef.current = false;
        return;
      }

      setLoading(true);
      try {
        const empType = (selectedEmployment.backendType || onboardingDraft.employmentType).toLowerCase();
        updateOnboardingDraft({ employmentType: empType, incomeRupees: String(incomeRupees) });
        await onboardingApi.updateEmployment({
          employmentType: (selectedEmployment.backendType || onboardingDraft.employmentType).toUpperCase(),
          monthlyIncomeMinor: Math.round(incomeRupees * 100),
          currency: currencyCode,
        });
        setStep(3);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.isNetworkError) {
          setStep(3);
        } else {
          setError(requestError instanceof Error ? requestError.message : 'Unable to update employment details');
        }
      } finally {
        setLoading(false);
        isSubmittingRef.current = false;
      }
      return;
    }

    // Step 3: Cash and savings balances
    if (step === 3) {
      if (onboardingDraft.cashRupees.trim() === '') {
        setError('Enter your cash balance, or 0 if you have none');
        isSubmittingRef.current = false;
        return;
      }
      const cashRupees = Number(onboardingDraft.cashRupees) || 0;
      const savingsRupees = Number(onboardingDraft.savingsRupees || '0') || 0;
      const maxLimit = config?.maxAmountMinor ? Math.floor(config.maxAmountMinor / 100) : 1000000000;
      if (cashRupees > maxLimit || savingsRupees > maxLimit) {
        setError(`Balances cannot exceed ${currencySymbol}${maxLimit.toLocaleString()}`);
        isSubmittingRef.current = false;
        return;
      }

      setLoading(true);
      try {
        updateOnboardingDraft({ cashRupees: String(cashRupees), savingsRupees: String(savingsRupees) });
        await onboardingApi.updateFinancialProfile({
          cashBalanceMinor: Math.round(cashRupees * 100),
          savingsBalanceMinor: Math.round(savingsRupees * 100),
          currency: currencyCode,
        });
        setStep(4);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.isNetworkError) {
          setStep(4);
        } else {
          setError(requestError instanceof Error ? requestError.message : 'Unable to update financial balances');
        }
      } finally {
        setLoading(false);
        isSubmittingRef.current = false;
      }
      return;
    }

    // Step 4: Finalize and complete account activation
    setLoading(true);
    try {
      const response = await completeOnboarding({
        firstName: onboardingDraft.firstName.trim(),
        lastName: onboardingDraft.lastName.trim(),
        email: onboardingDraft.email.trim().toLowerCase(),
        phone: onboardingDraft.phone || phone,
        employmentType: (selectedEmployment.backendType || onboardingDraft.employmentType).toUpperCase(),
        incomeAmountMinor: `${Math.round((Number(onboardingDraft.incomeRupees) || 0) * 100)}`,
        cashBalanceMinor: `${Math.round((Number(onboardingDraft.cashRupees) || 0) * 100)}`,
        savingsAmountMinor: `${Math.round((Number(onboardingDraft.savingsRupees || '0') || 0) * 100)}`,
        currency: currencyCode,
        avatarId: selectedAvatarId,
      });
      await applyAuthSession(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to complete your account');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const goBack = () => {
    if (step === 1) {
      setAuthPhase('mobile');
    } else {
      setStep(step - 1);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.fontLoading}>
        <ActivityIndicator color="#C8F169" />
      </View>
    );
  }

  // Verified contacts calculation
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
  const isPhoneVerified = Boolean(
    serverStatus?.isPhoneVerified ??
    (phoneVerified || (verificationChannel === 'phone' && Boolean(verificationTarget || phone || onboardingDraft.phone)))
  );
  const isEmailVerified = Boolean(
    serverStatus?.isEmailVerified ??
    (emailVerified || (verificationChannel === 'email' && Boolean(verificationTarget || onboardingDraft.email)))
  );

  const verifiedContacts = [
    emailValue && emailValue.trim() !== '' ? {
      id: 'email',
      label: 'EMAIL',
      value: emailValue.trim(),
      isVerified: isEmailVerified,
    } : null,
    phoneValue && phoneValue.trim() !== '' ? {
      id: 'phone',
      label: 'MOBILE NUMBER',
      value: phoneValue.trim(),
      isVerified: isPhoneVerified,
    } : null,
  ].filter((item): item is { id: string; label: string; value: string; isVerified: boolean } => item !== null);

  const activeStep = step;
  const currentFirst = onboardingDraft.firstName.trim() || firstNameDraft.current.trim();
  const currentLast = onboardingDraft.lastName.trim() || lastNameDraft.current.trim();

  const canContinue = (() => {
    if (activeStep === 1) {
      return Boolean(
        currentFirst &&
        currentLast &&
        currentFirst.toLowerCase() !== 'expensio' &&
        currentLast.toLowerCase() !== 'user'
      );
    }
    if (activeStep === 2) {
      return Boolean(
        onboardingDraft.employmentType &&
        onboardingDraft.incomeRupees !== undefined &&
        onboardingDraft.incomeRupees !== ''
      );
    }
    return true;
  })();

  const stepMeta = [
    { label: 'Profile', name: 'PROFILE' },
    { label: 'Work', name: 'WORK' },
    { label: 'Money', name: 'MONEY' },
    { label: 'Review', name: 'REVIEW' },
  ];

  const heroDetails = {
    1: {
      title: 'First, the basics.',
      subtitle: 'A few details help us make your money space feel like yours.',
    },
    2: {
      title: 'How do you earn?',
      subtitle: 'Choose what fits best. You can update this any time.',
    },
    3: {
      title: 'Start with what you have.',
      subtitle: 'Add your current cash and savings to give your money a clear starting point.',
    },
    4: {
      title: 'Your money, your way.',
      subtitle: 'Take a quick look. You can go back and change anything before you begin.',
    },
  }[activeStep as 1 | 2 | 3 | 4] || {
    title: '',
    subtitle: '',
  };

  const continueButtonText =
    activeStep === 1 ? 'Continue to Work' :
    activeStep === 2 ? 'Continue to Money' :
    activeStep === 3 ? 'Continue to Review' :
    'Create account';

  const footerHint =
    activeStep === 4 ? 'Ready to dive into your personalized finances.' : 'Your details stay private and secure.';

  return (
    <KeyboardAvoidingView style={styles.profileScreen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.profileFrame}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.profileFormScroll}
          contentContainerStyle={[styles.profileContent, { paddingTop: insets.top + 10 }]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            scrollOffsetY.current = e.nativeEvent.contentOffset.y;
            checkScroll(scrollOffsetY.current, scrollLayoutHeight.current, scrollContentHeight.current);
          }}
          scrollEventThrottle={16}
          onLayout={(e) => {
            scrollLayoutHeight.current = e.nativeEvent.layout.height;
            checkScroll(scrollOffsetY.current, scrollLayoutHeight.current, scrollContentHeight.current);
          }}
          onContentSizeChange={(_, height) => {
            scrollContentHeight.current = height;
            checkScroll(scrollOffsetY.current, scrollLayoutHeight.current, scrollContentHeight.current);
          }}
        >
          {/* Header */}
          <View style={styles.profileHeader}>
            <Pressable
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel={step === 1 ? 'Back to mobile login' : 'Go back to previous step'}
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
              <Text style={styles.stepCountText}>{String(activeStep).padStart(2, '0')}</Text>
              <Text style={styles.stepCountDivider}>/</Text>
              <Text style={styles.stepCountMuted}>04</Text>
            </View>
          </View>

          {/* Progress Bar with sequential smooth filling animation */}
          <SequentialProgressBar
            activeStep={activeStep}
            stepMeta={stepMeta}
          />

          {/* Hero Section (No badge pill) */}
          <View style={styles.profileHero}>
            <Text style={styles.profileTitle}>{heroDetails.title}</Text>
            <Text style={styles.profileSubtitle}>{heroDetails.subtitle}</Text>
          </View>

          {/* Step 1: Profile Information */}
          {activeStep === 1 ? (
            <View style={styles.profileCard}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose your profile avatar"
                onPress={() => setAvatarPickerOpen(true)}
                style={styles.photoRow}
              >
                <View style={styles.avatar}>
                  <CartoonAvatar id={selectedAvatarId} size={68} />
                </View>
                <View style={styles.photoCopy}>
                  <Text style={styles.photoTitle}>Your profile avatar</Text>
                  <Text style={styles.photoHint}>Choose a cartoon character that represents you.</Text>
                </View>
                <View style={styles.photoAction}>
                  <Ionicons name="color-palette-outline" size={19} color="#0B2B1F" />
                </View>
              </Pressable>

              <View style={styles.formDivider} />
              <Text style={styles.formSectionTitle}>What should we call you?</Text>
              <View style={styles.nameRow}>
                <ProfileNameField
                  label="First name"
                  value={onboardingDraft.firstName.trim().toLowerCase() === 'expensio' ? '' : onboardingDraft.firstName}
                  placeholder="Apeksha"
                  accessibilityLabel="First name"
                  onChangeText={(value) => { firstNameDraft.current = value; }}
                  onCommit={(value) => updateOnboardingDraft({ firstName: value })}
                />
                <ProfileNameField
                  label="Last name"
                  value={onboardingDraft.lastName.trim().toLowerCase() === 'user' ? '' : onboardingDraft.lastName}
                  placeholder="Doe"
                  accessibilityLabel="Last name"
                  onChangeText={(value) => { lastNameDraft.current = value; }}
                  onCommit={(value) => updateOnboardingDraft({ lastName: value })}
                />
              </View>

              {verifiedContacts.length > 0 ? (
                <>
                  <View style={styles.contactSectionHeading}>
                    <Text style={styles.formSectionTitle}>
                      {verifiedContacts.length > 1 ? 'Verified contacts' : 'Verified contact'}
                    </Text>
                    <Text style={styles.contactSectionHint}>Locked for your security</Text>
                  </View>
                  <View style={styles.verifiedFields}>
                    {verifiedContacts.map((contact) => (
                      <ContactField
                        key={contact.id}
                        label={contact.label}
                        value={contact.value}
                        isVerified={contact.isVerified}
                      />
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          ) : null}

          {/* Step 2: Work & Income */}
          {activeStep === 2 ? (
            <View style={styles.workSection}>
              <View style={styles.employmentGrid}>
                {employmentOptions.map((item) => {
                  const selected =
                    onboardingDraft.employmentType === item.value ||
                    onboardingDraft.employmentType?.toUpperCase() === item.backendType;
                  return (
                    <Pressable
                      key={item.value}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => {
                        setError('');
                        updateOnboardingDraft({ employmentType: item.value });
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 80);
                      }}
                      style={[styles.employmentCard, selected && styles.employmentActive]}
                    >
                      <View style={styles.employmentCardTop}>
                        <View style={[styles.employmentIconWrap, selected && styles.employmentIconWrapActive]}>
                          <Ionicons name={item.icon} size={20} color={selected ? '#FFFFFF' : '#1F6B3D'} />
                        </View>
                        <View style={[styles.employmentSelection, selected && styles.employmentSelectionActive]}>
                          {selected ? <Ionicons name="checkmark" size={13} color="#0B2B1F" /> : null}
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
                    <Ionicons name="trending-up" size={18} color="#0B2B1F" />
                  </View>
                </View>
                <CurrencyInput
                  label={selectedEmployment.income}
                  value={Number(onboardingDraft.incomeRupees) || 0}
                  onChangeValue={(value) => updateOnboardingDraft({ incomeRupees: String(Math.max(0, Math.trunc(value))) })}
                  variant="card"
                  currencySymbol={currencySymbol}
                />
                <Text style={styles.incomeHint}>An estimate is all you need to get started.</Text>
              </View>
            </View>
          ) : null}

          {/* Step 3: Balances */}
          {activeStep === 3 ? (
            <View style={styles.moneySection}>
              <View style={styles.moneyPrivacyNote}>
                <Ionicons name="lock-closed-outline" size={16} color="#1F6B3D" />
                <Text style={styles.moneyPrivacyText}>Your balances are self-reported and editable.</Text>
              </View>

              <View style={styles.moneyFields}>
                <CurrencyInput
                  label="Cash balance"
                  value={Number(onboardingDraft.cashRupees) || 0}
                  onChangeValue={(value) => updateOnboardingDraft({ cashRupees: String(Math.max(0, Math.trunc(value))) })}
                  variant="card"
                  icon="cash-outline"
                  currencySymbol={currencySymbol}
                />
                <CurrencyInput
                  label="Savings amount"
                  value={Number(onboardingDraft.savingsRupees) || 0}
                  onChangeValue={(value) => updateOnboardingDraft({ savingsRupees: String(Math.max(0, Math.trunc(value))) })}
                  variant="card"
                  icon="leaf-outline"
                  currencySymbol={currencySymbol}
                />
              </View>
            </View>
          ) : null}

          {/* Step 4: Review */}
          {activeStep === 4 ? (
            <View style={styles.reviewSection}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit profile details"
                onPress={() => setStep(1)}
                style={styles.reviewProfileCard}
              >
                <View style={styles.reviewProfileTop}>
                  <View style={styles.reviewAvatar}>
                    <CartoonAvatar id={selectedAvatarId} size={50} />
                  </View>
                  <View style={styles.reviewProfileIdentity}>
                    <Text style={styles.reviewProfileEyebrow}>YOUR PROFILE</Text>
                    <Text style={styles.reviewProfileName}>
                      {onboardingDraft.firstName} {onboardingDraft.lastName}
                    </Text>
                  </View>
                  <View style={styles.reviewEditButton}>
                    <Ionicons name="create-outline" size={17} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.reviewProfileDivider} />
                {onboardingDraft.email ? (
                  <View style={styles.reviewContactRow}>
                    <Ionicons name="mail-outline" size={15} color="#C8F169" />
                    <Text style={styles.reviewContactText} numberOfLines={1}>{onboardingDraft.email}</Text>
                  </View>
                ) : null}
                {(onboardingDraft.phone || phone) ? (
                  <View style={styles.reviewContactRow}>
                    <Ionicons name="call-outline" size={15} color="#C8F169" />
                    <Text style={styles.reviewContactText} numberOfLines={1}>{onboardingDraft.phone || phone}</Text>
                  </View>
                ) : null}
              </Pressable>

              <View style={styles.reviewMoneyCard}>
                <View style={styles.reviewMoneyHeader}>
                  <View style={styles.reviewMoneyIcon}>
                    <Ionicons name="briefcase-outline" size={17} color="#1F6B3D" />
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
                  <Text style={styles.reviewAmountValue}>
                    {currencySymbol}{formatINRInput(onboardingDraft.incomeRupees || '0') || '0'}
                    <Text style={styles.reviewAmountSuffix}> / month</Text>
                  </Text>
                </View>
                <View style={styles.reviewBalanceRow}>
                  <View style={styles.reviewBalanceTile}>
                    <Ionicons name="cash-outline" size={16} color="#1F6B3D" />
                    <Text style={styles.reviewBalanceLabel}>Cash</Text>
                    <Text style={styles.reviewBalanceValue}>
                      {currencySymbol}{formatINRInput(onboardingDraft.cashRupees || '0') || '0'}
                    </Text>
                  </View>
                  <View style={styles.reviewBalanceTile}>
                    <Ionicons name="leaf-outline" size={16} color="#1F6B3D" />
                    <Text style={styles.reviewBalanceLabel}>Savings</Text>
                    <Text style={styles.reviewBalanceValue}>
                      {currencySymbol}{formatINRInput(onboardingDraft.savingsRupees || '0') || '0'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Unified Pinned Footer */}
        <View style={[styles.profileFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {canScrollDown ? (
            <LinearGradient
              colors={['rgba(244, 243, 236, 0)', 'rgba(255, 255, 255, 0.45)', 'rgba(244, 243, 236, 0.9)', '#F4F3EC']}
              pointerEvents="none"
              style={styles.bottomScrollFade}
            />
          ) : null}
          {error ? <Text accessibilityRole="alert" style={styles.profileError}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={continueButtonText}
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
              <ActivityIndicator color={canContinue ? '#F4F3EC' : '#8FA698'} />
            ) : (
              <Text style={[styles.profileContinueText, canContinue && styles.profileContinueTextEnabled]}>
                {continueButtonText}
              </Text>
            )}
          </Pressable>
          <Text style={styles.profileFooterHint}>{footerHint}</Text>
        </View>

        {/* Animated Avatar Picker Bottom Sheet */}
        <AvatarPickerBottomSheet
          visible={avatarPickerOpen}
          selectedAvatarId={selectedAvatarId}
          onSelect={(avatarId) => {
            setSelectedAvatarId(avatarId);
            void saveAvatarPreference(avatarId).catch((err) => {
              console.warn('Could not save avatar preference', err);
            });
          }}
          onClose={() => setAvatarPickerOpen(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fontLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F3EC' },
  profileScreen: { flex: 1, backgroundColor: '#F4F3EC' },
  profileFrame: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  profileContent: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 24, gap: 24 },
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
  progressSegmentTrack: { flex: 1, height: 5, borderRadius: 5, backgroundColor: '#DDE3D8', overflow: 'hidden' },
  progressSegmentFill: { height: '100%', borderRadius: 5, backgroundColor: '#1F6B3D' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#89958B', fontSize: 10, fontWeight: '600', fontFamily: 'PlusJakartaSans_600SemiBold' },
  progressLabelActive: { color: '#0B2B1F', fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  profileHero: { gap: 6, paddingTop: 4 },
  profileTitle: { color: '#0B2B1F', fontSize: 32, lineHeight: 39, fontWeight: '800', letterSpacing: -1.1, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  profileSubtitle: { maxWidth: 330, color: '#68766D', fontSize: 14, lineHeight: 21, fontWeight: '500', fontFamily: 'PlusJakartaSans_500Medium' },

  // Step 1: Profile card
  profileCard: { padding: 18, borderRadius: 25, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7EAE1', gap: 17, shadowColor: '#143A2C', shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 3 },
  photoRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 68, height: 68, borderRadius: 23, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cameraBadge: { position: 'absolute', right: -4, bottom: -4, width: 28, height: 28, borderRadius: 10, borderWidth: 2.5, borderColor: '#FFFFFF', backgroundColor: '#C8F169', alignItems: 'center', justifyContent: 'center' },
  photoCopy: { flex: 1, minWidth: 0, gap: 4 },
  photoTitle: { color: '#0B2B1F', fontSize: 14, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  photoHint: { color: '#7A887F', fontSize: 11, lineHeight: 16, fontWeight: '500', fontFamily: 'PlusJakartaSans_500Medium' },
  photoAction: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#EFF3E9', alignItems: 'center', justifyContent: 'center' },
  formDivider: { height: 1, backgroundColor: '#EEF0E9' },
  formSectionTitle: { color: '#173B2C', fontSize: 14, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  contactSectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  contactSectionHint: { color: '#8B978D', fontSize: 10, fontWeight: '600', fontFamily: 'PlusJakartaSans_600SemiBold' },
  nameRow: { flexDirection: 'row', gap: 10 },
  nameFieldWrap: { flex: 1, minWidth: 0, gap: 7 },
  nameLabel: { color: '#44584B', fontSize: 11, lineHeight: 16, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  nameInputWrap: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0E5DC',
    backgroundColor: '#F9FAF7',
  },
  nameInputWrapFocused: {
    borderColor: '#1F6B3D',
    shadowColor: '#C8F169',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  nameInput: {
    flex: 1,
    height: '100%',
    color: '#0B2B1F',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
    paddingVertical: 0,
  },
  verifiedFields: { gap: 8 },
  contactField: { minHeight: 58, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 14, backgroundColor: '#F9FAF7', borderWidth: 1, borderColor: '#E8ECE4', flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#E8F0E2', alignItems: 'center', justifyContent: 'center' },
  contactCopy: { flex: 1, minWidth: 0, gap: 1 },
  contactLabel: { color: '#87938A', fontSize: 9, lineHeight: 13, fontWeight: '800', letterSpacing: 0.7, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  contactValue: { color: '#173B2C', fontSize: 13, lineHeight: 18, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  verifiedBadge: { height: 23, borderRadius: 999, backgroundColor: '#E5F3DC', flexDirection: 'row', alignItems: 'center', gap: 3, paddingLeft: 7, paddingRight: 8 },
  verifiedText: { color: '#1F6B3D', fontSize: 10, lineHeight: 14, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },

  // Step 2: Work & income
  workSection: { gap: 20 },
  employmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  employmentCard: {
    width: '48%',
    minHeight: 118,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E7EAE1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  employmentActive: { backgroundColor: '#0B2B1F', borderColor: '#0B2B1F' },
  employmentCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  employmentIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#E8F0E2', alignItems: 'center', justifyContent: 'center' },
  employmentIconWrapActive: { backgroundColor: 'rgba(255,255,255,0.16)' },
  employmentSelection: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#D4DDD2', alignItems: 'center', justifyContent: 'center' },
  employmentSelectionActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  employmentLabel: { color: '#0B2B1F', fontSize: 14, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold', marginTop: 8 },
  employmentDetail: { color: '#68766D', fontSize: 11, lineHeight: 15, fontFamily: 'PlusJakartaSans_500Medium' },
  employmentDetailActive: { color: 'rgba(255,255,255,0.72)' },
  activeText: { color: '#FFFFFF' },
  incomePanel: {
    padding: 18,
    gap: 14,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAE1',
    shadowColor: '#143A2C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  incomePanelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  incomeHeadingCopy: { flex: 1, gap: 2 },
  incomeEyebrow: { color: '#718177', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  incomeTitle: { color: '#0B2B1F', fontSize: 16, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  incomeAccent: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#DDF3A4', alignItems: 'center', justifyContent: 'center' },
  incomeHint: { color: '#7A887F', fontSize: 11, lineHeight: 16, fontWeight: '500', fontFamily: 'PlusJakartaSans_500Medium' },

  // Step 3: Balances
  moneySection: { gap: 16 },
  moneyPrivacyNote: {
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAE1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moneyPrivacyText: { color: '#44584B', fontSize: 12, fontWeight: '600', fontFamily: 'PlusJakartaSans_600SemiBold', flex: 1 },
  moneyFields: { gap: 14 },

  // Step 4: Review
  reviewSection: { gap: 16 },
  reviewProfileCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#0B2B1F',
    gap: 12,
    shadowColor: '#0B2B1F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  reviewProfileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  reviewProfileIdentity: { flex: 1, minWidth: 0, gap: 2 },
  reviewProfileEyebrow: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '800', letterSpacing: 0.9, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  reviewProfileName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  reviewEditButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  reviewProfileDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 4 },
  reviewContactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewContactText: { color: 'rgba(255,255,255,0.88)', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', flex: 1 },
  reviewMoneyCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAE1',
    gap: 16,
    shadowColor: '#143A2C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  reviewMoneyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewMoneyIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E8F0E2', alignItems: 'center', justifyContent: 'center' },
  reviewMoneyHeaderCopy: { flex: 1, gap: 2 },
  reviewMoneyTitle: { color: '#0B2B1F', fontSize: 15, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  reviewMoneySubtitle: { color: '#68766D', fontSize: 12, fontWeight: '500', fontFamily: 'PlusJakartaSans_500Medium' },
  reviewTextAction: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#EFF3E9' },
  reviewTextActionLabel: { color: '#0B2B1F', fontSize: 12, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  reviewIncomeAmount: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#F9FAF7', borderWidth: 1, borderColor: '#E8ECE4', gap: 4 },
  reviewAmountLabel: { color: '#68766D', fontSize: 11, fontWeight: '600', fontFamily: 'PlusJakartaSans_600SemiBold' },
  reviewAmountValue: { color: '#0B2B1F', fontSize: 24, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  reviewAmountSuffix: { color: '#68766D', fontSize: 12, fontWeight: '500', fontFamily: 'PlusJakartaSans_500Medium' },
  reviewBalanceRow: { flexDirection: 'row', gap: 10 },
  reviewBalanceTile: { flex: 1, minWidth: 0, padding: 12, borderRadius: 16, backgroundColor: '#F9FAF7', borderWidth: 1, borderColor: '#E8ECE4', gap: 4 },
  reviewBalanceLabel: { color: '#68766D', fontSize: 11, fontWeight: '600', fontFamily: 'PlusJakartaSans_600SemiBold' },
  reviewBalanceValue: { color: '#0B2B1F', fontSize: 16, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },

  // Unified Footer
  profileFooter: {
    position: 'relative',
    paddingHorizontal: 22,
    paddingTop: 12,
    gap: 10,
    backgroundColor: '#F4F3EC',
    borderTopWidth: 1,
    borderTopColor: '#E7E9E1',
  },
  bottomScrollFade: {
    position: 'absolute',
    top: -48,
    left: 0,
    right: 0,
    height: 48,
    zIndex: 10,
  },
  profileFormScroll: { flex: 1, minHeight: 0 },
  profileError: { color: '#B3261E', fontSize: 12, lineHeight: 17, fontFamily: 'PlusJakartaSans_500Medium' },
  profileContinue: { height: 56, borderRadius: 18, backgroundColor: '#DCE3D9', alignItems: 'center', justifyContent: 'center' },
  profileContinueEnabled: { backgroundColor: '#0B3D2B' },
  profileContinuePressed: { opacity: 0.9 },
  continueContents: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  profileContinueText: { color: '#8A958B', fontSize: 15, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  profileContinueTextEnabled: { color: '#F4F3EC' },
  profileFooterHint: { color: '#87938A', fontSize: 10, lineHeight: 15, textAlign: 'center', fontFamily: 'PlusJakartaSans_500Medium' },
});

interface ContactFieldProps {
  label: string;
  value: string;
  isVerified?: boolean;
}

function ContactField({ label, value, isVerified = true }: ContactFieldProps) {
  if (!value || value === '—') return null;

  return (
    <View style={styles.contactField}>
      <View style={styles.contactIcon}>
        <Ionicons name="lock-closed-outline" size={16} color="#4B5A50" />
      </View>
      <View style={styles.contactCopy}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue} numberOfLines={1} ellipsizeMode="tail">
          {value}
        </Text>
      </View>
      {isVerified ? (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark" size={12} color="#1F6B3D" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      ) : null}
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
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  return (
    <View style={styles.nameFieldWrap}>
      <Text style={styles.nameLabel}>{label}</Text>
      <View
        style={[styles.nameInputWrap, focused && styles.nameInputWrapFocused]}
        onTouchEnd={() => inputRef.current?.focus()}
      >
        <Ionicons
          name="person-outline"
          size={16}
          color="#74837A"
          pointerEvents="none"
        />
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={(nextValue) => {
            setText(nextValue);
            onChangeText(nextValue);
            onCommit(nextValue);
          }}
          placeholder={placeholder}
          placeholderTextColor="#74837A"
          autoCapitalize="words"
          autoCorrect={false}
          spellCheck={false}
          keyboardType="default"
          accessibilityLabel={accessibilityLabel}
          style={styles.nameInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

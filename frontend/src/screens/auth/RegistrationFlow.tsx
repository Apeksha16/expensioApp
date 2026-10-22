import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../services/api';
import { haptics } from '../../services/haptics';
import { LottieAnimation } from '../../components/common/LottieAnimation';
import { Toast, type ToastConfig } from '../../components/common/Toast';

export type CustomerCategory = 'Salaried' | 'Self-employed' | 'Retired' | 'Student';

interface RegistrationFlowProps {
  initialData: {
    phone?: string;
    email?: string;
    name?: string;
    type: 'phone' | 'google';
  };
  onSuccess: (user: any) => void;
  onCancel: () => void;
}

export function RegistrationFlow({ initialData, onSuccess, onCancel }: RegistrationFlowProps) {
  // Wizard steps: 'EMAIL' | 'PROFILE' | 'CATEGORY' | 'FINANCE' | 'MPIN' | 'CREATING'
  const isGoogle = initialData.type === 'google' && Boolean(initialData.email);
  const [currentStep, setCurrentStep] = useState<'EMAIL' | 'PROFILE' | 'CATEGORY' | 'FINANCE' | 'MPIN' | 'CREATING'>(
    isGoogle ? 'PROFILE' : 'EMAIL'
  );

  // Step 1: Email State
  const [email, setEmail] = useState(initialData.email || '');
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(isGoogle);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const emailOtpInputs = useRef<Array<TextInput | null>>([]);

  // Step 2: Profile State
  const [firstName, setFirstName] = useState(
    initialData.name ? initialData.name.split(' ')[0] : ''
  );
  const [lastName, setLastName] = useState(
    initialData.name ? initialData.name.split(' ').slice(1).join(' ') : ''
  );
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);

  // Step 3 & 4: Category & Financial Setup
  const [category, setCategory] = useState<CustomerCategory>('Salaried');
  const [income, setIncome] = useState('');
  const [cashBalance, setCashBalance] = useState('');
  const [savings, setSavings] = useState('');

  // Step 5: MPIN Setup
  const [mpin, setMpin] = useState(['', '', '', '']);
  const [confirmMpin, setConfirmMpin] = useState(['', '', '', '']);
  const mpinInputs = useRef<Array<TextInput | null>>([]);
  const confirmMpinInputs = useRef<Array<TextInput | null>>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastConfig | null>(null);

  // Resend Countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isEmailOtpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isEmailOtpSent, resendTimer]);

  // Image Picker
  const handleSelectImage = async () => {
    try {
      try { haptics.selection(); } catch {}
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Expensio requires photo library access to select a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch {
      setToast({ type: 'error', message: 'Unable to open photo picker' });
    }
  };

  // Step 1: Send Email Verification OTP
  const handleSendEmailOtp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setToast({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    try { haptics.selection(); } catch {}

    try {
      const res = await api.sendEmailOtp(email);
      setIsLoading(false);
      setIsEmailOtpSent(true);
      setResendTimer(30);
      setCanResend(false);
      setToast({ type: 'info', message: res.message || `Code sent to ${email}` });
      setTimeout(() => emailOtpInputs.current[0]?.focus(), 300);
    } catch {
      setIsLoading(false);
      setToast({ type: 'error', message: 'Failed to send verification code. Please retry.' });
    }
  };

  // Step 1: Verify Email OTP
  const handleVerifyEmailOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || emailOtp.join('');
    if (code.length !== 6) {
      setToast({ type: 'error', message: 'Please enter all 6 digits' });
      return;
    }

    setIsLoading(true);
    try { haptics.selection(); } catch {}

    try {
      const res = await api.verifyEmailOtp(email, code);
      setIsLoading(false);
      if (res.success && res.emailVerified) {
        try { haptics.success(); } catch {}
        setIsEmailVerified(true);
        setCurrentStep('PROFILE');
      } else {
        setToast({ type: 'error', message: res.error || 'Invalid verification code' });
      }
    } catch {
      setIsLoading(false);
      setToast({ type: 'error', message: 'Verification failed. Please retry.' });
    }
  };

  // Step 2: Validate Profile
  const handleProfileContinue = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setToast({ type: 'error', message: 'Please enter your first name and last name' });
      return;
    }
    const cleanUsername = username.replace(/^@/, '').trim();
    if (cleanUsername.length < 3) {
      setToast({ type: 'error', message: 'Username must be at least 3 characters' });
      return;
    }
    try { haptics.selection(); } catch {}
    setCurrentStep('CATEGORY');
  };

  // Step 3: Category Select
  const handleCategorySelect = (selected: CustomerCategory) => {
    try { haptics.selection(); } catch {}
    setCategory(selected);
  };

  // Step 4: Validate Financial Inputs
  const handleFinanceContinue = () => {
    if (!income.trim()) {
      setToast({ type: 'error', message: `Please enter your ${getCategoryIncomeLabel(category).toLowerCase()}` });
      return;
    }
    if (!cashBalance.trim()) {
      setToast({ type: 'error', message: 'Please enter your cash in hand balance' });
      return;
    }
    if (!savings.trim()) {
      setToast({ type: 'error', message: 'Please enter your savings balance' });
      return;
    }

    const numIncome = parseFloat(income);
    const numCash = parseFloat(cashBalance);
    const numSavings = parseFloat(savings);

    if (isNaN(numIncome) || numIncome < 0) {
      setToast({ type: 'error', message: 'Income amount cannot be negative' });
      return;
    }
    if (isNaN(numCash) || numCash < 0) {
      setToast({ type: 'error', message: 'Cash balance cannot be negative' });
      return;
    }
    if (isNaN(numSavings) || numSavings < 0) {
      setToast({ type: 'error', message: 'Savings balance cannot be negative' });
      return;
    }

    try { haptics.selection(); } catch {}
    setCurrentStep('MPIN');
  };

  // Step 5: Validate MPIN & Submit Final Registration
  const handleFinalSubmit = async () => {
    const pinStr = mpin.join('');
    const confirmStr = confirmMpin.join('');

    if (pinStr.length !== 4) {
      setToast({ type: 'error', message: 'Please enter a 4-digit MPIN' });
      return;
    }

    if (pinStr !== confirmStr) {
      setToast({ type: 'error', message: 'The entered MPINs do not match. Please verify.' });
      try { haptics.error(); } catch {}
      return;
    }

    // Advance to full-screen Lottie Animation: "Building your financial space"
    setCurrentStep('CREATING');
    try { haptics.selection(); } catch {}

    try {
      const payload = {
        phone: initialData.phone,
        googleId: initialData.type === 'google' ? 'google_oauth_verified' : undefined,
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.startsWith('@') ? username.trim() : `@${username.trim()}`,
        avatar: avatar || undefined,
        customerType: category,
        income: parseFloat(income),
        cashBalance: parseFloat(cashBalance),
        savings: parseFloat(savings),
        mpin: pinStr,
      };

      const res = await api.registerUser(payload);

      // Keep building animation on screen for 1.5 seconds for visual wow factor
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (res.success && res.user) {
        try { haptics.success(); } catch {}
        onSuccess(res.user);
      } else {
        setCurrentStep('MPIN');
        setToast({ type: 'error', message: res.error || 'Registration failed. Please retry.' });
      }
    } catch (err: any) {
      setCurrentStep('MPIN');
      setToast({ type: 'error', message: err?.message || 'Failed to complete registration.' });
    }
  };

  // Helper labels
  function getCategoryIncomeLabel(cat: CustomerCategory) {
    switch (cat) {
      case 'Salaried':
        return 'Monthly Salary';
      case 'Self-employed':
        return 'Monthly Earnings';
      case 'Retired':
        return 'Monthly Pension';
      case 'Student':
        return 'Monthly Pocket Money';
    }
  }

  function getCategoryIcon(cat: CustomerCategory) {
    switch (cat) {
      case 'Salaried':
        return 'briefcase';
      case 'Self-employed':
        return 'trending-up';
      case 'Retired':
        return 'heart';
      case 'Student':
        return 'book-open';
    }
  }

  // RENDER: Full-Screen Lottie Account Creation Overlay
  if (currentStep === 'CREATING') {
    return (
      <View style={styles.buildingContainer}>
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#0F172A']}
          style={StyleSheet.absoluteFill}
        />
        <LottieAnimation
          source={require('../../../assets/animations/account-creation.json')}
          type="creation"
          size={220}
        />
        <Text style={styles.buildingTitle}>Setting up your Expensio account...</Text>
        <Text style={styles.buildingSubtitle}>
          Preparing your personalized financial workspace.
        </Text>
        <ActivityIndicator size="small" color="#38BDF8" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast config={toast} onDismiss={() => setToast(null)} />

      <LinearGradient
        colors={['#D8E8FD', '#EBF2FB', '#F1F6FB', '#F8FAFC']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      {/* Header Bar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (currentStep === 'PROFILE' && !isGoogle) setCurrentStep('EMAIL');
            else if (currentStep === 'CATEGORY') setCurrentStep('PROFILE');
            else if (currentStep === 'FINANCE') setCurrentStep('CATEGORY');
            else if (currentStep === 'MPIN') setCurrentStep('FINANCE');
            else onCancel();
          }}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={18} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.brandLogoWrapper}>
          <Image
            source={require('../../../assets/expensio-logo-app.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            {currentStep === 'EMAIL'
              ? 'Step 1/5'
              : currentStep === 'PROFILE'
              ? 'Step 2/5'
              : currentStep === 'CATEGORY'
              ? 'Step 3/5'
              : currentStep === 'FINANCE'
              ? 'Step 4/5'
              : 'Step 5/5'}
          </Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: EMAIL VERIFICATION */}
          {currentStep === 'EMAIL' && (
            <View style={styles.stepContainer}>
              <View style={styles.headerIconCircle}>
                <Feather name="mail" size={26} color="#1864FF" />
              </View>
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.subtitle}>
                We will send an encrypted verification code for account recovery and statement reports.
              </Text>

              <View style={styles.inputCard}>
                <Feather name="at-sign" size={18} color="#64748B" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!isEmailOtpSent}
                />
              </View>

              {!isEmailOtpSent ? (
                <TouchableOpacity
                  style={[styles.primaryButton, !email && styles.buttonDisabled]}
                  onPress={handleSendEmailOtp}
                  disabled={!email || isLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={email ? ['#1864FF', '#0D47D9'] : ['#94A3B8', '#64748B']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Send Verification Code</Text>
                      <Feather name="arrow-right" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.inputGroupLabel}>ENTER 6-DIGIT CODE</Text>
                  <View style={styles.otpGrid}>
                    {emailOtp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          emailOtpInputs.current[index] = ref;
                        }}
                        style={[styles.otpBox, digit !== '' && styles.otpBoxFilled]}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(val) => {
                          const d = val.replace(/\D/g, '').slice(-1);
                          const next = [...emailOtp];
                          next[index] = d;
                          setEmailOtp(next);
                          if (d && index < 5) emailOtpInputs.current[index + 1]?.focus();
                          if (d && index === 5 && next.every((x) => x !== '')) handleVerifyEmailOtp(next.join(''));
                        }}
                        onKeyPress={(e) => {
                          if (e.nativeEvent.key === 'Backspace' && !emailOtp[index] && index > 0) {
                            emailOtpInputs.current[index - 1]?.focus();
                          }
                        }}
                        textAlign="center"
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, emailOtp.join('').length !== 6 && styles.buttonDisabled]}
                    onPress={() => handleVerifyEmailOtp()}
                    disabled={emailOtp.join('').length !== 6 || isLoading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={emailOtp.join('').length === 6 ? ['#1864FF', '#0D47D9'] : ['#94A3B8', '#64748B']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                    <Text style={styles.primaryButtonText}>Verify & Proceed</Text>
                    <Feather name="arrow-right" size={18} color="#FFFFFF" />
                  </TouchableOpacity>

                  <View style={styles.resendArea}>
                    {canResend ? (
                      <TouchableOpacity onPress={handleSendEmailOtp} style={styles.resendBtn}>
                        <Feather name="rotate-cw" size={13} color="#1864FF" />
                        <Text style={styles.resendBtnText}>Resend Code</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.timerText}>
                        Resend code in <Text style={styles.timerCount}>00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</Text>
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* STEP 2: PROFILE SETUP */}
          {currentStep === 'PROFILE' && (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>Set Up Your Profile</Text>
              <Text style={styles.subtitle}>
                Personalize your Expensio identity for shared groups and ledgers.
              </Text>

              {/* Avatar Selector */}
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  style={styles.avatarPickerWrapper}
                  onPress={handleSelectImage}
                  activeOpacity={0.8}
                >
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatarPickedImage} />
                  ) : (
                    <View style={styles.avatarDefault}>
                      <Feather name="user" size={36} color="#1864FF" />
                    </View>
                  )}
                  <View style={styles.cameraPill}>
                    <Feather name="camera" size={12} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.avatarPrompt}>Tap to choose profile photo</Text>
              </View>

              {/* First & Last Name */}
              <View style={styles.nameRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>FIRST NAME *</Text>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Rahul"
                      placeholderTextColor="#94A3B8"
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>LAST NAME *</Text>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Sharma"
                      placeholderTextColor="#94A3B8"
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                </View>
              </View>

              {/* Desired Username */}
              <Text style={styles.fieldLabel}>DESIRED USERNAME *</Text>
              <View style={styles.inputCard}>
                <Text style={styles.atSign}>@</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="your_unique_tag"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username.replace(/^@/, '')}
                  onChangeText={(v) => setUsername(`@${v.trim()}`)}
                />
              </View>

              {/* Verified Details Badges */}
              <View style={styles.verifiedChipRow}>
                {initialData.phone ? (
                  <View style={styles.verifiedChip}>
                    <Feather name="check" size={11} color="#10B981" />
                    <Text style={styles.verifiedChipText}>+91 {initialData.phone.slice(-10)}</Text>
                  </View>
                ) : null}
                <View style={styles.verifiedChip}>
                  <Feather name="check" size={11} color="#10B981" />
                  <Text style={styles.verifiedChipText}>{email || initialData.email}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleProfileContinue}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#1864FF', '#0D47D9']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.primaryButtonText}>Continue</Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: FINANCIAL CATEGORY SELECTION */}
          {currentStep === 'CATEGORY' && (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>What Best Describes You?</Text>
              <Text style={styles.subtitle}>
                Choose your primary profile to personalize your budget and vaults.
              </Text>

              <View style={styles.categoryGrid}>
                {(['Salaried', 'Self-employed', 'Retired', 'Student'] as CustomerCategory[]).map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                      onPress={() => handleCategorySelect(cat)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.catIconCircle, isSelected && styles.catIconCircleSelected]}>
                        <Feather
                          name={getCategoryIcon(cat) as any}
                          size={20}
                          color={isSelected ? '#1864FF' : '#64748B'}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.catTitle, isSelected && styles.catTitleSelected]}>
                          {cat}
                        </Text>
                        <Text style={styles.catSubtitle}>
                          {cat === 'Salaried'
                            ? 'Fixed or monthly salary deposit'
                            : cat === 'Self-employed'
                            ? 'Business earnings & freelance'
                            : cat === 'Retired'
                            ? 'Pension & senior citizen savings'
                            : 'Pocket money & college allowance'}
                        </Text>
                      </View>
                      <View style={[styles.catCheckCircle, isSelected && styles.catCheckCircleActive]}>
                        {isSelected && <Feather name="check" size={12} color="#FFFFFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setCurrentStep('FINANCE')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#1864FF', '#0D47D9']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.primaryButtonText}>Continue with {category}</Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: FINANCIAL SETUP (STRICT CATEGORY MAPPING) */}
          {currentStep === 'FINANCE' && (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>Financial Starting Balances</Text>
              <Text style={styles.subtitle}>
                Enter self-reported starting balances. These configure your initial vaults and budget.
              </Text>

              {/* 1. Category Specific Income Field */}
              <Text style={styles.fieldLabel}>
                {getCategoryIncomeLabel(category).toUpperCase()} (INR ₹) *
              </Text>
              <View style={styles.inputCard}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 50000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={income}
                  onChangeText={setIncome}
                />
              </View>

              {/* 2. Cash Balance */}
              <Text style={styles.fieldLabel}>CASH BALANCE (INR ₹) *</Text>
              <View style={styles.inputCard}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 5000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={cashBalance}
                  onChangeText={setCashBalance}
                />
              </View>

              {/* 3. Savings Balance */}
              <Text style={styles.fieldLabel}>SAVINGS BALANCE (INR ₹) *</Text>
              <View style={styles.inputCard}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 20000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={savings}
                  onChangeText={setSavings}
                />
              </View>

              <Text style={styles.financeDisclaimer}>
                ℹ️ Note: Amounts are treated as self-reported starting figures, not verified bank balances.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleFinanceContinue}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#1864FF', '#0D47D9']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.primaryButtonText}>Configure MPIN</Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5: MPIN SETUP */}
          {currentStep === 'MPIN' && (
            <View style={styles.stepContainer}>
              <View style={styles.headerIconCircle}>
                <Feather name="shield" size={26} color="#1864FF" />
              </View>
              <Text style={styles.title}>Create Your 4-Digit MPIN</Text>
              <Text style={styles.subtitle}>
                You will use this MPIN to securely unlock Expensio on this device.
              </Text>

              {/* Enter MPIN */}
              <Text style={styles.inputGroupLabel}>ENTER 4-DIGIT MPIN</Text>
              <View style={styles.pinGrid}>
                {mpin.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      mpinInputs.current[index] = ref;
                    }}
                    style={[styles.pinBox, digit !== '' && styles.pinBoxFilled]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    secureTextEntry
                    onChangeText={(val) => {
                      const d = val.replace(/\D/g, '').slice(-1);
                      const next = [...mpin];
                      next[index] = d;
                      setMpin(next);
                      if (d && index < 3) mpinInputs.current[index + 1]?.focus();
                      else if (d && index === 3) confirmMpinInputs.current[0]?.focus();
                    }}
                    onKeyPress={(e) => {
                      if (e.nativeEvent.key === 'Backspace' && !mpin[index] && index > 0) {
                        mpinInputs.current[index - 1]?.focus();
                      }
                    }}
                    textAlign="center"
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              {/* Confirm MPIN */}
              <Text style={styles.inputGroupLabel}>CONFIRM 4-DIGIT MPIN</Text>
              <View style={styles.pinGrid}>
                {confirmMpin.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      confirmMpinInputs.current[index] = ref;
                    }}
                    style={[styles.pinBox, digit !== '' && styles.pinBoxFilled]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    secureTextEntry
                    onChangeText={(val) => {
                      const d = val.replace(/\D/g, '').slice(-1);
                      const next = [...confirmMpin];
                      next[index] = d;
                      setConfirmMpin(next);
                      if (d && index < 3) confirmMpinInputs.current[index + 1]?.focus();
                    }}
                    onKeyPress={(e) => {
                      if (e.nativeEvent.key === 'Backspace' && !confirmMpin[index] && index > 0) {
                        confirmMpinInputs.current[index - 1]?.focus();
                      }
                    }}
                    textAlign="center"
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (mpin.join('').length !== 4 || confirmMpin.join('').length !== 4) && styles.buttonDisabled,
                ]}
                onPress={handleFinalSubmit}
                disabled={mpin.join('').length !== 4 || confirmMpin.join('').length !== 4}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    mpin.join('').length === 4 && confirmMpin.join('').length === 4
                      ? ['#1864FF', '#0D47D9']
                      : ['#94A3B8', '#64748B']
                  }
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.primaryButtonText}>Build My Financial Space</Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF2FB',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 6,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  brandLogoWrapper: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandLogo: {
    width: 28,
    height: 28,
  },
  stepBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  stepBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1864FF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
  },
  stepContainer: {
    marginTop: 6,
  },
  headerIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 4,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 10,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1864FF',
    marginRight: 8,
  },
  atSign: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1864FF',
    marginRight: 6,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarPickerWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    position: 'relative',
  },
  avatarDefault: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPickedImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  cameraPill: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1864FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1864FF',
    marginTop: 8,
  },
  verifiedChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  verifiedChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#065F46',
  },
  categoryGrid: {
    gap: 12,
    marginBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryCardSelected: {
    borderColor: '#1864FF',
    backgroundColor: '#F8FAFF',
  },
  catIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIconCircleSelected: {
    backgroundColor: '#EFF6FF',
  },
  catTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  catTitleSelected: {
    color: '#1864FF',
  },
  catSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  catCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catCheckCircleActive: {
    backgroundColor: '#1864FF',
    borderColor: '#1864FF',
  },
  financeDisclaimer: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
    marginVertical: 10,
  },
  inputGroupLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 6,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  otpBoxFilled: {
    borderColor: '#1864FF',
    backgroundColor: '#F8FAFF',
  },
  pinGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pinBox: {
    width: 52,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  pinBoxFilled: {
    borderColor: '#1864FF',
    backgroundColor: '#F8FAFF',
  },
  primaryButton: {
    height: 54,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
    gap: 8,
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.65,
    shadowOpacity: 0.05,
  },
  primaryButtonText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resendArea: {
    alignItems: 'center',
    marginTop: 14,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1864FF',
  },
  timerText: {
    fontSize: 13,
    color: '#64748B',
  },
  timerCount: {
    fontWeight: '800',
    color: '#1864FF',
  },
  buildingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  buildingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  buildingSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});

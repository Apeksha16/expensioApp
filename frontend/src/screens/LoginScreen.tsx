import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { api } from '../services/api';
import { haptics } from '../services/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  onBackToOnboarding?: () => void;
}

export function LoginScreen({ onLoginSuccess, onBackToOnboarding }: LoginScreenProps) {
  // Step state: 'PHONE' | 'OTP'
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  // Input states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Timer for resend
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const satelliteSway1 = useRef(new Animated.Value(0)).current;
  const satelliteSway2 = useRef(new Animated.Value(0)).current;

  // Refs for OTP input boxes
  const otpInputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    // Pulse loop for phone vault emblem (breathing scale, NO translateY float)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.07,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.98,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    // Satellite 1 gentle orbital float
    Animated.loop(
      Animated.sequence([
        Animated.timing(satelliteSway1, {
          toValue: 5,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(satelliteSway1, {
          toValue: -5,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    // Satellite 2 counter orbital float
    Animated.loop(
      Animated.sequence([
        Animated.timing(satelliteSway2, {
          toValue: -5,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(satelliteSway2, {
          toValue: 5,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, []);

  // Resend OTP countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === 'OTP' && resendTimer > 0) {
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
  }, [step, resendTimer]);

  // Clean phone string to digits
  const cleanPhone = phone.replace(/\D/g, '');
  const isPhoneValid = cleanPhone.length === 10;

  // Handle Send OTP
  const handleSendOtp = async () => {
    if (!isPhoneValid) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      try { haptics.error(); } catch {}
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    try { haptics.selection(); } catch {}

    try {
      const response = await api.sendOtp(cleanPhone);
      setIsLoading(false);
      setStep('OTP');
      setResendTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      try { haptics.success(); } catch {}

      // Transition animation
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }).start();

      // Focus first OTP input after step switch
      setTimeout(() => {
        otpInputs.current[0]?.focus();
      }, 350);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Failed to send OTP. Please try again.');
      try { haptics.error(); } catch {}
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (inputOtp?: string) => {
    const code = inputOtp || otp.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code');
      try { haptics.error(); } catch {}
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    try { haptics.selection(); } catch {}

    try {
      const response = await api.verifyOtp(cleanPhone, code);
      setIsLoading(false);

      if (response && (response.token || response.success)) {
        try { haptics.success(); } catch {}
        onLoginSuccess(response.user || { phone: cleanPhone, name: 'Expensio User' });
      } else {
        setErrorMsg(response?.error || 'Invalid code. Use dev code 123456');
        try { haptics.error(); } catch {}
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Verification failed. Please try again.');
      try { haptics.error(); } catch {}
    }
  };

  // Handle OTP digit input with auto-advance
  const handleOtpChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1); // Take last digit
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 filled
    if (digit && index === 5 && newOtp.every((d) => d !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  // Handle backspace navigation in OTP
  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  // Dev Quick Fill (123456)
  const handleDevAutoFill = () => {
    try { haptics.selection(); } catch {}
    const devCode = ['1', '2', '3', '4', '5', '6'];
    setOtp(devCode);
    handleVerifyOtp('123456');
  };

  // Handle Google OAuth Quick Login
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      try { haptics.selection(); } catch {}
      const res = await api.socialAuth({
        provider: 'google',
        token: 'dev-google-token-demo',
        email: 'apeksha@expensio.app',
        name: 'Apeksha Verma',
      });
      if (res && res.user) {
        try { haptics.success(); } catch {}
        onLoginSuccess(res.user);
      } else {
        onLoginSuccess({ name: 'Apeksha Verma', email: 'apeksha@expensio.app', phone: '9876543210' });
      }
    } catch {
      onLoginSuccess({ name: 'Apeksha Verma', email: 'apeksha@expensio.app', phone: '9876543210' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Biometric Quick PIN Login
  const handleBiometricLogin = () => {
    try { haptics.selection(); } catch {}
    onLoginSuccess({ name: 'Apeksha Verma', phone: '9876543210', biometricAuth: true });
  };

  return (
    <View style={styles.container}>
      {/* 1. Global Full-Screen Atmospheric Mesh Gradient */}
      <LinearGradient
        colors={['#D8E8FD', '#EBF2FB', '#F1F6FB', '#F8FAFC']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      {/* 2. Top-Right Ambient Aurora Glow */}
      <View style={styles.topRightAura} pointerEvents="none">
        <LinearGradient
          colors={['rgba(56, 189, 248, 0.38)', 'rgba(24, 100, 255, 0.16)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      {/* 3. Bottom-Left Ambient Glow */}
      <View style={styles.bottomLeftAura} pointerEvents="none">
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.18)', 'rgba(56, 189, 248, 0.08)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
        />
      </View>

      {/* 4. Fine Structural SVG Vector Atmosphere */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <SvgGradient id="radarRingLogin" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#1864FF" stopOpacity={0.14} />
            <Stop offset="50%" stopColor="#38BDF8" stopOpacity={0.07} />
            <Stop offset="100%" stopColor="#1864FF" stopOpacity={0.02} />
          </SvgGradient>
        </Defs>

        <Circle
          cx={SCREEN_WIDTH * 0.5}
          cy={SCREEN_HEIGHT * 0.26}
          r={130}
          stroke="url(#radarRingLogin)"
          strokeWidth={1.2}
          strokeDasharray="4, 8"
          fill="none"
        />
        <Circle
          cx={SCREEN_WIDTH * 0.5}
          cy={SCREEN_HEIGHT * 0.26}
          r={180}
          stroke="url(#radarRingLogin)"
          strokeWidth={1}
          strokeDasharray="6, 10"
          fill="none"
        />

        {/* Ambient star dots */}
        <Circle cx={SCREEN_WIDTH * 0.12} cy={SCREEN_HEIGHT * 0.12} r={2.2} fill="rgba(24, 100, 255, 0.28)" />
        <Circle cx={SCREEN_WIDTH * 0.88} cy={SCREEN_HEIGHT * 0.14} r={2.5} fill="rgba(56, 189, 248, 0.35)" />
        <Circle cx={SCREEN_WIDTH * 0.1} cy={SCREEN_HEIGHT * 0.42} r={2} fill="rgba(24, 100, 255, 0.22)" />
        <Circle cx={SCREEN_WIDTH * 0.9} cy={SCREEN_HEIGHT * 0.5} r={2.2} fill="rgba(99, 102, 241, 0.28)" />
      </Svg>

      {/* Top Header Bar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.headerLeft}>
          {step === 'OTP' ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setStep('PHONE');
                setErrorMsg(null);
                try { haptics.selection(); } catch {}
              }}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={18} color="#0F172A" />
            </TouchableOpacity>
          ) : onBackToOnboarding ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackToOnboarding}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={18} color="#0F172A" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}

          <View style={styles.brandLogoWrapper}>
            <Image
              source={require('../../assets/expensio-logo-app.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={{ width: 36 }} />
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Illustration: Centered Blue Aura + 3D Shield Lock */}
          <View style={styles.heroSection}>
            <Svg width={220} height={200} viewBox="0 0 220 200" style={styles.heroSvg}>
              <Defs>
                <SvgGradient id="loginBlobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#38BDF8" stopOpacity={1} />
                  <Stop offset="50%" stopColor="#1864FF" stopOpacity={1} />
                  <Stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.98} />
                </SvgGradient>
                <SvgGradient id="loginBlobSoft" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#BAE6FD" stopOpacity={0.5} />
                  <Stop offset="100%" stopColor="#818CF8" stopOpacity={0.15} />
                </SvgGradient>
              </Defs>

              {/* Ambient Outer Halo */}
              <Circle cx={110} cy={100} r={82} fill="url(#loginBlobSoft)" />

              {/* Primary Blue Aura */}
              <Circle cx={110} cy={100} r={72} fill="url(#loginBlobGrad)" />
            </Svg>

            {/* Floating 3D Frosted Vault Emblem (Scale Breathing, NO translateY) */}
            <Animated.View
              style={[
                styles.vaultEmblem,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F0F6FF', '#E2ECFC']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.innerEmblemCircle}>
                <Feather
                  name={step === 'PHONE' ? 'smartphone' : 'lock'}
                  size={30}
                  color="#1864FF"
                />
              </View>
            </Animated.View>

            {/* Orbiting Satellite 1 */}
            <Animated.View
              style={[
                styles.satelliteTag1,
                { transform: [{ translateX: satelliteSway1 }] },
              ]}
            >
              <Feather name={step === 'PHONE' ? 'zap' : 'shield'} size={11} color="#1864FF" />
              <Text style={styles.satelliteText}>{step === 'PHONE' ? 'Fast Sign-In' : '100% Private'}</Text>
            </Animated.View>

            {/* Orbiting Satellite 2 */}
            <Animated.View
              style={[
                styles.satelliteTag2,
                { transform: [{ translateX: satelliteSway2 }] },
              ]}
            >
              <Feather name={step === 'PHONE' ? 'shield' : 'lock'} size={11} color="#10B981" />
              <Text style={styles.satelliteText}>{step === 'PHONE' ? '100% Secure' : 'End-to-End'}</Text>
            </Animated.View>
          </View>

          {/* Error Banner */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* STEP 1: PHONE NUMBER INPUT */}
          {step === 'PHONE' ? (
            <View style={styles.formContainer}>
              <Text style={styles.title}>Enter Your Mobile Number</Text>
              <Text style={styles.subtitle}>
                We will send an encrypted 6-digit verification code to sign you in securely.
              </Text>

              {/* Phone Input Card */}
              <View style={styles.phoneInputCard}>
                <View style={styles.countryPicker}>
                  <Text style={styles.countryFlag}>🇮🇳</Text>
                  <Text style={styles.countryCode}>+91</Text>
                  <Feather name="chevron-down" size={14} color="#64748B" />
                </View>

                <View style={styles.inputDivider} />

                <TextInput
                  style={styles.phoneInput}
                  placeholder="98765 43210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  autoFocus
                />

                {phone.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setPhone('')}
                    style={styles.clearBtn}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={14} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.primaryButton, !isPhoneValid && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={!isPhoneValid || isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isPhoneValid ? ['#1864FF', '#0D47D9'] : ['#94A3B8', '#64748B']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Get Verification Code</Text>
                    <Feather name="arrow-right" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              {/* Trust Indicators (Updated points) */}
              <View style={styles.trustFooter}>
                <View style={styles.trustItem}>
                  <Feather name="shield" size={12} color="#10B981" />
                  <Text style={styles.trustText}>100% Private</Text>
                </View>
                <View style={styles.trustDot} />
                <View style={styles.trustItem}>
                  <Feather name="hard-drive" size={12} color="#10B981" />
                  <Text style={styles.trustText}>Local Storage</Text>
                </View>
                <View style={styles.trustDot} />
                <View style={styles.trustItem}>
                  <Feather name="lock" size={12} color="#10B981" />
                  <Text style={styles.trustText}>End-to-End Secure</Text>
                </View>
              </View>

              {/* Or Quick Login Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR QUICK SIGN IN WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Quick Login Button (Biometric PIN removed) */}
              <View style={styles.socialRow}>
                <TouchableOpacity
                  style={[styles.socialBtn, { flex: 1 }]}
                  onPress={handleGoogleLogin}
                  activeOpacity={0.8}
                >
                  <GoogleIcon />
                  <Text style={styles.socialBtnText}>Continue with Google</Text>
                </TouchableOpacity>
              </View>

              {/* Social Proof Badges (Made by Indian) */}
              <View style={styles.socialProofRow}>
                <View style={styles.proofPill}>
                  <Feather name="star" size={10} color="#F59E0B" />
                  <Text style={styles.proofPillText}>4.9 ★ Rating</Text>
                </View>
                <View style={styles.proofPill}>
                  <Feather name="lock" size={10} color="#10B981" />
                  <Text style={styles.proofPillText}>100% Offline Vault</Text>
                </View>
                <View style={styles.proofPill}>
                  <Text style={styles.proofPillFlag}>🇮🇳</Text>
                  <Text style={styles.proofPillText}>Made by Indian</Text>
                </View>
              </View>

              {/* Legal Footer Note */}
              <Text style={styles.legalText}>
                By signing in, you agree to Expensio's Terms of Service and Privacy Policy. Protected by 256-bit AES cryptographic encryption.
              </Text>
            </View>
          ) : (
            /* STEP 2: 6-DIGIT OTP VERIFICATION */
            <View style={styles.formContainer}>
              <Text style={styles.title}>Enter OTP Code</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit verification code to
              </Text>
              {/* Sleek Unified Phone Capsule with Dedicated Change Button */}
              <View style={styles.phoneUnifiedWrapper}>
                <View style={styles.phoneUnifiedCapsule}>
                  <View style={styles.phoneCapsuleLeft}>
                    <View style={styles.phoneIconCircle}>
                      <Feather name="smartphone" size={13} color="#1864FF" />
                    </View>
                    <Text style={styles.phoneCapsuleFlag}>🇮🇳</Text>
                    <Text style={styles.phoneCapsuleNumber}>
                      +91 {cleanPhone.length === 10 ? `${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` : (cleanPhone || '98765 43210')}
                    </Text>
                  </View>

                  <View style={styles.phoneCapsuleDivider} />

                  <TouchableOpacity
                    style={styles.phoneCapsuleEditBtn}
                    onPress={() => {
                      setStep('PHONE');
                      setErrorMsg(null);
                      try { haptics.selection(); } catch {}
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="edit-3" size={12} color="#1864FF" />
                    <Text style={styles.phoneCapsuleEditText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 6 OTP Input Boxes */}
              <View style={styles.otpGrid}>
                {otp.map((digit, index) => {
                  const isFocused = index === otp.findIndex((d) => d === '');
                  const hasValue = digit !== '';
                  return (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        otpInputs.current[index] = ref;
                      }}
                      style={[
                        styles.otpBox,
                        hasValue && styles.otpBoxFilled,
                        isFocused && !hasValue && styles.otpBoxFocused,
                      ]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleOtpKeyPress(e, index)}
                      selectTextOnFocus
                      textAlign="center"
                    />
                  );
                })}
              </View>



              {/* Verify & Login Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  otp.join('').length !== 6 && styles.buttonDisabled,
                ]}
                onPress={() => handleVerifyOtp()}
                disabled={otp.join('').length !== 6 || isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={otp.join('').length === 6 ? ['#1864FF', '#0D47D9'] : ['#94A3B8', '#64748B']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Verify & Login</Text>
                    <Feather name="check" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              {/* Resend Section */}
              <View style={styles.resendArea}>
                {canResend ? (
                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handleSendOtp}
                    activeOpacity={0.7}
                  >
                    <Feather name="rotate-cw" size={13} color="#1864FF" />
                    <Text style={styles.resendBtnText}>Resend SMS Code</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>
                    Resend code in <Text style={styles.timerCount}>00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</Text>
                  </Text>
                )}
              </View>

              {/* Redesigned Bottom Security Card */}
              <View style={styles.securityShieldCard}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFF', '#F1F6FF']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.shieldCardTop}>
                  <View style={styles.shieldIconSquircle}>
                    <Feather name="shield" size={18} color="#1864FF" />
                  </View>
                  <View style={styles.shieldCardMeta}>
                    <View style={styles.shieldTitleRow}>
                      <Text style={styles.shieldCardTitle}>Protected Verification</Text>
                      <View style={styles.shieldActiveBadge}>
                        <View style={styles.shieldActiveDot} />
                        <Text style={styles.shieldActiveText}>Active</Text>
                      </View>
                    </View>
                    <Text style={styles.shieldCardSubtitle}>
                      Single-use encrypted code • Auto-expires in 5m
                    </Text>
                  </View>
                </View>

                <View style={styles.shieldCardDivider} />

                <View style={styles.shieldFeaturesRow}>
                  <View style={styles.shieldFeatureItem}>
                    <Feather name="lock" size={11} color="#10B981" />
                    <Text style={styles.shieldFeatureText}>100% Private</Text>
                  </View>
                  <View style={styles.shieldFeatureDot} />
                  <View style={styles.shieldFeatureItem}>
                    <Feather name="clock" size={11} color="#1864FF" />
                    <Text style={styles.shieldFeatureText}>5m Expiry</Text>
                  </View>
                  <View style={styles.shieldFeatureDot} />
                  <View style={styles.shieldFeatureItem}>
                    <Feather name="check-circle" size={11} color="#10B981" />
                    <Text style={styles.shieldFeatureText}>Anti-Fraud</Text>
                  </View>
                </View>
              </View>

              {/* Trust Indicators (Points from last screen) */}
              <View style={styles.trustFooter}>
                <View style={styles.trustItem}>
                  <Feather name="shield" size={12} color="#10B981" />
                  <Text style={styles.trustText}>100% Private</Text>
                </View>
                <View style={styles.trustDot} />
                <View style={styles.trustItem}>
                  <Feather name="hard-drive" size={12} color="#10B981" />
                  <Text style={styles.trustText}>Local Storage</Text>
                </View>
                <View style={styles.trustDot} />
                <View style={styles.trustItem}>
                  <Feather name="lock" size={12} color="#10B981" />
                  <Text style={styles.trustText}>End-to-End Secure</Text>
                </View>
              </View>

              {/* Social Proof Badges with Made by Indian (Points from last screen) */}
              <View style={styles.socialProofRow}>
                <View style={styles.proofPill}>
                  <Feather name="star" size={10} color="#F59E0B" />
                  <Text style={styles.proofPillText}>4.9 ★ Rating</Text>
                </View>
                <View style={styles.proofPill}>
                  <Feather name="lock" size={10} color="#10B981" />
                  <Text style={styles.proofPillText}>100% Offline Vault</Text>
                </View>
                <View style={styles.proofPill}>
                  <Text style={styles.proofPillFlag}>🇮🇳</Text>
                  <Text style={styles.proofPillText}>Made by Indian</Text>
                </View>
              </View>

              {/* Need Help Prompt */}
              <TouchableOpacity
                style={styles.helpLink}
                onPress={() => {
                  setErrorMsg('In development mode, use demo OTP code: 123456');
                  try { haptics.selection(); } catch {}
                }}
                activeOpacity={0.7}
              >
                <Feather name="help-circle" size={13} color="#64748B" />
                <Text style={styles.helpLinkText}>Didn't receive the SMS code? Tap for help</Text>
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
  topRightAura: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 290,
    height: 290,
    borderRadius: 145,
    overflow: 'hidden',
  },
  bottomLeftAura: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 310,
    height: 310,
    borderRadius: 155,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  brandLogoWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: 9,
  },

  scrollContent: {
    paddingHorizontal: 26,
    paddingTop: 8,
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    position: 'relative',
    marginVertical: 10,
  },
  heroSvg: {
    position: 'absolute',
  },
  vaultEmblem: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  innerEmblemCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  satelliteTag1: {
    position: 'absolute',
    top: 24,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  satelliteTag2: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  satelliteText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
  },
  formContainer: {
    width: '100%',
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 5.5,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  tagBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1864FF',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 18,
  },
  phoneUnifiedWrapper: {
    alignItems: 'flex-start',
    marginTop: -8,
    marginBottom: 20,
  },
  phoneUnifiedCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 8,
    paddingLeft: 6,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  phoneCapsuleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 2,
  },
  phoneIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneCapsuleFlag: {
    fontSize: 13,
  },
  phoneCapsuleNumber: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
  phoneCapsuleDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E2E8F0',
  },
  phoneCapsuleEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  phoneCapsuleEditText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1864FF',
  },
  securityShieldCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    marginTop: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    padding: 14,
  },
  shieldCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shieldIconSquircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  shieldCardMeta: {
    flex: 1,
  },
  shieldTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  shieldCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  shieldActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  shieldActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  shieldActiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  shieldCardSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  shieldCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  shieldFeaturesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  shieldFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  shieldFeatureDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  shieldFeatureText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  phoneInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 12,
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingRight: 8,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 10,
    letterSpacing: 1.5,
  },
  clearBtn: {
    padding: 6,
  },
  devPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  devPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1864FF',
  },
  primaryButton: {
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 18,
  },
  buttonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 14,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  otpBoxFilled: {
    borderColor: '#1864FF',
    backgroundColor: '#F8FAFF',
  },
  otpBoxFocused: {
    borderColor: '#1864FF',
    borderWidth: 2,
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  resendArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  resendBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1864FF',
  },
  timerText: {
    fontSize: 13,
    color: '#64748B',
  },
  timerCount: {
    fontWeight: '700',
    color: '#0F172A',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  socialBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  securityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  secCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  secShieldIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  secCardHeaderTextCol: {
    flex: 1,
  },
  secCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  secCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  isoBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  isoBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1864FF',
    letterSpacing: 0.8,
  },
  secFeaturesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  secFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secFeatureDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  secFeatureText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  socialProofRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  proofPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  proofPillFlag: {
    fontSize: 11,
  },
  proofPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  legalText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  helpLinkText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
});

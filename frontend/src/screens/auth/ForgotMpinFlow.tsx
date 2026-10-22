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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { api } from '../../services/api';
import { haptics } from '../../services/haptics';
import { LottieAnimation } from '../../components/common/LottieAnimation';
import { Toast, type ToastConfig } from '../../components/common/Toast';

interface ForgotMpinFlowProps {
  user: any;
  onSuccess: (updatedUser: any) => void;
  onCancel: () => void;
}

export function ForgotMpinFlow({ user, onSuccess, onCancel }: ForgotMpinFlowProps) {
  // Step: 'OTP' | 'SET_PIN' | 'SUCCESS'
  const [step, setStep] = useState<'OTP' | 'SET_PIN' | 'SUCCESS'>('OTP');

  // Recovery State
  const [maskedEmail, setMaskedEmail] = useState('ap••••@expensio.app');
  const [resetToken, setResetToken] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // New PIN State
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastConfig | null>(null);

  const otpInputs = useRef<Array<TextInput | null>>([]);
  const newPinInputs = useRef<Array<TextInput | null>>([]);
  const confirmPinInputs = useRef<Array<TextInput | null>>([]);

  // Initial OTP Request on Mount
  useEffect(() => {
    async function initRecovery() {
      setIsLoading(true);
      try {
        const res = await api.requestForgotMpinOtp(user?.id || 'usr_001');
        setIsLoading(false);
        if (res.maskedEmail) {
          setMaskedEmail(res.maskedEmail);
        }
      } catch {
        setIsLoading(false);
      }
    }
    initRecovery();
  }, [user]);

  // Resend countdown
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

  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    try { haptics.selection(); } catch {}
    try {
      await api.requestForgotMpinOtp(user?.id || 'usr_001');
      setIsLoading(false);
      setResendTimer(30);
      setCanResend(false);
      setToast({ type: 'info', message: 'A fresh recovery code was sent to your email.' });
    } catch {
      setIsLoading(false);
      setToast({ type: 'error', message: 'Failed to resend code. Please retry.' });
    }
  };

  // OTP Change
  const handleOtpChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);

    if (digit && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    if (digit && index === 5 && nextOtp.every((d) => d !== '')) {
      handleVerifyOtp(nextOtp.join(''));
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join('');
    if (code.length !== 6) {
      setToast({ type: 'error', message: 'Please enter all 6 digits of the recovery code' });
      return;
    }

    setIsLoading(true);
    try { haptics.selection(); } catch {}

    try {
      const res = await api.verifyForgotMpinOtp(user?.id || 'usr_001', code);
      setIsLoading(false);

      if (res.success && res.resetToken) {
        try { haptics.success(); } catch {}
        setResetToken(res.resetToken);
        setStep('SET_PIN');
        setTimeout(() => newPinInputs.current[0]?.focus(), 300);
      } else {
        try { haptics.error(); } catch {}
        setToast({ type: 'error', message: res.error || 'Invalid recovery code. Please try again.' });
      }
    } catch (err: any) {
      setIsLoading(false);
      setToast({ type: 'error', message: err?.message || 'Verification failed. Please retry.' });
    }
  };

  // Set New MPIN Change
  const handleNewPinChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...newPin];
    next[index] = digit;
    setNewPin(next);

    if (digit && index < 3) {
      newPinInputs.current[index + 1]?.focus();
    } else if (digit && index === 3) {
      confirmPinInputs.current[0]?.focus();
    }
  };

  const handleConfirmPinChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...confirmPin];
    next[index] = digit;
    setConfirmPin(next);

    if (digit && index < 3) {
      confirmPinInputs.current[index + 1]?.focus();
    }
  };

  const handleResetSubmit = async () => {
    const pinStr = newPin.join('');
    const confirmStr = confirmPin.join('');

    if (pinStr.length !== 4) {
      setToast({ type: 'error', message: 'Please enter a 4-digit MPIN' });
      return;
    }

    if (pinStr !== confirmStr) {
      setToast({ type: 'error', message: 'The entered MPINs do not match. Please verify.' });
      try { haptics.error(); } catch {}
      return;
    }

    setIsLoading(true);
    try { haptics.selection(); } catch {}

    try {
      const res = await api.resetMpin(user?.id || 'usr_001', resetToken, pinStr);
      setIsLoading(false);

      if (res.success) {
        try { haptics.success(); } catch {}
        setStep('SUCCESS');
        setTimeout(() => {
          onSuccess(res.user || user);
        }, 1600);
      } else {
        setToast({ type: 'error', message: res.error || 'Failed to update MPIN' });
      }
    } catch (err: any) {
      setIsLoading(false);
      setToast({ type: 'error', message: err?.message || 'Reset failed. Please retry.' });
    }
  };

  return (
    <View style={styles.container}>
      <Toast config={toast} onDismiss={() => setToast(null)} />

      <LinearGradient
        colors={['#D8E8FD', '#EBF2FB', '#F1F6FB', '#F8FAFC']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      <SafeAreaView edges={['top']} style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onCancel}
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

        <View style={{ width: 36 }} />
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'OTP' && (
            <View style={styles.sectionContainer}>
              <View style={styles.headerIconCircle}>
                <Feather name="mail" size={26} color="#1864FF" />
              </View>

              <Text style={styles.title}>Verify Recovery Code</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit security code to your registered recovery email:
              </Text>

              <View style={styles.emailBadge}>
                <Feather name="shield" size={13} color="#10B981" />
                <Text style={styles.emailBadgeText}>{maskedEmail}</Text>
              </View>

              {/* 6 OTP Boxes */}
              <View style={styles.otpGrid}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      otpInputs.current[index] = ref;
                    }}
                    style={[styles.otpBox, digit !== '' && styles.otpBoxFilled]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(val) => handleOtpChange(val, index)}
                    onKeyPress={(e) => {
                      if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
                        otpInputs.current[index - 1]?.focus();
                      }
                    }}
                    textAlign="center"
                    autoFocus={index === 0}
                  />
                ))}
              </View>

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
                    <Text style={styles.primaryButtonText}>Verify & Proceed</Text>
                    <Feather name="arrow-right" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              {/* Resend Area */}
              <View style={styles.resendArea}>
                {canResend ? (
                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handleResendOtp}
                    activeOpacity={0.7}
                  >
                    <Feather name="rotate-cw" size={13} color="#1864FF" />
                    <Text style={styles.resendBtnText}>Resend Recovery Code</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>
                    Resend code in <Text style={styles.timerCount}>00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</Text>
                  </Text>
                )}
              </View>
            </View>
          )}

          {step === 'SET_PIN' && (
            <View style={styles.sectionContainer}>
              <View style={styles.headerIconCircle}>
                <Feather name="lock" size={26} color="#1864FF" />
              </View>

              <Text style={styles.title}>Set New 4-Digit MPIN</Text>
              <Text style={styles.subtitle}>
                Choose a new 4-digit numeric code to protect your account.
              </Text>

              {/* New MPIN */}
              <Text style={styles.inputGroupLabel}>NEW 4-DIGIT MPIN</Text>
              <View style={styles.pinGrid}>
                {newPin.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      newPinInputs.current[index] = ref;
                    }}
                    style={[styles.pinBox, digit !== '' && styles.pinBoxFilled]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    secureTextEntry
                    onChangeText={(val) => handleNewPinChange(val, index)}
                    onKeyPress={(e) => {
                      if (e.nativeEvent.key === 'Backspace' && !newPin[index] && index > 0) {
                        newPinInputs.current[index - 1]?.focus();
                      }
                    }}
                    textAlign="center"
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              {/* Confirm MPIN */}
              <Text style={styles.inputGroupLabel}>CONFIRM NEW MPIN</Text>
              <View style={styles.pinGrid}>
                {confirmPin.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      confirmPinInputs.current[index] = ref;
                    }}
                    style={[styles.pinBox, digit !== '' && styles.pinBoxFilled]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    secureTextEntry
                    onChangeText={(val) => handleConfirmPinChange(val, index)}
                    onKeyPress={(e) => {
                      if (e.nativeEvent.key === 'Backspace' && !confirmPin[index] && index > 0) {
                        confirmPinInputs.current[index - 1]?.focus();
                      }
                    }}
                    textAlign="center"
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (newPin.join('').length !== 4 || confirmPin.join('').length !== 4) && styles.buttonDisabled,
                ]}
                onPress={handleResetSubmit}
                disabled={newPin.join('').length !== 4 || confirmPin.join('').length !== 4 || isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    newPin.join('').length === 4 && confirmPin.join('').length === 4
                      ? ['#1864FF', '#0D47D9']
                      : ['#94A3B8', '#64748B']
                  }
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Update MPIN & Sign In</Text>
                    <Feather name="check" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 'SUCCESS' && (
            <View style={[styles.sectionContainer, { alignItems: 'center', marginTop: 40 }]}>
              <LottieAnimation
                source={require('../../../assets/animations/success-check.json')}
                type="success"
                size={140}
              />
              <Text style={[styles.title, { textAlign: 'center', marginTop: 20 }]}>
                MPIN Updated!
              </Text>
              <Text style={[styles.subtitle, { textAlign: 'center' }]}>
                Your secure financial space has been updated. Accessing dashboard...
              </Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionContainer: {
    marginTop: 8,
  },
  headerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 14,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  emailBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 54,
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
  inputGroupLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 6,
  },
  pinGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pinBox: {
    width: 54,
    height: 54,
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
});

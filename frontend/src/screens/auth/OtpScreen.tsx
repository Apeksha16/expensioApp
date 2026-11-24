import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { OTP_RESEND_SECONDS } from '../../data/config';
import { countryCodes } from '../../data/mock';
import { sendEmailOtp, sendOtp, verifyEmailOtp, verifyOtp } from '../../services/authApi';
import { maskEmail, maskPhone } from '../../utils/format';

export function OtpScreen() {
  const { verificationChannel } = useApp();
  return verificationChannel === 'email' ? <EmailOtpScreen /> : <PhoneOtpScreen />;
}

// ---------------------------------------------------------
// Smooth 1-by-1 Animated OTP Input
// ---------------------------------------------------------

interface SmoothOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
  inputRef?: React.RefObject<React.ElementRef<typeof TextInput> | null>;
}

function SmoothOtpDigit({ char }: { char: string }) {
  const scaleAnim = useRef(new Animated.Value(char ? 1 : 0.3)).current;
  const opacityAnim = useRef(new Animated.Value(char ? 1 : 0)).current;

  useEffect(() => {
    if (char) {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 260,
          friction: 14,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 130,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
    }
  }, [char, scaleAnim, opacityAnim]);

  if (!char) return null;
  return (
    <Animated.Text
      style={[
        otpInputStyles.digit,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {char}
    </Animated.Text>
  );
}

function SmoothOtpSlotItem({
  digit,
  isFilled,
}: {
  digit: string;
  isFilled: boolean;
}) {
  const fillAnim = useRef(new Animated.Value(isFilled ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: isFilled ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [isFilled, fillAnim]);

  return (
    <View style={otpInputStyles.slot}>
      <SmoothOtpDigit char={digit} />
      {/* Inactive base underline */}
      <View style={otpInputStyles.baseUnderline} />
      {/* Animated filled dark green underline */}
      <Animated.View
        style={[
          otpInputStyles.filledUnderline,
          { opacity: fillAnim },
        ]}
      />
    </View>
  );
}

function SmoothOtpInput({
  value,
  onChange,
  onComplete,
  autoFocus = true,
  inputRef: externalRef,
}: SmoothOtpInputProps) {
  const localRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const inputRef = externalRef || localRef;
  const [rowWidth, setRowWidth] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const slideAnim = useRef(new Animated.Value(Math.min(value.length, 5))).current;
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const targetSlot = Math.min(value.length, 5);
    Animated.spring(slideAnim, {
      toValue: targetSlot,
      tension: 220,
      friction: 18,
      useNativeDriver: true,
    }).start();
  }, [value.length, slideAnim]);

  useEffect(() => {
    if (!isFocused) {
      cursorOpacity.setValue(0);
      return;
    }
    cursorOpacity.setValue(1);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 480, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [isFocused, cursorOpacity]);

  const slotGap = 10;
  const totalSlots = 6;
  const slotWidth = rowWidth > 0 ? (rowWidth - (totalSlots - 1) * slotGap) / totalSlots : 0;
  const step = slotWidth + slotGap;

  return (
    <Pressable
      accessibilityLabel="Enter 6-digit verification code"
      onPress={() => inputRef.current?.focus()}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setRowWidth(w);
      }}
      style={otpInputStyles.slotsRow}
    >
      {Array.from({ length: 6 }, (_, index) => {
        const digit = value[index] ?? '';
        return (
          <SmoothOtpSlotItem
            key={index}
            digit={digit}
            isFilled={Boolean(digit)}
          />
        );
      })}

      {/* Smoothly gliding active indicator moving 1 by 1 across boxes */}
      {rowWidth > 0 && isFocused && value.length < 6 && (
        <Animated.View
          pointerEvents="none"
          style={[
            otpInputStyles.glider,
            {
              width: slotWidth,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1, 2, 3, 4, 5],
                    outputRange: [0, step, step * 2, step * 3, step * 4, step * 5],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Centered blinking vertical cursor */}
          <Animated.View style={[otpInputStyles.gliderCursor, { opacity: cursorOpacity }]} />
          {/* Active bottom underline that glides with the focus */}
          <View style={otpInputStyles.gliderBar} />
        </Animated.View>
      )}

      <TextInput
        ref={inputRef}
        autoFocus={autoFocus}
        accessibilityLabel="Verification code"
        value={value}
        onChangeText={(text) => {
          const cleaned = text.replace(/\D/g, '').slice(0, 6);
          onChange(cleaned);
          if (cleaned.length === 6) {
            onComplete?.(cleaned);
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        caretHidden
        style={otpInputStyles.hiddenInput}
      />
    </Pressable>
  );
}

// ---------------------------------------------------------
// Phone OTP Screen
// ---------------------------------------------------------

function PhoneOtpScreen() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const insets = useSafeAreaInsets();
  const {
    phone,
    countryCode,
    setAuthPhase,
    applyAuthSession,
    verificationTarget,
  } = useApp();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(OTP_RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const countryIso = countryCodes.find((item) => item.dial === countryCode)?.code;
  const isVerifyingRef = useRef(false);

  const verify = (value = otp) => {
    if (loading || isVerifyingRef.current) return;
    if (value.length < 6) {
      setError('Enter the 6-digit code');
      return;
    }

    isVerifyingRef.current = true;
    setLoading(true);
    void verifyOtp(phone, value, countryIso)
      .then(async (response) => {
        await applyAuthSession(response);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to verify code. Please check and try again.');
      })
      .finally(() => {
        setLoading(false);
        isVerifyingRef.current = false;
      });
  };

  const resend = async () => {
    if (resending || seconds > 0) return;
    setResending(true);
    setError('');
    try {
      const rawPhone = (phone || verificationTarget || '').trim();
      const activePhone = rawPhone.replace(/\D/g, '');
      const response = await sendOtp(activePhone || rawPhone, countryIso);
      setSeconds(response.resendCooldownSeconds || OTP_RESEND_SECONDS);
      setOtp('');
    } catch (requestError) {
      const errorMsg = requestError instanceof Error ? requestError.message : '';
      const match = errorMsg.match(/wait\s+(\d+)\s+seconds/i);
      if (match && match[1]) {
        setSeconds(parseInt(match[1], 10));
      } else {
        setError(errorMsg || 'Unable to resend verification code. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  const target = maskPhone(countryCode, phone);

  if (!fontsLoaded) {
    return <View style={mobileOtpStyles.fontLoading}><ActivityIndicator color="#2E7D52" /></View>;
  }

  return (
    <KeyboardAvoidingView
      style={mobileOtpStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={mobileOtpStyles.screen}>
        <View pointerEvents="none" style={mobileOtpStyles.decoration}>
          <View style={mobileOtpStyles.outerRing} />
          <View style={mobileOtpStyles.middleRing} />
          <View style={mobileOtpStyles.innerDisc} />
        </View>
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            mobileOtpStyles.container,
            { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 28) },
          ]}
        >
          <View style={mobileOtpStyles.header}>
            <Pressable
              accessibilityLabel="Change mobile number"
              onPress={() => setAuthPhase('mobile')}
              style={mobileOtpStyles.backButton}
            >
              <Ionicons name="chevron-back" size={22} color="#F3F1E7" />
            </Pressable>
            <View accessibilityLabel="Step 2 of 2" style={mobileOtpStyles.progress} accessible>
              <View style={mobileOtpStyles.progressPill} />
              <View style={mobileOtpStyles.progressPill} />
            </View>
            <View style={mobileOtpStyles.headerSpacer} />
          </View>
          <View style={mobileOtpStyles.hero}>
            <View style={mobileOtpStyles.keyTile}>
              <Ionicons name="key-outline" size={25} color="#38A169" />
            </View>
            <Text style={mobileOtpStyles.title}>
              Verify your{'\n'}
              <Text style={mobileOtpStyles.titleAccent}>number</Text>
            </Text>
            <Text style={mobileOtpStyles.subtitle}>Enter the 6-digit code we texted to</Text>
            <Pressable
              accessibilityLabel="Edit mobile number"
              onPress={() => setAuthPhase('mobile')}
              style={mobileOtpStyles.contactChip}
            >
              <Text style={mobileOtpStyles.target}>{target}</Text>
              <View style={mobileOtpStyles.editButton}>
                <Ionicons name="pencil" size={14} color="#38A169" />
              </View>
            </Pressable>
          </View>
          <View style={mobileOtpStyles.trustNote}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#6E8577" />
            <Text style={mobileOtpStyles.trustText}>
              This code only confirms it's you. We never ask for it by phone or email.
            </Text>
          </View>
          <View style={mobileOtpStyles.spacer} />
          <View style={mobileOtpStyles.codeCard}>
            <Text style={mobileOtpStyles.codeLabel}>VERIFICATION CODE</Text>
            <SmoothOtpInput
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (error) setError('');
              }}
              onComplete={(code) => {
                if (!loading) verify(code);
              }}
              inputRef={inputRef}
            />
            {error ? <Text accessibilityRole="alert" style={mobileOtpStyles.error}>{error}</Text> : null}
            <View style={mobileOtpStyles.resendRow}>
              {seconds > 0 ? (
                <Text style={mobileOtpStyles.resendMuted}>
                  Resend code in <Text style={mobileOtpStyles.seconds}>{seconds}s</Text>
                </Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Resend verification code"
                  onPress={() => void resend()}
                  disabled={resending}
                  style={mobileOtpStyles.resendButton}
                >
                  <Text style={mobileOtpStyles.resendLink}>{resending ? 'Sending…' : 'Resend code'}</Text>
                </Pressable>
              )}
            </View>
          </View>
          <Pressable
            style={[
              mobileOtpStyles.verifyButton,
              otp.length === 6 && mobileOtpStyles.verifyEnabled,
            ]}
            accessibilityLabel="Verify and continue"
            accessibilityRole="button"
            accessibilityState={{ disabled: otp.length < 6 || loading, busy: loading }}
            onPress={() => verify()}
            disabled={otp.length < 6 || loading}
          >
            {loading ? <ActivityIndicator color={otp.length === 6 ? '#0B2B1F' : '#8FA698'} /> : (
              <Text style={[
                mobileOtpStyles.verifyLabel,
                otp.length !== 6 && mobileOtpStyles.verifyLabelDisabled,
              ]}>Verify &amp; Continue</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------
// Email OTP Screen
// ---------------------------------------------------------

function EmailOtpScreen() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const insets = useSafeAreaInsets();
  const { verificationTarget, verificationReturnPhase, setAuthPhase, applyAuthSession } = useApp();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(OTP_RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const isVerifyingRef = useRef(false);

  const verify = async (value = otp) => {
    if (loading || isVerifyingRef.current) return;
    if (value.length !== 6) {
      setError('Enter the complete 6-digit code');
      return;
    }
    isVerifyingRef.current = true;
    setLoading(true);
    setError('');
    try {
      const response = await verifyEmailOtp(verificationTarget, value);
      await applyAuthSession(response);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : '';
      setOtp('');
      setError(/invalid/i.test(message)
        ? "That code didn't match. Try again."
        : message || 'Unable to verify code. Try again.');
    } finally {
      setLoading(false);
      isVerifyingRef.current = false;
      inputRef.current?.focus();
    }
  };

  const resend = async () => {
    if (resending || seconds > 0) return;
    setResending(true);
    setError('');
    try {
      const response = await sendEmailOtp(verificationTarget);
      if (response.debugOtp) {
        Alert.alert('Development OTP', `Use ${response.debugOtp} to verify your email.`);
      }
      setSeconds(OTP_RESEND_SECONDS);
      setOtp('');
    } catch (requestError) {
      const errorMsg = requestError instanceof Error ? requestError.message : '';
      const match = errorMsg.match(/wait\s+(\d+)\s+seconds/i);
      if (match && match[1]) {
        setSeconds(parseInt(match[1], 10));
      } else {
        setError(errorMsg || 'Unable to resend code.');
      }
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = maskEmail(verificationTarget);

  if (!fontsLoaded) {
    return (
      <View style={emailStyles.fontLoading}>
        <ActivityIndicator color="#2E7D52" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={emailStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={emailStyles.screen}>
        <View pointerEvents="none" style={emailStyles.decoration}>
          <View style={emailStyles.outerRing} />
          <View style={emailStyles.middleRing} />
          <View style={emailStyles.innerDisc} />
        </View>
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            emailStyles.container,
            { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 28) },
          ]}
        >
          <View style={emailStyles.header}>
            <Pressable
              accessibilityLabel="Back to email login"
              onPress={() => setAuthPhase(verificationReturnPhase)}
              style={emailStyles.backButton}
            >
              <Ionicons name="chevron-back" size={22} color="#F3F1E7" />
            </Pressable>
            <View accessibilityLabel="Step 2 of 2" style={emailStyles.progress} accessible>
              <View style={emailStyles.progressPill} />
              <View style={emailStyles.progressPill} />
            </View>
            <View style={emailStyles.headerSpacer} />
          </View>

          <View style={emailStyles.hero}>
            <View style={emailStyles.mailBadge}>
              <Ionicons name="mail-outline" size={24} color="#38A169" />
            </View>
            <Text style={emailStyles.title}>
              Check your{'\n'}
              <Text style={emailStyles.titleAccent}>email</Text>
            </Text>
            <Text style={emailStyles.subtitle}>Enter the 6-digit code we sent to</Text>
            <View style={emailStyles.emailChip}>
              <Text style={emailStyles.emailText}>{maskedEmail}</Text>
              <Pressable
                accessibilityLabel="Edit email address"
                onPress={() => setAuthPhase(verificationReturnPhase)}
                style={emailStyles.editButton}
              >
                <Ionicons name="pencil" size={14} color="#38A169" />
              </Pressable>
            </View>
          </View>

          <View style={emailStyles.trustNote}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#6E8577" />
            <Text style={emailStyles.trustText}>
              This code only confirms it's you. We never ask for it by phone or email.
            </Text>
          </View>

          <View style={emailStyles.spacer} />

          <View style={emailStyles.codeCard}>
            <Text style={emailStyles.codeLabel}>VERIFICATION CODE</Text>
            <SmoothOtpInput
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (error) setError('');
              }}
              onComplete={(code) => {
                if (!loading) verify(code);
              }}
              inputRef={inputRef}
            />
            {error ? <Text accessibilityRole="alert" style={emailStyles.error}>{error}</Text> : null}
            <Text style={emailStyles.helper}>Can't find it? Check your spam or promotions folder.</Text>
            <View style={emailStyles.resendRow}>
              {seconds > 0 ? (
                <Text style={emailStyles.resendMuted}>
                  Resend code in <Text style={emailStyles.seconds}>{seconds}s</Text>
                </Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Resend verification code"
                  onPress={() => void resend()}
                  disabled={resending}
                  style={emailStyles.resendButton}
                >
                  <Text style={emailStyles.resendLink}>{resending ? 'Sending…' : 'Resend code'}</Text>
                </Pressable>
              )}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Verify and continue"
            accessibilityState={{ disabled: otp.length !== 6 || loading, busy: loading }}
            onPress={() => void verify()}
            disabled={otp.length !== 6 || loading}
            style={[emailStyles.verifyButton, otp.length === 6 && emailStyles.verifyEnabled]}
          >
            {loading ? (
              <ActivityIndicator color={otp.length === 6 ? '#0B2B1F' : '#8FA698'} />
            ) : (
              <Text style={[emailStyles.verifyText, otp.length !== 6 && emailStyles.verifyTextDisabled]}>Verify &amp; Continue</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------
// Styles
// ---------------------------------------------------------

const otpInputStyles = StyleSheet.create({
  slotsRow: {
    position: 'relative',
    flexDirection: 'row',
    gap: 10,
    height: 52,
    alignItems: 'stretch',
  },
  slot: {
    flex: 1,
    minWidth: 0,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  baseUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D7DBC9',
  },
  filledUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#0B2B1F',
  },
  glider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gliderCursor: {
    width: 2,
    height: 24,
    borderRadius: 1,
    backgroundColor: '#0B2B1F',
  },
  gliderBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#0B2B1F',
  },
  digit: {
    color: '#0B2B1F',
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    color: 'transparent',
  },
});

const mobileOtpStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B2B1F' },
  fontLoading: { flex: 1, backgroundColor: '#0B2B1F', alignItems: 'center', justifyContent: 'center' },
  container: { flexGrow: 1, paddingHorizontal: 20 },
  decoration: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  outerRing: {
    position: 'absolute',
    width: 416,
    height: 416,
    borderRadius: 208,
    borderWidth: 1.5,
    borderColor: 'rgba(46,125,82,0.18)',
    top: 120,
    right: -208,
  },
  middleRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1.5,
    borderColor: 'rgba(46,125,82,0.14)',
    top: 178,
    right: -150,
  },
  innerDisc: {
    position: 'absolute',
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: 'rgba(46,125,82,0.08)',
    top: 236,
    right: -92,
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#2B5644',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 44, height: 44 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressPill: { width: 22, height: 4, borderRadius: 2, backgroundColor: '#2E7D52' },
  hero: { marginTop: 28, paddingHorizontal: 4, gap: 16 },
  keyTile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2B5644',
    backgroundColor: 'rgba(46,125,82,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#F3F1E7',
    fontSize: 38,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -1.4,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  titleAccent: { color: '#38A169' },
  subtitle: {
    color: '#B7C9BC',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  contactChip: {
    height: 36,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2B5644',
    backgroundColor: 'rgba(243,241,231,0.08)',
  },
  target: { color: '#F3F1E7', fontSize: 15, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46,125,82,0.18)',
  },
  trustNote: {
    marginTop: 26,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trustText: { flex: 1, color: '#6E8577', fontSize: 13, lineHeight: 18, fontFamily: 'PlusJakartaSans_400Regular' },
  spacer: { flex: 1, minHeight: 20 },
  codeCard: {
    backgroundColor: '#F3F1E7',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 10,
    gap: 14,
  },
  codeLabel: {
    color: '#4B5A50',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  error: { color: '#B3261E', fontSize: 13, lineHeight: 18, fontFamily: 'PlusJakartaSans_400Regular' },
  resendRow: { minHeight: 36, justifyContent: 'center' },
  resendMuted: { color: '#4B5A50', fontSize: 14, fontWeight: '500', fontFamily: 'PlusJakartaSans_500Medium' },
  seconds: { color: '#0B2B1F', fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  resendButton: { minHeight: 36, justifyContent: 'center', alignSelf: 'flex-start' },
  resendLink: {
    color: '#0B2B1F',
    fontSize: 14,
    fontWeight: '800',
    textDecorationLine: 'underline',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  verifyButton: {
    height: 60,
    marginTop: 16,
    borderRadius: 30,
    backgroundColor: '#1E4132',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  verifyEnabled: { backgroundColor: '#C8F169' },
  verifyLabel: { color: '#0B2B1F', fontSize: 17, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  verifyLabelDisabled: { color: '#8FA698' },
});

const emailStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B2B1F' },
  fontLoading: { flex: 1, backgroundColor: '#0B2B1F', alignItems: 'center', justifyContent: 'center' },
  container: { flexGrow: 1, paddingHorizontal: 20 },
  decoration: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  outerRing: {
    position: 'absolute',
    width: 416,
    height: 416,
    borderRadius: 208,
    borderWidth: 1.5,
    borderColor: 'rgba(46,125,82,0.18)',
    top: 120,
    right: -208,
  },
  middleRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1.5,
    borderColor: 'rgba(46,125,82,0.14)',
    top: 178,
    right: -150,
  },
  innerDisc: {
    position: 'absolute',
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: 'rgba(46,125,82,0.08)',
    top: 236,
    right: -92,
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#2B5644',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 44, height: 44 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressPill: { width: 22, height: 4, borderRadius: 2, backgroundColor: '#2E7D52' },
  hero: { marginTop: 28, paddingHorizontal: 4, gap: 16 },
  mailBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2B5644',
    backgroundColor: 'rgba(46,125,82,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#F3F1E7',
    fontSize: 38,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -1.4,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  titleAccent: { color: '#38A169' },
  subtitle: { color: '#B7C9BC', fontSize: 16, lineHeight: 24, fontWeight: '500', fontFamily: 'PlusJakartaSans_500Medium' },
  emailChip: {
    height: 36,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2B5644',
    backgroundColor: 'rgba(243,241,231,0.08)',
  },
  emailText: { color: '#F3F1E7', fontSize: 15, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46,125,82,0.18)',
  },
  trustNote: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  trustText: { flex: 1, color: '#6E8577', fontSize: 13, lineHeight: 18, fontFamily: 'PlusJakartaSans_400Regular' },
  spacer: { flex: 1, minHeight: 20 },
  codeCard: {
    backgroundColor: '#F3F1E7',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 10,
    gap: 14,
  },
  codeLabel: {
    color: '#4B5A50',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  error: { color: '#B3261E', fontSize: 13, lineHeight: 18, marginTop: -4, fontFamily: 'PlusJakartaSans_400Regular' },
  resendRow: { minHeight: 36, justifyContent: 'center' },
  resendMuted: { color: '#4B5A50', fontSize: 14, fontWeight: '500', fontFamily: 'PlusJakartaSans_500Medium' },
  seconds: { color: '#0B2B1F', fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  resendButton: { minHeight: 36, justifyContent: 'center', alignSelf: 'flex-start' },
  resendLink: {
    color: '#0B2B1F',
    fontSize: 14,
    fontWeight: '800',
    textDecorationLine: 'underline',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  verifyButton: {
    height: 60,
    marginTop: 16,
    borderRadius: 30,
    backgroundColor: '#1E4132',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  verifyEnabled: { backgroundColor: '#C8F169' },
  verifyText: { color: '#0B2B1F', fontSize: 17, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  verifyTextDisabled: { color: '#8FA698' },
  helper: { color: '#4B5A50', fontSize: 12.5, lineHeight: 18, fontFamily: 'PlusJakartaSans_400Regular' },
});

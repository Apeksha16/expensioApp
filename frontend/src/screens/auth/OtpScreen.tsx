import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
  Alert,
  ActivityIndicator,
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
import { OtpInput } from '../../components/OtpInput';
import { useApp } from '../../context/AppContext';
import { OTP_RESEND_SECONDS } from '../../data/config';
import { sendEmailOtp, sendOtp, verifyEmailOtp, verifyOtp } from '../../services/authApi';
import { maskEmail, maskPhone } from '../../utils/format';

export function OtpScreen() {
  const { verificationChannel } = useApp();
  return verificationChannel === 'email' ? <EmailOtpScreen /> : <PhoneOtpScreen />;
}

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
  } = useApp();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(OTP_RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [cursorOpacity]);

  const verify = (value = otp) => {
    if (loading) return;
    if (value.length < 6) {
      setError('Enter the 6-digit code');
      return;
    }

    setLoading(true);
    void verifyOtp(phone, value)
      .then(async (response) => {
        await applyAuthSession(response);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to verify OTP');
      })
      .finally(() => setLoading(false));
  };

  const resend = async () => {
    if (resending || seconds > 0) return;
    setResending(true);
    setError('');
    try {
      const response = await sendOtp(phone);
      if (response.debugOtp) {
        Alert.alert('Development OTP', `Use ${response.debugOtp} to verify your number.`);
      }
      setSeconds(OTP_RESEND_SECONDS);
      setOtp('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to resend code');
    } finally {
      setResending(false);
    }
  };

  const target = maskPhone(countryCode, phone);

  if (!fontsLoaded) {
    return <View style={mobileOtpStyles.fontLoading}><ActivityIndicator color="#C8F169" /></View>;
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
              <Ionicons name="key-outline" size={25} color="#C8F169" />
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
                <Ionicons name="pencil" size={14} color="#C8F169" />
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
            <Pressable
              accessibilityLabel="Enter 6-digit verification code"
              onPress={() => inputRef.current?.focus()}
              style={mobileOtpStyles.slotsRow}
            >
              {Array.from({ length: 6 }, (_, index) => {
                const digit = otp[index] ?? '';
                const isCurrent = index === Math.min(otp.length, 5) && !digit;
                return (
                  <View
                    key={index}
                    style={[
                      mobileOtpStyles.slot,
                      digit ? mobileOtpStyles.slotFilled : null,
                      isCurrent ? mobileOtpStyles.slotFocused : null,
                    ]}
                  >
                    {digit ? <Text style={mobileOtpStyles.digit}>{digit}</Text> : null}
                    {isCurrent ? <Animated.View style={[mobileOtpStyles.cursor, { opacity: cursorOpacity }]} /> : null}
                  </View>
                );
              })}
              <TextInput
                ref={inputRef}
                accessibilityLabel="Verification code"
                value={otp}
                onChangeText={(value) => {
                  const cleaned = value.replace(/\D/g, '').slice(0, 6);
                  setOtp(cleaned);
                  if (error) setError('');
                  if (cleaned.length === 6 && !loading) verify(cleaned);
                }}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={6}
                caretHidden
                style={mobileOtpStyles.hiddenInput}
              />
            </Pressable>
            {error ? <Text accessibilityRole="alert" style={mobileOtpStyles.error}>{error}</Text> : null}
            <View style={mobileOtpStyles.resendRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={seconds > 0 ? `Resend code in ${seconds} seconds` : 'Resend code'}
                accessibilityState={{ disabled: seconds > 0 || resending }}
                onPress={() => void resend()}
                disabled={seconds > 0 || resending}
                style={mobileOtpStyles.resendButton}
              >
                <Text style={mobileOtpStyles.resend}>{resending ? 'Sending…' : 'Resend code'}</Text>
              </Pressable>
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
              <>
                <Text style={[
                  mobileOtpStyles.verifyLabel,
                  otp.length !== 6 && mobileOtpStyles.verifyLabelDisabled,
                ]}>Verify &amp; Continue</Text>
                <Ionicons name="arrow-forward" size={20} color={otp.length === 6 ? '#0B2B1F' : '#8FA698'} />
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

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
  const [seconds, setSeconds] = useState(30);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!focused) {
      cursorOpacity.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [cursorOpacity, focused]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const verify = async () => {
    if (loading || otp.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const response = await verifyEmailOtp(verificationTarget, otp);
      await applyAuthSession(response);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : '';
      setOtp('');
      setError(/invalid|expired/i.test(message)
        ? "That code didn't match. Try again."
        : message || 'Unable to verify code. Try again.');
    } finally {
      setLoading(false);
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
      setSeconds(30);
      setOtp('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to resend code.');
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = maskEmail(verificationTarget);
  const activeSlot = Math.min(otp.length, 5);

  if (!fontsLoaded) {
    return (
      <View style={emailStyles.fontLoading}>
        <ActivityIndicator color="#C8F169" />
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
              <Ionicons name="mail-outline" size={24} color="#C8F169" />
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
                <Ionicons name="pencil" size={14} color="#C8F169" />
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
            <Pressable
              accessibilityLabel="Enter 6-digit verification code"
              onPress={() => inputRef.current?.focus()}
              style={emailStyles.slotsRow}
            >
              {Array.from({ length: 6 }, (_, index) => {
                const digit = otp[index] ?? '';
                const isCurrent = focused && index === activeSlot && !digit;
                return (
                  <View
                    key={index}
                    style={[
                      emailStyles.slot,
                      digit ? emailStyles.slotFilled : null,
                      isCurrent ? emailStyles.slotFocused : null,
                    ]}
                  >
                    {digit ? <Text style={emailStyles.digit}>{digit}</Text> : null}
                    {isCurrent ? <Animated.View style={[emailStyles.cursor, { opacity: cursorOpacity }]} /> : null}
                  </View>
                );
              })}
              <TextInput
                ref={inputRef}
                accessibilityLabel="Verification code"
                value={otp}
                onChangeText={(value) => {
                  setOtp(value.replace(/\D/g, '').slice(0, 6));
                  if (error) setError('');
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={6}
                style={emailStyles.hiddenInput}
                caretHidden
              />
            </Pressable>
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
              <>
                <Text style={[emailStyles.verifyText, otp.length !== 6 && emailStyles.verifyTextDisabled]}>Verify &amp; Continue</Text>
                <ActivityIndicator size="small" color={otp.length === 6 ? '#0B2B1F' : '#8FA698'} />
              </>
            ) : (
              <>
                <Text style={[emailStyles.verifyText, otp.length !== 6 && emailStyles.verifyTextDisabled]}>Verify &amp; Continue</Text>
                <Ionicons name="arrow-forward" size={20} color={otp.length === 6 ? '#0B2B1F' : '#8FA698'} />
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B2B1F' },
  container: { flexGrow: 1, paddingHorizontal: 20 },
  decoration: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  outerRing: {
    position: 'absolute',
    width: 416,
    height: 416,
    borderRadius: 208,
    borderWidth: 1.5,
    borderColor: 'rgba(200,241,105,0.16)',
    top: 210,
    right: -208,
  },
  middleRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1.5,
    borderColor: 'rgba(200,241,105,0.12)',
    top: 268,
    right: -150,
  },
  innerDisc: {
    position: 'absolute',
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: 'rgba(200,241,105,0.07)',
    top: 326,
    right: -92,
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2B5644',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 40, height: 40 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#C8F169',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: '#0B2B1F', fontSize: 17, fontWeight: '800' },
  brandText: { color: '#F3F1E7', fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  hero: { marginTop: 36, paddingHorizontal: 4 },
  keyTile: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: 'rgba(200,241,105,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(200,241,105,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    color: '#F3F1E7',
    fontSize: 40,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  titleAccent: { color: '#C8F169' },
  subtitle: { color: '#B7C9BC', fontSize: 15, lineHeight: 22, marginTop: 14 },
  target: { color: '#F3F1E7', fontWeight: '700' },
  changeButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 11 },
  changeArrow: { color: '#C8F169', fontSize: 19 },
  changeText: {
    color: '#C8F169',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  spacer: { flex: 1, minHeight: 28 },
  codeCard: {
    backgroundColor: '#F3F1E7',
    borderRadius: 24,
    padding: 16,
    minHeight: 158,
  },
  codeLabel: { color: '#0B2B1F', fontSize: 13, fontWeight: '700', marginBottom: 11 },
  codeCell: {
    height: 54,
    borderRadius: 12,
    borderColor: '#CBD2C2',
    backgroundColor: '#FFFFFF',
    fontSize: 24,
    color: '#0B2B1F',
  },
  error: { color: '#B3261E', fontSize: 12, marginTop: 8 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  resendMuted: { color: '#4B5A50', fontSize: 12 },
  resendTimer: { color: '#0B2B1F', fontWeight: '700' },
  resend: { color: '#0B2B1F', fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  hint: { color: '#4B5A50', fontSize: 12 },
  verifyButton: {
    height: 54,
    marginTop: 14,
    borderRadius: 27,
    backgroundColor: '#1E4132',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  verifyReady: { backgroundColor: '#C8F169' },
  verifyLabel: { color: '#8FA698', fontSize: 16, fontWeight: '800' },
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
    borderColor: 'rgba(200,241,105,0.16)',
    top: 120,
    right: -208,
  },
  middleRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1.5,
    borderColor: 'rgba(200,241,105,0.12)',
    top: 178,
    right: -150,
  },
  innerDisc: {
    position: 'absolute',
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: 'rgba(200,241,105,0.07)',
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
  progressPill: { width: 22, height: 4, borderRadius: 2, backgroundColor: '#C8F169' },
  hero: { marginTop: 28, paddingHorizontal: 4, gap: 16 },
  mailBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2B5644',
    backgroundColor: 'rgba(200,241,105,0.1)',
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
  titleAccent: { color: '#C8F169' },
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
    backgroundColor: 'rgba(200,241,105,0.14)',
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
    borderBottomWidth: 3,
    borderBottomColor: '#D7DBC9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFocused: { borderBottomColor: '#0B2B1F' },
  slotFilled: { borderBottomColor: '#C8F169' },
  digit: { color: '#0B2B1F', fontSize: 25, fontWeight: '800', textAlign: 'center', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  cursor: { width: 2, height: 24, backgroundColor: '#0B2B1F' },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    left: 0,
    top: 0,
  },
  helper: { color: '#4B5A50', fontSize: 12.5, lineHeight: 18, fontFamily: 'PlusJakartaSans_400Regular' },
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
    borderColor: 'rgba(200,241,105,0.16)',
    top: 120,
    right: -208,
  },
  middleRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1.5,
    borderColor: 'rgba(200,241,105,0.12)',
    top: 178,
    right: -150,
  },
  innerDisc: {
    position: 'absolute',
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: 'rgba(200,241,105,0.07)',
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
  progressPill: { width: 22, height: 4, borderRadius: 2, backgroundColor: '#C8F169' },
  hero: { marginTop: 28, paddingHorizontal: 4, gap: 16 },
  keyTile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2B5644',
    backgroundColor: 'rgba(200,241,105,0.1)',
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
  titleAccent: { color: '#C8F169' },
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
    backgroundColor: 'rgba(200,241,105,0.14)',
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
    borderBottomWidth: 3,
    borderBottomColor: '#D7DBC9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFocused: { borderBottomColor: '#0B2B1F' },
  slotFilled: { borderBottomColor: '#C8F169' },
  digit: { color: '#0B2B1F', fontSize: 25, fontWeight: '800', textAlign: 'center', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  cursor: { width: 2, height: 24, backgroundColor: '#0B2B1F' },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0, left: 0, top: 0 },
  error: { color: '#B3261E', fontSize: 13, lineHeight: 18, fontFamily: 'PlusJakartaSans_400Regular' },
  resendRow: { minHeight: 36, justifyContent: 'center' },
  resendButton: { minHeight: 36, justifyContent: 'center', alignSelf: 'flex-start' },
  resend: {
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

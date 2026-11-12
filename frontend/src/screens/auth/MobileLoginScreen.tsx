import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { DEFAULT_COUNTRY_DIAL } from '../../data/config';
import { countryCodes } from '../../data/mock';
import { sendEmailOtp, sendOtp } from '../../services/authApi';
import { isValidIndianMobile } from '../../utils/validation';

type Mode = 'mobile' | 'email';

function IndiaFlag() {
  return (
    <View style={styles.flag}>
      <View style={styles.flagSaffron} />
      <View style={styles.flagWhite}><View style={styles.flagWheel} /></View>
      <View style={styles.flagGreen} />
    </View>
  );
}

export function MobileLoginScreen() {
  const insets = useSafeAreaInsets();
  const {
    setAuthPhase,
    setPhoneCredentials,
    setVerification,
    verificationChannel,
    verificationTarget,
  } = useApp();
  const [mode, setMode] = useState<Mode>(verificationChannel === 'email' ? 'email' : 'mobile');
  const [dial, setDial] = useState(DEFAULT_COUNTRY_DIAL);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(verificationChannel === 'email' ? verificationTarget : '');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const selected = countryCodes.find((item) => item.dial === dial) ?? countryCodes[0];
  const phoneDigits = phone.replace(/\D/g, '');
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isReady = mode === 'mobile'
    ? (dial === '+91' ? isValidIndianMobile(phoneDigits, dial) : /^\d{8,15}$/.test(phoneDigits))
    : validEmail;

  const switchMode = (nextMode: Mode) => {
    if (loading || nextMode === mode) return;
    setMode(nextMode);
    setError('');
    setFocused(false);
  };

  const onPhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, dial === '+91' ? 10 : 15);
    setPhone(digits);
    if (error) setError('');
  };

  const onEmailChange = (value: string) => {
    setEmail(value);
    if (error) setError('');
  };

  const onInputChange = (value: string) => {
    if (mode === 'mobile') {
      onPhoneChange(value);
    } else {
      onEmailChange(value);
    }
  };

  const submit = async () => {
    if (loading) return;
    if (!isReady) {
      setError(mode === 'mobile'
        ? dial === '+91' ? 'Enter a valid 10-digit number' : 'Enter a valid mobile number'
        : 'Enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (mode === 'mobile') {
        const cleanPhone = phone.replace(/\D/g, '');
        const response = await sendOtp(cleanPhone);
        if (response.debugOtp) {
          Alert.alert('Development OTP', `Use ${response.debugOtp} to verify your number.`);
        }
        setPhoneCredentials(dial, cleanPhone);
        setVerification('phone', cleanPhone);
      } else {
        const target = email.trim().toLowerCase();
        const response = await sendEmailOtp(target);
        if (response.debugOtp) {
          Alert.alert('Development OTP', `Use ${response.debugOtp} to verify your email.`);
        }
        setVerification('email', target);
      }
      setAuthPhase('otp');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.decoration}>
          <View style={styles.outerRing} />
          <View style={styles.middleRing} />
          <View style={styles.innerDisc} />
        </View>

        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 28) },
          ]}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Back"
              onPress={() => setAuthPhase('login')}
              hitSlop={8}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={22} color="#F3F1E7" />
            </Pressable>
            <View style={styles.brand}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>e</Text></View>
              <Text style={styles.brandText}>expensio</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.hero}>
            <View style={styles.eyebrow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrowText}>WELCOME BACK</Text>
            </View>
            <Text style={styles.headline}>
              Your money,{'\n'}
              <Text style={styles.headlineAccent}>made simpler.</Text>
            </Text>
            <Text style={styles.subtitle}>Log in with a one-time code. No password to remember.</Text>
          </View>

          <View style={styles.spacer} />

          <View style={styles.formCard}>
            <View accessibilityLabel="Login method" accessibilityRole="tablist" style={styles.toggle}>
              {(['mobile', 'email'] as const).map((item) => (
                <Pressable
                  key={item}
                  accessibilityLabel={`Use ${item} login`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mode === item }}
                  onPress={() => switchMode(item)}
                  style={[styles.toggleButton, mode === item && styles.toggleSelected]}
                >
                  <Text style={[styles.toggleText, mode === item && styles.toggleTextSelected]}>
                    {item === 'mobile' ? 'Mobile' : 'Email'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.formGroup}>
              <Text nativeID="login-field-label" style={styles.label}>
                {mode === 'mobile' ? 'Mobile number' : 'Email address'}
              </Text>
              <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
                {mode === 'mobile' ? (
                  <Pressable
                    accessibilityLabel="Select country"
                    onPress={() => setPickerOpen(true)}
                    style={styles.countrySection}
                  >
                    {dial === '+91' ? <IndiaFlag /> : <Text style={styles.countryEmoji}>{selected.flag}</Text>}
                    <Text style={styles.dial}>{dial}</Text>
                    <Ionicons name="chevron-down" size={16} color="#0B2B1F" />
                  </Pressable>
                ) : null}
                <TextInput
                  key={`${mode}-${dial}`}
                  accessibilityLabel={mode === 'mobile' ? 'Mobile number' : 'Email address'}
                  accessibilityLabelledBy="login-field-label"
                  {...(mode === 'mobile'
                    ? { defaultValue: phone.replace(/^(\d{5})(\d)/, '$1 $2') }
                    : { value: email })}
                  onChangeText={onInputChange}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onSubmitEditing={mode === 'email' ? submit : undefined}
                  keyboardType={mode === 'mobile' ? 'phone-pad' : 'email-address'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType={mode === 'email' ? 'done' : 'default'}
                  blurOnSubmit={false}
                  placeholder={mode === 'mobile' ? '98765 43210' : 'you@example.com'}
                  placeholderTextColor="#74837A"
                  style={styles.input}
                />
              </View>
              <Text style={styles.helper}>
                {mode === 'mobile'
                  ? "We'll text you a 6-digit code. Message rates may apply."
                  : "We'll email you a 6-digit code. No password needed."}
              </Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          </View>

          <Pressable
            accessibilityLabel="Send OTP"
            accessibilityRole="button"
            accessibilityState={{ disabled: !isReady || loading, busy: loading }}
            onPress={() => void submit()}
            disabled={!isReady || loading}
            style={[styles.sendButton, isReady ? styles.sendButtonReady : styles.sendButtonDisabled]}
          >
            {loading ? <ActivityIndicator color="#0B2B1F" /> : (
              <>
                <Text style={[styles.sendLabel, !isReady && styles.sendLabelDisabled]}>Send OTP</Text>
                <Ionicons name="arrow-forward" size={20} color={isReady ? '#0B2B1F' : '#8FA698'} />
              </>
            )}
          </Pressable>

          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text accessibilityRole="link" style={styles.termLink}>Terms</Text>
            {' '}and{' '}
            <Text accessibilityRole="link" style={styles.termLink}>Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </View>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setPickerOpen(false)}>
          <View style={styles.picker}>
            <View style={styles.handle} />
            <Text style={styles.pickerTitle}>Select country</Text>
            {countryCodes.map((item) => (
              <Pressable
                key={item.code}
                accessibilityLabel={`${item.name} ${item.dial}`}
                style={styles.pickerRow}
                onPress={() => {
                  setDial(item.dial);
                  setPhone('');
                  setPickerOpen(false);
                }}
              >
                <Text style={styles.countryEmoji}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.pickerDial}>{item.dial}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B2B1F' },
  content: { flexGrow: 1, paddingHorizontal: 20 },
  decoration: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  outerRing: {
    position: 'absolute',
    width: 416,
    height: 416,
    borderRadius: 208,
    borderWidth: 1.5,
    borderColor: 'rgba(200,241,105,0.16)',
    top: 150,
    right: -208,
  },
  middleRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1.5,
    borderColor: 'rgba(200,241,105,0.12)',
    top: 208,
    right: -150,
  },
  innerDisc: {
    position: 'absolute',
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: 'rgba(200,241,105,0.07)',
    top: 266,
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
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#C8F169',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: '#0B2B1F', fontSize: 20, fontWeight: '800' },
  brandText: { color: '#F3F1E7', fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  hero: { marginTop: 44, paddingHorizontal: 4, gap: 16 },
  eyebrow: {
    height: 30,
    alignSelf: 'flex-start',
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2B5644',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#C8F169' },
  eyebrowText: { color: '#C8F169', fontSize: 12, fontWeight: '700', letterSpacing: 1.8 },
  headline: {
    color: '#F3F1E7',
    fontSize: 46,
    lineHeight: 47,
    fontWeight: '800',
    letterSpacing: -1.8,
  },
  headlineAccent: { color: '#C8F169' },
  subtitle: { color: '#B7C9BC', fontSize: 16, lineHeight: 24, fontWeight: '500', maxWidth: 290 },
  spacer: { flex: 1, minHeight: 18 },
  formCard: {
    backgroundColor: '#F3F1E7',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(11,43,31,0.06)',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    gap: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  toggle: {
    height: 52,
    padding: 4,
    gap: 4,
    borderRadius: 24,
    backgroundColor: '#E4E7D9',
    flexDirection: 'row',
  },
  toggleButton: { flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  toggleSelected: { backgroundColor: '#0B2B1F' },
  toggleText: { color: '#3F5247', fontSize: 14, fontWeight: '700' },
  toggleTextSelected: { color: '#C8F169' },
  formGroup: { gap: 11 },
  label: { color: '#0B2B1F', fontSize: 15, fontWeight: '700' },
  inputRow: {
    height: 64,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#CBD2C2',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputRowFocused: {
    borderColor: '#0B2B1F',
    shadowColor: '#C8F169',
    shadowOpacity: 0.6,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  countrySection: {
    height: '100%',
    paddingHorizontal: 14,
    borderRightWidth: 1.5,
    borderRightColor: '#E0E4D6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flag: { width: 26, height: 26, borderRadius: 13, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(10,42,30,0.12)' },
  flagSaffron: { flex: 1, backgroundColor: '#FF9933' },
  flagWhite: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  flagGreen: { flex: 1, backgroundColor: '#138808' },
  flagWheel: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: '#123B77' },
  countryEmoji: { fontSize: 22 },
  dial: { color: '#0B2B1F', fontSize: 18, fontWeight: '700' },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingHorizontal: 16,
    color: '#0B2B1F',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  helper: { color: '#4B5A50', fontSize: 13, lineHeight: 19 },
  error: { color: '#B3261E', fontSize: 13, lineHeight: 19, marginTop: -4 },
  sendButton: {
    height: 60,
    marginTop: 16,
    borderRadius: 30,
    backgroundColor: '#C8F169',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sendButtonReady: {
    shadowColor: '#C8F169',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sendButtonDisabled: { backgroundColor: '#1E4132' },
  sendLabel: { color: '#0B2B1F', fontSize: 17, fontWeight: '800' },
  sendLabelDisabled: { color: '#8FA698' },
  terms: { color: '#9DB0A2', fontSize: 12.5, lineHeight: 18, textAlign: 'center', marginHorizontal: 12, marginTop: 14 },
  termLink: { color: '#F3F1E7', fontWeight: '700', textDecorationLine: 'underline' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  picker: { backgroundColor: '#F3F1E7', padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: '#B8B4A7', marginBottom: 20 },
  pickerTitle: { color: '#0B2B1F', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  countryName: { flex: 1, color: '#0B2B1F', fontSize: 16 },
  pickerDial: { color: '#4B5A50', fontSize: 16 },
});

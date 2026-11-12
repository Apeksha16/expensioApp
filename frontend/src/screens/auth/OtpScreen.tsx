import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OtpInput } from '../../components/OtpInput';
import { useApp } from '../../context/AppContext';
import { OTP_RESEND_SECONDS } from '../../data/config';
import { sendEmailOtp, sendOtp, verifyEmailOtp, verifyOtp } from '../../services/authApi';
import { maskEmail, maskPhone } from '../../utils/format';

export function OtpScreen() {
  const insets = useSafeAreaInsets();
  const {
    phone,
    countryCode,
    verificationChannel,
    verificationTarget,
    setAuthPhase,
    applyAuthSession,
    markVerified,
  } = useApp();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(OTP_RESEND_SECONDS);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const verify = (value = otp) => {
    if (loading) return;
    if (value.length < 6) {
      setError('Enter the 6-digit code');
      return;
    }

    setLoading(true);
    const request = verificationChannel === 'email'
      ? verifyEmailOtp(verificationTarget, value)
      : verifyOtp(phone, value);

    void request
      .then((response) => {
        markVerified(verificationChannel);
        if (verificationChannel === 'email') setAuthPhase('setup');
        else applyAuthSession(response);
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
      if (verificationChannel === 'email') await sendEmailOtp(verificationTarget);
      else await sendOtp(phone);
      setSeconds(OTP_RESEND_SECONDS);
      setOtp('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to resend code');
    } finally {
      setResending(false);
    }
  };

  const target = verificationChannel === 'email'
    ? maskEmail(verificationTarget)
    : maskPhone(countryCode, phone);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.decoration}>
          <View style={styles.outerRing} />
          <View style={styles.middleRing} />
          <View style={styles.innerDisc} />
        </View>

        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.container,
            { paddingTop: insets.top + 10, paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Go back"
              onPress={() => setAuthPhase('mobile')}
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
            <View style={styles.keyTile}>
              <Ionicons name="key-outline" size={25} color="#C8F169" />
            </View>
            <Text style={styles.title}>
              Verify your{'\n'}
              <Text style={styles.titleAccent}>{verificationChannel === 'email' ? 'email' : 'number'}</Text>
            </Text>
            <Text style={styles.subtitle}>
              Code sent to <Text style={styles.target}>{target}</Text>
            </Text>
            <Pressable
              accessibilityLabel={verificationChannel === 'email' ? 'Change email' : 'Change number'}
              onPress={() => setAuthPhase(verificationChannel === 'email' ? 'email' : 'mobile')}
              style={styles.changeButton}
            >
              <Text style={styles.changeArrow}>←</Text>
              <Text style={styles.changeText}>{verificationChannel === 'email' ? 'Change email' : 'Change number'}</Text>
            </Pressable>
          </View>

          <View style={styles.spacer} />

          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Enter the 6-digit code</Text>
            <OtpInput
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (error) setError('');
                if (value.length === 6 && !loading) verify(value);
              }}
              cellStyle={styles.codeCell}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.cardFooter}>
              {seconds > 0 ? (
                <Text style={styles.resendMuted}>
                  Resend code in <Text style={styles.resendTimer}>{seconds}s</Text>
                </Text>
              ) : (
                <Pressable onPress={() => void resend()} disabled={resending}>
                  <Text style={styles.resend}>Resend code</Text>
                </Pressable>
              )}
              <Text style={styles.hint}>May take a minute</Text>
            </View>
          </View>

          <Pressable
            accessibilityLabel="Verify and continue"
            accessibilityRole="button"
            accessibilityState={{ disabled: otp.length < 6 || loading, busy: loading }}
            onPress={() => verify()}
            disabled={otp.length < 6 || loading}
            style={[styles.verifyButton, otp.length === 6 && styles.verifyReady]}
          >
            {loading ? <ActivityIndicator color="#C8F169" /> : (
              <>
                <Text style={styles.verifyLabel}>Verify &amp; Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#8FA698" />
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

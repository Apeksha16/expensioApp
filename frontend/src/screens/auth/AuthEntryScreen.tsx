import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { authenticateGoogle } from '../../services/authApi';
import { colors, radius, spacing, typography } from '../../theme';

export function AuthEntryScreen() {
  const insets = useSafeAreaInsets();
  const { setAuthPhase, applyAuthSession, markVerified } = useApp();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handledResponse = useRef<typeof response>(null);
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type !== 'success' || handledResponse.current === response) return;
    handledResponse.current = response;
    const idToken = response.authentication?.idToken || response.params?.id_token;
    if (!idToken) {
      setError('Google did not return a valid identity token.');
      return;
    }
    setLoading(true);
    void authenticateGoogle(idToken)
      .then((result) => {
        markVerified('email');
        applyAuthSession(result);
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Google sign-in failed'))
      .finally(() => setLoading(false));
  }, [applyAuthSession, response]);

  const continueWithGoogle = () => {
    if (!request) {
      setError('Google sign-in is not configured for this build.');
      return;
    }
    setError('');
    void promptAsync();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
      <Pressable onPress={() => setAuthPhase('onboarding')} hitSlop={10} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <View style={styles.brand}>
        <View style={styles.mark}><Text style={styles.markText}>e</Text></View>
        <Text style={styles.brandText}>expensio</Text>
      </View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>WELCOME TO EXPENSIO</Text>
        <Text style={styles.title}>Your money,{"\n"}your way.</Text>
        <Text style={styles.subtitle}>Sign in or create an account to keep your finances in one calm place.</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton title="Continue with Google" onPress={continueWithGoogle} loading={loading} style={styles.google} />
        <PrimaryButton title="Continue with Email" onPress={() => setAuthPhase('email')} variant="secondary" />
        <PrimaryButton title="Continue with Mobile Number" onPress={() => setAuthPhase('mobile')} variant="secondary" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <Text style={styles.legal}>By continuing, you agree to our Terms and Privacy Policy.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  back: { alignSelf: 'flex-start', padding: spacing.xs },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.xl },
  mark: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  markText: { color: colors.white, fontSize: 23, fontWeight: '800' },
  brandText: { color: colors.accentDark, fontSize: 25, fontWeight: '800', letterSpacing: -1 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  kicker: { ...typography.label, color: colors.accent, letterSpacing: 1.5 },
  title: { color: colors.textPrimary, fontSize: 38, lineHeight: 42, fontWeight: '800', textAlign: 'center', letterSpacing: -1.2, marginTop: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', maxWidth: 310, marginTop: spacing.md, lineHeight: 23 },
  actions: { gap: spacing.sm },
  google: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  error: { ...typography.caption, color: colors.expense, textAlign: 'center' },
  legal: { ...typography.micro, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.md },
});

import Ionicons from '@expo/vector-icons/Ionicons';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LegalDocumentSheet, type LegalDocKind } from '../../components/LegalDocumentSheet';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenStatusBar } from '../../components/ScreenStatusBar';
import { ENV } from '../../config/env';
import { useApp } from '../../context/AppContext';
import { authenticateGoogle } from '../../services/authApi';
import { colors, fontFamilies, layout, radius, shadows, spacing, typography } from '../../theme';
import { normalizeAuthError } from '../../utils/errorNormalization';

const CHART_HEIGHTS = [34, 52, 28, 64, 44, 72];

function GoogleSignInButton({
  onAuthenticated,
  onError,
}: {
  onAuthenticated: (idToken: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'com.aptech.expensio.app',
    path: 'oauthredirect',
  });
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: ENV.GOOGLE_CLIENT_ID,
    iosClientId: ENV.GOOGLE_CLIENT_ID,
    androidClientId: ENV.GOOGLE_CLIENT_ID,
    webClientId: ENV.GOOGLE_CLIENT_ID,
    redirectUri,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token || response.authentication?.idToken;
      if (!idToken) {
        submittingRef.current = false;
        setLoading(false);
        onError('Google did not return an ID token. Please try again.');
        return;
      }
      void onAuthenticated(idToken).finally(() => {
        submittingRef.current = false;
        setLoading(false);
      });
    } else if (response.type === 'error') {
      submittingRef.current = false;
      setLoading(false);
      onError(response.error?.message || 'Google sign-in failed. Please try again.');
    } else {
      submittingRef.current = false;
      setLoading(false);
    }
  }, [onAuthenticated, onError, response]);

  const startGoogleAuth = async () => {
    if (loading || submittingRef.current || !request) return;
    submittingRef.current = true;
    setLoading(true);
    onError('');
    try {
      await promptAsync();
    } catch (err) {
      submittingRef.current = false;
      setLoading(false);
      onError(normalizeAuthError(err, 'login').message);
    }
  };

  return (
    <PrimaryButton
      title="Continue with Google"
      icon="logo-google"
      variant="secondary"
      surface="dark"
      loading={loading}
      disabled={!request || loading}
      onPress={() => void startGoogleAuth()}
      style={styles.ctaButton}
    />
  );
}

export function AuthEntryScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { setAuthPhase, applyAuthSession } = useApp();
  const [googleError, setGoogleError] = useState('');
  const [legalDoc, setLegalDoc] = useState<LegalDocKind | null>(null);
  const cardWidth = Math.min(width, layout.maxContentWidth);
  const isCompactHeight = height < 830;
  const hasGoogleClientId = ENV.GOOGLE_CLIENT_ID.trim().length > 0;

  const handleGoogleIdToken = async (idToken: string) => {
    try {
      const res = await authenticateGoogle(idToken);
      await applyAuthSession({ ...res, verifiedChannel: 'email' });
    } catch (err) {
      setGoogleError(normalizeAuthError(err, 'login').message);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenStatusBar surface="dark" />
      <View style={[styles.headerWrap, { paddingTop: insets.top + spacing.xs }]}>
        <ScreenHeader tone="dark" showBrand />
      </View>
      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.cardStack,
            isCompactHeight && styles.cardStackCompact,
            { width: cardWidth, marginLeft: -layout.screenMargin },
          ]}
        >
          <View style={[styles.stackCard, styles.backCard, isCompactHeight && styles.backCardCompact]}>
            <View style={styles.cardHeader}>
              <View style={styles.smallIconTile}>
                <Ionicons name="people-outline" size={15} color={colors.accentDark} />
              </View>
              <Text style={styles.backCardTitle}>Split with friends</Text>
              <Text style={styles.backCardMeta}>3</Text>
            </View>
          </View>

          <View style={[styles.stackCard, styles.middleCard, isCompactHeight && styles.middleCardCompact]}>
            <View style={styles.cardHeader}>
              <View style={styles.smallIconTileMuted}>
                <Ionicons name="flag-outline" size={15} color={colors.surprise} />
              </View>
              <Text style={styles.middleCardTitle}>Trip fund</Text>
              <Text style={styles.middleCardMeta}>68%</Text>
            </View>
            <View style={styles.middleTrack}>
              <View style={styles.middleTrackFill} />
            </View>
          </View>

          <View style={[styles.stackCard, styles.frontCard, isCompactHeight && styles.frontCardCompact]}>
            <View style={styles.frontCopy}>
              <Text style={styles.balanceLabel}>THIS MONTH</Text>
              <Text style={[styles.balanceValue, isCompactHeight && styles.balanceValueCompact]}>₹24,580</Text>
              <View style={styles.trendRow}>
                <Ionicons name="trending-up" size={14} color={colors.accentDark} />
                <Text style={styles.trendText}>+₹1,240 this week</Text>
              </View>
            </View>
            <View style={styles.chart}>
              {CHART_HEIGHTS.map((barHeight, index) => (
                <View
                  key={index}
                  style={[
                    styles.chartBar,
                    { height: isCompactHeight ? Math.round(barHeight * 0.78) : barHeight },
                    index === CHART_HEIGHTS.length - 1 && styles.chartBarActive,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={[styles.copy, isCompactHeight && styles.copyCompact]}>
          <Text style={[styles.title, isCompactHeight && styles.titleCompact]}>
            Your money,{'\n'}
            <Text style={styles.titleAccent}>your way</Text>
          </Text>
          <Text style={styles.subtitle}>Track, split, and plan — all in one place.</Text>
        </View>

        <View style={[styles.actions, isCompactHeight && styles.actionsCompact]}>
          <PrimaryButton
            title="Continue with Mobile Number"
            variant="lime"
            surface="dark"
            onPress={() => setAuthPhase('mobile')}
            style={styles.ctaButton}
          />
          <PrimaryButton
            title="Continue with Email"
            variant="secondary"
            surface="dark"
            onPress={() => setAuthPhase('email')}
            style={styles.ctaButton}
          />
          {hasGoogleClientId ? (
            <GoogleSignInButton
              onAuthenticated={handleGoogleIdToken}
              onError={setGoogleError}
            />
          ) : null}
          {googleError ? (
            <Text accessibilityRole="alert" style={styles.errorBanner}>{googleError}</Text>
          ) : null}
        </View>

        <Text style={[styles.terms, isCompactHeight && styles.termsCompact]}>
          By continuing, you agree to our{' '}
          <Text accessibilityRole="button" onPress={() => setLegalDoc('terms')} style={styles.termLink}>Terms</Text>
          {' '}and{' '}
          <Text accessibilityRole="button" onPress={() => setLegalDoc('privacy')} style={styles.termLink}>Privacy Policy</Text>.
        </Text>
      </ScrollView>

      <LegalDocumentSheet doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.heroBg,
  },
  headerWrap: {
    paddingHorizontal: layout.screenMargin,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: layout.screenMargin,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  cardStack: {
    height: 248,
    marginTop: spacing.md,
    position: 'relative',
  },
  cardStackCompact: {
    height: 196,
    marginTop: spacing.xs,
  },
  stackCard: {
    position: 'absolute',
  },
  backCard: {
    top: 0,
    left: 58,
    right: 58,
    height: 120,
    borderRadius: radius.xxl,
    backgroundColor: colors.heroCardBg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    zIndex: 1,
  },
  backCardCompact: {
    height: 96,
  },
  middleCard: {
    top: 46,
    left: 32,
    right: 32,
    height: 130,
    borderRadius: radius.xxl,
    backgroundColor: colors.heroSurface,
    borderWidth: 1,
    borderColor: colors.heroGlassBorder,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    ...shadows.card,
    zIndex: 2,
  },
  middleCardCompact: {
    top: 34,
    height: 102,
  },
  frontCard: {
    top: 96,
    left: spacing.sm,
    right: spacing.sm,
    height: 150,
    borderRadius: radius.xxl,
    backgroundColor: colors.surprise,
    paddingHorizontal: spacing.lg,
    paddingVertical: layout.screenMargin,
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...shadows.card,
    zIndex: 3,
  },
  frontCardCompact: {
    top: 64,
    height: 132,
    paddingVertical: spacing.sm,
  },
  cardHeader: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  smallIconTile: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    backgroundColor: colors.surprise,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallIconTileMuted: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    backgroundColor: colors.heroIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backCardTitle: {
    flex: 1,
    ...typography.captionMedium,
    color: colors.accentDark,
    fontFamily: fontFamilies.semibold,
  },
  backCardMeta: {
    ...typography.captionMedium,
    color: colors.accentDark,
    fontFamily: fontFamilies.bold,
  },
  middleCardTitle: {
    flex: 1,
    ...typography.captionMedium,
    color: colors.heroText,
    fontFamily: fontFamilies.semibold,
  },
  middleCardMeta: {
    ...typography.captionMedium,
    color: colors.surprise,
    fontFamily: fontFamilies.bold,
  },
  middleTrack: {
    height: 5,
    borderRadius: radius.xs,
    backgroundColor: colors.heroTrackIdle,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  middleTrackFill: {
    width: '68%',
    height: '100%',
    borderRadius: radius.xs,
    backgroundColor: colors.surprise,
  },
  frontCopy: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: spacing.sm,
  },
  balanceLabel: {
    ...typography.label,
    color: colors.accentDark,
  },
  balanceValue: {
    ...typography.h1,
    color: colors.accentDark,
  },
  balanceValueCompact: {
    fontSize: typography.otpDigit.fontSize,
    lineHeight: typography.otpDigit.lineHeight,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  trendText: {
    ...typography.micro,
    color: colors.accentDark,
    fontFamily: fontFamilies.semibold,
  },
  chart: {
    height: 78,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xxs,
    alignSelf: 'flex-end',
  },
  chartBar: {
    width: 14,
    borderRadius: radius.xs,
    backgroundColor: colors.overlay,
    opacity: 0.22,
  },
  chartBarActive: {
    opacity: 0.45,
    backgroundColor: colors.accentDark,
  },
  spacer: {
    flex: 1,
    minHeight: spacing.sm,
  },
  copy: {
    marginBottom: spacing.lg,
  },
  copyCompact: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.display,
    color: colors.heroText,
    marginBottom: spacing.xs,
  },
  titleCompact: {
    ...typography.hero,
    marginBottom: spacing.xxs,
  },
  titleAccent: {
    color: colors.surprise,
  },
  subtitle: {
    ...typography.body,
    color: colors.heroTextMuted,
    maxWidth: 280,
  },
  actions: {
    gap: spacing.sm,
  },
  actionsCompact: {
    gap: spacing.xs,
  },
  ctaButton: {
    minHeight: layout.buttonHeight,
  },
  errorBanner: {
    ...typography.caption,
    color: colors.heroErrorAccent,
    textAlign: 'center',
  },
  terms: {
    ...typography.caption,
    color: colors.heroTextSubtle,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  termsCompact: {
    marginTop: spacing.sm,
  },
  termLink: {
    color: colors.heroText,
    fontFamily: fontFamilies.semibold,
    textDecorationLine: 'underline',
  },
});

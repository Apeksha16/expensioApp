import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenStatusBar } from '../../components/ScreenStatusBar';
import { useApp } from '../../context/AppContext';
import { colors, layout, radius, shadows, spacing, typography } from '../../theme';

export function AuthEntryScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { setAuthPhase } = useApp();
  const cardWidth = Math.min(width, layout.maxContentWidth);

  return (
    <View style={styles.screen}>
      <ScreenStatusBar surface="dark" />
      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + spacing.xs,
            paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xs,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          tone="dark"
          onBack={() => setAuthPhase('onboarding')}
          backAccessibilityLabel="Back to onboarding"
          showBrand
        />

        <View style={[styles.cardStack, { width: cardWidth, marginLeft: -layout.screenMargin }]}>
          <View style={[styles.stackCard, styles.backCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.smallIconTile}>
                <Ionicons name="restaurant-outline" size={15} color={colors.accentDark} />
              </View>
              <Text style={styles.backCardTitle}>Shared expenses</Text>
              <View style={styles.placeholderValue} />
            </View>
          </View>

          <View style={[styles.stackCard, styles.middleCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.smallIconTileMuted}>
                <Ionicons name="flag-outline" size={15} color={colors.surprise} />
              </View>
              <Text style={styles.middleCardTitle}>Goals &amp; plans</Text>
            </View>
            <View style={styles.middleTrack} />
          </View>

          <View style={[styles.stackCard, styles.frontCard]}>
            <View style={styles.frontCopy}>
              <Text style={styles.balanceLabel}>YOUR OVERVIEW</Text>
              <View>
                <Text style={styles.balanceValue}>Your overview</Text>
                <Text style={styles.trendText}>Your activity appears here as you add it.</Text>
              </View>
            </View>
            <View style={styles.chart}>
              {Array.from({ length: 6 }, (_, index) => (
                <View key={index} style={styles.chartBar} />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>WELCOME TO EXPENSIO</Text>
          <Text style={styles.title}>
            Your money,{'\n'}
            <Text style={styles.titleAccent}>your way</Text>
          </Text>
          <Text style={styles.subtitle}>
            Sign in or create an account to keep your finances in one calm place.
          </Text>
        </View>

        <View style={styles.actions}>
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
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termLink}>Terms</Text>
          {' '}and{' '}
          <Text style={styles.termLink}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.heroBg,
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
    fontWeight: '600',
  },
  placeholderValue: {
    width: 42,
    height: 12,
    borderRadius: radius.xs,
    backgroundColor: colors.border,
  },
  middleCardTitle: {
    flex: 1,
    ...typography.captionMedium,
    color: colors.heroText,
    fontWeight: '600',
  },
  middleTrack: {
    height: 5,
    borderRadius: radius.xs,
    backgroundColor: colors.heroTrackIdle,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  frontCopy: {
    flex: 1,
    justifyContent: 'space-between',
  },
  balanceLabel: {
    ...typography.label,
    color: colors.accentDark,
  },
  balanceValue: {
    ...typography.h1,
    color: colors.accentDark,
  },
  trendText: {
    ...typography.micro,
    color: colors.accentDark,
    fontWeight: '600',
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
    height: 28,
    borderRadius: radius.xs,
    backgroundColor: colors.overlay,
    opacity: 0.25,
  },
  spacer: {
    flex: 1,
    minHeight: spacing.sm,
  },
  copy: {
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.surprise,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.display,
    color: colors.heroText,
    marginBottom: spacing.sm,
  },
  titleAccent: {
    color: colors.surprise,
  },
  subtitle: {
    ...typography.body,
    color: colors.heroTextMuted,
    maxWidth: 320,
  },
  actions: {
    gap: spacing.sm,
  },
  ctaButton: {
    minHeight: layout.authButtonHeight,
  },
  terms: {
    ...typography.caption,
    color: colors.heroTextSubtle,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  termLink: {
    color: colors.heroText,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

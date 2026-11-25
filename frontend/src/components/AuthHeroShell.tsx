import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, radius, shadows, spacing, typography } from '../theme';
import { ScreenHeader } from './ScreenHeader';
import { ScreenStatusBar } from './ScreenStatusBar';

interface AuthHeroShellProps {
  onBack?: () => void;
  backAccessibilityLabel?: string;
  showBrand?: boolean;
  step?: number;
  totalSteps?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  titleLine1: string;
  titleAccent?: string;
  subtitle: string;
  heroExtra?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Shared dark-hero auth container (J1):
 * Circular back button, step dashes or brand lockup, icon tile,
 * two-tone display heading, and light input card on a forest hero.
 */
export function AuthHeroShell({
  onBack,
  backAccessibilityLabel = 'Go back',
  showBrand = false,
  step,
  totalSteps,
  icon,
  titleLine1,
  titleAccent,
  subtitle,
  heroExtra,
  children,
  footer,
}: AuthHeroShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.screen}>
        <ScreenStatusBar surface="dark" />
        <View pointerEvents="none" style={styles.decoration}>
          <View style={styles.outerRing} />
          <View style={styles.middleRing} />
          <View style={styles.innerDisc} />
        </View>

        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + spacing.xs,
              paddingBottom: Math.max(insets.bottom, spacing.lg),
            },
          ]}
        >
          <ScreenHeader
            tone="dark"
            onBack={onBack}
            backAccessibilityLabel={backAccessibilityLabel}
            showBrand={showBrand}
            step={step}
            totalSteps={totalSteps}
          />

          <View style={styles.hero}>
            {icon ? (
              <View style={styles.iconTile}>
                <Ionicons name={icon} size={24} color={colors.surprise} />
              </View>
            ) : null}

            <Text maxFontSizeMultiplier={1.3} style={styles.title}>
              {titleLine1}
              {titleAccent ? (
                <>
                  {'\n'}
                  <Text maxFontSizeMultiplier={1.3} style={styles.titleAccent}>{titleAccent}</Text>
                </>
              ) : null}
            </Text>

            <Text maxFontSizeMultiplier={1.35} style={styles.subtitle}>{subtitle}</Text>
            {heroExtra}
          </View>

          <View style={styles.spacer} />

          <View style={styles.card}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.heroBg,
  },
  decoration: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  outerRing: {
    position: 'absolute',
    width: 416,
    height: 416,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.heroRingOuter,
    top: 130,
    right: -208,
  },
  middleRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.heroRingMiddle,
    top: 188,
    right: -150,
  },
  innerDisc: {
    position: 'absolute',
    width: 184,
    height: 184,
    borderRadius: radius.full,
    backgroundColor: colors.heroRingInner,
    top: 246,
    right: -92,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenMargin,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  hero: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xxs,
    gap: spacing.sm,
  },
  iconTile: {
    width: layout.iconTileSize,
    height: layout.iconTileSize,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.heroBorder,
    backgroundColor: colors.heroIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.display,
    color: colors.heroText,
  },
  titleAccent: {
    color: colors.surprise,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.heroTextMuted,
    maxWidth: 320,
  },
  spacer: {
    flex: 1,
    minHeight: spacing.xs,
  },
  card: {
    backgroundColor: colors.heroCardBg,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: layout.screenMargin,
    paddingTop: layout.screenMargin,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  footer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});

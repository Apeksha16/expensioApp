import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, layout, radius, spacing, typography } from '../theme';

interface ScreenHeaderProps {
  tone?: 'dark' | 'light';
  onBack?: () => void;
  backAccessibilityLabel?: string;
  title?: string;
  showBrand?: boolean;
  step?: number;
  totalSteps?: number;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Shared top navigation bar across pushed light screens and dark auth screens.
 * Heading rule: screen titles omit trailing periods across the entire journey.
 */
export function ScreenHeader({
  tone = 'light',
  onBack,
  backAccessibilityLabel = 'Go back',
  title,
  showBrand = false,
  step,
  totalSteps,
  rightElement,
  style,
}: ScreenHeaderProps) {
  const isDark = tone === 'dark';

  return (
    <View style={[styles.header, style]}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backAccessibilityLabel}
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [
            styles.circleBtn,
            isDark ? styles.circleBtnDark : styles.circleBtnLight,
            pressed && (isDark ? styles.circleBtnDarkPressed : styles.circleBtnLightPressed),
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={isDark ? colors.heroText : colors.textPrimary}
          />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}

      <View style={styles.center}>
        {typeof step === 'number' && typeof totalSteps === 'number' && totalSteps > 0 ? (
          <View
            accessible
            accessibilityLabel={`Step ${step} of ${totalSteps}`}
            style={styles.progress}
          >
            {Array.from({ length: totalSteps }, (_, index) => {
              const active = index + 1 <= step;
              return (
                <View
                  key={index}
                  style={[
                    styles.progressDash,
                    isDark
                      ? active
                        ? styles.progressDashDarkActive
                        : styles.progressDashDarkIdle
                      : active
                        ? styles.progressDashLightActive
                        : styles.progressDashLightIdle,
                  ]}
                />
              );
            })}
          </View>
        ) : showBrand ? (
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Text maxFontSizeMultiplier={1.1} style={styles.brandMarkText}>e</Text>
            </View>
            <Text maxFontSizeMultiplier={1.25} style={[styles.brandText, !isDark && styles.brandTextLight]}>expensio</Text>
          </View>
        ) : title ? (
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.25}
            style={[styles.title, isDark && styles.titleDark]}
          >
            {title}
          </Text>
        ) : null}
      </View>

      {rightElement ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: layout.stickyBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleBtn: {
    width: layout.headerButtonSize,
    height: layout.headerButtonSize,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnLight: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  circleBtnLightPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  circleBtnDark: {
    backgroundColor: colors.transparent,
    borderColor: colors.heroBorder,
  },
  circleBtnDarkPressed: {
    backgroundColor: colors.heroGlassSubtle,
  },
  spacer: {
    width: layout.headerButtonSize,
    height: layout.headerButtonSize,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  titleDark: {
    color: colors.heroText,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.surprise,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    ...typography.h3,
    color: colors.accentDark,
    fontWeight: '800',
  },
  brandText: {
    ...typography.h2,
    color: colors.heroText,
    letterSpacing: -0.5,
  },
  brandTextLight: {
    color: colors.accentDark,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressDash: {
    width: 24,
    height: 4,
    borderRadius: radius.xxs,
  },
  progressDashDarkActive: {
    backgroundColor: colors.surprise,
  },
  progressDashDarkIdle: {
    backgroundColor: colors.heroTrackIdle,
  },
  progressDashLightActive: {
    backgroundColor: colors.accent,
  },
  progressDashLightIdle: {
    backgroundColor: colors.border,
  },
});

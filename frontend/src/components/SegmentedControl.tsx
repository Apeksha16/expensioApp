import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { fontFamilies, colors, layout, radius, shadows, spacing, typography } from '../theme';

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
  badgeCount?: number;
  hasDot?: boolean;
  accessibilityLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  variant?: 'subtle' | 'primary';
  style?: ViewStyle;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = 'subtle',
  style,
}: SegmentedControlProps<T>) {
  const isPrimary = variant === 'primary';
  const [containerWidth, setContainerWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const selectedIndex = Math.max(0, options.findIndex((o) => o.key === value));
  const slideAnim = useRef(new Animated.Value(selectedIndex)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(Boolean(enabled));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      slideAnim.setValue(selectedIndex);
      return;
    }
    Animated.timing(slideAnim, {
      toValue: selectedIndex,
      duration: 210,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, selectedIndex, slideAnim]);

  const innerPadding = spacing.xxs;
  const segmentWidth =
    containerWidth > innerPadding * 2 && options.length > 0
      ? (containerWidth - innerPadding * 2) / options.length
      : 0;

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={[styles.track, isPrimary && styles.trackPrimary, style]}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            isPrimary && styles.indicatorPrimary,
            {
              width: segmentWidth,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: options.map((_, i) => i),
                    outputRange: options.map((_, i) => i * segmentWidth),
                  }),
                },
              ],
            },
          ]}
        />
      ) : null}

      {options.map((option) => {
        const active = option.key === value;
        const showBadge = typeof option.badgeCount === 'number' && option.badgeCount > 0;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityLabel={
              option.accessibilityLabel
              ?? (showBadge ? `${option.label}, ${option.badgeCount}` : option.label)
            }
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.key)}
            style={styles.segment}
          >
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
              style={[
                styles.label,
                isPrimary && styles.labelPrimary,
                active && (isPrimary ? styles.labelPrimaryActive : styles.labelActive),
              ]}
            >
              {option.label}
            </Text>
            {showBadge ? (
              <View style={[styles.badge, active && styles.badgeActive]}>
                <Text maxFontSizeMultiplier={1.15} style={[styles.badgeText, active && styles.badgeTextActive]}>
                  {option.badgeCount}
                </Text>
              </View>
            ) : option.hasDot ? (
              <View style={styles.dot} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    minHeight: layout.segmentHeight,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    padding: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  trackPrimary: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentMuted,
  },
  indicator: {
    position: 'absolute',
    top: spacing.xxs,
    bottom: spacing.xxs,
    left: spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  indicatorPrimary: {
    backgroundColor: colors.accentDark,
  },
  segment: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    zIndex: 1,
    paddingHorizontal: spacing.xs,
  },
  label: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    fontFamily: fontFamilies.semibold,
  },
  labelPrimary: {
    color: colors.accent,
  },
  labelActive: {
    color: colors.accentDark,
    fontFamily: fontFamilies.bold,
  },
  labelPrimaryActive: {
    color: colors.textInverse,
    fontFamily: fontFamilies.bold,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: colors.accentDark,
  },
  badgeText: {
    ...typography.microTag,
    color: colors.textInverse,
    fontVariant: ['tabular-nums'],
  },
  badgeTextActive: {
    color: colors.surprise,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
});

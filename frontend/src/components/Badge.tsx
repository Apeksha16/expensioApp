import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export type BadgeVariant = 'neutral' | 'tag' | 'accent' | 'lime' | 'warning' | 'danger' | 'dark';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = 'neutral',
  icon,
  size = 'sm',
  style,
}: BadgeProps) {
  const palette = VARIANT_STYLES[variant];
  const isTag = variant === 'tag';

  return (
    <View
      style={[
        styles.base,
        isTag && styles.baseTag,
        size === 'md' && styles.baseMd,
        { backgroundColor: palette.bg, borderColor: palette.border },
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={size === 'md' ? 14 : 12}
          color={palette.fg}
        />
      ) : null}
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
        style={[
          isTag ? styles.textTag : size === 'md' ? styles.textMd : styles.textSm,
          { color: palette.fg },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; border: string; fg: string }> = {
  neutral: { bg: colors.surfaceMuted, border: colors.border, fg: colors.accentDark },
  tag: { bg: colors.accentSoft, border: colors.transparent, fg: colors.accentDark },
  accent: { bg: colors.accentSoft, border: colors.accentMuted, fg: colors.accent },
  lime: { bg: colors.surprise, border: colors.accentMuted, fg: colors.accentDark },
  warning: { bg: colors.warningSoft, border: colors.warningBorder, fg: colors.warning },
  danger: { bg: colors.dangerSoft, border: colors.dangerBorder, fg: colors.expense },
  dark: { bg: colors.accentDark, border: colors.accentDark, fg: colors.textInverse },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  baseTag: {
    borderWidth: 0,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  baseMd: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  textTag: {
    ...typography.micro,
    fontWeight: '600',
  },
  textSm: {
    ...typography.microTag,
  },
  textMd: {
    ...typography.micro,
    fontWeight: '700',
  },
});

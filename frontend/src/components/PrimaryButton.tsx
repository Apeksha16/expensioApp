import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  ActivityIndicator,
  AccessibilityState,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { colors, layout, radius, shadows, spacing, typography } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'lime' | 'danger';
  surface?: 'light' | 'dark';
  size?: 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  labelColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  surface = 'light',
  size = 'lg',
  icon,
  labelColor,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
}: Props) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isLime = variant === 'lime';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';
  const isDarkSurface = surface === 'dark';

  const resolvedTextColor = labelColor
    ?? (isPrimary || isDanger
      ? colors.textInverse
      : isLime
        ? colors.accentDark
        : isSecondary
          ? (isDarkSurface ? colors.heroText : colors.textPrimary)
          : colors.textSecondary);

  const spinnerColor = isPrimary || isDanger
    ? colors.textInverse
    : isLime
      ? colors.accentDark
      : isDarkSurface
        ? colors.heroText
        : colors.accent;

  const disabledTextColor = isDarkSurface ? colors.heroButtonDisabledText : colors.disabledText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: Boolean(disabled || loading),
        busy: Boolean(loading),
        ...accessibilityState,
      }}
      style={({ pressed }) => [
        styles.base,
        size === 'md' && styles.sizeMd,
        isPrimary && styles.primary,
        isLime && styles.lime,
        isDanger && styles.danger,
        isSecondary && (isDarkSurface ? styles.secondaryDark : styles.secondary),
        isGhost && styles.ghost,
        disabled && !loading && (isDarkSurface ? styles.disabledDark : styles.disabled),
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={disabled ? disabledTextColor : spinnerColor} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={size === 'md' ? 16 : 18}
              color={disabled ? disabledTextColor : resolvedTextColor}
            />
          ) : null}
          <Text
            maxFontSizeMultiplier={1.3}
            style={[
              styles.label,
              size === 'md' && styles.labelMd,
              isPrimary && styles.labelPrimary,
              isLime && styles.labelLime,
              isDanger && styles.labelDanger,
              isSecondary && (isDarkSurface ? styles.labelSecondaryDark : styles.labelSecondary),
              isGhost && styles.labelGhost,
              labelColor ? { color: labelColor } : null,
              disabled && (isDarkSurface ? styles.labelDisabledDark : styles.labelDisabled),
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.buttonHeight,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  sizeMd: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  primary: {
    backgroundColor: colors.accent,
    ...shadows.button,
  },
  lime: {
    backgroundColor: colors.surprise,
    ...shadows.soft,
  },
  danger: {
    backgroundColor: colors.expense,
    ...shadows.soft,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryDark: {
    backgroundColor: colors.transparent,
    borderWidth: 1.5,
    borderColor: colors.heroSecondaryBorder,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
  disabled: {
    backgroundColor: colors.disabledBg,
    borderWidth: 1.5,
    borderColor: colors.disabledBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledDark: {
    backgroundColor: colors.heroButtonDisabledBg,
    borderWidth: 1.5,
    borderColor: colors.heroButtonDisabledBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  label: {
    ...typography.bodySemibold,
  },
  labelMd: {
    ...typography.captionMedium,
    fontWeight: '700',
  },
  labelPrimary: {
    color: colors.textInverse,
    letterSpacing: -0.2,
  },
  labelLime: {
    color: colors.accentDark,
    fontWeight: '700',
  },
  labelDanger: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  labelSecondary: {
    color: colors.textPrimary,
  },
  labelSecondaryDark: {
    color: colors.heroText,
  },
  labelGhost: {
    color: colors.textSecondary,
  },
  labelDisabled: {
    color: colors.disabledText,
  },
  labelDisabledDark: {
    color: colors.heroButtonDisabledText,
  },
});

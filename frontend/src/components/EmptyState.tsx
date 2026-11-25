import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { colors, layout, radius, spacing, typography } from '../theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaIcon?: keyof typeof Ionicons.glyphMap;
  onCtaPress?: () => void;
  compact?: boolean;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaIcon,
  onCtaPress,
  compact = false,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.card, compact && styles.cardCompact, style]}>
      <View style={[styles.iconTile, compact && styles.iconTileCompact]}>
        <Ionicons name={icon} size={compact ? 20 : 24} color={colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {ctaLabel && onCtaPress ? (
        <PrimaryButton
          title={ctaLabel}
          icon={ctaIcon}
          variant="secondary"
          size="md"
          onPress={onCtaPress}
          style={styles.cta}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: layout.cardPadding,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  cardCompact: {
    paddingVertical: spacing.md,
    paddingHorizontal: layout.cardPadding,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  iconTileCompact: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
  },
  title: {
    ...typography.rowTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  cta: {
    marginTop: spacing.xxs,
  },
});

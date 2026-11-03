import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../theme';
import type { SplitSummary } from '../types';
import { formatINR } from '../utils/format';
import { AvatarGroup } from './AvatarGroup';

interface Props {
  split: SplitSummary;
  onPress?: () => void;
}

export function SplitSummaryCard({ split, onPress }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Split with friends</Text>
      <View style={styles.row}>
        <AvatarGroup avatars={split.friends} />
        <View style={styles.meta}>
          <Text style={styles.amount}>You are owed</Text>
          <Text style={styles.value}>{formatINR(split.owedAmount)}</Text>
        </View>
      </View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
      >
        <Text style={styles.ctaText}>View Splits</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.soft,
  },
  label: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  meta: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  value: {
    ...typography.h3,
    color: colors.income,
  },
  cta: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  ctaText: {
    ...typography.bodySemibold,
    color: colors.accentDark,
  },
});

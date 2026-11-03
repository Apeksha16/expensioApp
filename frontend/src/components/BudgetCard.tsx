import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../theme';
import type { BudgetSummary } from '../types';
import { formatINR } from '../utils/format';
import { ProgressBar } from './ProgressBar';

interface Props {
  budget: BudgetSummary;
}

export function BudgetCard({ budget }: Props) {
  const remaining = Math.max(budget.limit - budget.spent, 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Monthly Budget</Text>
      <Text style={styles.amount}>
        {formatINR(budget.spent)}
        <Text style={styles.limit}> / {formatINR(budget.limit)}</Text>
      </Text>
      <ProgressBar
        current={budget.spent}
        total={budget.limit}
        color={colors.accent}
        style={styles.bar}
      />
      <Text style={styles.remaining}>{formatINR(remaining)} remaining</Text>
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
  title: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  amount: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  limit: {
    ...typography.body,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  bar: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  remaining: {
    ...typography.captionMedium,
    color: colors.accent,
  },
});

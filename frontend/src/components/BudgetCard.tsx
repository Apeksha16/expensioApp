import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cardChrome, colors, radius, spacing, typography } from '../theme';
import type { BudgetSummary } from '../types';
import { formatINR } from '../utils/format';
import { ProgressBar } from './ProgressBar';

interface Props {
  budget: BudgetSummary;
}

export function BudgetCard({ budget }: Props) {
  const remaining = Math.max(budget.limit - budget.spent, 0);
  const pct = Math.round((budget.spent / budget.limit) * 100);
  const isOver = budget.spent > budget.limit;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Monthly Budget</Text>
          <Text style={styles.amount}>
            {formatINR(budget.spent)}
            <Text style={styles.limit}> / {formatINR(budget.limit)}</Text>
          </Text>
        </View>
        <View style={[styles.pctBadge, isOver && styles.pctBadgeOver]}>
          <Text style={[styles.pctText, isOver && styles.pctTextOver]}>{pct}%</Text>
        </View>
      </View>
      <ProgressBar
        current={budget.spent}
        total={budget.limit}
        color={isOver ? colors.expense : colors.accent}
        height={8}
        style={styles.bar}
      />
      <Text style={[styles.remaining, isOver && styles.over]}>
        {isOver ? 'Over budget by ' + formatINR(budget.spent - budget.limit) : formatINR(remaining) + ' remaining'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardChrome,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
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
  pctBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: 2,
  },
  pctBadgeOver: {
    backgroundColor: colors.dangerSoft,
  },
  pctText: {
    ...typography.captionMedium,
    color: colors.accentDark,
  },
  pctTextOver: {
    color: colors.expense,
  },
  bar: {
    marginBottom: spacing.sm,
  },
  remaining: {
    ...typography.captionMedium,
    color: colors.accent,
  },
  over: {
    color: colors.expense,
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../theme';
import type { SavingsGoal } from '../types';
import { formatINR, progressRatio } from '../utils/format';
import { ProgressBar } from './ProgressBar';

interface Props {
  goal: SavingsGoal;
}

export function GoalCard({ goal }: Props) {
  const pct = Math.round(progressRatio(goal.current, goal.target) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Savings Goal</Text>
          <Text style={styles.title}>{goal.title}</Text>
        </View>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
      <Text style={styles.amount}>
        {formatINR(goal.current)}
        <Text style={styles.target}> / {formatINR(goal.target)}</Text>
      </Text>
      <ProgressBar
        current={goal.current}
        total={goal.target}
        color={colors.warning}
        style={styles.bar}
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  pct: {
    ...typography.bodySemibold,
    color: colors.warning,
  },
  amount: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
  },
  target: {
    ...typography.caption,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  bar: {
    marginTop: spacing.md,
  },
});

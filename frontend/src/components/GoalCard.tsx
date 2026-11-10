import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cardChrome, colors, radius, spacing, typography } from '../theme';
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
        <View style={styles.iconWrap}>
          <Ionicons name="flag" size={18} color={colors.accent} />
        </View>
        <View style={styles.titleGroup}>
          <Text style={styles.label}>Savings Goal</Text>
          <Text style={styles.title}>{goal.title}</Text>
        </View>
        <View style={styles.pctBadge}>
          <Text style={styles.pct}>{pct}%</Text>
        </View>
      </View>
      <Text style={styles.amount}>
        {formatINR(goal.current)}
        <Text style={styles.target}> / {formatINR(goal.target)}</Text>
      </Text>
      <ProgressBar
        current={goal.current}
        total={goal.target}
        color={colors.accent}
        height={8}
        style={styles.bar}
      />
      <Text style={styles.hint}>{formatINR(goal.target - goal.current)} left to go</Text>
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
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleGroup: {
    flex: 1,
  },
  label: {
    ...typography.micro,
    color: colors.textTertiary,
    marginBottom: 1,
  },
  title: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
  },
  pctBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  pct: {
    ...typography.captionMedium,
    color: colors.accent,
  },
  amount: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  target: {
    ...typography.body,
    color: colors.textTertiary,
    fontWeight: '400',
  },
  bar: {
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

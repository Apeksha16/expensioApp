import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../theme';
import type { MonthlyOverview } from '../types';
import { formatINR, progressRatio } from '../utils/format';
import { ProgressBar } from './ProgressBar';

interface Props {
  overview: MonthlyOverview;
}

export function MonthlyOverviewCard({ overview }: Props) {
  const spentRatio = progressRatio(overview.spent, overview.income);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Monthly Overview</Text>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Income</Text>
          <Text style={[styles.statValue, { color: colors.income }]}>
            {formatINR(overview.income)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Spent</Text>
          <Text style={[styles.statValue, { color: colors.expense }]}>
            {formatINR(overview.spent)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={styles.statValue}>{formatINR(overview.remaining)}</Text>
        </View>
      </View>
      <ProgressBar
        current={overview.spent}
        total={overview.income}
        color={spentRatio > 0.8 ? colors.expense : colors.accent}
        height={10}
        style={styles.bar}
      />
      <Text style={styles.hint}>
        {Math.round(spentRatio * 100)}% of income used this month
      </Text>
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
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    ...typography.micro,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  statValue: {
    ...typography.captionMedium,
    color: colors.textPrimary,
    fontSize: 14,
  },
  bar: {
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

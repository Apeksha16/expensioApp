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
  const isWarning = spentRatio > 0.8;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Monthly Overview</Text>
        <View style={[styles.badge, isWarning && styles.badgeWarning]}>
          <Text style={[styles.badgeText, isWarning && styles.badgeTextWarning]}>
            {Math.round(spentRatio * 100)}% used
          </Text>
        </View>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <View style={[styles.dot, { backgroundColor: colors.income }]} />
          <Text style={styles.statLabel}>Income</Text>
          <Text style={[styles.statValue, { color: colors.income }]}>
            {formatINR(overview.income)}
          </Text>
        </View>
        <View style={styles.stat}>
          <View style={[styles.dot, { backgroundColor: colors.expense }]} />
          <Text style={styles.statLabel}>Spent</Text>
          <Text style={[styles.statValue, { color: colors.expense }]}>
            {formatINR(overview.spent)}
          </Text>
        </View>
        <View style={styles.stat}>
          <View style={[styles.dot, { backgroundColor: colors.accent }]} />
          <Text style={styles.statLabel}>Left</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {formatINR(overview.remaining)}
          </Text>
        </View>
      </View>
      <ProgressBar
        current={overview.spent}
        total={overview.income}
        color={isWarning ? colors.expense : colors.accent}
        height={8}
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    ...typography.micro,
    color: colors.accentDark,
  },
  badgeTextWarning: {
    color: colors.warning,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    ...typography.micro,
    color: colors.textTertiary,
  },
  statValue: {
    ...typography.captionMedium,
    fontSize: 14,
    fontWeight: '600',
  },
  bar: {
    marginBottom: 0,
  },
});

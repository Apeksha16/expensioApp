import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../theme';
import type { SplitBalances } from '../types';
import { formatINR } from '../utils/format';

interface Props {
  balances: SplitBalances;
}

export function SplitBalanceHeader({ balances }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.label}>You owe</Text>
          <Text style={[styles.value, styles.owe]}>
            {formatINR(balances.youOwe)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.label}>You are owed</Text>
          <Text style={[styles.value, styles.owed]}>
            {formatINR(balances.youAreOwed)}
          </Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <View style={[styles.metaDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.meta}>{balances.pendingCount} pending</Text>
        </View>
        <View style={styles.metaChip}>
          <View style={[styles.metaDot, { backgroundColor: colors.income }]} />
          <Text style={styles.meta}>{balances.settledCount} settled</Text>
        </View>
      </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
  },
  label: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  value: {
    ...typography.h2,
  },
  owe: {
    color: colors.expense,
  },
  owed: {
    color: colors.income,
  },
  divider: {
    width: 1,
    height: 44,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  metaDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  meta: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
});

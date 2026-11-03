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
        <Text style={styles.meta}>
          {balances.pendingCount} pending
        </Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.meta}>{balances.settledCount} settled</Text>
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
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  meta: {
    ...typography.captionMedium,
    color: colors.textTertiary,
  },
  dot: {
    color: colors.textTertiary,
  },
});

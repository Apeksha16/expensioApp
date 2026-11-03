import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../theme';
import type { BalanceSummary } from '../types';
import { formatINR } from '../utils/format';

interface Props {
  balance: BalanceSummary;
  onAction?: (action: string) => void;
}

const actions = [
  { key: 'expense', label: 'Expense', icon: 'remove-circle-outline' as const },
  { key: 'income', label: 'Income', icon: 'add-circle-outline' as const },
  { key: 'split', label: 'Split', icon: 'people-outline' as const },
  { key: 'transfer', label: 'Transfer', icon: 'swap-horizontal-outline' as const },
];

export function BalanceCard({ balance, onAction }: Props) {
  return (
    <LinearGradient
      colors={[colors.balanceStart, colors.balanceEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Text style={styles.label}>Total Balance</Text>
      <Text style={styles.total}>{formatINR(balance.total)}</Text>

      <View style={styles.subRow}>
        <View style={styles.subItem}>
          <Text style={styles.subLabel}>Cash</Text>
          <Text style={styles.subValue}>{formatINR(balance.cash)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.subItem}>
          <Text style={styles.subLabel}>Savings</Text>
          <Text style={styles.subValue}>{formatINR(balance.savings)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {actions.map((action) => (
          <Pressable
            key={action.key}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            onPress={() => onAction?.(action.key)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name={action.icon} size={18} color={colors.white} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.card,
  },
  label: {
    ...typography.captionMedium,
    color: 'rgba(255,255,255,0.72)',
  },
  total: {
    ...typography.hero,
    color: colors.white,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  subItem: {
    flex: 1,
  },
  subLabel: {
    ...typography.micro,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 2,
  },
  subValue: {
    ...typography.bodySemibold,
    color: colors.white,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  action: {
    alignItems: 'center',
    gap: spacing.xs,
    width: '22%',
  },
  actionPressed: {
    opacity: 0.75,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...typography.micro,
    color: 'rgba(255,255,255,0.9)',
  },
});

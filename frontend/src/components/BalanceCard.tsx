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
      colors={['#0D4F4A', '#0F766E', '#14897F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <Text style={styles.label}>Total Balance</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Nov 2026</Text>
        </View>
      </View>
      <Text style={styles.total}>{formatINR(balance.total)}</Text>

      <View style={styles.subRow}>
        <View style={styles.subItem}>
          <Ionicons name="wallet-outline" size={13} color="rgba(255,255,255,0.6)" />
          <Text style={styles.subLabel}>Cash</Text>
          <Text style={styles.subValue}>{formatINR(balance.cash)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.subItem}>
          <Ionicons name="save-outline" size={13} color="rgba(255,255,255,0.6)" />
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
              <Ionicons name={action.icon} size={19} color={colors.white} />
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  label: {
    ...typography.captionMedium,
    color: 'rgba(255,255,255,0.72)',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    ...typography.micro,
    color: 'rgba(255,255,255,0.8)',
  },
  total: {
    ...typography.hero,
    color: colors.white,
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
    fontSize: 36,
    letterSpacing: -1,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  subItem: {
    flex: 1,
    gap: 3,
  },
  subLabel: {
    ...typography.micro,
    color: 'rgba(255,255,255,0.6)',
  },
  subValue: {
    ...typography.bodySemibold,
    color: colors.white,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  action: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  actionPressed: {
    opacity: 0.72,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...typography.micro,
    color: 'rgba(255,255,255,0.9)',
  },
});

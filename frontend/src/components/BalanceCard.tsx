import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../theme';
import type { BalanceSummary } from '../types';
import { formatINR } from '../utils/format';

interface Props {
  balance: BalanceSummary;
}

export function BalanceCard({ balance }: Props) {
  return (
    <LinearGradient
      colors={[colors.balanceStart, '#12533F', colors.balanceEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.glow} />
      <View style={styles.topRow}>
        <Text style={styles.label}>Total Balance</Text>
        <Ionicons name="eye-outline" size={24} color={colors.white} />
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

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xxl,
    padding: spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...shadows.card,
  },
  glow: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.10)',
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
  total: {
    ...typography.hero,
    color: colors.white,
    marginTop: spacing.xxs,
    marginBottom: spacing.lg,
    fontSize: 36,
    letterSpacing: -1,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
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
});

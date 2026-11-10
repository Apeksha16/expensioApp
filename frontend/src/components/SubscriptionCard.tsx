import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cardChrome, colors, radius, spacing, typography } from '../theme';
import type { Subscription } from '../types';
import { formatINR } from '../utils/format';

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  tv: 'tv',
  'musical-notes': 'musical-notes',
  cloud: 'cloud',
};

interface Props {
  items: Subscription[];
  upcomingTotal: number;
}

export function SubscriptionCard({ items, upcomingTotal }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscriptions</Text>
        <View style={styles.upcomingBadge}>
          <Text style={styles.upcomingLabel}>Due soon</Text>
          <Text style={styles.upcoming}>{formatINR(upcomingTotal)}</Text>
        </View>
      </View>
      {items.map((item, index) => (
        <View
          key={item.id}
          style={[styles.row, index < items.length - 1 && styles.rowBorder]}
        >
          <View style={[styles.icon, { backgroundColor: `${item.color}18` }]}>
            <Ionicons
              name={iconMap[item.icon] ?? 'ellipse'}
              size={17}
              color={item.color}
            />
          </View>
          <View style={styles.meta}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.date}>Renews {item.nextDate}</Text>
          </View>
          <Text style={styles.amount}>{formatINR(item.amount)}<Text style={styles.mo}>/mo</Text></Text>
        </View>
      ))}
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
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  upcomingBadge: {
    alignItems: 'flex-end',
  },
  upcomingLabel: {
    ...typography.micro,
    color: colors.textTertiary,
  },
  upcoming: {
    ...typography.captionMedium,
    color: colors.warning,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  date: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  amount: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
  },
  mo: {
    ...typography.micro,
    color: colors.textTertiary,
    fontWeight: '400',
  },
});

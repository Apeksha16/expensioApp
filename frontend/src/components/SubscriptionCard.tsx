import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../theme';
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
        <Text style={styles.upcoming}>
          Upcoming {formatINR(upcomingTotal)}
        </Text>
      </View>
      {items.map((item, index) => (
        <View
          key={item.id}
          style={[styles.row, index < items.length - 1 && styles.rowBorder]}
        >
          <View style={[styles.icon, { backgroundColor: `${item.color}18` }]}>
            <Ionicons
              name={iconMap[item.icon] ?? 'ellipse'}
              size={16}
              color={item.color}
            />
          </View>
          <View style={styles.meta}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.date}>{item.nextDate}</Text>
          </View>
          <Text style={styles.amount}>{formatINR(item.amount)}</Text>
        </View>
      ))}
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
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  upcoming: {
    ...typography.captionMedium,
    color: colors.textSecondary,
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
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
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
});

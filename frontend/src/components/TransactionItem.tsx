import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import type { Transaction } from '../types';
import { formatINR } from '../utils/format';

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  restaurant: 'restaurant',
  car: 'car',
  tv: 'tv',
  cart: 'cart',
  flash: 'flash',
};

interface Props {
  item: Transaction;
}

export function TransactionItem({ item }: Props) {
  const iconName = iconMap[item.icon] ?? 'ellipse';

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: `${item.iconColor}18` }]}>
        <Ionicons name={iconName} size={18} color={item.iconColor} />
      </View>
      <View style={styles.meta}>
        <Text style={styles.merchant}>{item.merchant}</Text>
        <Text style={styles.sub}>
          {item.date} · {item.time}
        </Text>
      </View>
      <Text style={styles.amount}>-{formatINR(item.amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  merchant: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  sub: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  amount: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
  },
});

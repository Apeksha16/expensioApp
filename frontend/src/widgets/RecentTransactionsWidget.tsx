import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  IconCart,
  IconCoffee,
  IconZap,
} from '../components/icons/Icons';
import { colors } from '../theme/colors';

export interface TransactionItem {
  id: string;
  title: string;
  date: string;
  amount: string;
  method: string;
  icon: 'cart' | 'coffee' | 'zap';
  iconColor: string;
  iconBg: string;
}

interface RecentTransactionsWidgetProps {
  onSeeAll?: () => void;
  scale?: number;
}

const RECENT_TRANSACTIONS: TransactionItem[] = [
  {
    id: 'tx1',
    title: 'zepto order',
    date: 'SEP 18, 11:40 PM',
    amount: '₹120',
    method: 'UPI',
    icon: 'cart',
    iconColor: colors.categories.shopping, // #9B5DE5
    iconBg: 'rgba(155, 93, 229, 0.18)',
  },
  {
    id: 'tx2',
    title: 'zepto order',
    date: 'SEP 18, 11:40 PM',
    amount: '₹68.67',
    method: 'UPI',
    icon: 'cart',
    iconColor: colors.categories.shopping, // #9B5DE5
    iconBg: 'rgba(155, 93, 229, 0.18)',
  },
  {
    id: 'tx3',
    title: 'Milk',
    date: 'SEP 18, 11:37 PM',
    amount: '₹12.50',
    method: 'UPI',
    icon: 'coffee',
    iconColor: colors.categories.health, // #16C784
    iconBg: 'rgba(22, 199, 132, 0.18)',
  },
  {
    id: 'tx4',
    title: 'Dahi',
    date: 'SEP 18, 11:35 PM',
    amount: '₹5',
    method: 'UPI',
    icon: 'coffee',
    iconColor: colors.categories.food, // #FF6B6B
    iconBg: 'rgba(255, 107, 107, 0.18)',
  },
];

export function RecentTransactionsWidget({ onSeeAll, scale = 1 }: RecentTransactionsWidgetProps) {
  const renderTxIcon = (type: TransactionItem['icon'], color: string) => {
    switch (type) {
      case 'cart':
        return <IconCart size={18} color={color} />;
      case 'coffee':
        return <IconCoffee size={18} color={color} />;
      case 'zap':
      default:
        return <IconZap size={18} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { fontSize: Math.round(13 * scale) }]}>
          RECENT ACTIVITY
        </Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.viewAllBtn} onPress={onSeeAll}>
          <Text style={styles.viewAllText}>See All ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {RECENT_TRANSACTIONS.map((tx) => (
          <View key={tx.id} style={styles.glassCard}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: tx.iconBg, borderColor: `${tx.iconColor}45` },
              ]}
            >
              {renderTxIcon(tx.icon, tx.iconColor)}
            </View>

            <View style={styles.detailsCol}>
              <Text style={styles.titleText}>{tx.title}</Text>
              <Text style={styles.dateText}>{tx.date}</Text>
            </View>

            <View style={styles.amountCol}>
              <Text style={styles.amountText}>{tx.amount}</Text>
              <View style={styles.methodBadge}>
                <Text style={styles.methodText}>{tx.method}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  viewAllBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  viewAllText: {
    color: colors.secondary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  listContainer: {
    gap: 8,
  },
  glassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCol: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  titleText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  dateText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  amountText: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 14.5,
  },
  methodBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  methodText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
  },
});

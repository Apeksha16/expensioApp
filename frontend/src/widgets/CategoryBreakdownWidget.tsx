import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import {
  IconCart,
  IconFilm,
  IconCoffee,
  IconZap,
} from '../components/icons/Icons';
import { colors } from '../theme/colors';

export interface CategoryItem {
  id: string;
  name: string;
  amount: string;
  percent: number;
  color: string;
  icon: 'cart' | 'film' | 'coffee' | 'zap';
}

interface CategoryBreakdownWidgetProps {
  onViewAll?: () => void;
  scale?: number;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'groceries',
    name: 'Shopping & Mart',
    amount: '₹201.17',
    percent: 44,
    color: colors.categories.shopping, // #9B5DE5
    icon: 'cart',
  },
  {
    id: 'bills',
    name: 'Subscriptions & Bills',
    amount: '₹180.00',
    percent: 39,
    color: colors.categories.bills, // #F5B700
    icon: 'film',
  },
  {
    id: 'food',
    name: 'Food & Dining',
    amount: '₹55.00',
    percent: 12,
    color: colors.categories.food, // #FF6B6B
    icon: 'coffee',
  },
  {
    id: 'health',
    name: 'Health & Essentials',
    amount: '₹21.83',
    percent: 5,
    color: colors.categories.health, // #16C784
    icon: 'zap',
  },
];

export function CategoryBreakdownWidget({ onViewAll, scale = 1 }: CategoryBreakdownWidgetProps) {
  const renderIcon = (type: CategoryItem['icon'], color: string) => {
    switch (type) {
      case 'cart':
        return <IconCart size={18} color={color} />;
      case 'film':
        return <IconFilm size={18} color={color} />;
      case 'coffee':
        return <IconCoffee size={18} color={color} />;
      case 'zap':
      default:
        return <IconZap size={18} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { fontSize: Math.round(13 * scale) }]}>
          CATEGORY BREAKDOWN
        </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onViewAll} style={styles.viewAllBtn}>
          <Text style={styles.viewAllText}>Analysis ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.glassCard}>
        {CATEGORIES.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.categoryRow,
              index !== CATEGORIES.length - 1 && styles.borderBottom,
            ]}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: `${item.color}20`, borderColor: `${item.color}45` },
              ]}
            >
              {renderIcon(item.icon, item.color)}
            </View>

            <View style={styles.contentCol}>
              <View style={styles.labelRow}>
                <Text style={styles.categoryName}>{item.name}</Text>
                <Text style={styles.amountText}>{item.amount}</Text>
              </View>

              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${item.percent}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>

              <View style={styles.percentRow}>
                <Text style={[styles.percentText, { color: item.color }]}>
                  {item.percent}% of total
                </Text>
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
  glassCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
    gap: 5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13.5,
  },
  amountText: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 13.5,
  },
  barTrack: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  percentRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

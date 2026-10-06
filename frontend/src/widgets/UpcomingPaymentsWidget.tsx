import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { IconZap, IconFilm } from '../components/icons/Icons';
import { colors } from '../theme/colors';

export interface PaymentItem {
  id: string;
  name: string;
  amount: string;
  dueText: string;
  dueStatus: 'overdue' | 'soon' | 'future';
  category: string;
}

interface UpcomingPaymentsWidgetProps {
  onViewAll?: () => void;
  onPayItem?: (item: PaymentItem) => void;
  cardWidth?: number;
  scale?: number;
}

const DEFAULT_PAYMENTS: PaymentItem[] = [
  {
    id: 'yt',
    name: 'Youtube Premium',
    amount: '₹50',
    dueText: '3 days ago',
    dueStatus: 'overdue',
    category: 'SUB',
  },
  {
    id: 'nflx',
    name: 'Netflix',
    amount: '₹130',
    dueText: 'In 2 days',
    dueStatus: 'soon',
    category: 'SUB',
  },
  {
    id: 'sptfy',
    name: 'Spotify Family',
    amount: '₹119',
    dueText: 'In 5 days',
    dueStatus: 'future',
    category: 'SUB',
  },
];

export function UpcomingPaymentsWidget({
  onViewAll,
  onPayItem,
  cardWidth = 220,
  scale = 1,
}: UpcomingPaymentsWidgetProps) {
  const getBadgeStyle = (status: PaymentItem['dueStatus']) => {
    switch (status) {
      case 'overdue':
        return {
          bg: colors.coralMuted,
          border: 'rgba(239, 68, 68, 0.25)',
          color: colors.coral,
        };
      case 'soon':
        return {
          bg: colors.warningMuted,
          border: 'rgba(245, 158, 11, 0.25)',
          color: colors.warning,
        };
      case 'future':
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.06)',
          border: 'rgba(255, 255, 255, 0.10)',
          color: colors.textSecondary,
        };
    }
  };

  const getPaymentIcon = (id: string, color: string) => {
    if (id === 'yt' || id === 'nflx') {
      return <IconFilm size={16} color={color} />;
    }
    return <IconZap size={16} color={color} />;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { fontSize: Math.round(12 * scale) }]}>
          UPCOMING PAYMENTS
        </Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.viewAllBtn} onPress={onViewAll}>
          <Text style={styles.viewAllText}>View All ›</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        decelerationRate="fast"
        snapToInterval={cardWidth + 12}
        snapToAlignment="start"
      >
        {DEFAULT_PAYMENTS.map((item) => {
          const badge = getBadgeStyle(item.dueStatus);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.glassCard, { width: cardWidth }]}
              activeOpacity={0.85}
              onPress={() => onPayItem?.(item)}
            >
              <View style={styles.cardTop}>
                <View style={[styles.iconBox, { borderColor: badge.border, backgroundColor: badge.bg }]}>
                  {getPaymentIcon(item.id, badge.color)}
                </View>
                <Text style={[styles.amountText, { fontSize: Math.round(17 * scale) }]}>
                  {item.amount}
                </Text>
              </View>

              <Text style={[styles.titleText, { fontSize: Math.round(14 * scale) }]} numberOfLines={1}>
                {item.name}
              </Text>

              <View style={styles.badgesRow}>
                <View style={styles.subBadge}>
                  <Text style={styles.subBadgeText}>{item.category}</Text>
                </View>

                <View style={styles.separatorDot} />

                <View
                  style={[
                    styles.timeBadge,
                    { backgroundColor: badge.bg, borderColor: badge.border },
                  ]}
                >
                  <Text style={[styles.timeBadgeText, { color: badge.color }]}>
                    {item.dueText}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  scrollContainer: {
    gap: 12,
    paddingRight: 10,
  },
  glassCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountText: {
    color: colors.textPrimary,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  titleText: {
    color: colors.textPrimary,
    fontWeight: '800',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  subBadgeText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
  },
  separatorDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  timeBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});

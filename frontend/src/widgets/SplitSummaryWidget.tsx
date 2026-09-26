import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import {
  IconUsers,
  IconTrendDown,
  IconTrendUp,
  IconChevronRight,
} from '../components/icons/Icons';
import { colors } from '../theme/colors';

interface SplitSummaryWidgetProps {
  onViewSplits?: () => void;
  onAddFriends?: () => void;
  onSettleGroup?: () => void;
  scale?: number;
}

export function SplitSummaryWidget({
  onViewSplits,
  onAddFriends,
  onSettleGroup,
  scale = 1,
}: SplitSummaryWidgetProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { fontSize: Math.round(13 * scale) }]}>
          SPLIT SUMMARY
        </Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.viewAllBtn} onPress={onViewSplits}>
          <Text style={styles.viewAllText}>View Details ›</Text>
        </TouchableOpacity>
      </View>

      {/* Dual Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCardLeft}>
          <View style={styles.arrowCircleEmerald}>
            <IconTrendDown size={16} color={colors.emerald} />
          </View>
          <Text style={styles.metricLabel}>You'll Get</Text>
          <Text style={[styles.metricAmount, { fontSize: Math.round(20 * scale), color: colors.emerald }]}>
            ₹8,774
          </Text>
          <Text style={styles.metricSub}>from 2 people</Text>
        </View>

        <View style={styles.metricCardRight}>
          <View style={styles.arrowCircleCoral}>
            <IconTrendUp size={16} color={colors.coral} />
          </View>
          <Text style={styles.metricLabel}>You Owe</Text>
          <Text style={[styles.metricAmount, { fontSize: Math.round(20 * scale) }]}>
            ₹0
          </Text>
          <Text style={styles.metricSub}>to 0 people</Text>
        </View>
      </View>

      {/* Active Group Card: Room GGN */}
      <View style={styles.groupCard}>
        <View style={styles.groupIconBox}>
          <IconUsers size={20} color={colors.secondary} />
        </View>

        <View style={styles.groupInfo}>
          <View style={styles.groupTitleRow}>
            <Text style={styles.groupTitle}>Room GGN</Text>
            <View style={styles.archiveBadge}>
              <Text style={styles.archiveBadgeText}>ACTIVE</Text>
            </View>
          </View>
          <Text style={styles.groupMembers}>3 members • Meds, Wifi & Groceries</Text>
          <Text style={styles.groupOweText}>
            YOU OWE <Text style={styles.groupOweAmount}>₹226</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.settleBtn}
          activeOpacity={0.8}
          onPress={onSettleGroup || onViewSplits}
        >
          <Text style={styles.settleBtnText}>Settle</Text>
        </TouchableOpacity>
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
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCardLeft: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      },
    }),
  },
  metricCardRight: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      },
    }),
  },
  arrowCircleEmerald: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.emeraldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  arrowCircleCoral: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.coralMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricAmount: {
    color: colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  metricSub: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  groupIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 3,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  archiveBadge: {
    backgroundColor: colors.emeraldMuted,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  archiveBadgeText: {
    color: colors.emerald,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  groupMembers: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  groupOweText: {
    color: colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  groupOweAmount: {
    color: colors.coral,
    fontWeight: '700',
  },
  settleBtn: {
    backgroundColor: colors.secondaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  settleBtnText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
});

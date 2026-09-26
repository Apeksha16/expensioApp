import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { IconFilm, IconZap } from '../components/icons/Icons';
import { useSubscriptions } from '../hooks';
import { formatters } from '../utils/formatters';

export function SubscriptionsScreen() {
  const {
    subscriptions,
    subTab,
    loading,
    totalMonthly,
    changeSubTab,
    markPaid,
  } = useSubscriptions();

  return (
    <View style={styles.container}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>TOTAL MONTHLY RECURRING</Text>
        <Text style={styles.totalAmount}>{formatters.currency(totalMonthly)}</Text>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, subTab === 'upcoming' && styles.tabBtnActive]}
          onPress={() => changeSubTab('upcoming')}
        >
          <Text style={[styles.tabText, subTab === 'upcoming' && styles.tabTextActive]}>
            UPCOMING
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, subTab === 'paid' && styles.tabBtnActive]}
          onPress={() => changeSubTab('paid')}
        >
          <Text style={[styles.tabText, subTab === 'paid' && styles.tabTextActive]}>
            PAID
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>SUBSCRIPTIONS</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <View style={styles.itemsList}>
          {subscriptions.map((sub) => (
            <View key={sub.id} style={styles.subCard}>
              <View style={styles.iconBox}>
                {sub.name.toLowerCase().includes('netflix') || sub.name.toLowerCase().includes('youtube') ? (
                  <IconFilm size={20} color={colors.purple} />
                ) : (
                  <IconZap size={20} color={colors.gold} />
                )}
              </View>

              <View style={styles.subInfo}>
                <Text style={styles.subTitle}>{sub.name}</Text>
                <Text style={styles.subDate}>Due {sub.dueDate}</Text>
              </View>

              <View style={styles.subRight}>
                <Text style={styles.subAmount}>{formatters.currency(sub.amount)}</Text>
                {sub.status !== 'PAID' ? (
                  <TouchableOpacity
                    style={styles.payBtn}
                    activeOpacity={0.8}
                    onPress={() => markPaid(sub.id)}
                  >
                    <Text style={styles.payBtnText}>Pay</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidBadgeText}>✓ Paid</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  itemsList: {
    gap: spacing.sm,
  },
  subCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  subRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  subAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  payBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  payBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDark,
  },
  paidBadge: {
    backgroundColor: colors.emeraldMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.emerald,
  },
});

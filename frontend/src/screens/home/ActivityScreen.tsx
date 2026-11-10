import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionItem } from '../../components/TransactionItem';
import { mockTransactions } from '../../data/mock';
import { colors, radius, spacing, typography } from '../../theme';

const filters = ['All', 'Food', 'Travel', 'Bills'];

export function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All');
  const transactions = useMemo(
    () =>
      filter === 'All'
        ? mockTransactions
        : mockTransactions.filter((item) => item.category === filter),
    [filter],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>YOUR MONEY TRAIL</Text>
          <Text style={styles.title}>Activity</Text>
          <Text style={styles.subtitle}>Every expense, clear at a glance.</Text>
        </View>
        <View style={styles.iconTile}>
          <Ionicons name="pulse-outline" size={22} color={colors.accent} />
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.filter, filter === item && styles.filterActive]}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>This month</Text>
            <Text style={styles.summaryAmount}>₹28,400</Text>
          </View>
          <View style={styles.summaryBadge}>
            <Ionicons name="trending-down" size={15} color={colors.income} />
            <Text style={styles.summaryBadgeText}>12% lower</Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Recent transactions</Text>
        <View style={styles.list}>
          {transactions.length ? (
            transactions.map((item) => <TransactionItem key={item.id} item={item} />)
          ) : (
            <Text style={styles.empty}>No expenses in this category yet.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kicker: { ...typography.label, color: colors.accent, letterSpacing: 1.4 },
  title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  iconTile: {
    width: 46, height: 46, borderRadius: radius.lg, backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { paddingTop: spacing.xl, paddingBottom: 160, gap: spacing.lg },
  filters: { gap: spacing.xs },
  filter: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  filterActive: { backgroundColor: colors.accent },
  filterText: { ...typography.captionMedium, color: colors.textSecondary },
  filterTextActive: { color: colors.textInverse },
  summary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  summaryLabel: { ...typography.caption, color: colors.textSecondary },
  summaryAmount: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.xxs },
  summaryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xxs,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.full,     backgroundColor: colors.accentSoft,
  },
  summaryBadgeText: { ...typography.captionMedium, color: colors.income },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  list: {
    backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: spacing.md,
  },
  empty: { ...typography.body, color: colors.textSecondary, paddingVertical: spacing.xl },
});

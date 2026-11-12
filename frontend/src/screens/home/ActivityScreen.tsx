import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionItem } from '../../components/TransactionItem';
import { useApp } from '../../context/AppContext';
import { colors, radius, spacing, typography } from '../../theme';

const filters = ['All', 'Expenses', 'Income'] as const;

export function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { transactions: savedTransactions } = useApp();
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const filteredTransactions = useMemo(
    () =>
      filter === 'All'
        ? savedTransactions
        : savedTransactions.filter((item) => item.type === (filter === 'Income' ? 'income' : 'expense')),
    [filter, savedTransactions],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>YOUR MONEY TRAIL</Text>
          <Text style={styles.title}>Activity</Text>
          <Text style={styles.subtitle}>Your transactions saved on this device.</Text>
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
        <Text style={styles.sectionTitle}>Transactions</Text>
        <View style={styles.list}>
          {filteredTransactions.length ? (
            filteredTransactions.map((item) => <TransactionItem key={item.id} item={item} />)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={24} color={colors.accent} />
              <Text style={styles.empty}>
                {filter === 'All' ? 'No transactions yet. Add one to see it here.' : `No ${filter.toLowerCase()} recorded yet.`}
              </Text>
            </View>
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
    minHeight: 44, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  filterActive: { backgroundColor: colors.accent },
  filterText: { ...typography.captionMedium, color: colors.textSecondary },
  filterTextActive: { color: colors.textInverse },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  list: {
    backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: spacing.md,
  },
  empty: { ...typography.body, color: colors.textSecondary, paddingVertical: spacing.xl },
  emptyState: { alignItems: 'center', gap: spacing.xs },
});

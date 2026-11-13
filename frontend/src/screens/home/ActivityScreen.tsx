import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { CURRENT_USER_ID } from '../../data/splits';
import type { MainTabParamList } from '../../navigation/MainTabs';
import { getDefaultBudgetIconId } from '../../services/budgetIconService';
import { createExpenseService, getCurrentLocalMonth, getPaymentModeLabel } from '../../services/expenseService';
import { colors, radius, spacing, typography } from '../../theme';
import type { Transaction } from '../../types';
import { formatINR } from '../../utils/format';
import { getFriendMeta } from '../../utils/splits';

type Props = BottomTabScreenProps<MainTabParamList, 'Activity'>;
const PAGE_SIZE = 20;
const filters = ['Expenses', 'Income', 'All'] as const;

function monthLabel(month: string): string {
  const [year, value] = month.split('-').map(Number);
  return new Date(year, value - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function ActivityScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    transactions,
    budgets,
    splits,
    friends,
    addTransaction,
    updateTransaction,
    authPhase,
    restoreError,
    retryRestore,
    removeTransaction,
    showToast,
  } = useApp();
  const expenseService = useMemo(() => createExpenseService({
    create: addTransaction,
    update: updateTransaction,
    delete: removeTransaction,
  }), [addTransaction, updateTransaction, removeTransaction]);
  const [filter, setFilter] = useState<(typeof filters)[number]>('Expenses');
  const [query, setQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentLocalMonth);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const loadingRef = useRef(false);
  const deleteRef = useRef(false);

  useFocusEffect(useCallback(() => {
    setSelectedMonth(getCurrentLocalMonth());
    setVisibleCount(PAGE_SIZE);
    setQuery('');
    setFilter('Expenses');
  }, []));

  const type = filter === 'Expenses' ? 'expense' : filter === 'Income' ? 'income' : 'all';
  const allFiltered = useMemo(() => expenseService.getExpenses({
    transactions,
    month: selectedMonth,
    type,
    query,
    pageSize: Math.max(transactions.length, PAGE_SIZE),
  }).items, [expenseService, transactions, selectedMonth, type, query]);
  const visiblePage = useMemo(() => expenseService.getExpenses({
    transactions,
    month: selectedMonth,
    type,
    query,
    pageSize: visibleCount,
  }), [expenseService, transactions, selectedMonth, type, query, visibleCount]);
  const monthlyTotal = useMemo(() => expenseService.getMonthlySummary(transactions, selectedMonth), [expenseService, transactions, selectedMonth]);
  const isRestoring = authPhase === 'restoring';

  const changeMonth = (delta: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const next = new Date(year, month - 1 + delta, 1);
    setSelectedMonth(getCurrentLocalMonth(next));
    setVisibleCount(PAGE_SIZE);
    loadingRef.current = false;
  };

  const loadNextPage = () => {
    if (loadingRef.current || !visiblePage.hasMore || loadingMore) return;
    loadingRef.current = true;
    setLoadingMore(true);
    requestAnimationFrame(() => {
      setVisibleCount((count) => count + PAGE_SIZE);
      setLoadingMore(false);
      loadingRef.current = false;
    });
  };

  const removeSelected = async () => {
    if (!deleteTarget || deleteRef.current || deleteTarget.canDelete === false) return;
    deleteRef.current = true;
    setDeleting(true);
    try {
      await expenseService.deleteExpense(deleteTarget.id);
      setDeleteTarget(null);
      showToast('success', deleteTarget.splitExpenseId
        ? 'Split expense removed from your activity.'
        : 'Expense deleted.');
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Unable to delete this expense. Retry when you’re back online.';
      showToast('error', message);
    } finally {
      deleteRef.current = false;
      setDeleting(false);
    }
  };

  const confirmDelete = (transaction: Transaction) => {
    setDeleteTarget(transaction);
  };

  const scrollIsNearEnd = (event: { nativeEvent: { layoutMeasurement: { height: number }; contentOffset: { y: number }; contentSize: { height: number } } }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 260) loadNextPage();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>YOUR MONEY TRAIL</Text>
          <Text style={styles.title}>Expenses</Text>
          <Text style={styles.subtitle}>Monthly spending, one clear view.</Text>
        </View>
        <View style={styles.iconTile}><Ionicons name="receipt-outline" size={22} color={colors.accent} /></View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={scrollIsNearEnd}
        scrollEventThrottle={300}
      >
        <View style={styles.monthSelector}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => changeMonth(-1)} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={20} color={colors.accent} />
          </Pressable>
          <View style={styles.monthCopy}>
            <Text style={styles.monthTitle}>{monthLabel(selectedMonth)}</Text>
            <Text style={styles.monthHint}>Personal expenses and your split shares</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => changeMonth(1)} style={styles.monthArrow}>
            <Ionicons name="chevron-forward" size={20} color={colors.accent} />
          </Pressable>
        </View>

        <View style={styles.totalCard}>
          <View style={styles.totalTop}>
            <Text style={styles.totalLabel}>TOTAL EXPENSES</Text>
            <View style={styles.totalIcon}><Ionicons name="trending-down-outline" size={17} color={colors.white} /></View>
          </View>
          {isRestoring ? (
            <View style={styles.totalLoading}><ActivityIndicator color={colors.white} /><Text style={styles.totalHint}>Loading this month…</Text></View>
          ) : restoreError ? (
            <View style={styles.loadError}>
              <Text style={styles.totalValue}>Unavailable</Text>
              <Text style={styles.totalHint}>{restoreError}</Text>
              <Pressable accessibilityRole="button" onPress={retryRestore} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.totalValue}>{formatINR(monthlyTotal)}</Text>
              <Text style={styles.totalHint}>{monthlyTotal === 0 ? 'No expenses recorded this month.' : 'Includes only expenses from this month.'}</Text>
            </>
          )}
        </View>

        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Add', { type: 'expense' })} style={styles.addButton}>
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Add expense</Text>
        </Pressable>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput value={query} onChangeText={(value) => { setQuery(value); setVisibleCount(PAGE_SIZE); }} placeholder="Search expenses" placeholderTextColor={colors.textTertiary} accessibilityLabel="Search expenses" returnKeyType="search" style={styles.searchInput} />
          {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => { setQuery(''); setVisibleCount(PAGE_SIZE); }} hitSlop={8}><Ionicons name="close-circle" size={18} color={colors.textTertiary} /></Pressable> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((item) => (
            <Pressable key={item} accessibilityRole="radio" accessibilityState={{ checked: filter === item }} onPress={() => { setFilter(item); setVisibleCount(PAGE_SIZE); }} style={[styles.filter, filter === item && styles.filterActive]}>
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.listHeading}>
          <Text style={styles.sectionTitle}>{filter === 'Income' ? 'Income' : 'Expenses'}</Text>
          <Text style={styles.count}>{allFiltered.length}</Text>
        </View>
        {isRestoring ? (
          <View style={styles.emptyState}><ActivityIndicator color={colors.accent} /><Text style={styles.empty}>Loading transactions…</Text></View>
        ) : restoreError ? (
          <View style={styles.emptyState}>
            <Text style={styles.empty}>Couldn’t load your expenses.</Text>
            <Pressable accessibilityRole="button" onPress={retryRestore} style={styles.retryButtonLight}><Text style={styles.retryTextLight}>Retry</Text></Pressable>
          </View>
        ) : visiblePage.items.length ? (
          <View style={styles.list}>
            {visiblePage.items.map((item) => {
              const linkedSplit = splits.find((split) =>
                split.id === item.splitExpenseId || split.ledgerTransactionId === item.id);
              const ownShare = linkedSplit?.shares.find((share) => share.friendId === CURRENT_USER_ID)?.amount ?? item.amount;
              const creatorId = linkedSplit?.createdById;
              const creatorName = linkedSplit?.createdByName
                ?? item.createdByName
                ?? (creatorId && creatorId !== CURRENT_USER_ID ? getFriendMeta(creatorId, friends).name : undefined);
              const canEdit = item.canEdit !== false && (!linkedSplit || !creatorId || creatorId === CURRENT_USER_ID);
              const canDelete = item.canDelete !== false && (!linkedSplit || !creatorId || creatorId === CURRENT_USER_ID);
              const budget = budgets.find((entry) => entry.id === item.budgetId);
              const iconId = budget?.iconId || getDefaultBudgetIconId(item.category);
              return (
                <View key={item.id} style={styles.transactionRow}>
                  <View style={[styles.rowIcon, { backgroundColor: `${item.iconColor || colors.accent}18` }]}>
                    <Ionicons name={iconId as keyof typeof Ionicons.glyphMap} size={19} color={item.iconColor || colors.accent} />
                  </View>
                  <View style={styles.transactionCopy}>
                    <Text style={styles.merchant} numberOfLines={1}>{item.merchant}</Text>
                    <Text style={styles.transactionSub} numberOfLines={1}>{item.category} · {item.date}</Text>
                    <Text style={styles.transactionSub}>{getPaymentModeLabel(item.paymentMode)}</Text>
                    {linkedSplit ? (
                      <View style={styles.splitMeta}>
                        <Text style={styles.splitBadge}>SPLIT</Text>
                        <Text style={styles.transactionSub}>Your share {formatINR(ownShare)}</Text>
                        {creatorName && creatorId !== CURRENT_USER_ID ? <Text style={styles.transactionSub}>Created by {creatorName}</Text> : null}
                        {!canEdit && !item.budgetId ? (
                          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Budgets')}>
                            <Text style={styles.assignmentLink}>Assign your share in Budgets</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                    {linkedSplit && !canEdit ? <Text style={styles.readOnlyText}>Only the creator can change this expense.</Text> : null}
                  </View>
                  <View style={styles.amountAndActions}>
                    <Text style={[styles.amount, item.type === 'income' && styles.incomeAmount]}>{item.type === 'income' ? '+' : '-'}{formatINR(ownShare)}</Text>
                    {canEdit || canDelete ? (
                      <View style={styles.rowActions}>
                        {canEdit ? <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${item.merchant}`} onPress={() => navigation.navigate('Add', { transactionId: item.id })} hitSlop={8} style={styles.actionButton}><Ionicons name="pencil-outline" size={15} color={colors.accent} /></Pressable> : null}
                        {canDelete ? <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${item.merchant}`} onPress={() => confirmDelete(item)} hitSlop={8} style={styles.actionButton}><Ionicons name="trash-outline" size={15} color={colors.expense} /></Pressable> : null}
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Ionicons name="receipt-outline" size={22} color={colors.accent} /></View>
            <Text style={styles.emptyTitle}>{query ? 'No matches' : `No ${filter.toLowerCase()} this month`}</Text>
            <Text style={styles.empty}>{query ? 'Try another name or category.' : 'Your monthly total is ₹0. Add an expense when you’re ready.'}</Text>
            {!query ? <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Add', { type: 'expense' })} style={styles.emptyAdd}><Text style={styles.emptyAddText}>Add expense</Text></Pressable> : null}
          </View>
        )}

        {loadingMore ? <View style={styles.pageStatus}><ActivityIndicator size="small" color={colors.accent} /><Text style={styles.pageStatusText}>Loading more…</Text></View> : null}
        {!visiblePage.hasMore && visiblePage.items.length ? <Text style={styles.endState}>You’re all caught up for {monthLabel(selectedMonth)}.</Text> : null}
      </ScrollView>

      <Modal visible={deleteTarget !== null} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteCard}>
            <Text style={styles.deleteTitle}>Confirm deletion</Text>
            <Text style={styles.deleteMessage}>{deleteTarget && splits.some((split) => split.id === deleteTarget.splitExpenseId || split.ledgerTransactionId === deleteTarget.id)
              ? 'This split will be deleted from this device. Participant copies cannot be updated in the local-only version.'
              : 'This expense will be removed from your local activity.'}</Text>
            <View style={styles.deleteActions}>
              <Pressable accessibilityRole="button" disabled={deleting} onPress={() => setDeleteTarget(null)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={deleting} onPress={() => void removeSelected()} style={styles.confirmDeleteButton}><Text style={styles.confirmDeleteText}>{deleting ? 'Deleting…' : 'Delete'}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kicker: { ...typography.label, color: colors.accent, letterSpacing: 1.4 },
  title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  iconTile: { width: 46, height: 46, borderRadius: radius.lg, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingTop: spacing.lg, paddingBottom: 160, gap: spacing.md },
  monthSelector: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xs, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  monthArrow: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.accentSoft },
  disabledArrow: { backgroundColor: colors.background },
  monthCopy: { flex: 1, alignItems: 'center', gap: 2 },
  monthTitle: { ...typography.bodySemibold, color: colors.textPrimary },
  monthHint: { ...typography.micro, color: colors.textTertiary },
  totalCard: { padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.accentDark, gap: spacing.xs },
  totalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { ...typography.micro, color: colors.surprise, fontWeight: '700', letterSpacing: 1 },
  totalIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.12)' },
  totalValue: { ...typography.h1, color: colors.white },
  totalHint: { ...typography.caption, color: 'rgba(255,255,255,0.72)' },
  totalLoading: { minHeight: 45, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  loadError: { gap: spacing.xs },
  retryButton: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.white },
  retryText: { ...typography.captionMedium, color: colors.accentDark },
  retryButtonLight: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.accentSoft },
  retryTextLight: { ...typography.captionMedium, color: colors.accentDark },
  addButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radius.full, backgroundColor: colors.accent },
  addButtonText: { ...typography.captionMedium, color: colors.white },
  searchBox: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, minWidth: 0, ...typography.caption, color: colors.textPrimary, paddingVertical: spacing.xs },
  filters: { gap: spacing.xs },
  filter: { minHeight: 40, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.accent },
  filterText: { ...typography.captionMedium, color: colors.textSecondary },
  filterTextActive: { color: colors.textInverse },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  count: { ...typography.captionMedium, color: colors.accent, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.full, backgroundColor: colors.accentSoft },
  list: { paddingHorizontal: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  transactionRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  transactionCopy: { flex: 1, minWidth: 0, gap: 2 },
  merchant: { ...typography.bodyMedium, color: colors.textPrimary },
  transactionSub: { ...typography.micro, color: colors.textTertiary },
  assignmentLink: { ...typography.micro, color: colors.accent, textDecorationLine: 'underline' },
  splitMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  splitBadge: { ...typography.micro, color: colors.accentDark, fontWeight: '700', paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.accentSoft },
  readOnlyText: { ...typography.micro, color: colors.warning },
  amountAndActions: { alignItems: 'flex-end', gap: spacing.xs },
  amount: { ...typography.captionMedium, color: colors.expense },
  incomeAmount: { color: colors.income },
  rowActions: { flexDirection: 'row', gap: spacing.xxs },
  actionButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.background },
  emptyState: { alignItems: 'center', gap: spacing.xs, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  emptyIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.accentSoft },
  emptyTitle: { ...typography.bodySemibold, color: colors.textPrimary },
  empty: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  emptyAdd: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.accentSoft },
  emptyAddText: { ...typography.captionMedium, color: colors.accentDark },
  pageStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  pageStatusText: { ...typography.caption, color: colors.textSecondary },
  endState: { ...typography.micro, textAlign: 'center', color: colors.textTertiary, paddingVertical: spacing.md },
  deleteOverlay: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.overlay },
  deleteCard: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: spacing.lg, gap: spacing.md, borderRadius: radius.xl, backgroundColor: colors.background },
  deleteTitle: { ...typography.h3, color: colors.textPrimary },
  deleteMessage: { ...typography.caption, color: colors.textSecondary, lineHeight: 20 },
  deleteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  cancelButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.full, backgroundColor: colors.surface },
  cancelText: { ...typography.captionMedium, color: colors.textSecondary },
  confirmDeleteButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: radius.full, backgroundColor: colors.expense },
  confirmDeleteText: { ...typography.captionMedium, color: colors.white },
});

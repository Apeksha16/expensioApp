import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrencyInput } from '../../components/CurrencyInput';
import { InputField } from '../../components/InputField';
import { TransactionItem } from '../../components/TransactionItem';
import { useApp } from '../../context/AppContext';
import { colors, radius, spacing, typography } from '../../theme';
import type { Transaction } from '../../types';
import { validateDate } from '../../services/moneyService';

const filters = ['All', 'Expenses', 'Income'] as const;

export function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { transactions: savedTransactions, updateTransaction, removeTransaction, showToast } = useApp();
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const [query, setQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [draftMerchant, setDraftMerchant] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftAmount, setDraftAmount] = useState(0);
  const [draftType, setDraftType] = useState<'expense' | 'income'>('expense');
  const [draftDate, setDraftDate] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const filteredTransactions = useMemo(
    () =>
      (filter === 'All'
        ? savedTransactions
        : savedTransactions.filter((item) => item.type === (filter === 'Income' ? 'income' : 'expense')))
        .filter((item) => `${item.merchant} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase()))
        .filter((item) => {
          if (!rangeStart && !rangeEnd) return true;
          const date = typeof item.occurredAt === 'number'
            ? new Date(item.occurredAt)
            : item.date === 'Today' || item.date === 'Yesterday'
              ? new Date(Date.now())
              : new Date(item.date);
          if (item.date === 'Yesterday' && item.occurredAt === undefined) date.setDate(date.getDate() - 1);
          if (Number.isNaN(date.getTime())) return false;
          const dateValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          return (!rangeStart || dateValue >= rangeStart) && (!rangeEnd || dateValue <= rangeEnd);
        }),
    [filter, query, rangeStart, rangeEnd, savedTransactions],
  );
  const rangeError = (() => {
    try {
      if (rangeStart) validateDate(rangeStart, 'start date');
      if (rangeEnd) validateDate(rangeEnd, 'end date');
      if (rangeStart && rangeEnd && rangeStart > rangeEnd) return 'Start date must be on or before end date.';
      return '';
    } catch (validationError) {
      return validationError instanceof Error ? validationError.message : 'Choose a valid date range.';
    }
  })();

  const openEditor = (item: Transaction) => {
    setSelectedTransaction(item);
    setDraftMerchant(item.merchant);
    setDraftCategory(item.category);
    setDraftAmount(item.amount);
    setDraftType(item.type);
    const date = typeof item.occurredAt === 'number' ? new Date(item.occurredAt) : new Date();
    setDraftDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
    setConfirmDelete(false);
    setError('');
  };

  const saveEdit = async () => {
    if (!selectedTransaction || saving) return;
    setSaving(true);
    setError('');
    try {
      await updateTransaction(selectedTransaction.id, {
        merchant: draftMerchant,
        category: draftCategory,
        amount: draftAmount,
        type: draftType,
        date: draftDate,
      });
      setSelectedTransaction(null);
      showToast('success', 'Transaction updated.');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to update this transaction.';
      setError(message);
      showToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSelected = async () => {
    if (!selectedTransaction || saving) return;
    setSaving(true);
    try {
      await removeTransaction(selectedTransaction.id);
      setSelectedTransaction(null);
      setConfirmDelete(false);
      showToast('success', 'Transaction removed.');
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Unable to remove this transaction.';
      setError(message);
      showToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>YOUR MONEY TRAIL</Text>
          <Text style={styles.title}>Transactions</Text>
          <Text style={styles.subtitle}>Your activity, organized in one place.</Text>
        </View>
        <View style={styles.iconTile}>
          <Ionicons name="pulse-outline" size={22} color={colors.accent} />
        </View>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search transactions"
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Search transactions"
            returnKeyType="search"
            style={styles.searchInput}
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setQuery('')}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.dateRange}>
          <TextInput
            accessibilityLabel="Transactions from date"
            value={rangeStart}
            onChangeText={setRangeStart}
            placeholder="From YYYY-MM-DD"
            placeholderTextColor={colors.textTertiary}
            style={styles.rangeInput}
          />
          <Text style={styles.rangeDivider}>to</Text>
          <TextInput
            accessibilityLabel="Transactions through date"
            value={rangeEnd}
            onChangeText={setRangeEnd}
            placeholder="To YYYY-MM-DD"
            placeholderTextColor={colors.textTertiary}
            style={styles.rangeInput}
          />
        </View>
        {rangeError ? <Text style={styles.error}>{rangeError}</Text> : null}
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
        <View style={styles.listHeading}>
          <Text style={styles.sectionTitle}>{filter === 'All' ? 'Recent transactions' : filter}</Text>
          <Text style={styles.count}>{filteredTransactions.length}</Text>
        </View>
        <View style={styles.list}>
          {filteredTransactions.length ? (
            filteredTransactions.map((item) => (
              <View key={item.id} style={styles.transactionRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.merchant}`}
                  onPress={() => openEditor(item)}
                  style={styles.transactionItem}
                >
                  <TransactionItem item={item} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit transaction ${item.merchant}`}
                  onPress={() => openEditor(item)}
                  hitSlop={8}
                  style={styles.editAction}
                >
                  <Ionicons name="pencil-outline" size={16} color={colors.accent} />
                </Pressable>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={24} color={colors.accent} />
              <Text style={styles.empty}>
                {query
                  ? 'No transactions match your search.'
                  : filter === 'All'
                    ? 'No transactions yet. Add one to see it here.'
                    : `No ${filter.toLowerCase()} recorded yet.`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={selectedTransaction !== null}
        transparent
        animationType="fade"
        onRequestClose={() => { setSelectedTransaction(null); setConfirmDelete(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editorCard}>
            <View style={styles.editorHeader}>
              <View style={styles.editorHeadingCopy}>
                <Text style={styles.editorTitle}>{confirmDelete ? 'Remove transaction?' : 'Edit transaction'}</Text>
                <Text style={styles.editorSubtitle}>
                  {confirmDelete ? 'This entry will be removed from this device.' : 'Changes update your local money history.'}
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close editor" onPress={() => { setSelectedTransaction(null); setConfirmDelete(false); }} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            {confirmDelete ? (
              <View style={styles.deletePrompt}>
                <Text style={styles.deleteText}>{selectedTransaction?.merchant}</Text>
                <Text style={styles.deleteAmount}>{selectedTransaction ? `₹${selectedTransaction.amount.toLocaleString('en-IN')}` : ''}</Text>
              </View>
            ) : (
              <>
                <View style={styles.typeOptions}>
                  {(['expense', 'income'] as const).map((type) => (
                    <Pressable key={type} accessibilityRole="radio" accessibilityState={{ checked: draftType === type }} onPress={() => setDraftType(type)} style={[styles.typeOption, draftType === type && styles.typeOptionActive]}>
                      <Text style={[styles.typeOptionText, draftType === type && styles.typeOptionTextActive]}>{type === 'expense' ? 'Expense' : 'Income'}</Text>
                    </Pressable>
                  ))}
                </View>
                <InputField label="Name" value={draftMerchant} onChangeText={setDraftMerchant} />
                <InputField label="Category" value={draftCategory} onChangeText={setDraftCategory} />
                <CurrencyInput label="Amount" value={draftAmount} onChangeValue={setDraftAmount} variant="card" />
                <InputField label="Date" value={draftDate} onChangeText={setDraftDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
                {error ? <Text style={styles.error}>{error}</Text> : null}
              </>
            )}
            <View style={styles.editorActions}>
              {confirmDelete ? (
                <>
                  <Pressable accessibilityRole="button" onPress={() => setConfirmDelete(false)} style={styles.cancelButton}>
                    <Text style={styles.cancelText}>Keep it</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" disabled={saving} onPress={() => void deleteSelected()} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>{saving ? 'Removing…' : 'Remove'}</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable accessibilityRole="button" onPress={() => setConfirmDelete(true)} style={styles.removeLink}>
                    <Ionicons name="trash-outline" size={17} color={colors.expense} />
                    <Text style={styles.removeLinkText}>Remove</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" disabled={saving} onPress={() => void saveEdit()} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save changes'}</Text>
                  </Pressable>
                </>
              )}
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
  iconTile: {
    width: 46, height: 46, borderRadius: radius.lg, backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { paddingTop: spacing.xl, paddingBottom: 160, gap: spacing.lg },
  searchBox: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, minWidth: 0, ...typography.caption, color: colors.textPrimary, paddingVertical: spacing.xs },
  dateRange: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rangeInput: { flex: 1, minWidth: 0, height: 42, borderRadius: radius.md, paddingHorizontal: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...typography.caption, color: colors.textPrimary },
  rangeDivider: { ...typography.caption, color: colors.textTertiary },
  filters: { gap: spacing.xs },
  filter: {
    minHeight: 44, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  filterActive: { backgroundColor: colors.accent },
  filterText: { ...typography.captionMedium, color: colors.textSecondary },
  filterTextActive: { color: colors.textInverse },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  count: { ...typography.captionMedium, color: colors.accent, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.full, backgroundColor: colors.accentSoft },
  list: {
    backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: spacing.md,
  },
  transactionRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  transactionItem: { flex: 1 },
  editAction: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty: { ...typography.body, color: colors.textSecondary, paddingVertical: spacing.xl },
  emptyState: { alignItems: 'center', gap: spacing.xs },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.overlay },
  editorCard: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: spacing.lg, gap: spacing.md, borderRadius: radius.xl, backgroundColor: colors.background },
  editorHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  editorHeadingCopy: { flex: 1, gap: 3 },
  editorTitle: { ...typography.h3, color: colors.textPrimary },
  editorSubtitle: { ...typography.caption, color: colors.textSecondary },
  typeOptions: { flexDirection: 'row', gap: spacing.xs },
  typeOption: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  typeOptionActive: { backgroundColor: colors.accent },
  typeOptionText: { ...typography.captionMedium, color: colors.textSecondary, textTransform: 'capitalize' },
  typeOptionTextActive: { color: colors.white },
  deletePrompt: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, gap: spacing.xs },
  deleteText: { ...typography.bodySemibold, color: colors.textPrimary },
  deleteAmount: { ...typography.body, color: colors.textSecondary },
  editorActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  cancelButton: { minHeight: 46, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.full, backgroundColor: colors.surface },
  cancelText: { ...typography.captionMedium, color: colors.textSecondary },
  deleteButton: { minHeight: 46, justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: radius.full, backgroundColor: colors.expense },
  deleteButtonText: { ...typography.captionMedium, color: colors.white },
  removeLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs },
  removeLinkText: { ...typography.captionMedium, color: colors.expense },
  saveButton: { minHeight: 46, justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: radius.full, backgroundColor: colors.accent },
  saveButtonText: { ...typography.captionMedium, color: colors.white },
  error: { ...typography.caption, color: colors.expense },
});

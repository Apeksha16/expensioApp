import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Platform,
  ListRenderItemInfo,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { ExpenseItem, ExpenseCategory, AccountType } from '../types';
import {
  IconCart,
  IconCoffee,
  IconZap,
  IconTarget,
  IconPlus,
} from '../components/icons/Icons';
import { BottomSheet } from '../components/BottomSheet';
import { SwipeableRow } from '../components/SwipeableRow';
import { useExpenses } from '../hooks';
import { formatters } from '../utils/formatters';

export function ExpensesScreen() {
  const {
    expenses,
    loading,
    refreshing,
    totalSpend,
    addExpense,
    deleteExpense,
    refresh,
  } = useExpenses();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('food');
  const [newAccount, setNewAccount] = useState<AccountType>('salary');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    setSubmitting(true);
    const success = await addExpense({
      title: newTitle,
      amount: newAmount,
      category: newCategory,
      account: newAccount,
    });
    setSubmitting(false);

    if (success) {
      setNewTitle('');
      setNewAmount('');
      setIsSheetOpen(false);
    }
  };

  const renderCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
      case 'food':
        return <IconCoffee size={18} color={colors.categories.food} />;
      case 'shopping':
        return <IconCart size={18} color={colors.categories.shopping} />;
      case 'bills':
        return <IconZap size={18} color={colors.categories.bills} />;
      default:
        return <IconTarget size={18} color={colors.primary} />;
    }
  };

  const renderExpenseItem = useCallback(
    ({ item }: ListRenderItemInfo<ExpenseItem>) => (
      <SwipeableRow
        actionText="Delete"
        actionColor={colors.coral}
        onAction={() => deleteExpense(item.id)}
      >
        <View style={styles.txCard}>
          <View style={styles.iconBox}>{renderCategoryIcon(item.category)}</View>
          <View style={styles.txInfo}>
            <Text style={styles.txTitle}>{item.title}</Text>
            <Text style={styles.txDate}>{item.date}</Text>
          </View>
          <View style={styles.txRight}>
            <Text style={styles.txAmount}>{formatters.currency(item.amount)}</Text>
            <Text style={styles.txMethod}>{item.method || 'UPI'}</Text>
          </View>
        </View>
      </SwipeableRow>
    ),
    [deleteExpense]
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Total Spend Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <Text style={styles.summaryLabel}>Total Spend</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>THIS MONTH</Text>
          </View>
        </View>
        <Text style={styles.totalAmount}>{formatters.currency(totalSpend)}</Text>

        {/* Salary Account Budget Progress */}
        <View style={styles.budgetRow}>
          <View style={styles.budgetLabels}>
            <Text style={styles.budgetName}>SALARY ACCOUNT</Text>
            <Text style={styles.budgetTotal}>₹31,627</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '92%', backgroundColor: colors.primary }]} />
          </View>
        </View>

        {/* Quick Add Button */}
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.85}
          onPress={() => setIsSheetOpen(true)}
        >
          <IconPlus size={16} color={colors.textDark} />
          <Text style={styles.addBtnText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>TRANSACTIONS</Text>
        <Text style={styles.countText}>{expenses.length} items (Swipe left to delete)</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxxl }} />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={renderExpenseItem}
          ListHeaderComponent={renderHeader}
          refreshing={refreshing}
          onRefresh={refresh}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />
      )}

      {/* Native Slide-Up Bottom Sheet for Adding Expense */}
      <BottomSheet visible={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
        <Text style={styles.sheetTitle}>Record Expense</Text>

        <TextInput
          style={styles.input}
          placeholder="Expense title (e.g. Zepto, Coffee)"
          placeholderTextColor={colors.textMuted}
          value={newTitle}
          onChangeText={setNewTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Amount (₹)"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          value={newAmount}
          onChangeText={setNewAmount}
        />

        <View style={styles.categoryPicker}>
          {(['food', 'shopping', 'bills', 'general'] as ExpenseCategory[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                newCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setNewCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  newCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sheetActions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setIsSheetOpen(false)}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.textDark} />
            ) : (
              <Text style={styles.confirmBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  budgetRow: {
    marginBottom: spacing.lg,
  },
  budgetLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  budgetName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  budgetTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 44,
    gap: spacing.xs,
  },
  addBtnText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '700',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  countText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  txMethod: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  categoryPicker: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  categoryChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.textDark,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  confirmBtnText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '700',
  },
});

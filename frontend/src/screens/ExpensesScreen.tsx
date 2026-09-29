import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  ListRenderItemInfo,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheet } from '../components/BottomSheet';
import { SwipeableRow } from '../components/SwipeableRow';
import { useExpenses } from '../hooks';
import { formatters } from '../utils/formatters';
import { storage, STORAGE_KEYS } from '../services/storage';
import { haptics } from '../services/haptics';
import { useDrawer } from '../navigation/RootNavigator';
import type { ExpenseItem, ExpenseCategory, AccountType } from '../types';

export function ExpensesScreen({ route, navigation }: any) {
  const { openDrawer } = useDrawer();
  const {
    expenses,
    loading,
    refreshing,
    totalSpend,
    addExpense,
    deleteExpense,
    refresh,
  } = useExpenses();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | ExpenseCategory>('all');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('food');
  const [newAccount, setNewAccount] = useState<AccountType>('salary');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const saved = await storage.get<any>(STORAGE_KEYS.AUTH_USER, null);
      if (saved) setUserProfile(saved);
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (route?.params?.openNewExpense) {
      setIsSheetOpen(true);
      navigation.setParams({ openNewExpense: undefined });
    }
  }, [route?.params?.openNewExpense, navigation]);

  const user = userProfile?.user || userProfile;
  const rawSalary = Number(user?.salary) || 31627;
  const remainingBudget = Math.max(0, rawSalary - totalSpend);
  const budgetPercent = Math.min(100, Math.round((totalSpend / rawSalary) * 100));

  const cashBalance = -80;
  const cashTotal = -80;
  const cashPercent = 100; // Since it's negative, we just mock 100% or something visually.

  const handleSave = async () => {
    if (!newTitle.trim() || !newAmount.trim()) return;
    setSubmitting(true);
    const success = await addExpense({
      title: newTitle.trim(),
      amount: newAmount.trim(),
      category: newCategory,
      account: newAccount,
    });
    setSubmitting(false);

    if (success) {
      haptics.success();
      setNewTitle('');
      setNewAmount('');
      setIsSheetOpen(false);
    }
  };

  const getCategoryDetails = (title: string, category: ExpenseCategory) => {
    const lower = (title || '').toLowerCase();
    if (lower.includes('zepto') || lower.includes('quick') || lower.includes('grocery') || category === 'shopping') {
      return { icon: 'shopping-bag' as const, color: '#7C3AED', bg: '#F5F3FF', label: 'Shopping' };
    }
    if (lower.includes('milk') || lower.includes('dahi') || lower.includes('coffee') || lower.includes('chai') || category === 'food') {
      return { icon: 'coffee' as const, color: '#059669', bg: '#ECFDF5', label: 'Food & Dairy' };
    }
    if (lower.includes('soap') || lower.includes('clean') || lower.includes('wash') || lower.includes('home')) {
      return { icon: 'droplet' as const, color: '#0284C7', bg: '#F0F9FF', label: 'Household' };
    }
    if (lower.includes('ice cream') || lower.includes('sweet') || lower.includes('swiggy') || lower.includes('zomato')) {
      return { icon: 'heart' as const, color: '#E11D48', bg: '#FFF1F2', label: 'Dining & Treats' };
    }
    if (lower.includes('bill') || lower.includes('wi-fi') || lower.includes('recharge') || category === 'bills') {
      return { icon: 'zap' as const, color: '#D97706', bg: '#FFFBEB', label: 'Bills' };
    }
    return { icon: 'credit-card' as const, color: '#2563EB', bg: '#EFF6FF', label: 'General' };
  };

  const filteredExpenses = selectedFilter === 'all'
    ? expenses
    : expenses.filter((e) => e.category === selectedFilter);

  const renderExpenseItem = useCallback(
    ({ item }: ListRenderItemInfo<ExpenseItem>) => {
      const meta = getCategoryDetails(item.title, item.category);

      return (
        <SwipeableRow
          actionText="Delete"
          actionColor="#E11D48"
          onAction={() => {
            haptics.medium();
            deleteExpense(item.id);
          }}
        >
          <View style={styles.txCard}>
            <View style={[styles.txIconBox, { backgroundColor: meta.bg }]}>
              <Feather name={meta.icon} size={18} color={meta.color} />
            </View>

            <View style={styles.txInfoCol}>
              <Text style={styles.txTitleText} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.txMetaText}>
                {item.date} • {item.method || 'UPI'}
              </Text>
            </View>

            <View style={styles.txRightCol}>
              <Text style={styles.txAmountText}>
                -{formatters.currency(item.amount)}
              </Text>
              <View style={styles.accountTag}>
                <Text style={styles.accountTagText}>
                  {item.account === 'salary' ? 'Salary' : 'General'}
                </Text>
              </View>
            </View>
          </View>
        </SwipeableRow>
      );
    },
    [deleteExpense]
  );

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      {/* Title Bar */}
      <View style={styles.screenTitleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => { haptics.selection(); openDrawer(); }} style={{ marginRight: 12 }}>
            <Feather name="menu" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.screenHeading}>Expenses</Text>
            <Text style={styles.screenSubheading}>Live UPI ledger & auto-categorization</Text>
          </View>
        </View>

        <View style={styles.monthBadge}>
          <Text style={styles.monthBadgeText}>This Month ▾</Text>
        </View>
      </View>

      {/* 1. HERO APPLE LIQUID GLASS CARD */}
      <View style={styles.heroGlassCard}>
        <View style={styles.glassTopSpecular} />

        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(244, 248, 255, 0.88)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCardInner}
        >
          <View style={styles.heroTopStatusRow}>
            <View style={styles.accountPill}>
              <View style={styles.activeDot} />
              <Text style={styles.accountPillText}>ALL ACCOUNTS</Text>
            </View>
          </View>

          <Text style={styles.totalSpendLabel}>TOTAL SPENT THIS MONTH</Text>
          <Text style={styles.totalSpendAmount}>{formatters.currency(totalSpend)}</Text>

          {/* Salary Account Progress Track */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelsRow}>
              <Text style={styles.progressRemainingText}>
                SALARY ACCOUNT <Text style={styles.leftLabelText}>₹{remainingBudget.toLocaleString('en-IN')} LEFT</Text>
              </Text>
              <Text style={styles.progressPercentText}>TOTAL ₹{rawSalary.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.progressTrackBg}>
              <LinearGradient
                colors={['#059669', '#34D399']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFillGrad, { width: `${Math.max(budgetPercent, 4)}%` }]}
              />
            </View>
          </View>

          {/* Cash Account Progress Track */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelsRow}>
              <Text style={styles.progressRemainingText}>
                CASH ACCOUNT <Text style={styles.leftLabelText}>-₹80 LEFT</Text>
              </Text>
              <Text style={styles.progressPercentText}>TOTAL -₹80</Text>
            </View>
            <View style={[styles.progressTrackBg, { marginBottom: 16 }]}>
              <LinearGradient
                colors={['#F43F5E', '#FDA4AF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFillGrad, { width: `5%` }]}
              />
            </View>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.addExpenseBtn}
            activeOpacity={0.85}
            onPress={() => {
              haptics.medium();
              setIsSheetOpen(true);
            }}
          >
            <Feather name="plus" size={17} color="#FFFFFF" />
            <Text style={styles.addExpenseBtnText}>Record Expense</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* 2. CATEGORY FILTER CHIPS */}
      <View style={styles.filterChipsRow}>
        {(['all', 'shopping', 'food', 'bills'] as const).map((filter) => {
          const isSelected = selectedFilter === filter;
          const label = filter === 'all' ? 'All Ledger' : filter.charAt(0).toUpperCase() + filter.slice(1);

          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                isSelected && styles.filterChipSelected,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                haptics.selection();
                setSelectedFilter(filter);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextSelected,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. LIST HEADER */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>TRANSACTIONS</Text>
        <Text style={styles.listHeaderCount}>
          {filteredExpenses.length} items • Swipe left to delete
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* Ambient Atmospheric Light */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#EDF4FE', '#F8FAFD', '#F4F7FB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.ambientGlow} />
      </View>

      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator color="#2563EB" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredExpenses}
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
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        )}
      </View>

      {/* Light Theme Bottom Sheet for Adding Expense */}
      <BottomSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        theme="light"
      >
        <Text style={styles.sheetTitle}>New Expense</Text>

        <TextInput
          style={styles.sheetInput}
          placeholder="Expense title (e.g. Zepto, Coffee)"
          placeholderTextColor="#94A3B8"
          value={newTitle}
          onChangeText={setNewTitle}
        />

        <TextInput
          style={styles.sheetInput}
          placeholder="Amount (₹)"
          placeholderTextColor="#94A3B8"
          keyboardType="decimal-pad"
          value={newAmount}
          onChangeText={setNewAmount}
        />

        <Text style={styles.sheetPickerLabel}>Select Category</Text>
        <View style={styles.categoryPickerRow}>
          {(['food', 'shopping', 'bills', 'general'] as ExpenseCategory[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChoiceChip,
                newCategory === cat && styles.categoryChoiceChipActive,
              ]}
              onPress={() => {
                haptics.selection();
                setNewCategory(cat);
              }}
            >
              <Text
                style={[
                  styles.categoryChoiceText,
                  newCategory === cat && styles.categoryChoiceTextActive,
                ]}
              >
                {cat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sheetActionsRow}>
          <TouchableOpacity
            style={styles.sheetCancelBtn}
            onPress={() => setIsSheetOpen(false)}
          >
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetSaveBtn}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.sheetSaveText}>Save Expense</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFD',
  },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingTop: Platform.OS === 'android' ? 44 : 20,
    paddingBottom: 110, // clear floating tab bar
  },
  headerBlock: {
    marginBottom: 16,
  },

  // Title Bar
  screenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  screenSubheading: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  monthBadge: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  monthBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Hero Glass Card
  heroGlassCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
    elevation: 4,
  },
  glassTopSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 2,
  },
  heroCardInner: {
    padding: 20,
  },
  heroTopStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  accountPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.6,
  },
  salaryBudgetTotal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  totalSpendLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  totalSpendAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
    marginBottom: 14,
  },

  // Progress Bar
  progressContainer: {
    marginBottom: 18,
  },
  progressTrackBg: {
    height: 8,
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFillGrad: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  progressRemainingText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  leftLabelText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0,
  },
  progressPercentText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },

  // Button
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  addExpenseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Filter Chips
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },

  // List Header
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listHeaderTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  listHeaderCount: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },

  // Transaction Cards
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  txIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfoCol: {
    flex: 1,
    marginRight: 10,
  },
  txTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  txMetaText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  txRightCol: {
    alignItems: 'flex-end',
  },
  txAmountText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  accountTag: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  accountTagText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
  },

  // Bottom Sheet
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  sheetInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  sheetPickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
    marginTop: 4,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  categoryChoiceChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  categoryChoiceChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryChoiceText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  categoryChoiceTextActive: {
    color: '#FFFFFF',
  },
  sheetActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  sheetCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sheetCancelText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  sheetSaveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  sheetSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

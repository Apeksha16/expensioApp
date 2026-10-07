import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
  ListRenderItemInfo,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SwipeableRow } from '../components/SwipeableRow';
import { useFinance } from '../hooks/FinanceContext';
import { TransactionSheet } from '../components/TransactionSheet';
import { useDrawer } from '../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage, STORAGE_KEYS } from '../services/storage';
import { haptics } from '../services/haptics';
import { formatters } from '../utils/formatters';
import type { ExpenseItem, ExpenseCategory } from '../types';

export function ExpensesScreen({ route, navigation }: any) {
  const { openDrawer } = useDrawer();
  const insets = useSafeAreaInsets();
  
  const { state, summary, deleteTransaction, loading, refresh } = useFinance();
  const refreshing = loading;
  const { transactions } = state;
  const { salary } = summary;

  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | ExpenseCategory>('all');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<ExpenseItem | null>(null);

  useEffect(() => {
    async function loadUser() {
      const saved = await storage.get<any>(STORAGE_KEYS.AUTH_USER, null);
      if (saved) setUserProfile(saved);
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (route?.params?.openNewExpense || route?.params?.openNewIncome) {
      setEditingTx(null);
      setIsSheetOpen(true);
      navigation.setParams({ openNewExpense: undefined, openNewIncome: undefined });
    }
  }, [route?.params?.openNewExpense, route?.params?.openNewIncome, navigation]);

  const user = userProfile?.user || userProfile;
  const rawSalary = Number(user?.salary) || 31627;

  // Use dynamically calculated values from FinanceContext
  const totalSpend = salary.spentThisMonth / 100;
  const remainingBudget = salary.remaining / 100;
  const budgetPercent = Math.min(100, Math.round((totalSpend / rawSalary) * 100));

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? All associated balances and splits will be reversed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            haptics.medium();
            deleteTransaction(id);
          } 
        }
      ]
    );
  };

  const getCategoryDetails = (title: string, category: ExpenseCategory) => {
    const lower = (title || '').toLowerCase();
    if (lower.includes('zepto') || lower.includes('quick') || lower.includes('grocery') || category === 'shopping') {
      return { icon: 'shopping-bag' as const, color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)', label: 'Shopping' };
    }
    if (lower.includes('milk') || lower.includes('dahi') || lower.includes('coffee') || lower.includes('chai') || category === 'food') {
      return { icon: 'coffee' as const, color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)', label: 'Food & Dairy' };
    }
    if (lower.includes('soap') || lower.includes('clean') || lower.includes('wash') || lower.includes('home')) {
      return { icon: 'droplet' as const, color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', label: 'Household' };
    }
    if (lower.includes('ice cream') || lower.includes('sweet') || lower.includes('swiggy') || lower.includes('zomato')) {
      return { icon: 'heart' as const, color: '#FB7185', bg: 'rgba(251, 113, 133, 0.15)', label: 'Dining & Treats' };
    }
    if (lower.includes('bill') || lower.includes('wi-fi') || lower.includes('recharge') || category === 'bills') {
      return { icon: 'zap' as const, color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)', label: 'Bills' };
    }
    return { icon: 'credit-card' as const, color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.15)', label: 'General' };
  };

  const filteredExpenses = selectedFilter === 'all'
    ? transactions
    : transactions.filter((e) => e.category === selectedFilter);

  const renderExpenseItem = useCallback(
    ({ item }: ListRenderItemInfo<ExpenseItem>) => {
      const meta = getCategoryDetails(item.title, item.category);

      return (
        <SwipeableRow
          onEdit={() => {
            haptics.medium();
            setEditingTx(item);
            setIsSheetOpen(true);
          }}
          onDelete={() => handleDelete(item.id)}
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
                {formatters.timestamp(new Date(item.date))} • {item.method || 'UPI'}
              </Text>
            </View>

            <View style={styles.txRightCol}>
              <Text style={[styles.txAmountText, item.type === 'income' && { color: '#34D399' }]}>
                {item.type === 'income' ? '+' : '-'}{formatters.currency(item.amount)}
              </Text>
              <View style={styles.accountTag}>
                <Text style={styles.accountTagText}>
                  {item.account ? item.account.toUpperCase() : 'GENERAL'}
                </Text>
              </View>
            </View>
          </View>
        </SwipeableRow>
      );
    },
    [deleteTransaction]
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

        <TouchableOpacity 
          style={styles.monthBadge} 
          activeOpacity={0.7}
          onPress={() => {
            haptics.selection();
            Alert.alert('Coming Soon', 'Month selection will be available in the next update.');
          }}
        >
          <Text style={styles.monthBadgeText}>This Month ▾</Text>
        </TouchableOpacity>
      </View>

      {/* 1. HERO APPLE LIQUID GLASS CARD */}
      <View style={styles.heroGlassCard}>
        <View style={styles.glassTopSpecular} />

        <LinearGradient
          colors={['rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.02)']}
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
            <Feather name="plus" size={17} color="#0F172A" />
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
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>

      {/* Ambient Atmospheric Light */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#F8FAFC', '#F1F5F9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.ambientGlow} />
      </View>

      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator color="#14B8A6" style={{ marginTop: 40 }} />
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

      <TransactionSheet 
        visible={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)} 
        existingTransaction={editingTx} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingTop: 12,
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
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  monthBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 0,
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
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 22,
    elevation: 0,
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
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  accountPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#14B8A6',
    letterSpacing: 0.6,
  },
  salaryBudgetTotal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
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
    color: '#94A3B8',
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
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 0,
  },
  addExpenseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
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
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#14B8A6',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  filterChipTextSelected: {
    color: '#0F172A',
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
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 0,
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  accountTagText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#94A3B8',
  },

});

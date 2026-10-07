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
import { BottomSheet } from '../components/BottomSheet';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import type { ExpenseItem, ExpenseCategory } from '../types';

export function ExpensesScreen({ route, navigation }: any) {
  const { openDrawer } = useDrawer();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  
  const bgColor = isDark ? '#090909' : '#F6F3EE';
  const cardBg = isDark ? '#121212' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#A1A1AA' : '#8E8E93';
  const borderColor = isDark ? '#27272A' : '#EBE6DE';
  
  const { state, summary, deleteTransaction, loading, refresh } = useFinance();
  const refreshing = loading;
  const { transactions } = state;
  const { salary } = summary;

  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | ExpenseCategory>('all');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<ExpenseItem | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  
  const recentMonths = React.useMemo(() => {
    const result = [];
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    for(let i=0; i<12; i++) {
      result.push(new Date(d));
      d.setMonth(d.getMonth() - 1);
    }
    return result;
  }, []);

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

  const filteredExpenses = transactions.filter((e) => {
    const d = new Date(e.date);
    const matchesMonth = d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();
    const matchesCategory = selectedFilter === 'all' || e.category === selectedFilter;
    return matchesMonth && matchesCategory;
  });

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
          <TouchableOpacity activeOpacity={0.7} onPress={() => { haptics.medium(); setEditingTx(item); setIsSheetOpen(true); }}>
            <View style={[styles.txCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={[styles.txIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : meta.bg }]}>
                <Feather name={meta.icon} size={18} color={meta.color} />
              </View>

              <View style={styles.txInfoCol}>
                <Text style={[styles.txTitleText, { color: textPrimary }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.txMetaText, { color: textSecondary }]}>
                  {formatters.timestamp(new Date(item.date))} • {item.method || 'UPI'}
                </Text>
              </View>

              <View style={styles.txRightCol}>
                <Text style={[styles.txAmountText, item.type === 'income' ? { color: '#34D399' } : { color: textPrimary }]}>
                  {item.type === 'income' ? '+' : '-'}{formatters.currency(item.amount)}
                </Text>
                <View style={[styles.accountTag, { backgroundColor: isDark ? '#1E1E1E' : 'rgba(0,0,0,0.05)' }]}>
                  <Text style={[styles.accountTagText, { color: textSecondary }]}>
                    {item.account ? item.account.toUpperCase() : 'GENERAL'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </SwipeableRow>
      );
    },
    [deleteTransaction, isDark, cardBg, borderColor, textPrimary, textSecondary]
  );

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      {/* Title Bar */}
      <View style={styles.screenTitleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => { haptics.selection(); openDrawer(); }} style={{ marginRight: 12 }}>
            <Feather name="menu" size={24} color={textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.screenHeading, { color: textPrimary }]}>Expenses</Text>
            <Text style={[styles.screenSubheading, { color: textSecondary }]}>Live UPI ledger & auto-categorization</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.monthBadge, { backgroundColor: cardBg, borderColor }]} 
          activeOpacity={0.7}
          onPress={() => {
            haptics.selection();
            setShowMonthPicker(true);
          }}
        >
          <Text style={[styles.monthBadgeText, { color: textPrimary }]}>
            {selectedMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} ▾
          </Text>
        </TouchableOpacity>
      </View>

      {/* 1. HERO CARD */}
      <View style={[styles.heroGlassCard, { borderColor }]}>
        <LinearGradient
          colors={isDark ? ['#1A1A1A', '#121212'] : ['#FFFFFF', '#FFFFFF']}
          style={styles.heroCardInner}
        >
          <Text style={[styles.totalSpendLabel, { color: textSecondary }]}>TOTAL SPENT THIS MONTH</Text>
          <Text style={[styles.totalSpendAmount, { color: textPrimary }]}>{formatters.currency(totalSpend)}</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelsRow}>
              <Text style={[styles.progressRemainingText, { color: textSecondary }]}>
                LIMIT: {formatters.currency(rawSalary)}
              </Text>
              <Text style={[styles.leftLabelText, { color: textPrimary }]}>REMAINING: {formatters.currency(remainingBudget)}</Text>
            </View>
          </View>
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
                !isSelected && { backgroundColor: cardBg, borderColor },
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
                  !isSelected && { color: textSecondary },
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
        <Text style={[styles.listHeaderTitle, { color: textSecondary }]}>TRANSACTIONS</Text>
        <Text style={[styles.listHeaderCount, { color: textSecondary }]}>
          {filteredExpenses.length} items • Swipe left to delete
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: bgColor }]}>
      {/* Ambient Atmospheric Light */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={[bgColor, bgColor]}
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fabBtn}
        activeOpacity={0.8}
        onPress={() => {
          haptics.medium();
          setEditingTx(null);
          setIsSheetOpen(true);
        }}
      >
        <Feather name="plus" size={24} color="#FFF" />
      </TouchableOpacity>
      
      <TransactionSheet 
        visible={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)} 
        existingTransaction={editingTx} 
      />

      <BottomSheet visible={showMonthPicker} onClose={() => setShowMonthPicker(false)} theme={isDark ? "dark" : "light"}>
        <Text style={[styles.screenHeading, { textAlign: 'center', marginBottom: 20, color: textPrimary }]}>Select Month</Text>
        <View style={styles.monthGrid}>
          {recentMonths.map((m, i) => {
            const isSelected = m.getTime() === selectedMonth.getTime();
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.monthBox, 
                  { backgroundColor: cardBg, borderColor },
                  isSelected && styles.monthBoxSelected
                ]}
                onPress={() => {
                  haptics.selection();
                  setSelectedMonth(m);
                  setShowMonthPicker(false);
                }}
              >
                <Text style={[
                  styles.monthBoxText, 
                  { color: textPrimary },
                  isSelected && styles.monthBoxTextSelected
                ]}>
                  {m.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  fabBtn: {
    position: 'absolute',
    bottom: 100, // Just above the bottom tab bar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  safeArea: {
    flex: 1,
  },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(20, 184, 166, 0.05)',
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
  screenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenHeading: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  screenSubheading: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
  monthBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  monthBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  heroGlassCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1.2,
  },
  heroCardInner: {
    padding: 20,
  },
  totalSpendLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  totalSpendAmount: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 14,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  progressRemainingText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  leftLabelText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  filterChipTextSelected: {
    color: '#FFF',
  },
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
    letterSpacing: 0.8,
  },
  listHeaderCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
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
    marginBottom: 2,
  },
  txMetaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  txRightCol: {
    alignItems: 'flex-end',
  },
  txAmountText: {
    fontSize: 14.5,
    fontWeight: '800',
    marginBottom: 3,
  },
  accountTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  accountTagText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  monthBox: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  monthBoxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthBoxText: {
    fontSize: 14,
    fontWeight: '700',
  },
  monthBoxTextSelected: {
    color: '#FFFFFF',
  },
});

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { haptics } from '../services/haptics';
import { useDrawer } from '../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance } from '../hooks/FinanceContext';
import { useTheme } from '../theme/ThemeContext';

export function LedgerScreen({ navigation, route, ...props }: any) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { state } = useFinance();
  const { isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const safeFormatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown Date';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const filteredTransactions = useMemo(() => {
    let filtered = [...state.transactions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        tx => tx.title.toLowerCase().includes(q) || tx.category?.toLowerCase().includes(q) || tx.method?.toLowerCase().includes(q)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    filtered.sort((a, b) => {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return filtered;
  }, [state.transactions, searchQuery, filterType, sortOrder]);

  const bgColor = isDark ? '#090909' : '#F6F3EE';
  const cardBg = isDark ? '#121212' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#A1A1AA' : '#8E8E93';
  const borderColor = isDark ? '#27272A' : '#EBE6DE';
  const accentColor = isDark ? '#C6A584' : '#332014';
  const accentText = isDark ? '#121212' : '#FFFFFF';

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: bgColor }]}>
      <View style={styles.container}>
        {/* Title Bar */}
        <View style={styles.screenTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => { haptics.selection(); openDrawer(); }} style={{ marginRight: 16 }}>
              <Feather name="menu" size={24} color={textPrimary} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.screenHeading, { color: textPrimary }]}>Transactions</Text>
              <Text style={[styles.screenSubheading, { color: textSecondary }]}>Your complete financial history</Text>
            </View>
          </View>
        </View>

        {/* Filters and Search */}
        <View style={styles.filtersContainer}>
          <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor }]}>
            <Feather name="search" size={18} color={textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Search title, category, method..."
              placeholderTextColor={textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingRight: 20 }}>
            <TouchableOpacity 
              style={[
                styles.filterPill, 
                { backgroundColor: filterType === 'all' ? accentColor : cardBg, borderColor }
              ]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[styles.filterPillText, { color: filterType === 'all' ? accentText : textSecondary }]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.filterPill, 
                { backgroundColor: filterType === 'expense' ? accentColor : cardBg, borderColor }
              ]}
              onPress={() => setFilterType('expense')}
            >
              <Text style={[styles.filterPillText, { color: filterType === 'expense' ? accentText : textSecondary }]}>Expenses</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.filterPill, 
                { backgroundColor: filterType === 'income' ? accentColor : cardBg, borderColor }
              ]}
              onPress={() => setFilterType('income')}
            >
              <Text style={[styles.filterPillText, { color: filterType === 'income' ? accentText : textSecondary }]}>Income</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterPill, { backgroundColor: cardBg, borderColor }]}
              onPress={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            >
              <Feather name={sortOrder === 'desc' ? "arrow-down" : "arrow-up"} size={14} color={textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.filterPillText, { color: textSecondary }]}>Date</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Transaction List */}
        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          {filteredTransactions.length === 0 ? (
            <Text style={[styles.emptyText, { color: textSecondary }]}>No transactions found.</Text>
          ) : (
            filteredTransactions.map(tx => {
              const isIncome = tx.type === 'income';
              let iconName: any = 'credit-card';
              switch (tx.category?.toLowerCase()) {
                case 'food': iconName = 'coffee'; break;
                case 'travel': iconName = 'navigation'; break;
                case 'shopping': iconName = 'shopping-bag'; break;
                case 'bills': iconName = 'file-text'; break;
                case 'health': iconName = 'heart'; break;
                case 'entertainment': iconName = 'tv'; break;
              }
              if (isIncome) iconName = 'arrow-down-left';

              return (
                <View key={tx.id} style={[styles.transactionCard, { backgroundColor: cardBg, borderColor, shadowOpacity: isDark ? 0 : 0.05 }]}>
                  <View style={styles.txLeft}>
                    <View style={[styles.txIconBox, { backgroundColor: isIncome ? (isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)') : (isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)') }]}>
                      <Feather name={iconName} size={18} color={isIncome ? '#10B981' : '#EF4444'} />
                    </View>
                    <View>
                      <Text style={[styles.txTitle, { color: textPrimary }]}>{tx.title}</Text>
                      <Text style={[styles.txDate, { color: textSecondary }]}>
                        {safeFormatDate(tx.date)} • {isIncome ? 'CREDIT' : (tx.method?.toUpperCase() || 'UPI')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: isIncome ? '#10B981' : textPrimary }]}>
                      {isIncome ? '+' : '-'}{tx.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 20 
  },
  screenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 24 : 10,
    marginBottom: 24,
  },
  screenHeading: { 
    fontSize: 28, 
    fontWeight: '500', 
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  screenSubheading: { 
    fontSize: 14, 
    marginTop: 4 
  },
  filtersContainer: {
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterScroll: {
    flexDirection: 'row',
    overflow: 'visible',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  txDate: {
    fontSize: 12,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
});

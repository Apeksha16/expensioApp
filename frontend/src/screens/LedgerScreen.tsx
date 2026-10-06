import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { haptics } from '../services/haptics';
import { useDrawer } from '../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useFinance } from '../hooks/FinanceContext';
import { formatters } from '../utils/formatters';

export function LedgerScreen({ navigation, route, onSuccess, onResetAuth, ...props }: any) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { state } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredTransactions = useMemo(() => {
    let filtered = [...state.transactions];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        tx => tx.title.toLowerCase().includes(q) || tx.category?.toLowerCase().includes(q) || tx.method?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    // Sort order
    filtered.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return filtered;
  }, [state.transactions, searchQuery, filterType, sortOrder]);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} translucent={true} />
      
      <View style={styles.container}>
        {/* Title Bar */}
        <View style={styles.screenTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => { haptics.selection(); openDrawer(); }} style={{ marginRight: 12 }}>
              <Feather name="menu" size={24} color="#F8FAFC" />
            </TouchableOpacity>
            <View>
              <Text style={styles.screenHeading}>Transactions</Text>
              <Text style={styles.screenSubheading}>Your complete financial history</Text>
            </View>
          </View>
        </View>

        {/* Filters and Search */}
        <View style={styles.filtersContainer}>
          <View style={styles.searchBox}>
            <Feather name="search" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search title, category, method..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity 
              style={[styles.filterPill, filterType === 'all' && styles.filterPillActive]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[styles.filterPillText, filterType === 'all' && styles.filterPillTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterPill, filterType === 'expense' && styles.filterPillActive]}
              onPress={() => setFilterType('expense')}
            >
              <Text style={[styles.filterPillText, filterType === 'expense' && styles.filterPillTextActive]}>Expenses</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterPill, filterType === 'income' && styles.filterPillActive]}
              onPress={() => setFilterType('income')}
            >
              <Text style={[styles.filterPillText, filterType === 'income' && styles.filterPillTextActive]}>Income</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.filterPill}
              onPress={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            >
              <Feather name={sortOrder === 'desc' ? "arrow-down" : "arrow-up"} size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.filterPillText}>Date</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Transaction List */}
        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          {filteredTransactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions found.</Text>
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
                <View key={tx.id} style={styles.transactionCard}>
                  <View style={styles.txLeft}>
                    <View style={[styles.txIconBox, { backgroundColor: isIncome ? 'rgba(0, 209, 178, 0.15)' : 'rgba(255, 77, 77, 0.15)' }]}>
                      <Feather name={iconName} size={16} color={isIncome ? colors.primary : colors.coral} />
                    </View>
                    <View>
                      <Text style={styles.txTitle}>{tx.title}</Text>
                      <Text style={styles.txDate}>
                        {formatters.timestamp(new Date(tx.date))} • {isIncome ? 'CREDIT' : (tx.method?.toUpperCase() || 'UPI')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={isIncome ? styles.txAmountPositive : styles.txAmountNegative}>
                      {isIncome ? '+' : '-'}{formatters.currency(tx.amount)}
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
    backgroundColor: colors.background 
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
    marginBottom: 20,
  },
  screenHeading: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: colors.textPrimary, 
    letterSpacing: -0.5 
  },
  screenSubheading: { 
    fontSize: 13, 
    color: colors.textSecondary, 
    fontWeight: '500', 
    marginTop: 2 
  },
  filtersContainer: {
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#19202A',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#242D3D',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#19202A',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#242D3D',
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.background,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
    gap: 10,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#19202A',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242D3D',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  txDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmountNegative: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.coral,
    marginBottom: 4,
  },
  txAmountPositive: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
});

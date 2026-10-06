import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform, ScrollView, TextInput, KeyboardAvoidingView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { haptics } from '../services/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useFinance } from '../hooks/FinanceContext';
import { formatters } from '../utils/formatters';
import { BottomSheet } from '../components/BottomSheet';
import { calculateCashSummary, toRupees } from '../utils/financeCalculations';
import type { ExpenseItem, AccountType, ExpenseCategory } from '../types';

export function CashScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { state, addTransaction } = useFinance();

  const [isDepositSheetOpen, setIsDepositSheetOpen] = useState(false);
  const [isWithdrawSheetOpen, setIsWithdrawSheetOpen] = useState(false);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('general');
  const [sourceAccount, setSourceAccount] = useState<AccountType | 'none'>('none');
  const [destinationAccount, setDestinationAccount] = useState<AccountType | 'none'>('none');
  const [notes, setNotes] = useState('');

  const cashSummary = calculateCashSummary(state);
  const cashBalanceRupees = toRupees(cashSummary.cashBalance);

  const cashHistory = useMemo(() => {
    return state.transactions
      .filter(tx => tx.account === 'cash' || (tx.title.includes('Cash Transfer')))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions]);

  const resetForm = () => {
    setAmount('');
    setCategory('general');
    setSourceAccount('none');
    setDestinationAccount('none');
    setNotes('');
  };

  const handleDeposit = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    const numAmount = Number(amount);
    const dateStr = new Date().toISOString();

    const incomeTx: ExpenseItem = {
      id: `tx_${Date.now()}_inc`,
      title: notes || (sourceAccount !== 'none' ? `Transfer from ${formatters.capitalize(sourceAccount)}` : 'Cash Deposit'),
      amount: numAmount,
      category,
      date: dateStr,
      method: 'Cash',
      account: 'cash',
      type: 'income',
    };
    addTransaction(incomeTx);

    if (sourceAccount !== 'none') {
      const expTx: ExpenseItem = {
        id: `tx_${Date.now()}_exp`,
        title: `Transfer to Cash`,
        amount: numAmount,
        category: 'general',
        date: dateStr,
        method: 'Cash',
        account: sourceAccount as AccountType,
        type: 'expense',
      };
      addTransaction(expTx);
    }

    haptics.success();
    setIsDepositSheetOpen(false);
    resetForm();
  };

  const handleWithdraw = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    const numAmount = Number(amount);
    
    // Prevent overdraft
    if (numAmount > cashBalanceRupees) {
      Alert.alert('Insufficient Balance', 'You do not have enough cash to complete this transaction.');
      return;
    }

    const dateStr = new Date().toISOString();

    const expTx: ExpenseItem = {
      id: `tx_${Date.now()}_exp`,
      title: notes || (destinationAccount !== 'none' ? `Transfer to ${formatters.capitalize(destinationAccount)}` : 'Cash Expense'),
      amount: numAmount,
      category: destinationAccount !== 'none' ? 'general' : category,
      date: dateStr,
      method: 'Cash',
      account: 'cash',
      type: 'expense',
    };
    addTransaction(expTx);

    if (destinationAccount !== 'none') {
      const incTx: ExpenseItem = {
        id: `tx_${Date.now()}_inc`,
        title: `Transfer from Cash`,
        amount: numAmount,
        category: 'general',
        date: dateStr,
        method: 'Cash',
        account: destinationAccount as AccountType,
        type: 'income',
      };
      addTransaction(incTx);
    }

    haptics.success();
    setIsWithdrawSheetOpen(false);
    resetForm();
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} translucent={true} />
      
      <View style={styles.container}>
        <View style={styles.screenTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
              <Feather name="arrow-left" size={24} color="#F8FAFC" />
            </TouchableOpacity>
            <View>
              <Text style={styles.screenHeading}>Cash Account</Text>
              <Text style={styles.screenSubheading}>Physical currency and wallets</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.heroCard}>
            <View style={styles.balanceHeaderRow}>
              <Text style={styles.balanceLabel}>CASH BALANCE</Text>
            </View>
            <Text style={styles.balanceAmount}>{formatters.currency(cashBalanceRupees)}</Text>
            <View style={styles.divider} />
            
            <View style={[styles.actionsRow, { justifyContent: 'space-between', marginBottom: 20 }]}>
              <View>
                <Text style={styles.statLabel}>CASH IN</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>{formatters.currency(toRupees(cashSummary.cashIncome))}</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>CASH SPENT</Text>
                <Text style={[styles.statValue, { color: colors.coral }]}>{formatters.currency(toRupees(cashSummary.cashSpent))}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { resetForm(); setIsDepositSheetOpen(true); haptics.selection(); }}>
                <Feather name="plus-circle" size={18} color={colors.primary} />
                <Text style={styles.actionBtnText}>Add Funds</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { resetForm(); setIsWithdrawSheetOpen(true); haptics.selection(); }}>
                <Feather name="minus-circle" size={18} color={colors.coral} />
                <Text style={styles.actionBtnText}>Spend / Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Cash History</Text>
          {cashHistory.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 13 }}>No cash history yet.</Text>
            </View>
          ) : (
            cashHistory.map(tx => {
              const isIncome = tx.type === 'income' && tx.account === 'cash';
              let iconName: any = 'credit-card';
              switch (tx.category?.toLowerCase()) {
                case 'food': iconName = 'coffee'; break;
                case 'travel': iconName = 'navigation'; break;
                case 'shopping': iconName = 'shopping-bag'; break;
                case 'bills': iconName = 'file-text'; break;
                case 'health': iconName = 'heart'; break;
                case 'entertainment': iconName = 'tv'; break;
                case 'general': iconName = 'refresh-cw'; break;
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
                      <Text style={styles.txDate}>{formatters.timestamp(new Date(tx.date))}</Text>
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

      {/* Deposit Sheet */}
      <BottomSheet
        visible={isDepositSheetOpen}
        onClose={() => setIsDepositSheetOpen(false)}
        title="Add Cash"
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.formRow}>
            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.formRow}>
            <Text style={styles.label}>Source (Optional Transfer)</Text>
            <View style={styles.chipsRow}>
              {['none', 'salary', 'savings'].map((acc) => (
                <TouchableOpacity
                  key={acc}
                  style={[styles.chip, sourceAccount === acc && styles.chipActive]}
                  onPress={() => setSourceAccount(acc as any)}
                >
                  <Text style={[styles.chipText, sourceAccount === acc && styles.chipTextActive]}>
                    {formatters.capitalize(acc === 'none' ? 'External / ATM' : acc)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.formRow}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipsRow}>
              {['general', 'food', 'travel', 'shopping'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat as any)}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                    {formatters.capitalize(cat)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.formRow}>
            <Text style={styles.label}>Notes / Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ATM Withdrawal"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleDeposit}>
            <Text style={styles.saveBtnText}>Add Funds</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* Withdraw Sheet */}
      <BottomSheet
        visible={isWithdrawSheetOpen}
        onClose={() => setIsWithdrawSheetOpen(false)}
        title="Spend / Transfer Cash"
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.formRow}>
            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.formRow}>
            <Text style={styles.label}>Transfer To (Optional)</Text>
            <View style={styles.chipsRow}>
              {['none', 'salary', 'savings'].map((acc) => (
                <TouchableOpacity
                  key={acc}
                  style={[styles.chip, destinationAccount === acc && styles.chipActive]}
                  onPress={() => setDestinationAccount(acc as any)}
                >
                  <Text style={[styles.chipText, destinationAccount === acc && styles.chipTextActive]}>
                    {formatters.capitalize(acc === 'none' ? 'Direct Expense' : acc)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {destinationAccount === 'none' && (
            <View style={styles.formRow}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.chipsRow}>
                {['general', 'food', 'travel', 'shopping', 'bills', 'entertainment'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, category === cat && styles.chipActive]}
                    onPress={() => setCategory(cat as any)}
                  >
                    <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                      {formatters.capitalize(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <View style={styles.formRow}>
            <Text style={styles.label}>Notes / Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Paid for taxi"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.coral }]} onPress={handleWithdraw}>
            <Text style={styles.saveBtnText}>{destinationAccount !== 'none' ? 'Transfer Funds' : 'Record Expense'}</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 20 },
  screenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 24 : 10,
    marginBottom: 20,
  },
  screenHeading: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  screenSubheading: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', marginTop: 2 },
  
  heroCard: {
    borderRadius: 20, marginBottom: 28, backgroundColor: '#1E2634',
    padding: 24, borderWidth: 1, borderColor: '#2A3441',
  },
  balanceHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  balanceLabel: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  balanceAmount: { fontSize: 36, fontWeight: '700', color: colors.textPrimary, marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#2A3441', marginBottom: 16 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#19202A', borderRadius: 12, borderWidth: 1, borderColor: '#242D3D' },
  actionBtnText: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },

  statLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700' },

  listContainer: { flex: 1 },
  listContent: { paddingBottom: 100 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  
  transactionCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#19202A', padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: '#242D3D', marginBottom: 10,
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  txDate: { fontSize: 12, color: colors.textSecondary },
  txRight: { alignItems: 'flex-end' },
  txAmountNegative: { fontSize: 14, fontWeight: '600', color: colors.coral, marginBottom: 4 },
  txAmountPositive: { fontSize: 14, fontWeight: '600', color: colors.primary, marginBottom: 4 },

  formRow: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(25, 32, 42, 0.5)', borderWidth: 1, borderColor: '#242D3D',
    borderRadius: 12, paddingHorizontal: 16, height: 50, color: colors.textPrimary, fontSize: 15,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#19202A', borderWidth: 1, borderColor: '#242D3D' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.background },
  
  saveBtn: { backgroundColor: colors.primary, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  saveBtnText: { color: colors.background, fontWeight: '700', fontSize: 16 },
});

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, TextInput, KeyboardAvoidingView, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { haptics } from '../services/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useFinance } from '../hooks/FinanceContext';
import { formatters } from '../utils/formatters';
import { BottomSheet } from '../components/BottomSheet';
import { calculateSavingsSummary, toRupees } from '../utils/financeCalculations';
import type { ExpenseItem, AccountType } from '../types';

export function SavingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { state, addTransaction } = useFinance();

  const [isDepositSheetOpen, setIsDepositSheetOpen] = useState(false);
  const [isWithdrawSheetOpen, setIsWithdrawSheetOpen] = useState(false);

  const [amount, setAmount] = useState('');
  const [sourceAccount, setSourceAccount] = useState<AccountType | 'none'>('none');
  const [destinationAccount, setDestinationAccount] = useState<AccountType | 'none'>('none');
  const [notes, setNotes] = useState('');

  const savingsSummary = calculateSavingsSummary(state);

  const savingsHistory = useMemo(() => {
    return state.transactions
      .filter(tx => tx.account === 'savings' || (tx.title.includes('Savings Transfer')))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions]);

  const resetForm = () => {
    setAmount('');
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

    // 1. Create income transaction for savings
    const incomeTx: ExpenseItem = {
      id: `tx_${Date.now()}_inc`,
      title: notes || (sourceAccount !== 'none' ? `Transfer from ${formatters.capitalize(sourceAccount)}` : 'Savings Deposit'),
      amount: numAmount,
      category: 'general',
      date: dateStr,
      method: 'NetBanking',
      account: 'savings',
      type: 'income',
    };
    addTransaction(incomeTx);

    // 2. If sourced from another account, create expense there
    if (sourceAccount !== 'none') {
      const expTx: ExpenseItem = {
        id: `tx_${Date.now()}_exp`,
        title: `Transfer to Savings`,
        amount: numAmount,
        category: 'general',
        date: dateStr,
        method: 'NetBanking',
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
    if (numAmount > toRupees(savingsSummary.totalSavings)) {
      Alert.alert('Insufficient Balance', 'You do not have enough savings to withdraw this amount.');
      return;
    }

    const dateStr = new Date().toISOString();

    // 1. Create expense transaction for savings
    const expTx: ExpenseItem = {
      id: `tx_${Date.now()}_exp`,
      title: notes || (destinationAccount !== 'none' ? `Transfer to ${formatters.capitalize(destinationAccount)}` : 'Savings Withdrawal'),
      amount: numAmount,
      category: 'general',
      date: dateStr,
      method: 'NetBanking',
      account: 'savings',
      type: 'expense',
    };
    addTransaction(expTx);

    // 2. If transferring to another account, create income there
    if (destinationAccount !== 'none') {
      const incTx: ExpenseItem = {
        id: `tx_${Date.now()}_inc`,
        title: `Transfer from Savings`,
        amount: numAmount,
        category: 'general',
        date: dateStr,
        method: 'NetBanking',
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
      <View style={styles.container}>
        <View style={styles.screenTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
              <Feather name="arrow-left" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View>
              <Text style={styles.screenHeading}>Savings</Text>
              <Text style={styles.screenSubheading}>Manage and track your wealth</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.heroCard}>
            <View style={styles.balanceHeaderRow}>
              <Text style={styles.balanceLabel}>TOTAL SAVINGS</Text>
              <View style={[styles.growthPill, savingsSummary.growthStatus === 'shrinking' && { backgroundColor: 'rgba(255, 77, 77, 0.15)' }, savingsSummary.growthStatus === 'neutral' && { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                <Ionicons name={savingsSummary.growthStatus === 'growing' ? "arrow-up" : savingsSummary.growthStatus === 'shrinking' ? "arrow-down" : "remove"} size={10} color={savingsSummary.growthStatus === 'growing' ? colors.primary : savingsSummary.growthStatus === 'shrinking' ? colors.coral : colors.textSecondary} />
                <Text style={[styles.growthText, savingsSummary.growthStatus === 'shrinking' && { color: colors.coral }, savingsSummary.growthStatus === 'neutral' && { color: colors.textSecondary }]}>
                  {savingsSummary.growthStatus === 'growing' ? 'Active ↗' : savingsSummary.growthStatus === 'shrinking' ? 'Declining ↘' : 'Neutral'}
                </Text>
              </View>
            </View>
            <Text style={styles.balanceAmount}>{formatters.currency(toRupees(savingsSummary.totalSavings))}</Text>
            <View style={styles.divider} />
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { resetForm(); setIsDepositSheetOpen(true); haptics.selection(); }}>
                <Feather name="arrow-down-circle" size={18} color={colors.primary} />
                <Text style={styles.actionBtnText}>Deposit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { resetForm(); setIsWithdrawSheetOpen(true); haptics.selection(); }}>
                <Feather name="arrow-up-circle" size={18} color={colors.coral} />
                <Text style={styles.actionBtnText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Savings History</Text>
          {savingsHistory.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 13 }}>No savings history yet.</Text>
            </View>
          ) : (
            savingsHistory.map(tx => {
              const isIncome = tx.type === 'income' && tx.account === 'savings';
              return (
                <View key={tx.id} style={styles.transactionCard}>
                  <View style={styles.txLeft}>
                    <View style={[styles.txIconBox, { backgroundColor: isIncome ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 77, 77, 0.15)' }]}>
                      <Feather name={isIncome ? 'arrow-down-left' : 'arrow-up-right'} size={16} color={isIncome ? colors.primary : colors.coral} />
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
        title="Deposit to Savings"
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
            <Text style={styles.label}>Source Account (Optional)</Text>
            <View style={styles.chipsRow}>
              {['none', 'salary', 'cash'].map((acc) => (
                <TouchableOpacity
                  key={acc}
                  style={[styles.chip, sourceAccount === acc && styles.chipActive]}
                  onPress={() => setSourceAccount(acc as any)}
                >
                  <Text style={[styles.chipText, sourceAccount === acc && styles.chipTextActive]}>
                    {formatters.capitalize(acc === 'none' ? 'External' : acc)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.formRow}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Monthly contribution"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleDeposit}>
            <Text style={styles.saveBtnText}>Deposit Funds</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* Withdraw Sheet */}
      <BottomSheet
        visible={isWithdrawSheetOpen}
        onClose={() => setIsWithdrawSheetOpen(false)}
        title="Withdraw from Savings"
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
              {['none', 'salary', 'cash'].map((acc) => (
                <TouchableOpacity
                  key={acc}
                  style={[styles.chip, destinationAccount === acc && styles.chipActive]}
                  onPress={() => setDestinationAccount(acc as any)}
                >
                  <Text style={[styles.chipText, destinationAccount === acc && styles.chipTextActive]}>
                    {formatters.capitalize(acc === 'none' ? 'External' : acc)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.formRow}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Emergency fund use"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.coral }]} onPress={handleWithdraw}>
            <Text style={styles.saveBtnText}>Withdraw Funds</Text>
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
    borderRadius: 20, marginBottom: 28, backgroundColor: '#F1F5F9',
    padding: 24, borderWidth: 1, borderColor: '#E2E8F0',
  },
  balanceHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  balanceLabel: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  growthPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  growthText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  balanceAmount: { fontSize: 36, fontWeight: '700', color: colors.textPrimary, marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 16 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  actionBtnText: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },

  listContainer: { flex: 1 },
  listContent: { paddingBottom: 100 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  
  transactionCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10,
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
    backgroundColor: 'rgba(25, 32, 42, 0.5)', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, paddingHorizontal: 16, height: 50, color: colors.textPrimary, fontSize: 15,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.background },
  
  saveBtn: { backgroundColor: colors.primary, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  saveBtnText: { color: colors.background, fontWeight: '700', fontSize: 16 },
});

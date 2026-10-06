import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomSheet } from './BottomSheet';
import { haptics } from '../services/haptics';
import { colors } from '../theme/colors';
import { formatters } from '../utils/formatters';
import type { ExpenseItem, SplitItem, AccountType } from '../types';
import { useFinance } from '../hooks/FinanceContext';

interface SettlementSheetProps {
  visible: boolean;
  onClose: () => void;
  personName: string;
  balanceAmount: number; // Positive means they owe YOU. Negative means YOU owe them.
}

const AVAILABLE_ACCOUNTS = ['salary', 'savings', 'cash'] as AccountType[];

export function SettlementSheet({ visible, onClose, personName, balanceAmount }: SettlementSheetProps) {
  const { addTransaction, addSplit } = useFinance();
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState<AccountType>('salary');
  const [method, setMethod] = useState<'UPI' | 'Card' | 'Cash' | 'NetBanking'>('UPI');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOwed = balanceAmount > 0;
  const absBalance = Math.abs(balanceAmount);

  useEffect(() => {
    if (visible) {
      setAmount(absBalance.toString());
      setAccount('salary');
      setMethod('UPI');
      setNote(`Settlement with ${personName}`);
    }
  }, [visible, personName, absBalance]);

  const validateAmount = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return false;
    const parts = val.split('.');
    if (parts.length > 1 && parts[1].length > 2) return false;
    return true;
  };

  const handleSave = async () => {
    if (!validateAmount(amount)) {
      Alert.alert('Validation Error', 'Enter a valid amount (greater than 0, max 2 decimals)');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (parsedAmount > absBalance) {
      Alert.alert('Validation Error', `Amount cannot exceed the total balance of ₹${absBalance}`);
      return;
    }

    setSubmitting(true);
    try {
      const txId = `tx_${Date.now()}`;
      
      // If they owe YOU, and they pay -> It's an INCOME to your account
      // If YOU owe them, and you pay -> It's an EXPENSE from your account
      const txType = isOwed ? 'income' : 'expense';
      
      const newTx: ExpenseItem = {
        id: txId,
        title: note.trim() || `Settlement with ${personName}`,
        amount: parsedAmount,
        category: 'general',
        account,
        method,
        type: txType,
        date: new Date().toISOString(),
      };

      addTransaction(newTx);

      // Create settlement split to adjust the person's balance
      const newSplit: SplitItem = {
        id: `split_${Date.now()}`,
        title: note.trim() || `Settlement with ${personName}`,
        amount: parsedAmount,
        date: newTx.date,
        // If they pay YOU, they are the payer
        // If YOU pay them, YOU are the payer
        paidBy: isOwed ? personName : 'YOU',
        status: 'PENDING',
        strategy: 'settlement',
        participants: [isOwed ? 'YOU' : personName],
        shares: { [isOwed ? 'YOU' : personName]: parsedAmount },
        // If they pay YOU, you receive it (youOwe goes up? No, if they paid by personName, the engine does: split.paidBy !== 'YOU' && split.youOwe.
        // Wait, if personName paid YOU, personName is paidBy. To decrease their debt (i.e. reduce their negative balance in engine),
        // we need `youOwe` to be the amount.
        // Because if `paidBy !== 'YOU' && youOwe`, then `balances[paidBy] -= youOwe`.
        // If Pranav owes me, `balances[Pranav]` is positive.
        // Wait, if `balances[Pranav]` is positive, and Pranav pays me `youOwe`, then `balances[Pranav] -= youOwe`.
        // So `youOwe` should be `parsedAmount`. And `youGet: 0`.
        youGet: isOwed ? 0 : parsedAmount,
        youOwe: isOwed ? parsedAmount : 0,
        transactionId: txId,
      };

      addSplit(newSplit);
      
      haptics.success();
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to save settlement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} theme="dark">
      <Text style={styles.sheetTitle}>Record Settlement</Text>

      <View style={styles.balanceInfoBox}>
        <Text style={styles.balanceInfoLabel}>
          {isOwed ? `${personName} owes you` : `You owe ${personName}`}
        </Text>
        <Text style={[styles.balanceInfoAmount, isOwed ? { color: '#34D399' } : { color: '#E11D48' }]}>
          {formatters.currency(absBalance)}
        </Text>
      </View>

      <Text style={styles.label}>AMOUNT RECEIVED / PAID</Text>
      <TextInput
        style={styles.input}
        placeholder="Amount (₹)"
        placeholderTextColor="#64748B"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>INTO / FROM ACCOUNT</Text>
      <View style={styles.chipsRow}>
        {AVAILABLE_ACCOUNTS.map(acc => (
          <TouchableOpacity
            key={`acc_${acc}`}
            style={[styles.chip, account === acc && styles.chipActive]}
            onPress={() => { haptics.selection(); setAccount(acc); }}
          >
            <Text style={[styles.chipText, account === acc && styles.chipTextActive]}>{acc.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>PAYMENT METHOD</Text>
      <View style={styles.chipsRow}>
        {['UPI', 'Card', 'Cash'].map(m => (
          <TouchableOpacity
            key={`method_${m}`}
            style={[styles.chip, method === m && styles.chipActive]}
            onPress={() => { haptics.selection(); setMethod(m as any); }}
          >
            <Text style={[styles.chipText, method === m && styles.chipTextActive]}>{m.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>NOTE (OPTIONAL)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Cleared dues"
        placeholderTextColor="#64748B"
        value={note}
        onChangeText={setNote}
      />

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#022C22" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Record</Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 20,
  },
  balanceInfoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceInfoLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceInfoAmount: {
    fontSize: 28,
    fontWeight: '800',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderColor: '#14B8A6',
  },
  chipText: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#14B8A6',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#34D399',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#022C22',
    fontSize: 16,
    fontWeight: '700',
  },
});

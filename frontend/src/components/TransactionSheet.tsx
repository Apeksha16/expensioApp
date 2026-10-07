import React, { useState, useEffect, useMemo } from 'react';
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
import type { ExpenseItem, ExpenseCategory, AccountType, SplitItem } from '../types';
import { useFinance } from '../hooks/FinanceContext';
import { useTheme } from '../theme/ThemeContext';

interface TransactionSheetProps {
  visible: boolean;
  onClose: () => void;
  existingTransaction?: ExpenseItem | null;
}

const AVAILABLE_FRIENDS = ['Pranav', 'Ananya', 'Rahul'];

export function TransactionSheet({ visible, onClose, existingTransaction }: TransactionSheetProps) {
  const { state, addTransaction, deleteTransaction, addSplit, deleteSplit } = useFinance();
  const { isDark } = useTheme();
  
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#A1A1AA' : '#8E8E93';
  const borderColor = isDark ? '#27272A' : '#EBE6DE';
  const inputBg = isDark ? '#1E1E1E' : '#F6F3EE';
  const chipBg = isDark ? '#1E1E1E' : '#FFFFFF';
  
  // Existing split logic if we're editing
  const existingSplit = existingTransaction 
    ? state.splits.find(s => s.transactionId === existingTransaction.id) 
    : undefined;

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('general');
  const [account, setAccount] = useState<AccountType>('salary');
  const [method, setMethod] = useState<'UPI' | 'Card' | 'Cash' | 'NetBanking'>('UPI');
  const [submitting, setSubmitting] = useState(false);

  // Split specific state
  const [isSplit, setIsSplit] = useState(false);
  const [paidBy, setPaidBy] = useState<'Apeksha' | string>('Apeksha');
  const [participants, setParticipants] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<'equally' | 'custom'>('equally');
  const [customShares, setCustomShares] = useState<Record<string, string>>({});

  const [txDate, setTxDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      if (existingTransaction) {
        setType(existingTransaction.type || 'expense');
        setTitle(existingTransaction.title);
        setAmount(existingTransaction.amount.toString());
        setCategory(existingTransaction.category);
        setAccount(existingTransaction.account || 'salary');
        setMethod(existingTransaction.method || 'UPI');
        setTxDate(new Date(existingTransaction.date));

        if (existingSplit) {
          setIsSplit(true);
          setPaidBy(existingSplit.paidBy);
          setParticipants(existingSplit.participants || []);
          setStrategy((existingSplit.strategy === 'settlement' ? 'equally' : existingSplit.strategy) || 'equally');
          const sharesObj: Record<string, string> = {};
          if (existingSplit.shares) {
            Object.keys(existingSplit.shares).forEach(p => {
              sharesObj[p] = existingSplit.shares![p].toString();
            });
          }
          setCustomShares(sharesObj);
        } else {
          setIsSplit(false);
          setPaidBy('Apeksha');
          setParticipants([]);
          setStrategy('equally');
          setCustomShares({});
        }
      } else {
        setType('expense');
        setTitle('');
        setAmount('');
        setCategory('general');
        setAccount('salary');
        setMethod('UPI');
        setTxDate(new Date());
        setIsSplit(false);
        setPaidBy('Apeksha');
        setParticipants([]);
        setStrategy('equally');
        setCustomShares({});
      }
    }
  }, [visible, existingTransaction, existingSplit]);

  const validateAmount = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return false;
    const parts = val.split('.');
    if (parts.length > 1 && parts[1].length > 2) return false;
    return true;
  };

  const parsedTotalAmount = parseFloat(amount) || 0;
  
  // Get list of everyone involved in the split including the payer
  const allInvolved = useMemo(() => {
    const set = new Set(participants);
    set.add(paidBy);
    return Array.from(set);
  }, [participants, paidBy]);

  // Calculate shares dynamically based on strategy
  const calculatedShares = useMemo(() => {
    const shares: Record<string, number> = {};
    if (strategy === 'equally' && allInvolved.length > 0 && parsedTotalAmount > 0) {
      // Split equally, rounding properly in paise to ensure exact total
      const totalPaise = Math.round(parsedTotalAmount * 100);
      const baseSharePaise = Math.floor(totalPaise / allInvolved.length);
      let remainderPaise = totalPaise % allInvolved.length;

      allInvolved.forEach((p) => {
        let sharePaise = baseSharePaise;
        if (remainderPaise > 0) {
          sharePaise += 1;
          remainderPaise -= 1;
        }
        shares[p] = sharePaise / 100;
      });
    } else if (strategy === 'custom') {
      allInvolved.forEach((p) => {
        shares[p] = parseFloat(customShares[p]) || 0;
      });
    }
    return shares;
  }, [strategy, allInvolved, parsedTotalAmount, customShares]);

  const totalAssignedPaise = useMemo(() => {
    return Object.values(calculatedShares).reduce((acc, val) => acc + Math.round(val * 100), 0);
  }, [calculatedShares]);

  const parsedTotalAmountPaise = Math.round(parsedTotalAmount * 100);
  const diffAmountPaise = parsedTotalAmountPaise - totalAssignedPaise;
  
  const isBalanced = diffAmountPaise === 0;
  const diffAmount = diffAmountPaise / 100;

  const handleToggleParticipant = (friend: string) => {
    haptics.selection();
    if (participants.includes(friend)) {
      setParticipants(participants.filter(p => p !== friend));
    } else {
      setParticipants([...participants, friend]);
    }
  };

  const handleCustomShareChange = (person: string, val: string) => {
    setCustomShares(prev => ({ ...prev, [person]: val }));
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Validation Error', 'Expense Name is required');
      return;
    }
    if (!validateAmount(amount)) {
      Alert.alert('Validation Error', 'Enter a valid amount (greater than 0, max 2 decimals)');
      return;
    }

    if (isSplit && !isBalanced) {
      Alert.alert('Validation Error', 'Split shares must exactly match the total amount.');
      return;
    }

    setSubmitting(true);
    try {
      const txId = existingTransaction ? existingTransaction.id : `tx_${Date.now()}`;

      if (existingTransaction) {
        deleteTransaction(existingTransaction.id);
        if (existingSplit) {
          deleteSplit(existingSplit.id);
        }
      }

      const newTx: ExpenseItem = {
        id: txId,
        title: trimmedTitle,
        amount: parsedTotalAmount,
        category,
        account,
        method,
        type,
        date: txDate.toISOString(),
      };

      addTransaction(newTx);

      if (isSplit && participants.length > 0) {
        let youGet = 0;
        let youOwe = 0;

        if (paidBy === 'Apeksha') {
          participants.forEach(p => {
            youGet += calculatedShares[p] || 0;
          });
        } else {
          youOwe = calculatedShares['Apeksha'] || 0;
        }

        const newSplit: SplitItem = {
          id: existingSplit ? existingSplit.id : `split_${Date.now()}`,
          title: trimmedTitle,
          amount: parsedTotalAmount,
          date: newTx.date,
          paidBy,
          status: 'PENDING',
          strategy,
          participants,
          shares: calculatedShares,
          youGet,
          youOwe,
          transactionId: txId,
        };
        addSplit(newSplit);
      }
      
      haptics.success();
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Split?',
      'This will remove this expense split and reverse the associated balances.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (existingTransaction) {
              deleteTransaction(existingTransaction.id);
            }
            if (existingSplit) {
              deleteSplit(existingSplit.id);
            }
            haptics.success();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={[styles.sheetTitle, { color: textPrimary, marginBottom: 0 }]}>{existingTransaction ? (isSplit ? 'Edit Split' : 'Edit Expense') : 'New Expense'}</Text>
        {existingTransaction && (
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="trash-2" size={20} color="#E11D48" />
          </TouchableOpacity>
        )}
      </View>

      {/* Type Selection */}
      <View style={styles.segmentedRow}>
        <TouchableOpacity
          style={[styles.segmentBtn, { backgroundColor: inputBg, borderColor }, type === 'expense' && styles.segmentBtnExpense]}
          onPress={() => { haptics.selection(); setType('expense'); }}
        >
          <Text style={[styles.segmentText, { color: textSecondary }, type === 'expense' && { color: '#0F172A' }]}>EXPENSE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, { backgroundColor: inputBg, borderColor }, type === 'income' && styles.segmentBtnIncome]}
          onPress={() => { haptics.selection(); setType('income'); setIsSplit(false); }}
        >
          <Text style={[styles.segmentText, { color: textSecondary }, type === 'income' && { color: '#0F172A' }]}>INCOME</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { color: textSecondary }]}>WHAT WAS THE EXPENSE?</Text>
      <TextInput
        style={[styles.input, { backgroundColor: inputBg, borderColor, color: textPrimary }]}
        placeholder="e.g. Dinner, Netflix"
        placeholderTextColor="#64748B"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={[styles.label, { color: textSecondary }]}>HOW MUCH?</Text>
      <TextInput
        style={[styles.input, { backgroundColor: inputBg, borderColor, color: textPrimary }]}
        placeholder="Amount (₹)"
        placeholderTextColor="#64748B"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      {type === 'expense' && (
        <>
          <Text style={[styles.label, { color: textSecondary }]}>PAID VIA</Text>
          <View style={styles.chipsRow}>
            {(['UPI', 'Card', 'Cash', 'NetBanking'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, { backgroundColor: chipBg, borderColor }, method === m && styles.chipActive]}
                onPress={() => { haptics.selection(); setMethod(m); }}
              >
                <Text style={[styles.chipText, { color: textSecondary }, method === m && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: textSecondary }]}>CATEGORY</Text>
          <View style={[styles.chipsRow, { flexWrap: 'wrap' }]}>
            {(['bills', 'entertainment', 'food', 'gifts', 'general'] as ExpenseCategory[]).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, { backgroundColor: chipBg, borderColor }, category === cat && styles.chipActive]}
                onPress={() => { haptics.selection(); setCategory(cat); }}
              >
                <Text style={[styles.chipText, { color: textSecondary }, category === cat && styles.chipTextActive]}>{cat.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.chipsRow, { justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }]}>
            <Text style={[styles.label, { color: textSecondary, marginTop: 0 }]}>SPLIT EXPENSE?</Text>
            <TouchableOpacity 
              style={[styles.chip, { backgroundColor: chipBg, borderColor }, isSplit && styles.chipActive]}
              onPress={() => { haptics.selection(); setIsSplit(!isSplit); }}
            >
              <Text style={[styles.chipText, { color: textSecondary }, isSplit && styles.chipTextActive]}>{isSplit ? 'YES' : 'NO'}</Text>
            </TouchableOpacity>
          </View>

          {isSplit && (
            <View style={[styles.splitContainer, { borderColor }]}>
              <Text style={[styles.label, { color: textSecondary }]}>PAID BY</Text>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, { backgroundColor: chipBg, borderColor }, paidBy === 'Apeksha' && styles.chipActive]}
                  onPress={() => { haptics.selection(); setPaidBy('Apeksha'); }}
                >
                  <Text style={[styles.chipText, { color: textSecondary }, paidBy === 'Apeksha' && styles.chipTextActive]}>APEKSHA</Text>
                </TouchableOpacity>
                {AVAILABLE_FRIENDS.map(friend => (
                  <TouchableOpacity
                    key={`payer_${friend}`}
                    style={[styles.chip, { backgroundColor: chipBg, borderColor }, paidBy === friend && styles.chipActive]}
                    onPress={() => { haptics.selection(); setPaidBy(friend); }}
                  >
                    <Text style={[styles.chipText, { color: textSecondary }, paidBy === friend && styles.chipTextActive]}>{friend.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: textSecondary }]}>SPLIT WITH</Text>
              <View style={styles.chipsRow}>
                {AVAILABLE_FRIENDS.filter(f => f !== paidBy).map(friend => (
                  <TouchableOpacity
                    key={`with_${friend}`}
                    style={[styles.chip, { backgroundColor: chipBg, borderColor }, participants.includes(friend) && styles.chipActive]}
                    onPress={() => handleToggleParticipant(friend)}
                  >
                    <Text style={[styles.chipText, { color: textSecondary }, participants.includes(friend) && styles.chipTextActive]}>{friend.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {participants.length > 0 && (
                <>
                  <Text style={[styles.label, { color: textSecondary }]}>SPLIT STRATEGY</Text>
                  <View style={styles.segmentedRow}>
                    <TouchableOpacity
                      style={[styles.segmentBtn, { backgroundColor: inputBg, borderColor }, strategy === 'equally' && { backgroundColor: '#3B82F6', borderColor: '#60A5FA' }]}
                      onPress={() => { haptics.selection(); setStrategy('equally'); }}
                    >
                      <Text style={[styles.segmentText, { color: textSecondary }, strategy === 'equally' && styles.segmentTextActive]}>EQUALLY</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.segmentBtn, { backgroundColor: inputBg, borderColor }, strategy === 'custom' && { backgroundColor: '#8B5CF6', borderColor: '#A78BFA' }]}
                      onPress={() => { haptics.selection(); setStrategy('custom'); }}
                    >
                      <Text style={[styles.segmentText, { color: textSecondary }, strategy === 'custom' && styles.segmentTextActive]}>CUSTOM</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.sharesContainer}>
                    {allInvolved.map((p) => (
                      <View key={`share_${p}`} style={[styles.shareRow, { backgroundColor: inputBg }]}>
                        <Text style={[styles.shareName, { color: textPrimary }]}>{p === 'Apeksha' ? 'Apeksha' : p}</Text>
                        {strategy === 'equally' ? (
                          <Text style={[styles.shareValueText, { color: textPrimary }]}>
                            {formatters.currency(calculatedShares[p] || 0)}
                          </Text>
                        ) : (
                          <TextInput
                            style={[styles.shareInput, { backgroundColor: chipBg, borderColor, color: textPrimary }]}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor="#64748B"
                            value={customShares[p] || ''}
                            onChangeText={(val) => handleCustomShareChange(p, val)}
                          />
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Validation Banner for Custom Strategy */}
                  {(strategy === 'custom' && !isBalanced) && (
                    <View style={[styles.validationBanner, styles.validationBannerError]}>
                      <Text style={styles.validationText}>
                        {diffAmount > 0 
                          ? `REMAINING: ${formatters.currency(diffAmount)}`
                          : `OVER ASSIGNED: ${formatters.currency(Math.abs(diffAmount))}`}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          <Text style={[styles.label, { color: textSecondary }]}>DATE</Text>
          <TouchableOpacity 
            style={[styles.dateBtn, { backgroundColor: inputBg, borderColor }]}
            onPress={() => { haptics.selection(); setShowDatePicker(true); }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Feather name="calendar" size={16} color="#94A3B8" />
              <Text style={[styles.dateBtnText, { color: textPrimary }]}>{formatters.timestamp(txDate).split(',')[0]}</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={[styles.cancelBtnText, { color: textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveBtn, (isSplit && !isBalanced) && { backgroundColor: borderColor }]} 
          onPress={handleSave} 
          disabled={submitting || (isSplit && !isBalanced)}
        >
          {submitting ? (
            <ActivityIndicator color="#022C22" size="small" />
          ) : (
            <Text style={[styles.saveBtnText, (isSplit && !isBalanced) && { color: textSecondary }]}>{existingTransaction ? (isSplit ? 'Update Split' : 'Update Expense') : 'Save'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <BottomSheet visible={showDatePicker} onClose={() => setShowDatePicker(false)}>
        <Text style={[styles.sheetTitle, { color: textPrimary }]}>Select Date</Text>
        <View style={{ maxHeight: 300 }}>
          {[...Array(30)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const isSelected = d.toDateString() === txDate.toDateString();
            return (
              <TouchableOpacity
                key={i}
                style={[styles.dateOptionBtn, { borderBottomColor: borderColor }, isSelected && styles.dateOptionBtnSelected]}
                onPress={() => {
                  haptics.selection();
                  setTxDate(d);
                  setShowDatePicker(false);
                }}
              >
                <Text style={[styles.dateOptionText, { color: textSecondary }, isSelected && styles.dateOptionTextSelected]}>
                  {i === 0 ? 'Today' : i === 1 ? 'Yesterday' : formatters.timestamp(d).split(',')[0]}
                </Text>
                {isSelected && <Feather name="check" size={16} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  segmentBtnExpense: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: '#F43F5E',
  },
  segmentBtnIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#0F172A',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  splitContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    marginBottom: 16,
  },
  sharesContainer: {
    marginTop: 8,
    gap: 12,
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  shareName: {
    fontSize: 14,
    fontWeight: '600',
  },
  shareValueText: {
    fontSize: 14,
    fontWeight: '700',
  },
  shareInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    width: 100,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  validationBanner: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  validationBannerOk: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: '#34D399',
  },
  validationBannerError: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#F43F5E',
  },
  validationText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  dateBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dateOptionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dateOptionBtnSelected: {
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
  },
  dateOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dateOptionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
});

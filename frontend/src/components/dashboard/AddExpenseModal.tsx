import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { haptics } from '../../services/haptics';
import type { ExpenseCategory } from '../../types';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onAddExpense: (data: {
    title: string;
    amount: number;
    category: ExpenseCategory;
    type: 'expense' | 'income';
    method: 'UPI' | 'Card' | 'Cash' | 'NetBanking';
  }) => void;
  currencySymbol?: string;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  onAddExpense,
  currencySymbol = '$',
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState<ExpenseCategory>('shopping');
  const [method, setMethod] = useState<'UPI' | 'Card' | 'Cash' | 'NetBanking'>('Card');

  const categories: { key: ExpenseCategory; label: string; icon: string }[] = [
    { key: 'shopping', label: 'Shopping', icon: 'shopping-bag' },
    { key: 'food', label: 'Food & Dining', icon: 'coffee' },
    { key: 'bills', label: 'Bills & Utilities', icon: 'file-text' },
    { key: 'travel', label: 'Travel', icon: 'map-pin' },
    { key: 'entertainment', label: 'Entertainment', icon: 'tv' },
    { key: 'health', label: 'Health', icon: 'activity' },
  ];

  const methods: ('Card' | 'UPI' | 'Cash' | 'NetBanking')[] = ['Card', 'UPI', 'Cash', 'NetBanking'];

  const handleSubmit = () => {
    const num = parseFloat(amount);
    if (!title.trim() || isNaN(num) || num <= 0) {
      try { haptics.error(); } catch {}
      return;
    }

    try { haptics.success(); } catch {}
    onAddExpense({
      title: title.trim(),
      amount: num,
      category,
      type,
      method,
    });
    setTitle('');
    setAmount('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContent}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Record Transaction</Text>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => {
                    try { haptics.selection(); } catch {}
                    onClose();
                  }}
                >
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Type Toggle: Expense vs Income */}
                <View style={styles.typeToggle}>
                  <TouchableOpacity
                    style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveExpense]}
                    onPress={() => {
                      try { haptics.selection(); } catch {}
                      setType('expense');
                    }}
                  >
                    <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>
                      Expense
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]}
                    onPress={() => {
                      try { haptics.selection(); } catch {}
                      setType('income');
                    }}
                  >
                    <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>
                      Income
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Amount Input */}
                <View style={styles.amountBox}>
                  <Text style={styles.currPrefix}>{currencySymbol}</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>

                {/* Title Input */}
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldLabel}>Merchant / Description</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Amazon.com, Mac mini M4, Coffee"
                    placeholderTextColor="#94A3B8"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                {/* Category Selector */}
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <View style={styles.chipsRow}>
                    {categories.map((cat) => {
                      const isSelected = category === cat.key;
                      return (
                        <TouchableOpacity
                          key={cat.key}
                          style={[styles.chip, isSelected && styles.chipActive]}
                          onPress={() => {
                            try { haptics.selection(); } catch {}
                            setCategory(cat.key);
                          }}
                        >
                          <Feather
                            name={cat.icon as any}
                            size={12}
                            color={isSelected ? '#FFFFFF' : '#64748B'}
                          />
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Payment Method */}
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldLabel}>Payment Method</Text>
                  <View style={styles.chipsRow}>
                    {methods.map((m) => {
                      const isSelected = method === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[styles.chip, isSelected && styles.chipActive]}
                          onPress={() => {
                            try { haptics.selection(); } catch {}
                            setMethod(m);
                          }}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitBtnText}>Add Transaction</Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  typeBtnActiveExpense: {
    backgroundColor: '#0F172A',
  },
  typeBtnActiveIncome: {
    backgroundColor: '#10B981',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    height: 56,
    marginBottom: 16,
  },
  currPrefix: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldBox: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#0F172A',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  chipActive: {
    backgroundColor: '#0F172A',
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, TextInput, KeyboardAvoidingView, Switch, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { haptics } from '../services/haptics';
import { useDrawer } from '../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useFinance } from '../hooks/FinanceContext';
import { formatters } from '../utils/formatters';
import { BottomSheet } from '../components/BottomSheet';
import type { PaymentItem, ExpenseCategory, AccountType } from '../types';

export function PaymentsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { state, addPayment, editPayment, deletePayment, markPaymentPaid } = useFinance();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentItem | null>(null);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('bills');
  const [account, setAccount] = useState<AccountType>('salary');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [recurring, setRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [method, setMethod] = useState<'UPI' | 'Card' | 'NetBanking' | 'Cash'>('UPI');

  const pendingPayments = useMemo(() => {
    return state.payments
      .filter(p => p.status === 'pending')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [state.payments]);

  const paidPayments = useMemo(() => {
    return state.payments
      .filter(p => p.status === 'paid')
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [state.payments]);

  const openNewPayment = () => {
    setEditingPayment(null);
    setTitle('');
    setAmount('');
    setCategory('bills');
    setAccount('salary');
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDueDate(d.toISOString().split('T')[0]);
    setRecurring(false);
    setRecurrenceType('monthly');
    setMethod('UPI');
    setIsSheetOpen(true);
  };

  const openEditPayment = (p: PaymentItem) => {
    setEditingPayment(p);
    setTitle(p.title);
    setAmount(p.amount.toString());
    setCategory(p.category);
    setAccount(p.account);
    setDueDate(new Date(p.dueDate).toISOString().split('T')[0]);
    setRecurring(p.recurring);
    setRecurrenceType(p.recurrenceType || 'monthly');
    setMethod(p.method || 'UPI');
    setIsSheetOpen(true);
  };

  const handleSave = () => {
    if (!title.trim() || !amount.trim() || isNaN(Number(amount))) {
      Alert.alert('Invalid Input', 'Please enter a valid title and amount.');
      return;
    }

    const payload: PaymentItem = {
      id: editingPayment ? editingPayment.id : `pay_${Date.now()}`,
      title: title.trim(),
      amount: Number(amount),
      dueDate: new Date(dueDate).toISOString(),
      category,
      account,
      recurring,
      recurrenceType: recurring ? recurrenceType : undefined,
      status: editingPayment ? editingPayment.status : 'pending',
      method,
    };

    if (editingPayment) {
      editPayment(payload);
    } else {
      addPayment(payload);
    }

    haptics.success();
    setIsSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Payment', 'Are you sure you want to delete this payment reminder?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        haptics.medium();
        deletePayment(id);
      }}
    ]);
  };

  const handleMarkPaid = (id: string) => {
    Alert.alert('Mark as Paid', 'This will create an actual expense transaction. Proceed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'default', onPress: () => {
        haptics.success();
        markPaymentPaid(id);
      }}
    ]);
  };

  const renderPayment = (p: PaymentItem) => {
    const isOverdue = p.status === 'pending' && new Date(p.dueDate).getTime() < new Date().getTime();
    let iconName: any = 'credit-card';
    switch (p.category?.toLowerCase()) {
      case 'food': iconName = 'coffee'; break;
      case 'travel': iconName = 'navigation'; break;
      case 'shopping': iconName = 'shopping-bag'; break;
      case 'bills': iconName = 'file-text'; break;
      case 'health': iconName = 'heart'; break;
      case 'entertainment': iconName = 'tv'; break;
    }

    return (
      <TouchableOpacity key={p.id} style={styles.transactionCard} onPress={() => openEditPayment(p)}>
        <View style={styles.txLeft}>
          <View style={[styles.txIconBox, { backgroundColor: isOverdue ? 'rgba(255, 77, 77, 0.15)' : p.status === 'paid' ? 'rgba(0, 209, 178, 0.15)' : 'rgba(255, 184, 77, 0.15)' }]}>
            <Feather name={p.status === 'paid' ? 'check' : iconName} size={16} color={isOverdue ? colors.coral : p.status === 'paid' ? colors.primary : '#FFB84D'} />
          </View>
          <View>
            <Text style={styles.txTitle}>{p.title}</Text>
            <Text style={[styles.txDate, isOverdue && { color: colors.coral, fontWeight: '600' }]}>
              {p.status === 'paid' ? 'Paid: ' : isOverdue ? 'Overdue: ' : 'Due: '}{formatters.timestamp(new Date(p.dueDate))}
              {p.recurring && ` • 🔄 ${p.recurrenceType}`}
            </Text>
          </View>
        </View>
        <View style={styles.txRight}>
          <Text style={styles.txAmountNegative}>
            {formatters.currency(p.amount)}
          </Text>
          {p.status === 'pending' && (
            <TouchableOpacity style={styles.payBtn} onPress={() => handleMarkPaid(p.id)}>
              <Text style={styles.payBtnText}>PAY NOW</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <View style={styles.screenTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => { haptics.selection(); openDrawer(); }} style={{ marginRight: 12 }}>
              <Feather name="menu" size={24} color="#F8FAFC" />
            </TouchableOpacity>
            <View>
              <Text style={styles.screenHeading}>Upcoming Payments</Text>
              <Text style={styles.screenSubheading}>Manage recurring bills and dues</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => { haptics.medium(); openNewPayment(); }}>
            <Feather name="plus" size={16} color="#FFF" />
            <Text style={styles.newBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          <Text style={styles.sectionHeader}>Pending</Text>
          {pendingPayments.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 15, marginBottom: 4 }}>No pending payments</Text>
              <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 13 }}>You're all caught up! Enjoy your stress-free month.</Text>
            </View>
          ) : (
            pendingPayments.map(renderPayment)
          )}

          {paidPayments.length > 0 && (
            <>
              <Text style={[styles.sectionHeader, { marginTop: 20 }]}>Recently Paid</Text>
              {paidPayments.map(renderPayment)}
            </>
          )}
        </ScrollView>
      </View>

      <BottomSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingPayment ? 'Edit Payment' : 'New Payment'}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.formRow}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Netflix Subscription"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

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
            <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2026-10-15"
              placeholderTextColor={colors.textSecondary}
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>

          <View style={styles.formRow}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>Recurring Payment</Text>
              <Switch value={recurring} onValueChange={setRecurring} trackColor={{ true: colors.primary }} />
            </View>
          </View>

          {recurring && (
            <View style={styles.formRow}>
              <Text style={styles.label}>Recurrence</Text>
              <View style={styles.chipsRow}>
                {['daily', 'weekly', 'monthly', 'yearly'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, recurrenceType === t && styles.chipActive]}
                    onPress={() => setRecurrenceType(t as any)}
                  >
                    <Text style={[styles.chipText, recurrenceType === t && styles.chipTextActive]}>
                      {formatters.capitalize(t)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>{editingPayment ? 'Save Changes' : 'Add Payment'}</Text>
          </TouchableOpacity>

          {editingPayment && (
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(editingPayment.id)}>
              <Feather name="trash-2" size={16} color={colors.coral} />
              <Text style={styles.deleteBtnText}>Delete Payment</Text>
            </TouchableOpacity>
          )}
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
  newBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
  },
  newBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 4 },
  
  listContainer: { flex: 1 },
  listContent: { paddingBottom: 100 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, marginTop: 10 },
  
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
  txAmountNegative: { fontSize: 14, fontWeight: '600', color: colors.coral, marginBottom: 8 },
  payBtn: { backgroundColor: 'rgba(0, 209, 178, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  payBtnText: { fontSize: 10, fontWeight: '800', color: colors.primary },

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
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 6 },
  deleteBtnText: { color: colors.coral, fontWeight: '600', fontSize: 14 },
});

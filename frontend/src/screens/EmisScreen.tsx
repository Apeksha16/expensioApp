import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useEmis } from '../hooks';
import { formatters } from '../utils/formatters';
import { haptics } from '../services/haptics';
import { useDrawer } from '../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { SwipeableRow } from '../components/SwipeableRow';
import { BottomSheet } from '../components/BottomSheet';
import type { EmiItem } from '../types';

export function EmisScreen({ navigation, route, ...props }: any) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { isDark } = useTheme();

  const {
    emis,
    loading,
    totalMonthly,
    markPaid,
    addEmi,
    updateEmi,
    deleteEmi,
  } = useEmis();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingEmi, setEditingEmi] = useState<EmiItem | null>(null);
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [totalMonths, setTotalMonths] = useState('');
  const [monthsPaid, setMonthsPaid] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const bgColor = isDark ? '#090909' : '#F6F3EE';
  const cardBg = isDark ? '#121212' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#A1A1AA' : '#8E8E93';
  const borderColor = isDark ? '#27272A' : '#EBE6DE';
  const primaryColor = '#F97316'; // Orange for EMIs

  const openSheet = (emi?: EmiItem) => {
    if (emi) {
      setEditingEmi(emi);
      setName(emi.name);
      setAmount(emi.amount.toString());
      setTotalAmount(emi.totalAmount.toString());
      setTotalMonths(emi.totalMonths.toString());
      setMonthsPaid(emi.monthsPaid.toString());
      setDueDate(emi.dueDate);
    } else {
      setEditingEmi(null);
      setName('');
      setAmount('');
      setTotalAmount('');
      setTotalMonths('');
      setMonthsPaid('0');
      setDueDate('');
    }
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !amount.trim() || !dueDate.trim() || !totalAmount.trim() || !totalMonths.trim()) return;
    setSubmitting(true);
    
    const payload = {
      name: name.trim(),
      amount: parseFloat(amount),
      totalAmount: parseFloat(totalAmount),
      totalMonths: parseInt(totalMonths, 10),
      monthsPaid: parseInt(monthsPaid || '0', 10),
      dueDate: dueDate.trim(),
    };

    if (editingEmi) {
      await updateEmi(editingEmi.id, payload);
    } else {
      await addEmi(payload);
    }
    
    setSubmitting(false);
    setIsSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete EMI', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEmi(id) },
    ]);
  };

  const renderEmiCard = (emi: EmiItem) => {
    const isPaid = emi.status === 'PAID';
    const progress = Math.min((emi.monthsPaid / emi.totalMonths) * 100, 100) || 0;

    return (
      <SwipeableRow key={emi.id} onEdit={() => openSheet(emi)} onDelete={() => handleDelete(emi.id)}>
        <View style={[styles.subCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={[styles.subIconBox, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.1)' }]}>
            <Feather name="credit-card" size={20} color={primaryColor} />
          </View>

          <View style={styles.subContentCol}>
            <View style={styles.subTopRow}>
              <Text style={[styles.subTitleText, { color: textPrimary }]}>{emi.name}</Text>
              <Text style={[styles.subAmountText, { color: textPrimary }]}>{formatters.currency(emi.amount)}</Text>
            </View>
            
            <View style={{ marginBottom: 12 }}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 10, color: textSecondary, fontWeight: '600' }}>{emi.monthsPaid} / {emi.totalMonths} Paid</Text>
                  <Text style={{ fontSize: 10, color: textSecondary, fontWeight: '600' }}>{Math.round(progress)}%</Text>
               </View>
               <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#27272A' : '#EBE6DE' }]}>
                  <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: primaryColor }]} />
               </View>
            </View>

            <View style={styles.subBottomRow}>
              <View style={[styles.statusBadge, { backgroundColor: isDark ? '#1E1E1E' : '#F1F5F9' }]}>
                <Text style={[styles.statusBadgeText, { color: textSecondary }]}>DUE ON {emi.dueDate.toUpperCase()}</Text>
              </View>

              {isPaid ? (
                <View style={[styles.paidActionBadge, { backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC' }]}>
                  <Feather name="check" size={10} color={primaryColor} />
                  <Text style={[styles.paidActionText, { color: primaryColor }]}>PAID THIS MONTH</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.payActionBtn, { backgroundColor: primaryColor }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    haptics.medium();
                    markPaid(emi.id);
                  }}
                >
                  <Feather name="check" size={10} color="#FFF" />
                  <Text style={styles.payActionBtnText}>MARK PAID</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </SwipeableRow>
    );
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => { haptics.selection(); openDrawer(); }} style={{ marginRight: 16 }}>
            <Feather name="menu" size={24} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: textPrimary }]}>EMIs & Loans</Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.totalLabel, { color: textSecondary }]}>TOTAL MONTHLY EMIs</Text>
          <Text style={[styles.totalAmount, { color: textPrimary }]}>{formatters.currency(totalMonthly)}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={primaryColor} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.itemsList}>
            {emis.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.emptyIconBox}>
                  <Feather name="credit-card" size={24} color={primaryColor} />
                </View>
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>No active EMIs</Text>
              </View>
            ) : (
              emis.map(renderEmiCard)
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fabBtn, { backgroundColor: primaryColor }]} activeOpacity={0.8} onPress={() => { haptics.medium(); openSheet(); }}>
        <Feather name="plus" size={26} color="#FFF" />
      </TouchableOpacity>

      <BottomSheet visible={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
        <Text style={[styles.sheetTitle, { color: textPrimary }]}>{editingEmi ? 'Edit EMI' : 'New EMI'}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC', borderColor, color: textPrimary }]}
          placeholder="Loan/EMI Name (e.g. Car Loan)"
          placeholderTextColor={textSecondary}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC', borderColor, color: textPrimary }]}
          placeholder="Monthly EMI Amount (₹)"
          placeholderTextColor={textSecondary}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC', borderColor, color: textPrimary }]}
            placeholder="Total Loan Amount"
            placeholderTextColor={textSecondary}
            keyboardType="decimal-pad"
            value={totalAmount}
            onChangeText={setTotalAmount}
          />
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC', borderColor, color: textPrimary }]}
            placeholder="Due Date (e.g. 5th)"
            placeholderTextColor={textSecondary}
            value={dueDate}
            onChangeText={setDueDate}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC', borderColor, color: textPrimary }]}
            placeholder="Total Months"
            placeholderTextColor={textSecondary}
            keyboardType="number-pad"
            value={totalMonths}
            onChangeText={setTotalMonths}
          />
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC', borderColor, color: textPrimary }]}
            placeholder="Months Paid (e.g. 5)"
            placeholderTextColor={textSecondary}
            keyboardType="number-pad"
            value={monthsPaid}
            onChangeText={setMonthsPaid}
          />
        </View>
        
        <View style={styles.sheetActionsRow}>
          <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => setIsSheetOpen(false)}>
            <Text style={[styles.sheetCancelText, { color: textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sheetSaveBtn, { backgroundColor: primaryColor }]} onPress={handleSave} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.sheetSaveText}>Save EMI</Text>}
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 110 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  heroCard: { borderRadius: 20, padding: 24, marginBottom: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  totalLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  totalAmount: { fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  itemsList: { gap: 12 },
  subCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  subIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  subContentCol: { flex: 1, justifyContent: 'center' },
  subTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subTitleText: { fontSize: 15, fontWeight: '700' },
  subAmountText: { fontSize: 15, fontWeight: '800' },
  subBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  statusBadgeText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 },
  paidActionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  paidActionText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  payActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
  payActionBtnText: { fontSize: 10, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 },
  emptyCard: { padding: 40, borderRadius: 24, alignItems: 'center', borderWidth: 1, marginTop: 10 },
  emptyIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(249, 115, 22, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  fabBtn: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, zIndex: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 52, fontSize: 14, fontWeight: '600', marginBottom: 12 },
  sheetActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 10 },
  sheetCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  sheetCancelText: { fontSize: 13, fontWeight: '600' },
  sheetSaveBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  sheetSaveText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  progressBarBg: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
});

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
import { useSubscriptions } from '../hooks';
import { formatters } from '../utils/formatters';
import { haptics } from '../services/haptics';
import { useDrawer } from '../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { colors } from '../theme/colors';
import { SwipeableRow } from '../components/SwipeableRow';
import { BottomSheet } from '../components/BottomSheet';
import type { SubscriptionItem } from '../types';

export function SubscriptionsScreen({ navigation, route, ...props }: any) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { isDark } = useTheme();

  const {
    subscriptions,
    subTab,
    loading,
    totalMonthly,
    changeSubTab,
    markPaid,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  } = useSubscriptions();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionItem | null>(null);
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const bgColor = isDark ? '#090909' : '#F6F3EE';
  const cardBg = isDark ? '#121212' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#A1A1AA' : '#8E8E93';
  const borderColor = isDark ? '#27272A' : '#EBE6DE';

  const openSheet = (sub?: SubscriptionItem) => {
    if (sub) {
      setEditingSub(sub);
      setName(sub.name);
      setAmount(sub.amount.toString());
      setDueDate(sub.dueDate);
    } else {
      setEditingSub(null);
      setName('');
      setAmount('');
      setDueDate('');
    }
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !amount.trim() || !dueDate.trim()) return;
    setSubmitting(true);
    
    if (editingSub) {
      await updateSubscription(editingSub.id, { name: name.trim(), amount: parseFloat(amount), dueDate: dueDate.trim() });
    } else {
      await addSubscription({ name: name.trim(), amount: parseFloat(amount), dueDate: dueDate.trim() });
    }
    
    setSubmitting(false);
    setIsSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Subscription', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSubscription(id) },
    ]);
  };

  const getSubMeta = (name: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('netflix') || lower.includes('prime') || lower.includes('hotstar')) {
      return { icon: 'film' as const, color: '#FB7185', bg: isDark ? 'rgba(251, 113, 133, 0.15)' : 'rgba(251, 113, 133, 0.1)' };
    }
    if (lower.includes('youtube') || lower.includes('music') || lower.includes('spotify')) {
      return { icon: 'play-circle' as const, color: '#A78BFA', bg: isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(167, 139, 250, 0.1)' };
    }
    if (lower.includes('wifi') || lower.includes('broadband') || lower.includes('airtel')) {
      return { icon: 'wifi' as const, color: '#38BDF8', bg: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.1)' };
    }
    return { icon: 'zap' as const, color: '#FBBF24', bg: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)' };
  };

  const getStatusBadgeStyles = (sub: any) => {
    if (sub.status === 'OVERDUE') {
      return {
        text: `OVERDUE BY ${Math.abs(sub.daysLeft || 0)} DAY(S)`,
        color: '#EF4444',
        bg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'
      };
    }
    if (sub.status === 'UPCOMING' && sub.monthGroup === 'this') {
      return {
        text: `DUE IN ${sub.daysLeft || 0} DAY(S)`,
        color: '#8B5CF6',
        bg: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)'
      };
    }
    return {
      text: `DUE ON ${sub.dueDate.toUpperCase()}`,
      color: textSecondary,
      bg: isDark ? '#1E1E1E' : '#F1F5F9'
    };
  };

  const filteredSubs = subscriptions.filter((s) => {
    if (subTab === 'upcoming') return s.status !== 'PAID';
    return s.status === 'PAID';
  });

  const thisMonthSubs = filteredSubs.filter(s => s.monthGroup === 'this' || !s.monthGroup);
  const nextMonthSubs = filteredSubs.filter(s => s.monthGroup === 'next');

  const renderSubCard = (sub: any) => {
    const meta = getSubMeta(sub.name);
    const isPaid = sub.status === 'PAID';
    const badgeMeta = getStatusBadgeStyles(sub);

    return (
      <SwipeableRow key={sub.id} onEdit={() => openSheet(sub)} onDelete={() => handleDelete(sub.id)}>
        <View style={[styles.subCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={[styles.subIconBox, { backgroundColor: meta.bg }]}>
            <Feather name={meta.icon} size={20} color={meta.color} />
          </View>

          <View style={styles.subContentCol}>
            <View style={styles.subTopRow}>
              <Text style={[styles.subTitleText, { color: textPrimary }]}>{sub.name}</Text>
              <Text style={[styles.subAmountText, { color: textPrimary }]}>{formatters.currency(sub.amount)}</Text>
            </View>
            
            <View style={styles.subBottomRow}>
              {isPaid ? (
                <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(52, 211, 153, 0.1)' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#34D399' }]}>PAID ON {sub.dueDate}</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: badgeMeta.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: badgeMeta.color }]}>{badgeMeta.text}</Text>
                </View>
              )}

              {isPaid ? (
                <View style={[styles.paidActionBadge, { backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC' }]}>
                  <Feather name="check" size={10} color="#D946EF" />
                  <Text style={[styles.paidActionText, { color: '#D946EF' }]}>PAID</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.payActionBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    haptics.medium();
                    markPaid(sub.id);
                  }}
                >
                  <Feather name="check" size={10} color="#FFF" />
                  <Text style={styles.payActionBtnText}>PAID</Text>
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
          <Text style={[styles.pageTitle, { color: textPrimary }]}>Subscriptions</Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.totalLabel, { color: textSecondary }]}>TOTAL MONTHLY SUBSCRIPTIONS</Text>
          <Text style={[styles.totalAmount, { color: textPrimary }]}>{formatters.currency(totalMonthly)}</Text>
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity style={[styles.tabBtn, subTab === 'upcoming' ? styles.tabBtnActive : { backgroundColor: cardBg, borderColor }]} onPress={() => changeSubTab('upcoming')}>
            <Text style={[styles.tabText, subTab === 'upcoming' ? styles.tabTextActive : { color: textSecondary }]}>UPCOMING</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, subTab === 'paid' ? styles.tabBtnActive : { backgroundColor: cardBg, borderColor }]} onPress={() => changeSubTab('paid')}>
            <Text style={[styles.tabText, subTab === 'paid' ? styles.tabTextActive : { color: textSecondary }]}>PAID</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#D946EF" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.itemsList}>
            {filteredSubs.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.emptyIconBox}>
                  <Feather name="check" size={24} color="#D946EF" />
                </View>
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>Nothing paid yet</Text>
              </View>
            ) : (
              <>
                {thisMonthSubs.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { color: textSecondary }]}>THIS MONTH</Text>
                    {thisMonthSubs.map(renderSubCard)}
                  </>
                )}
                {nextMonthSubs.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { color: textSecondary, marginTop: 16 }]}>NEXT MONTH</Text>
                    {nextMonthSubs.map(renderSubCard)}
                  </>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fabBtn} activeOpacity={0.8} onPress={() => { haptics.medium(); openSheet(); }}>
        <Feather name="plus" size={26} color="#FFF" />
      </TouchableOpacity>

      <BottomSheet visible={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
        <Text style={[styles.sheetTitle, { color: textPrimary }]}>{editingSub ? 'Edit Subscription' : 'New Subscription'}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC', borderColor, color: textPrimary }]}
          placeholder="Service Name (e.g. Netflix)"
          placeholderTextColor={textSecondary}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC', borderColor, color: textPrimary }]}
          placeholder="Monthly Amount (₹)"
          placeholderTextColor={textSecondary}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC', borderColor, color: textPrimary }]}
          placeholder="Due Date (e.g. 4th, Sep 15)"
          placeholderTextColor={textSecondary}
          value={dueDate}
          onChangeText={setDueDate}
        />
        
        <View style={styles.sheetActionsRow}>
          <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => setIsSheetOpen(false)}>
            <Text style={[styles.sheetCancelText, { color: textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sheetSaveBtn, { backgroundColor: '#D946EF' }]} onPress={handleSave} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.sheetSaveText}>Save</Text>}
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
  tabsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1 },
  tabBtnActive: { backgroundColor: '#D946EF', borderColor: '#D946EF', borderWidth: 1 },
  tabText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  tabTextActive: { color: '#FFF' },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12, marginLeft: 4 },
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
  payActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D946EF', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
  payActionBtnText: { fontSize: 10, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 },
  emptyCard: { padding: 40, borderRadius: 24, alignItems: 'center', borderWidth: 1, marginTop: 10 },
  emptyIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(217, 70, 239, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  fabBtn: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#D946EF', alignItems: 'center', justifyContent: 'center', shadowColor: '#D946EF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, zIndex: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 52, fontSize: 14, fontWeight: '600', marginBottom: 12 },
  sheetActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 10 },
  sheetCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  sheetCancelText: { fontSize: 13, fontWeight: '600' },
  sheetSaveBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  sheetSaveText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});

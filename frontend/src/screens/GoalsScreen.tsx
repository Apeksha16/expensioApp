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
import { useGoals } from '../hooks';
import { formatters } from '../utils/formatters';
import { haptics } from '../services/haptics';
import { useDrawer } from '../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { SwipeableRow } from '../components/SwipeableRow';
import { BottomSheet } from '../components/BottomSheet';
import type { GoalItem } from '../types';

export function GoalsScreen({ navigation, route, ...props }: any) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { isDark } = useTheme();

  const {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useGoals();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);
  
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const bgColor = isDark ? '#090909' : '#F6F3EE';
  const cardBg = isDark ? '#121212' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#A1A1AA' : '#8E8E93';
  const borderColor = isDark ? '#27272A' : '#EBE6DE';
  const primaryColor = '#10B981'; // Emerald Green for Goals

  const totalSaved = goals.reduce((acc, g) => acc + (g.savedAmount || 0), 0);
  const totalTarget = goals.reduce((acc, g) => acc + (g.targetAmount || 0), 0);

  const openSheet = (goal?: GoalItem) => {
    if (goal) {
      setEditingGoal(goal);
      setName(goal.name);
      setTargetAmount(goal.targetAmount.toString());
      setSavedAmount(goal.savedAmount.toString());
      setTargetDate(goal.targetDate);
      setMonthlyContribution(goal.monthlyContribution?.toString() || '');
    } else {
      setEditingGoal(null);
      setName('');
      setTargetAmount('');
      setSavedAmount('');
      setTargetDate('');
      setMonthlyContribution('');
    }
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !targetAmount.trim() || !targetDate.trim()) return;
    setSubmitting(true);
    
    const payload = {
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      savedAmount: parseFloat(savedAmount || '0'),
      targetDate: targetDate.trim(),
      monthlyContribution: parseFloat(monthlyContribution || '0'),
    };

    if (editingGoal) {
      await updateGoal(editingGoal.id, payload);
    } else {
      await addGoal(payload);
    }
    
    setSubmitting(false);
    setIsSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(id) },
    ]);
  };

  const renderGoalCard = (goal: GoalItem) => {
    const isCompleted = goal.savedAmount >= goal.targetAmount;
    const progress = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) || 0;

    return (
      <SwipeableRow key={goal.id} onEdit={() => openSheet(goal)} onDelete={() => handleDelete(goal.id)}>
        <View style={[styles.subCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={[styles.subIconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
            <Feather name="target" size={20} color={primaryColor} />
          </View>

          <View style={styles.subContentCol}>
            <View style={styles.subTopRow}>
              <Text style={[styles.subTitleText, { color: textPrimary }]}>{goal.name}</Text>
              <Text style={[styles.subAmountText, { color: textPrimary }]}>{formatters.currency(goal.targetAmount)}</Text>
            </View>
            
            <View style={{ marginBottom: 12 }}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 10, color: textSecondary, fontWeight: '600' }}>
                     Saved: {formatters.currency(goal.savedAmount)}
                  </Text>
                  <Text style={{ fontSize: 10, color: textSecondary, fontWeight: '600' }}>{Math.round(progress)}%</Text>
               </View>
               <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#27272A' : '#EBE6DE' }]}>
                  <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: isCompleted ? '#3B82F6' : primaryColor }]} />
               </View>
            </View>

            <View style={styles.subBottomRow}>
              <View style={[styles.statusBadge, { backgroundColor: isDark ? '#1E1E1E' : '#F1F5F9' }]}>
                <Text style={[styles.statusBadgeText, { color: textSecondary }]}>TARGET: {goal.targetDate.toUpperCase()}</Text>
              </View>

              {goal.monthlyContribution > 0 && (
                <View style={[styles.paidActionBadge, { backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC' }]}>
                  <Text style={[styles.paidActionText, { color: primaryColor }]}>+ {formatters.currency(goal.monthlyContribution)} /mo</Text>
                </View>
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
          <Text style={[styles.pageTitle, { color: textPrimary }]}>Financial Goals</Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.totalLabel, { color: textSecondary }]}>TOTAL SAVED ACROSS GOALS</Text>
          <Text style={[styles.totalAmount, { color: textPrimary }]}>{formatters.currency(totalSaved)}</Text>
          <Text style={[styles.heroSubtitle, { color: textSecondary }]}>OUT OF {formatters.currency(totalTarget)}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={primaryColor} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.itemsList}>
            {goals.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.emptyIconBox}>
                  <Feather name="target" size={24} color={primaryColor} />
                </View>
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>No goals yet</Text>
              </View>
            ) : (
              goals.map(renderGoalCard)
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fabBtn, { backgroundColor: primaryColor }]} activeOpacity={0.8} onPress={() => { haptics.medium(); openSheet(); }}>
        <Feather name="plus" size={26} color="#FFF" />
      </TouchableOpacity>

      <BottomSheet visible={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
        <Text style={[styles.sheetTitle, { color: textPrimary }]}>{editingGoal ? 'Edit Goal' : 'New Goal'}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC', borderColor, color: textPrimary }]}
          placeholder="Goal Name (e.g. PS5, Vacation)"
          placeholderTextColor={textSecondary}
          value={name}
          onChangeText={setName}
        />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC', borderColor, color: textPrimary }]}
            placeholder="Target Amount (₹)"
            placeholderTextColor={textSecondary}
            keyboardType="decimal-pad"
            value={targetAmount}
            onChangeText={setTargetAmount}
          />
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC', borderColor, color: textPrimary }]}
            placeholder="Saved Amount (₹)"
            placeholderTextColor={textSecondary}
            keyboardType="decimal-pad"
            value={savedAmount}
            onChangeText={setSavedAmount}
          />
        </View>
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC', borderColor, color: textPrimary }]}
          placeholder="Target Date (e.g. Dec 31, 2026)"
          placeholderTextColor={textSecondary}
          value={targetDate}
          onChangeText={setTargetDate}
        />
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC', borderColor, color: textPrimary }]}
          placeholder="Monthly Save Plan (e.g. 5000)"
          placeholderTextColor={textSecondary}
          keyboardType="decimal-pad"
          value={monthlyContribution}
          onChangeText={setMonthlyContribution}
        />
        
        <View style={styles.sheetActionsRow}>
          <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => setIsSheetOpen(false)}>
            <Text style={[styles.sheetCancelText, { color: textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sheetSaveBtn, { backgroundColor: primaryColor }]} onPress={handleSave} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.sheetSaveText}>Save Goal</Text>}
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
  totalAmount: { fontSize: 38, fontWeight: '800', letterSpacing: -1, marginBottom: 4 },
  heroSubtitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
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
  emptyCard: { padding: 40, borderRadius: 24, alignItems: 'center', borderWidth: 1, marginTop: 10 },
  emptyIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  fabBtn: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, zIndex: 10 },
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

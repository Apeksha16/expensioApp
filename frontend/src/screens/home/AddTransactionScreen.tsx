import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { CURRENT_USER_ID } from '../../data/splits';
import type { MainTabParamList } from '../../navigation/MainTabs';
import { createExpenseService, getCategories } from '../../services/expenseService';
import { colors, radius, spacing, typography } from '../../theme';
import type { ExpensePaymentMode, ExpenseSource, SplitMethod, SplitShare, Transaction } from '../../types';
import { formatTransactionDate } from '../../utils/format';
import { buildEqualShares, getFriendMeta } from '../../utils/splits';
import { localDateString, validateDate, validatePositiveAmount } from '../../services/moneyService';

type Props = BottomTabScreenProps<MainTabParamList, 'Add'>;
const paymentModes: { value: ExpensePaymentMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'cash', label: 'Cash', icon: 'cash-outline' },
  { value: 'debit_card', label: 'Debit Card', icon: 'card-outline' },
  { value: 'credit_card', label: 'Credit Card', icon: 'card' },
];
const incomeCategories = ['Salary', 'Business', 'Freelance', 'Investment', 'Other'];

function sourceForPaymentMode(mode: ExpensePaymentMode): ExpenseSource {
  return mode === 'cash' ? 'cash' : 'salary';
}

function getLocalDate(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day
    ? null
    : date;
}

export function AddTransactionScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const {
    profile,
    friends,
    budgets,
    splits,
    transactions,
    addTransaction,
    addSplit,
    updateTransaction,
    removeTransaction,
    showToast,
  } = useApp();
  const [type, setType] = useState<'expense' | 'income'>(route.params?.type ?? 'expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState('Others');
  const [date, setDate] = useState(localDateString(new Date()));
  const [paymentMode, setPaymentMode] = useState<ExpensePaymentMode>('debit_card');
  const [incomeCategory, setIncomeCategory] = useState(incomeCategories[0]);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [exactShares, setExactShares] = useState<Record<string, number>>({});
  const [exactShareText, setExactShareText] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const editingSplit = editingTransaction
    ? splits.find((item) => item.id === editingTransaction.splitExpenseId || item.ledgerTransactionId === editingTransaction.id)
    : undefined;

  const categoryOptions = useMemo(() => getCategories(budgets), [budgets]);
  const expenseService = useMemo(() => createExpenseService({
    create: addTransaction,
    update: updateTransaction,
    delete: removeTransaction,
  }), [addTransaction, updateTransaction, removeTransaction]);
  const effectiveCategory = type === 'income' ? incomeCategory : category;
  const participantList = useMemo(() => [CURRENT_USER_ID, ...participantIds], [participantIds]);
  const equalShares = useMemo(() => {
    if (amount <= 0 || participantList.length < 2) return [];
    try {
      return buildEqualShares(participantList, amount, CURRENT_USER_ID);
    } catch {
      return [];
    }
  }, [participantList, amount]);
  const exactTotal = participantList.reduce((total, id) => total + (exactShares[id] ?? 0), 0);
  const myShare = splitEnabled
    ? (splitMethod === 'equal'
      ? equalShares.find((share) => share.friendId === CURRENT_USER_ID)?.amount ?? 0
      : exactShares[CURRENT_USER_ID] ?? 0)
    : amount;

  useEffect(() => {
    if (route.params?.transactionId) {
      const saved = transactions.find((item) => item.id === route.params?.transactionId);
      if (!saved) {
        setEditingTransaction(null);
        setError('This expense is no longer available. Return to the list and retry.');
        return;
      }
      if (saved.canEdit === false) {
        setEditingTransaction(null);
        setError('Only the creator can change this split expense.');
        return;
      }
      setEditingTransaction(saved);
      setType(saved.type);
      setTitle(saved.merchant);
      setCategory(saved.category);
      setIncomeCategory(saved.category);
      setPaymentMode(saved.paymentMode ?? (saved.source === 'cash' ? 'cash' : 'debit_card'));
      const linkedSplit = saved.splitExpenseId
        ? splits.find((item) => item.id === saved.splitExpenseId)
        : splits.find((item) => item.ledgerTransactionId === saved.id);
      const fullAmount = linkedSplit?.amount ?? saved.amount;
      setAmount(fullAmount);
      setAmountText(String(fullAmount));
      const occurredAt = typeof saved.occurredAt === 'number' ? new Date(saved.occurredAt) : new Date(saved.date);
      setDate(Number.isNaN(occurredAt.getTime()) ? localDateString(new Date()) : localDateString(occurredAt));
      setSplitEnabled(Boolean(linkedSplit));
      setParticipantIds(linkedSplit?.shares.map((share) => share.friendId).filter((id) => id !== CURRENT_USER_ID) ?? []);
      if (linkedSplit) {
        setSplitMethod(linkedSplit.method);
        const shares = Object.fromEntries(linkedSplit.shares.map((share) => [share.friendId, share.amount]));
        setExactShares(shares);
        setExactShareText(Object.fromEntries(linkedSplit.shares.map((share) => [share.friendId, String(share.amount)])));
      }
      setError('');
      navigation.setParams({ transactionId: undefined });
      return;
    }
    if (route.params?.type) {
      const nextType = route.params.type;
      setType(nextType);
      setTitle('');
      setAmount(0);
      setAmountText('');
      setCategory(categoryOptions[0]?.category ?? 'Others');
      setIncomeCategory(incomeCategories[0]);
      setDate(localDateString(new Date()));
      setPaymentMode('debit_card');
      setSplitEnabled(false);
      setParticipantIds([]);
      setSplitMethod('equal');
      setExactShares({});
      setExactShareText({});
      setEditingTransaction(null);
      setError('');
      navigation.setParams({ type: undefined });
    }
  }, [route.params?.transactionId, route.params?.type, navigation]);

  const setAmountValue = (text: string) => {
    if (!/^\d*\.?\d{0,2}$/.test(text)) return;
    setAmountText(text);
    setAmount(text ? Number(text) : 0);
    setError('');
  };

  const toggleParticipant = (id: string) => {
    setParticipantIds((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id]);
    setError('');
  };

  const updateExactShare = (id: string, value: string) => {
    if (!/^\d*\.?\d{0,2}$/.test(value)) return;
    setExactShareText((current) => ({ ...current, [id]: value }));
    setExactShares((current) => ({ ...current, [id]: value ? Number(value) : 0 }));
    setError('');
  };

  const validate = (): string => {
    if (title.trim().length < 2) return 'Enter an expense name with at least two characters.';
    try {
      validatePositiveAmount(amount, 'expense amount');
      validateDate(date, 'expense date');
    } catch (validationError) {
      return validationError instanceof Error ? validationError.message : 'Check the expense details.';
    }
    const selectedDate = getLocalDate(date);
    if (!selectedDate) return 'Choose a valid expense date.';
    const today = getLocalDate(localDateString(new Date()));
    if (today && selectedDate > today) return 'Expense date cannot be in the future.';
    if (type === 'expense' && category !== 'Others' && !categoryOptions.some((item) => item.category === category)) {
      return 'Choose an available budget category.';
    }
    if (splitEnabled) {
      if (!participantIds.length) return 'Choose at least one person to split with.';
      if (splitMethod === 'custom' && Math.round(exactTotal * 100) !== Math.round(amount * 100)) {
        return `Shares must total ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. The remaining difference is ₹${Math.abs(amount - exactTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;
      }
    }
    if (editingTransaction?.splitExpenseId && !splitEnabled) {
      return 'A saved split expense cannot be changed into a personal expense.';
    }
    return '';
  };

  const validationError = validate();
  const save = async () => {
    if (savingRef.current) return;
    const issue = validate();
    if (issue) {
      setError(issue);
      return;
    }
    const selectedDate = getLocalDate(date);
    if (!selectedDate) return;
    const occurredAt = selectedDate.getTime();
    const actualCategory = type === 'income' ? incomeCategory : category;
    const iconId = type === 'income' ? 'cash-outline' : categoryOptions.find((item) => item.category === category)?.iconId ?? 'ellipsis-horizontal-circle-outline';
    const source = type === 'expense' ? sourceForPaymentMode(paymentMode) : undefined;
    const iconColor = type === 'income' ? colors.income : colors.accent;
    const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      if (editingTransaction) {
        const linkedSplit = editingTransaction.splitExpenseId
          ? splits.find((item) => item.id === editingTransaction.splitExpenseId)
          : splits.find((item) => item.ledgerTransactionId === editingTransaction.id);
        const shares: SplitShare[] = splitEnabled
          ? splitMethod === 'equal'
            ? equalShares
            : participantList.map((friendId) => ({
              friendId,
              amount: exactShares[friendId] ?? 0,
              settled: friendId === linkedSplit?.paidById,
            }))
          : [];
        await expenseService.updateExpense(editingTransaction.id, {
          merchant: title.trim(),
          category: actualCategory,
          amount,
          type,
          source,
          paymentMode,
          icon: iconId,
          iconColor,
          date,
          occurredAt,
          ...(linkedSplit ? { splitDetails: { method: splitMethod, shares, fullAmount: amount } } : {}),
        });
        showToast('success', 'Expense updated.');
      } else if (splitEnabled) {
        const shares = splitMethod === 'equal'
          ? equalShares
          : participantList.map((friendId) => ({
            friendId,
            amount: exactShares[friendId] ?? 0,
            settled: friendId === CURRENT_USER_ID,
          }));
        await addSplit({
          title: title.trim(),
          amount,
          paidById: CURRENT_USER_ID,
          source,
          date,
          occurredAt,
          method: splitMethod,
          participantIds: participantList,
          customShares: splitMethod === 'custom'
            ? Object.fromEntries(shares.map((share) => [share.friendId, share.amount]))
            : undefined,
          category: actualCategory,
          iconId,
          paymentMode,
        });
        showToast('success', 'Split expense added.');
      } else {
        const transaction: Omit<Transaction, 'id'> = {
          type,
          merchant: title.trim(),
          category: actualCategory,
          icon: iconId,
          iconColor,
          amount,
          source,
          paymentMode: type === 'expense' ? paymentMode : undefined,
          date: formatTransactionDate(new Date(occurredAt)),
          time,
          occurredAt,
          canEdit: true,
          canDelete: true,
          createdByName: profile?.name || 'You',
        };
        await expenseService.createExpense(transaction);
        showToast('success', 'Expense added.');
      }
      navigation.navigate('Activity');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save this expense. Your entries are still here; retry when ready.';
      setError(message);
      showToast('error', message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 140 }]}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}><Ionicons name="receipt-outline" size={21} color={colors.accent} /></View>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>{editingTransaction ? 'UPDATE YOUR MONEY TRAIL' : 'QUICK ADD'}</Text>
            <Text style={styles.title}>{editingTransaction ? 'Edit expense' : type === 'income' ? 'Add income' : 'Add expense'}</Text>
            <Text style={styles.subtitle}>Capture your spending and keep your budget in sync.</Text>
          </View>
        </View>

        {editingTransaction && editingTransaction.canEdit === false ? (
          <View style={styles.readOnlyNotice}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.formHint}>Only the creator can change this split expense.</Text>
          </View>
        ) : (
          <View style={styles.form}>
            {!editingTransaction ? (
              <View style={styles.typeToggle}>
                {(['expense', 'income'] as const).map((nextType) => (
                  <Pressable key={nextType} accessibilityRole="radio" accessibilityState={{ checked: type === nextType }} onPress={() => { setType(nextType); setError(''); }} style={[styles.typeOption, type === nextType && styles.typeOptionActive]}>
                    <Text style={[styles.typeLabel, type === nextType && styles.typeLabelActive]}>{nextType === 'expense' ? 'Expense' : 'Income'}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <InputField label={type === 'expense' ? 'Expense name' : 'Income name'} value={title} onChangeText={(value) => { setTitle(value); setError(''); }} placeholder={type === 'expense' ? 'Coffee, groceries...' : 'Salary, freelance...'} autoCapitalize="sentences" />
            <View style={styles.moneyField}>
              <View style={styles.moneyIcon}><Ionicons name="wallet-outline" size={19} color={colors.accent} /></View>
              <View style={styles.moneyCopy}>
                <Text style={styles.fieldLabel}>Amount</Text>
                <View style={styles.moneyInputRow}>
                  <Text style={styles.currency}>₹</Text>
                  <TextInput
                    accessibilityLabel="Expense amount"
                    value={amountText}
                    onChangeText={setAmountValue}
                    keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                    inputMode="decimal"
                    placeholder="0.00"
                    placeholderTextColor={colors.textTertiary}
                    style={styles.moneyInput}
                  />
                </View>
              </View>
            </View>

            {type === 'expense' ? (
              <>
                <View style={styles.section}>
                  <Text style={styles.fieldLabel}>Payment mode</Text>
                  <View style={styles.optionRow}>
                    {paymentModes.map((mode) => (
                      <Pressable key={mode.value} accessibilityRole="radio" accessibilityState={{ checked: paymentMode === mode.value }} onPress={() => setPaymentMode(mode.value)} style={[styles.paymentOption, paymentMode === mode.value && styles.optionSelected]}>
                        <Ionicons name={mode.icon} size={17} color={paymentMode === mode.value ? colors.accentDark : colors.textSecondary} />
                        <Text style={[styles.paymentLabel, paymentMode === mode.value && styles.optionTextSelected]}>{mode.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.fieldLabel}>Category</Text>
                    {!categoryOptions.length ? (
                      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Budgets')} style={styles.linkButton}>
                        <Text style={styles.linkText}>Create budget category</Text>
                        <Ionicons name="arrow-forward" size={14} color={colors.accent} />
                      </Pressable>
                    ) : null}
                  </View>
                  <View style={styles.categoryGrid}>
                    {(categoryOptions.length ? categoryOptions : [{ id: 'others', name: 'Others', category: 'Others', iconId: 'ellipsis-horizontal-circle-outline' }]).map((option) => (
                      <Pressable key={option.id} accessibilityRole="radio" accessibilityState={{ checked: category === option.category }} onPress={() => { setCategory(option.category); setError(''); }} style={[styles.categoryOption, category === option.category && styles.optionSelected]}>
                        <Ionicons name={option.iconId as keyof typeof Ionicons.glyphMap} size={18} color={category === option.category ? colors.accentDark : colors.textSecondary} />
                        <Text style={[styles.categoryLabel, category === option.category && styles.optionTextSelected]}>{option.name}</Text>
                      </Pressable>
                    ))}
                    <Pressable accessibilityRole="radio" accessibilityState={{ checked: category === 'Others' }} onPress={() => setCategory('Others')} style={[styles.categoryOption, category === 'Others' && styles.optionSelected]}>
                      <Ionicons name="ellipsis-horizontal-circle-outline" size={18} color={category === 'Others' ? colors.accentDark : colors.textSecondary} />
                      <Text style={[styles.categoryLabel, category === 'Others' && styles.optionTextSelected]}>Others</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.section}>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.optionRow}>
                  {incomeCategories.map((item) => (
                    <Pressable key={item} onPress={() => setIncomeCategory(item)} style={[styles.categoryOption, incomeCategory === item && styles.optionSelected]}>
                      <Text style={[styles.categoryLabel, incomeCategory === item && styles.optionTextSelected]}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Date</Text>
              <TextInput accessibilityLabel="Expense date" value={date} onChangeText={(value) => { setDate(value); setError(''); }} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} autoCapitalize="none" style={styles.dateInput} />
              <Text style={styles.formHint}>Today or a past date (YYYY-MM-DD).</Text>
            </View>

            {type === 'expense' && (!editingTransaction || editingSplit) ? (
              <View style={styles.splitSection}>
                <Pressable accessibilityRole="switch" accessibilityState={{ checked: splitEnabled }} onPress={() => { setSplitEnabled((current) => !current); setError(''); }} style={styles.splitToggle}>
                  <View style={styles.splitToggleCopy}>
                    <Text style={styles.fieldLabel}>Split this expense</Text>
                    <Text style={styles.formHint}>Track only your share in your monthly total.</Text>
                  </View>
                  <View style={[styles.toggle, splitEnabled && styles.toggleOn]}><View style={[styles.toggleThumb, splitEnabled && styles.toggleThumbOn]} /></View>
                </Pressable>
                {splitEnabled ? (
                  <View style={styles.splitOptions}>
                    {friends.length ? (
                      <>
                        <Text style={styles.fieldLabel}>People</Text>
                        <View style={styles.optionRow}>
                          {friends.map((friend) => {
                            const selected = participantIds.includes(friend.id);
                            return (
                              <Pressable key={friend.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => toggleParticipant(friend.id)} style={[styles.personChip, selected && styles.optionSelected]}>
                                <Text style={[styles.categoryLabel, selected && styles.optionTextSelected]}>{friend.name}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                        <Text style={styles.formHint}>You’re included as the creator. Your share: {`₹${myShare.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}.</Text>
                        <View style={styles.optionRow}>
                          {(['equal', 'custom'] as const).map((method) => (
                            <Pressable key={method} accessibilityRole="radio" accessibilityState={{ checked: splitMethod === method }} onPress={() => setSplitMethod(method)} style={[styles.methodOption, splitMethod === method && styles.optionSelected]}>
                              <Text style={[styles.categoryLabel, splitMethod === method && styles.optionTextSelected]}>{method === 'equal' ? 'Equal' : 'Exact amount'}</Text>
                            </Pressable>
                          ))}
                        </View>
                        {splitMethod === 'equal' ? equalShares.map((share) => (
                          <View key={share.friendId} style={styles.shareRow}>
                            <Text style={styles.shareName}>{share.friendId === CURRENT_USER_ID ? 'You (creator)' : getFriendMeta(share.friendId, friends).name}</Text>
                            <Text style={styles.shareAmount}>₹{share.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                          </View>
                        )) : participantList.map((id) => (
                          <View key={id} style={styles.exactShareRow}>
                            <Text style={styles.shareName}>{id === CURRENT_USER_ID ? 'You (creator)' : getFriendMeta(id, friends).name}</Text>
                            <TextInput
                              accessibilityLabel={`${id === CURRENT_USER_ID ? 'Your' : getFriendMeta(id, friends).name} exact share`}
                              value={exactShareText[id] ?? ''}
                              onChangeText={(value) => updateExactShare(id, value)}
                              keyboardType="decimal-pad"
                              inputMode="decimal"
                              placeholder="0.00"
                              style={styles.shareInput}
                            />
                          </View>
                        ))}
                        {splitMethod === 'custom' ? (
                          <Text style={[styles.formHint, Math.round(exactTotal * 100) !== Math.round(amount * 100) && styles.error]}>
                            Shares: ₹{exactTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · Remaining: ₹{(amount - exactTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                        ) : null}
                      </>
                    ) : (
                      <View style={styles.noFriends}>
                        <Text style={styles.formHint}>Add people in Splits before creating a shared expense.</Text>
                        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Split')} style={styles.linkButton}>
                          <Text style={styles.linkText}>Open Splits</Text>
                          <Ionicons name="arrow-forward" size={14} color={colors.accent} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton title={saving ? 'Saving…' : editingTransaction ? 'Save changes' : `Save ${type}`} onPress={() => void save()} loading={saving} disabled={Boolean(validationError) || saving} />
            {validationError && !error ? <Text style={styles.error}>{validationError}</Text> : null}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surprise },
  headerCopy: { flex: 1, gap: spacing.xxs },
  kicker: { ...typography.label, color: colors.accent, letterSpacing: 1.4 },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  form: { marginTop: spacing.xl, padding: spacing.md, gap: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  typeToggle: { flexDirection: 'row', gap: spacing.xs, padding: 4, borderRadius: radius.full, backgroundColor: colors.background },
  typeOption: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  typeOptionActive: { backgroundColor: colors.accentDark },
  typeLabel: { ...typography.captionMedium, color: colors.textSecondary, textTransform: 'capitalize' },
  typeLabelActive: { color: colors.white },
  section: { gap: spacing.xs },
  fieldLabel: { ...typography.captionMedium, color: colors.textSecondary },
  formHint: { ...typography.caption, color: colors.textTertiary, lineHeight: 18 },
  moneyField: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  moneyIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.accentSoft },
  moneyCopy: { flex: 1 },
  moneyInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  currency: { ...typography.h3, color: colors.accent },
  moneyInput: { flex: 1, minHeight: 34, ...typography.h3, color: colors.textPrimary, paddingVertical: 0 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  paymentOption: { flexGrow: 1, minWidth: 98, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  categoryOption: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  methodOption: { minHeight: 38, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  personChip: { minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  optionSelected: { backgroundColor: colors.accentSoft, borderColor: colors.accentMuted },
  paymentLabel: { ...typography.micro, color: colors.textSecondary },
  categoryLabel: { ...typography.micro, color: colors.textSecondary },
  optionTextSelected: { color: colors.accentDark, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  linkButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs },
  linkText: { ...typography.captionMedium, color: colors.accent },
  dateInput: { minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, ...typography.captionMedium, color: colors.textPrimary },
  splitSection: { padding: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.background, gap: spacing.sm },
  splitToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  splitToggleCopy: { flex: 1, gap: 3 },
  toggle: { width: 44, height: 26, justifyContent: 'center', padding: 3, borderRadius: radius.full, backgroundColor: colors.surfaceMuted },
  toggleOn: { backgroundColor: colors.accent },
  toggleThumb: { width: 20, height: 20, borderRadius: radius.full, backgroundColor: colors.white },
  toggleThumbOn: { alignSelf: 'flex-end' },
  splitOptions: { gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  noFriends: { gap: spacing.xs },
  shareRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exactShareRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  shareName: { flex: 1, ...typography.caption, color: colors.textPrimary },
  shareAmount: { ...typography.captionMedium, color: colors.textPrimary },
  shareInput: { width: 120, minHeight: 38, paddingHorizontal: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, textAlign: 'right', ...typography.captionMedium, color: colors.textPrimary },
  error: { ...typography.caption, color: colors.expense },
  readOnlyNotice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
});

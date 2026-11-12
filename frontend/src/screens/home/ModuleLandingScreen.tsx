import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrencyInput } from '../../components/CurrencyInput';
import { GoalCard } from '../../components/GoalCard';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { AppModule } from '../../data/modules';
import { useApp } from '../../context/AppContext';
import type { MainTabParamList } from '../../navigation/MainTabs';
import { moduleRegistryService } from '../../services/moduleRegistryService';
import { localDateString, validateDate } from '../../services/moneyService';
import { colors, radius, spacing, typography } from '../../theme';
import type { PaymentCadence, PaymentKind, RecurringPayment } from '../../types';
import { formatINR, progressRatio } from '../../utils/format';

type Props = BottomTabScreenProps<MainTabParamList>;
type PaymentFormKind = PaymentKind;

const budgetCategories = ['Food & Dining', 'Shopping', 'Transport', 'Bills & Utilities', 'Health', 'Other'];

function isCompletedPayment(payment: RecurringPayment): boolean {
  return payment.completed === true
    || (!payment.active
      && payment.kind === 'emi'
      && ((payment.remainingInstallments !== undefined && payment.remainingInstallments === 0)
        || (payment.outstandingBalance !== undefined && payment.outstandingBalance === 0)));
}

export function ModuleLandingScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const {
    preferredModuleIds,
    transactions,
    budgets,
    goals,
    recurringPayments,
    addBudget,
    updateBudget,
    removeBudget,
    addGoal,
    removeGoal,
    contributeToGoal,
    addRecurringPayment,
    updateRecurringPayment,
    setRecurringPaymentActive,
    removeRecurringPayment,
    markRecurringPaymentPaid,
    showToast,
  } = useApp();
  const currentModule = moduleRegistryService.getModuleByRoute(route.name);
  const isAdditionalModules = currentModule?.id === 'additional-modules';
  const modules = moduleRegistryService.getModules();
  const additionalModules = modules.filter(
    (module) => module.available
      && module.navigationVisible
      && !preferredModuleIds.includes(module.id)
      && module.id !== 'additional-modules',
  );
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState(budgetCategories[0]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [targetDate, setTargetDate] = useState('');
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);
  const [paymentKind, setPaymentKind] = useState<PaymentFormKind>('emi');
  const [cadence, setCadence] = useState<PaymentCadence>('monthly');
  const [dueDate, setDueDate] = useState(localDateString(new Date()));
  const [paymentCategory, setPaymentCategory] = useState('Bills & Utilities');
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [remainingInstallments, setRemainingInstallments] = useState('');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [reportStart, setReportStart] = useState(() => localDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [reportEnd, setReportEnd] = useState(() => localDateString(new Date()));
  const [reportError, setReportError] = useState('');

  const openModule = (module: AppModule) => {
    if (module.route === 'Add') {
      navigation.navigate('Add', { type: 'expense' });
      return;
    }
    navigation.navigate(module.route);
  };

  const isCurrentMonth = (transaction: (typeof transactions)[number]) => {
    if (typeof transaction.occurredAt === 'number') {
      const date = new Date(transaction.occurredAt);
      const now = new Date();
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }
    if (transaction.date === 'Today' || transaction.date === 'Yesterday') return true;
    const date = new Date(`${transaction.date} ${new Date().getFullYear()}`);
    return !Number.isNaN(date.getTime()) && date.getMonth() === new Date().getMonth();
  };

  const thisMonthTransactions = transactions.filter(isCurrentMonth);
  const monthIncome = thisMonthTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthExpenses = thisMonthTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const upcomingPayments = recurringPayments
    .filter((payment) => payment.active)
    .slice()
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  const scheduledPayments = recurringPayments
    .filter((payment) => !isCompletedPayment(payment))
    .slice()
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  const completedPayments = recurringPayments.filter(isCompletedPayment);
  const reportRangeError = (() => {
    try {
      validateDate(reportStart, 'report start date');
      validateDate(reportEnd, 'report end date');
      if (reportStart > reportEnd) return 'Report start date must be on or before the end date.';
      return '';
    } catch (validationError) {
      return validationError instanceof Error ? validationError.message : 'Choose a valid report date range.';
    }
  })();
  const selectedReportTransactions = reportRangeError ? [] : transactions.filter((transaction) => {
    const date = typeof transaction.occurredAt === 'number'
      ? new Date(transaction.occurredAt)
      : transaction.date === 'Today' || transaction.date === 'Yesterday'
        ? new Date(Date.now())
        : new Date(transaction.date);
    if (transaction.date === 'Yesterday' && transaction.occurredAt === undefined) date.setDate(date.getDate() - 1);
    if (Number.isNaN(date.getTime())) return false;
    const dateValue = localDateString(date);
    return dateValue >= reportStart && dateValue <= reportEnd;
  });
  const reportIncome = selectedReportTransactions.filter((transaction) => transaction.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const reportExpenses = selectedReportTransactions.filter((transaction) => transaction.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const duePayments = upcomingPayments.filter((payment) => {
    const [year, month, day] = payment.nextDueDate.split('-').map(Number);
    const due = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / 86400000) <= 7;
  });

  const monthlyBudgetSpent = (budgetCategory: string) => thisMonthTransactions
    .filter((transaction) => transaction.type === 'expense' && transaction.category.toLowerCase() === budgetCategory.toLowerCase())
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const clearForm = () => {
    setFormOpen(false);
    setContributionGoalId(null);
    setTitle('');
    setAmount(0);
    setTargetDate('');
    setOutstandingBalance(0);
    setRemainingInstallments('');
    setError('');
    setEditingBudgetId(null);
    setEditingPaymentId(null);
    setCustomCategory('');
  };

  const exportReport = async () => {
    setReportError('');
    try {
      validateDate(reportStart, 'report start date');
      validateDate(reportEnd, 'report end date');
      if (reportStart > reportEnd) {
        throw new Error('Choose a valid date range with the start on or before the end.');
      }
      const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const rows = [
        ['Date', 'Type', 'Name', 'Category', 'Amount'],
        ...selectedReportTransactions.map((transaction) => [
          transaction.date,
          transaction.type,
          transaction.merchant,
          transaction.category,
          String(transaction.amount),
        ]),
      ];
      const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `expensio-report-${reportStart}-to-${reportEnd}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ title: 'Expensio report CSV', message: csv });
      }
    } catch (exportError) {
      setReportError(exportError instanceof Error ? exportError.message : 'Unable to export this report.');
    }
  };

  const saveForm = async () => {
    setError('');
    setSaving(true);
    try {
      if (currentModule?.id === 'budgets') {
        const selectedCategory = category === 'Custom' ? customCategory.trim() : category;
        if (!selectedCategory) throw new Error('Enter a budget category.');
        if (editingBudgetId) {
          await updateBudget(editingBudgetId, { category: selectedCategory, limit: amount });
          showToast('success', 'Budget updated.');
        } else {
          await addBudget({ category: selectedCategory, limit: amount });
          showToast('success', 'Budget saved.');
        }
      } else if (currentModule?.id === 'goals' && contributionGoalId) {
        await contributeToGoal(contributionGoalId, amount);
        showToast('success', 'Goal contribution saved.');
      } else if (currentModule?.id === 'goals') {
        await addGoal({ title, target: amount, targetDate: targetDate || undefined });
        showToast('success', 'Savings goal created.');
      } else if (currentModule?.id === 'upcoming-payments') {
        const details = {
          name: title,
          amount,
          kind: paymentKind,
          cadence,
          nextDueDate: dueDate,
          category: paymentCategory,
          outstandingBalance: paymentKind === 'emi' && outstandingBalance > 0 ? outstandingBalance : undefined,
          remainingInstallments: paymentKind === 'emi' && remainingInstallments ? Number(remainingInstallments) : undefined,
        };
        if (editingPaymentId) {
          await updateRecurringPayment(editingPaymentId, details);
          showToast('success', `${paymentKind === 'emi' ? 'EMI' : 'Subscription'} updated.`);
        } else {
          await addRecurringPayment(details);
          showToast('success', `${paymentKind === 'emi' ? 'EMI' : 'Subscription'} saved.`);
        }
      }
      clearForm();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save this item on your device.';
      setError(message);
      showToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = (label: string, remove: () => Promise<void>) => {
    const performRemove = () => {
      void remove().then(() => showToast('success', `${label} removed.`)).catch((removeError: unknown) => {
        const message = removeError instanceof Error ? removeError.message : 'Unable to remove this item.';
        showToast('error', message);
      });
    };
    const message = 'This only removes it from your device. Your transaction history is not changed.';
    if (Platform.OS === 'web' && typeof globalThis.confirm === 'function') {
      if (globalThis.confirm(`Remove ${label}? ${message}`)) performRemove();
      return;
    }
    Alert.alert(`Remove ${label}?`, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: performRemove },
    ]);
  };

  if (!currentModule) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.title}>Module unavailable</Text>
        <Text style={styles.copy}>This destination is not available on this version.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <ScrollView
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name={currentModule.icon as keyof typeof Ionicons.glyphMap} size={24} color={colors.accentDark} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>YOUR MONEY SPACE</Text>
            <Text style={styles.title}>{currentModule.name}</Text>
            <Text style={styles.copy}>{currentModule.description}.</Text>
          </View>
        </View>

        {isAdditionalModules ? (
          <View style={styles.moduleList}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Explore your tools</Text>
              <Text style={styles.sectionSub}>Your preferences stay saved in Profile.</Text>
            </View>
            {additionalModules.map((module) => (
              <Pressable key={module.id} accessibilityRole="button" onPress={() => openModule(module)} style={styles.moduleRow}>
                <View style={styles.rowIcon}><Ionicons name={module.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.accent} /></View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{module.name}</Text>
                  <Text style={styles.rowSub}>{module.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Profile')} style={styles.secondaryButton}>
              <Ionicons name="options-outline" size={18} color={colors.accent} />
              <Text style={styles.secondaryButtonText}>Manage preferred modules</Text>
            </Pressable>
          </View>
        ) : null}

        {currentModule.id === 'budgets' ? (
          <View style={styles.moduleList}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>SPENDING THIS MONTH</Text>
              <Text style={styles.summaryValue}>{formatINR(monthExpenses)}</Text>
              <Text style={styles.summaryHint}>{thisMonthTransactions.filter((item) => item.type === 'expense').length} recorded expense{thisMonthTransactions.filter((item) => item.type === 'expense').length === 1 ? '' : 's'}</Text>
            </View>
            <SectionHeading title="Category budgets" subtitle="Compare your real expenses with limits you set." />
            {budgets.map((budget) => {
              const spent = monthlyBudgetSpent(budget.category);
              const ratio = progressRatio(spent, budget.limit);
              return (
                <View key={budget.id} style={styles.itemCard}>
                  <View style={styles.itemTop}>
                    <View style={styles.rowIcon}><Ionicons name="pie-chart-outline" size={19} color={colors.accent} /></View>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle}>{budget.category}</Text>
                      <Text style={styles.rowSub}>{formatINR(spent)} spent of {formatINR(budget.limit)}</Text>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${budget.category} budget`} onPress={() => {
                      setEditingBudgetId(budget.id);
                      setCategory(budgetCategories.includes(budget.category) ? budget.category : 'Custom');
                      setCustomCategory(budgetCategories.includes(budget.category) ? '' : budget.category);
                      setAmount(budget.limit);
                      setFormOpen(true);
                      setError('');
                    }} hitSlop={8}>
                      <Ionicons name="pencil-outline" size={18} color={colors.accent} />
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${budget.category} budget`} onPress={() => confirmRemove(`${budget.category} budget`, () => removeBudget(budget.id))} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                  <View style={styles.track}><View style={[styles.trackFill, { width: `${Math.min(ratio * 100, 100)}%`, backgroundColor: ratio > 1 ? colors.expense : colors.accent }]} /></View>
                  <Text style={styles.remainingText}>{spent > budget.limit ? `${formatINR(spent - budget.limit)} over limit` : `${formatINR(budget.limit - spent)} remaining`}</Text>
                </View>
              );
            })}
            {!budgets.length ? <EmptyState icon="pie-chart-outline" title="No budgets yet" message="Set a monthly limit for a category. Spending updates from transactions you record." /> : null}
            <PrimaryButton title={formOpen ? 'Close form' : 'Create a budget'} onPress={() => { if (formOpen) clearForm(); else { setEditingBudgetId(null); setAmount(0); setFormOpen(true); } setError(''); }} variant={formOpen ? 'secondary' : 'primary'} />
            {formOpen ? (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>{editingBudgetId ? 'Edit category budget' : 'New category budget'}</Text>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.chipList}>
                  {[...budgetCategories, 'Custom'].map((item) => <ChoiceChip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}
                </View>
                {category === 'Custom' ? <InputField label="Custom category" value={customCategory} onChangeText={setCustomCategory} placeholder="e.g. Pet care" /> : null}
                <CurrencyInput label="Monthly limit" value={amount} onChangeValue={setAmount} variant="card" icon="wallet-outline" />
                <Text style={styles.formHint}>You’ll see an in-app alert at 80% and when you exceed the limit.</Text>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <PrimaryButton title={editingBudgetId ? 'Save changes' : 'Save budget'} onPress={() => void saveForm()} loading={saving} />
              </View>
            ) : null}
          </View>
        ) : null}

        {currentModule.id === 'goals' ? (
          <View style={styles.moduleList}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>SAVINGS GOALS</Text>
              <Text style={styles.summaryValue}>{goals.length}</Text>
              <Text style={styles.summaryHint}>{goals.length === 1 ? 'goal you are tracking' : 'goals you are tracking'}</Text>
            </View>
            <SectionHeading title="Your goals" subtitle="Add contributions as you set money aside." />
            {goals.map((goal) => (
              <View key={goal.id} style={styles.goalItem}>
                <GoalCard goal={goal} />
                {goal.contributions?.length ? (
                  <View style={styles.contributionHistory}>
                    <Text style={styles.fieldLabel}>Recent contributions</Text>
                    {goal.contributions.slice(-3).reverse().map((contribution) => (
                      <View key={contribution.id} style={styles.contributionRow}>
                        <Text style={styles.rowSub}>{new Date(contribution.occurredAt).toLocaleDateString()}</Text>
                        <Text style={styles.rowTitle}>{formatINR(contribution.amount)}</Text>
                      </View>
                    ))}
                    <Text style={styles.formHint}>Contributions earmark savings; they don’t change your total balance.</Text>
                  </View>
                ) : null}
                <View style={styles.goalActions}>
                  <Pressable accessibilityRole="button" onPress={() => { setContributionGoalId(goal.id); setAmount(0); setFormOpen(true); setError(''); }} style={styles.secondaryButton}>
                    <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
                    <Text style={styles.secondaryButtonText}>Add contribution</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove goal ${goal.title}`} onPress={() => confirmRemove(`goal “${goal.title}”`, () => removeGoal(goal.id))} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                  </Pressable>
                </View>
              </View>
            ))}
            {!goals.length ? <EmptyState icon="flag-outline" title="Make a goal" message="Choose something you are saving for, set a target, and track progress as you contribute." /> : null}
            {!contributionGoalId ? <PrimaryButton title={formOpen ? 'Close form' : 'Create a savings goal'} onPress={() => { setFormOpen(!formOpen); setError(''); }} variant={formOpen ? 'secondary' : 'primary'} /> : null}
            {formOpen ? (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>{contributionGoalId ? 'Add to your goal' : 'New savings goal'}</Text>
                {!contributionGoalId ? <InputField label="What are you saving for?" value={title} onChangeText={setTitle} placeholder="e.g. Emergency fund" /> : null}
                <CurrencyInput label={contributionGoalId ? 'Contribution amount' : 'Target amount'} value={amount} onChangeValue={setAmount} variant="card" icon="flag-outline" />
                {!contributionGoalId ? <InputField label="Target date (optional)" value={targetDate} onChangeText={setTargetDate} placeholder="YYYY-MM-DD" autoCapitalize="none" /> : null}
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <PrimaryButton title={contributionGoalId ? 'Save contribution' : 'Create goal'} onPress={() => void saveForm()} loading={saving} />
                <Pressable accessibilityRole="button" onPress={clearForm} style={styles.cancelLink}><Text style={styles.cancelText}>Cancel</Text></Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        {currentModule.id === 'upcoming-payments' ? (
          <View style={styles.moduleList}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>UPCOMING COMMITMENTS</Text>
              <Text style={styles.summaryValue}>{upcomingPayments.length}</Text>
              <Text style={styles.summaryHint}>Active EMIs and subscriptions you entered</Text>
            </View>
            <SectionHeading title="Your payments" subtitle="Mark a payment paid to add it to your expense ledger." />
            {duePayments.length ? (
              <View style={styles.reminderCard}>
                <Ionicons name="notifications-outline" size={20} color={colors.accentDark} />
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{duePayments.length} payment{duePayments.length === 1 ? '' : 's'} due soon</Text>
                  <Text style={styles.rowSub}>{duePayments.map((payment) => payment.name).join(', ')}{duePayments.length ? ' · check your schedule' : ''}</Text>
                </View>
              </View>
            ) : null}
            {scheduledPayments.map((payment) => (
              <View key={payment.id} style={styles.itemCard}>
                <View style={styles.itemTop}>
                  <View style={[styles.rowIcon, payment.kind === 'emi' ? styles.orangeIcon : styles.greenIcon]}>
                    <Ionicons name={payment.kind === 'emi' ? 'home-outline' : 'refresh-outline'} size={19} color={colors.accentDark} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{payment.name}</Text>
                    <Text style={styles.rowSub}>{payment.kind === 'emi' ? 'EMI' : 'Subscription'} · {payment.category}</Text>
                  </View>
                  <Text style={styles.paymentAmount}>{formatINR(payment.amount)}</Text>
                </View>
                <View style={styles.paymentFooter}>
                  <View>
                    <Text style={styles.dueLabel}>NEXT DUE</Text>
                    <Text style={styles.dueDate}>{formatPaymentDate(payment.nextDueDate)} · {payment.cadence}</Text>
                  </View>
                  {payment.active ? (
                    <Pressable accessibilityRole="button" onPress={() => {
                      void markRecurringPaymentPaid(payment.id)
                        .then(() => showToast('success', `${payment.name} marked paid and added to expenses.`))
                        .catch((paymentError: unknown) => showToast('error', paymentError instanceof Error ? paymentError.message : 'Unable to mark payment as paid.'));
                    }} style={styles.paidButton}>
                      <Text style={styles.paidButtonText}>Mark paid</Text>
                    </Pressable>
                  ) : <Text style={styles.pausedLabel}>Paused</Text>}
                  <Pressable accessibilityRole="button" accessibilityLabel={`${payment.active ? 'Pause' : 'Resume'} ${payment.name}`} onPress={() => {
                    void setRecurringPaymentActive(payment.id, !payment.active)
                      .then(() => showToast('success', `${payment.name} ${payment.active ? 'paused' : 'resumed'}.`))
                      .catch((paymentError: unknown) => showToast('error', paymentError instanceof Error ? paymentError.message : 'Unable to update payment status.'));
                  }} hitSlop={8}>
                    <Ionicons name={payment.active ? 'pause-circle-outline' : 'play-circle-outline'} size={21} color={colors.accent} />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${payment.name}`} onPress={() => {
                    setEditingPaymentId(payment.id);
                    setPaymentKind(payment.kind);
                    setTitle(payment.name);
                    setAmount(payment.amount);
                    setCadence(payment.cadence);
                    setDueDate(payment.nextDueDate);
                    setPaymentCategory(payment.category);
                    setOutstandingBalance(payment.outstandingBalance ?? 0);
                    setRemainingInstallments(payment.remainingInstallments?.toString() ?? '');
                    setFormOpen(true);
                    setError('');
                  }} hitSlop={8}>
                    <Ionicons name="pencil-outline" size={18} color={colors.accent} />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${payment.name}`} onPress={() => confirmRemove(payment.name, () => removeRecurringPayment(payment.id))} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                  </Pressable>
                </View>
                {payment.kind === 'emi' && (payment.outstandingBalance !== undefined || payment.remainingInstallments !== undefined) ? (
                  <Text style={styles.loanDetails}>
                    {payment.outstandingBalance !== undefined ? `${formatINR(payment.outstandingBalance)} outstanding` : ''}
                    {payment.outstandingBalance !== undefined && payment.remainingInstallments !== undefined ? ' · ' : ''}
                    {payment.remainingInstallments !== undefined ? `${payment.remainingInstallments} installments left` : ''}
                  </Text>
                ) : null}
              </View>
            ))}
            {completedPayments.length ? (
              <>
                <SectionHeading title="Completed EMIs" subtitle="Loans with no installments remaining." />
                {completedPayments.map((payment) => (
                  <View key={payment.id} style={styles.itemCard}>
                    <View style={styles.itemTop}>
                      <View style={styles.rowIcon}><Ionicons name="checkmark-circle-outline" size={19} color={colors.income} /></View>
                      <View style={styles.rowCopy}>
                        <Text style={styles.rowTitle}>{payment.name}</Text>
                        <Text style={styles.rowSub}>Paid off · {payment.category}</Text>
                      </View>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${payment.name}`} onPress={() => confirmRemove(payment.name, () => removeRecurringPayment(payment.id))} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </>
            ) : null}
            {!scheduledPayments.length && !completedPayments.length ? <EmptyState icon="calendar-outline" title="Nothing scheduled yet" message="Add an EMI or subscription to keep upcoming payments in one place." /> : null}
            <PrimaryButton title={formOpen ? 'Close form' : 'Add EMI or subscription'} onPress={() => { if (formOpen) clearForm(); else { setEditingPaymentId(null); setFormOpen(true); } setError(''); }} variant={formOpen ? 'secondary' : 'primary'} />
            {formOpen ? (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>{editingPaymentId ? 'Edit recurring payment' : 'Recurring payment'}</Text>
                <View style={styles.formSegment}>
                  {(['emi', 'subscription'] as const).map((kind) => <ChoiceChip key={kind} label={kind === 'emi' ? 'EMI' : 'Subscription'} selected={paymentKind === kind} onPress={() => setPaymentKind(kind)} />)}
                </View>
                <InputField label={paymentKind === 'emi' ? 'Loan or EMI name' : 'Subscription name'} value={title} onChangeText={setTitle} placeholder={paymentKind === 'emi' ? 'e.g. Home loan' : 'e.g. Music service'} />
                <CurrencyInput label="Payment amount" value={amount} onChangeValue={setAmount} variant="card" icon="wallet-outline" />
                <Text style={styles.fieldLabel}>Frequency</Text>
                <View style={styles.chipList}>
                  {(['weekly', 'monthly', 'yearly'] as const).map((item) => <ChoiceChip key={item} label={item} selected={cadence === item} onPress={() => setCadence(item)} />)}
                </View>
                <InputField label="Next due date" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
                <InputField label="Expense category" value={paymentCategory} onChangeText={setPaymentCategory} placeholder="Bills & Utilities" />
                {paymentKind === 'emi' ? (
                  <>
                    <CurrencyInput label="Outstanding loan balance (optional)" value={outstandingBalance} onChangeValue={setOutstandingBalance} variant="card" icon="business-outline" />
                    <InputField
                      label="Installments remaining (optional)"
                      value={remainingInstallments}
                      onChangeText={(value) => setRemainingInstallments(value.replace(/\D/g, ''))}
                      placeholder="e.g. 24"
                      keyboardType="number-pad"
                      inputMode="numeric"
                    />
                  </>
                ) : null}
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <PrimaryButton title={editingPaymentId ? 'Save changes' : 'Save payment'} onPress={() => void saveForm()} loading={saving} />
              </View>
            ) : null}
          </View>
        ) : null}

        {currentModule.id === 'reports' || currentModule.id === 'analytics' ? (
          <View style={styles.moduleList}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>SELECTED PERIOD · FROM YOUR ENTRIES</Text>
              {selectedReportTransactions.length ? (
                <View style={styles.statRow}>
                  <View style={styles.statBlock}>
                    <Text style={styles.statLabel}>Income</Text>
                    <Text style={[styles.statValue, styles.incomeText]}>{formatINR(reportIncome)}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBlock}>
                    <Text style={styles.statLabel}>Expenses</Text>
                    <Text style={[styles.statValue, styles.expenseText]}>{formatINR(reportExpenses)}</Text>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.summaryValue}>No data yet</Text>
                  <Text style={styles.summaryHint}>Add transactions to see your real monthly summary.</Text>
                </>
              )}
            </View>
            <View style={styles.dateRange}>
              <InputField label="From" value={reportStart} onChangeText={(value) => { setReportStart(value); setReportError(''); }} placeholder="YYYY-MM-DD" autoCapitalize="none" />
              <InputField label="To" value={reportEnd} onChangeText={(value) => { setReportEnd(value); setReportError(''); }} placeholder="YYYY-MM-DD" autoCapitalize="none" />
            </View>
            <PrimaryButton title="Export CSV" variant="secondary" onPress={() => void exportReport()} disabled={Boolean(reportRangeError)} />
            {reportRangeError ? <Text style={styles.error}>{reportRangeError}</Text> : null}
            {reportError ? <Text style={styles.error}>{reportError}</Text> : null}
            {selectedReportTransactions.length ? (
              <>
                <SectionHeading title="By category" subtitle={`Expense totals from ${reportStart} to ${reportEnd}.`} />
                {Object.entries(selectedReportTransactions
                  .filter((item) => item.type === 'expense')
                  .reduce<Record<string, number>>((totals, item) => {
                    totals[item.category] = (totals[item.category] ?? 0) + item.amount;
                    return totals;
                  }, {}))
                  .sort((a, b) => b[1] - a[1])
                  .map(([itemCategory, total]) => {
                    const ratio = monthExpenses ? total / monthExpenses : 0;
                    return (
                      <View key={itemCategory} style={styles.itemCard}>
                        <View style={styles.itemTop}>
                          <View style={styles.rowCopy}>
                            <Text style={styles.rowTitle}>{itemCategory}</Text>
                            <Text style={styles.rowSub}>{Math.round(ratio * 100)}% of recorded expenses</Text>
                          </View>
                          <Text style={styles.paymentAmount}>{formatINR(total)}</Text>
                        </View>
                        <View style={styles.track}><View style={[styles.trackFill, { width: `${Math.min(ratio * 100, 100)}%` }]} /></View>
                      </View>
                    );
                  })}
              </>
            ) : null}
          </View>
        ) : null}

        {!isAdditionalModules
          && !['budgets', 'goals', 'upcoming-payments', 'reports', 'analytics'].includes(currentModule.id) ? (
          <EmptyState icon="sparkles-outline" title="Nothing here yet" message={`Your ${currentModule.name.toLowerCase()} information will appear here as you add it. No sample financial data is shown.`} />
        ) : null}
      </ScrollView>
    </View>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSub}>{subtitle}</Text>
    </View>
  );
}

function EmptyState({ icon, title, message }: { icon: keyof typeof Ionicons.glyphMap; title: string; message: string }) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}><Ionicons name={icon} size={22} color={colors.accentDark} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function formatPaymentDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 150, gap: spacing.lg, width: '100%', maxWidth: 760, alignSelf: 'center' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surprise },
  headerCopy: { flex: 1, gap: 2 },
  kicker: { ...typography.micro, color: colors.accent, fontWeight: '700', letterSpacing: 0.9 },
  title: { ...typography.h1, color: colors.textPrimary },
  copy: { ...typography.caption, color: colors.textSecondary, lineHeight: 19 },
  moduleList: { gap: spacing.md },
  sectionHeading: { gap: 4, marginTop: spacing.xs },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  sectionSub: { ...typography.caption, color: colors.textSecondary, lineHeight: 19 },
  summaryCard: { padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.accentDark, gap: spacing.xs },
  summaryLabel: { ...typography.micro, color: colors.surprise, letterSpacing: 0.8, fontWeight: '700' },
  summaryValue: { ...typography.h1, color: colors.white },
  summaryHint: { ...typography.caption, color: 'rgba(255,255,255,0.72)' },
  moduleRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  rowIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  orangeIcon: { backgroundColor: colors.warningSoft },
  greenIcon: { backgroundColor: colors.surprise },
  rowCopy: { flex: 1, minWidth: 0, gap: 3 },
  rowTitle: { ...typography.bodySemibold, color: colors.textPrimary },
  rowSub: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  itemCard: { padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  track: { height: 8, overflow: 'hidden', borderRadius: radius.full, backgroundColor: colors.surfaceMuted },
  trackFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.accent },
  remainingText: { ...typography.caption, color: colors.textSecondary },
  paymentAmount: { ...typography.bodySemibold, color: colors.textPrimary },
  paymentFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  dueLabel: { ...typography.micro, color: colors.textTertiary, letterSpacing: 0.6 },
  dueDate: { ...typography.captionMedium, color: colors.textSecondary, marginTop: 2 },
  loanDetails: { ...typography.caption, color: colors.textSecondary, marginTop: -spacing.xs },
  paidButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: spacing.sm, marginLeft: 'auto', borderRadius: radius.full, backgroundColor: colors.accentSoft },
  paidButtonText: { ...typography.captionMedium, color: colors.accentDark },
  completedLabel: { ...typography.captionMedium, color: colors.income, marginLeft: 'auto' },
  pausedLabel: { ...typography.captionMedium, color: colors.textTertiary, marginLeft: 'auto' },
  emptyCard: { alignItems: 'center', padding: spacing.lg, gap: spacing.xs, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  emptyIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.surprise, marginBottom: spacing.xs },
  emptyTitle: { ...typography.bodySemibold, color: colors.textPrimary },
  emptyMessage: { ...typography.caption, color: colors.textSecondary, lineHeight: 19, textAlign: 'center', maxWidth: 300 },
  formCard: { padding: spacing.md, gap: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  formTitle: { ...typography.h3, color: colors.textPrimary },
  formHint: { ...typography.caption, color: colors.textTertiary, lineHeight: 18 },
  dateRange: { gap: spacing.xs },
  reminderCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surprise },
  fieldLabel: { ...typography.captionMedium, color: colors.textSecondary },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  formSegment: { flexDirection: 'row', gap: spacing.xs },
  chip: { minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radius.full, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  chipSelected: { backgroundColor: colors.accentSoft, borderColor: colors.accentMuted },
  chipText: { ...typography.caption, color: colors.textSecondary, textTransform: 'capitalize' },
  chipTextSelected: { color: colors.accentDark, fontWeight: '700' },
  error: { ...typography.caption, color: colors.expense },
  goalItem: { gap: spacing.xs },
  contributionHistory: { padding: spacing.md, gap: spacing.xs, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  contributionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xxs },
  goalActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  secondaryButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.full, backgroundColor: colors.accentSoft },
  secondaryButtonText: { ...typography.captionMedium, color: colors.accentDark },
  cancelLink: { alignItems: 'center', padding: spacing.xs },
  cancelText: { ...typography.captionMedium, color: colors.textSecondary },
  statRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  statBlock: { flex: 1, gap: spacing.xxs },
  statDivider: { width: 1, height: 42, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: spacing.md },
  statLabel: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
  statValue: { ...typography.h3, color: colors.white },
  incomeText: { color: colors.surprise },
  expenseText: { color: '#FFB8AF' },
});

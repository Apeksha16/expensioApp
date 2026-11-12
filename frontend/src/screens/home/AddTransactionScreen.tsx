import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CurrencyInput } from '../../components/CurrencyInput';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import type { MainTabParamList } from '../../navigation/MainTabs';
import { colors, radius, spacing, typography } from '../../theme';
import { formatTransactionDate } from '../../utils/format';
import { localDateString, validateDate } from '../../services/moneyService';

type Props = BottomTabScreenProps<MainTabParamList, 'Add'>;

const expenseCategories = ['Food & Dining', 'Shopping', 'Transport', 'Bills & Utilities', 'Health', 'Other'];
const incomeCategories = ['Salary', 'Business', 'Freelance', 'Investment', 'Other'];

export function AddTransactionScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('Food & Dining');
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [date, setDate] = useState(localDateString(new Date()));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { addTransaction } = useApp();

  React.useEffect(() => {
    if (route.params?.type) {
      setType(route.params.type);
      setCategory(route.params.type === 'expense' ? 'Food & Dining' : 'Salary');
      setUseCustomCategory(false);
      navigation.setParams({ type: undefined });
    }
  }, [navigation, route.params?.type]);

  const save = async () => {
    if (title.trim().length < 2) { setError('Add a short name for this transaction'); return; }
    if (amount <= 0) { setError('Enter an amount greater than zero'); return; }
    if (useCustomCategory && !customCategory.trim()) { setError('Enter a category name'); return; }
    try {
      validateDate(date, 'transaction date');
    } catch (dateError) {
      setError(dateError instanceof Error ? dateError.message : 'Choose a valid transaction date.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const now = new Date();
      const selectedDate = new Date(`${date}T12:00:00`);
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      await addTransaction({
        type,
        merchant: title.trim(),
        category: useCustomCategory ? customCategory.trim() : category,
        icon: type === 'income' ? 'cash' : category === 'Food & Dining' ? 'restaurant' : category === 'Transport' ? 'car' : category === 'Shopping' ? 'cart' : 'receipt',
        iconColor: type === 'income' ? colors.income : colors.accent,
        amount,
        date: formatTransactionDate(selectedDate),
        time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        occurredAt: selectedDate.getTime(),
      });
      setTitle('');
      setAmount(0);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this transaction on your device');
    } finally {
      setLoading(false);
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
          <View style={styles.headerIcon}>
            <Ionicons name="receipt-outline" size={21} color={colors.accent} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>QUICK ADD</Text>
            <Text style={styles.title}>Add transaction</Text>
            <Text style={styles.subtitle}>Capture it now. Keep your money picture honest.</Text>
          </View>
        </View>
        <View style={styles.segment}>
          {(['expense', 'income'] as const).map((item) => (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ checked: type === item }}
              onPress={() => {
                setType(item);
                setCategory(item === 'expense' ? 'Food & Dining' : 'Salary');
                setUseCustomCategory(false);
                setError('');
              }}
              style={[styles.segmentOption, type === item && styles.segmentOptionActive]}
            >
              <Ionicons
                name={item === 'expense' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
                size={18}
                color={type === item ? colors.white : colors.textSecondary}
              />
              <Text style={[styles.segmentLabel, type === item && styles.segmentLabelActive]}>
                {item === 'expense' ? 'Expense' : 'Income'}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.form}>
          <View style={styles.formHeading}>
            <Text style={styles.formTitle}>Transaction details</Text>
            <Text style={styles.formHint}>Only you can see this entry</Text>
          </View>
          <InputField
            label="What is it?"
            value={title}
            onChangeText={(value) => { setTitle(value); setError(''); }}
            placeholder={type === 'expense' ? 'Coffee, groceries...' : 'Salary, freelance...'}
            autoCapitalize="sentences"
          />
          <CurrencyInput
            label="Amount"
            value={amount}
            onChangeValue={(value) => { setAmount(value); setError(''); }}
            variant="card"
            icon={type === 'income' ? 'trending-up-outline' : 'wallet-outline'}
          />
          <View style={styles.categorySection}>
            <Text style={styles.categoryHeading}>Category</Text>
            <View style={styles.categoryOptions}>
              {[...(type === 'expense' ? expenseCategories : incomeCategories), 'Custom'].map((item) => {
                const custom = item === 'Custom';
                const selected = custom ? useCustomCategory : !useCustomCategory && category === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => {
                      setUseCustomCategory(custom);
                      if (!custom) setCategory(item);
                      setError('');
                    }}
                    style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  >
                    <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>
            {useCustomCategory ? (
              <InputField label="Custom category" value={customCategory} onChangeText={(value) => { setCustomCategory(value); setError(''); }} placeholder="e.g. Pet care" />
            ) : null}
          </View>
          <View style={styles.metaRows}>
            <View style={styles.metaRow}>
              <View style={styles.metaIcon}><Ionicons name="calendar-outline" size={17} color={colors.accent} /></View>
              <Text style={styles.metaLabel}>Date</Text>
              <TextInput
                accessibilityLabel="Transaction date"
                value={date}
                onChangeText={(value) => { setDate(value); setError(''); }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                style={styles.dateInput}
              />
            </View>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton title={loading ? 'Saving...' : `Save ${type}`} loading={loading} onPress={() => void save()} style={styles.save} />
        </View>
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
  segment: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xl, padding: 5, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  segmentOption: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radius.full },
  segmentOptionActive: { backgroundColor: colors.accentDark },
  segmentLabel: { ...typography.captionMedium, color: colors.textSecondary, textTransform: 'capitalize' },
  segmentLabelActive: { color: colors.white },
  form: { marginTop: spacing.md, padding: spacing.md, gap: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  formHeading: { gap: 3 },
  formTitle: { ...typography.h3, color: colors.textPrimary },
  formHint: { ...typography.caption, color: colors.textTertiary },
  categorySection: { gap: spacing.xs },
  categoryHeading: { ...typography.captionMedium, color: colors.textSecondary },
  categoryOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  categoryChip: { minHeight: 34, justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radius.full, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  categoryChipSelected: { backgroundColor: colors.accentSoft, borderColor: colors.accentMuted },
  categoryText: { ...typography.micro, color: colors.textSecondary },
  categoryTextSelected: { color: colors.accentDark, fontWeight: '700' },
  metaRows: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  metaRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  metaIcon: { width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  metaLabel: { flex: 1, ...typography.caption, color: colors.textSecondary },
  dateInput: { minWidth: 112, ...typography.captionMedium, color: colors.textPrimary, textAlign: 'right', paddingVertical: spacing.xs },
  error: { ...typography.caption, color: colors.expense, marginTop: -spacing.xs },
  save: { marginTop: spacing.xs },
});

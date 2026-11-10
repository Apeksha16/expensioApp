import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrencyInput } from '../../components/CurrencyInput';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, spacing, typography } from '../../theme';

export function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const save = () => {
    if (title.trim().length < 2) { setError('Add a short name for this transaction'); return; }
    if (amount <= 0) { setError('Enter an amount greater than zero'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => { setLoading(false); setTitle(''); setAmount(0); }, 650);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 140 }]}
      >
        <Text style={styles.kicker}>QUICK ADD</Text>
        <Text style={styles.title}>Where did it go?</Text>
        <Text style={styles.subtitle}>Capture it now. Keep your money picture honest.</Text>
        <View style={styles.segment}>
          {(['expense', 'income'] as const).map((item) => (
            <PrimaryButton key={item} title={item === 'expense' ? 'Expense' : 'Income'} variant={type === item ? 'primary' : 'secondary'} onPress={() => setType(item)} style={styles.segmentButton} />
          ))}
        </View>
        <View style={styles.form}>
          <InputField label="What is it?" value={title} onChangeText={(value) => { setTitle(value); setError(''); }} placeholder={type === 'expense' ? 'Coffee, groceries...' : 'Salary, freelance...'} autoCapitalize="sentences" />
          <CurrencyInput label="Amount" value={amount} onChangeValue={(value) => { setAmount(value); setError(''); }} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton title={loading ? 'Saving...' : `Save ${type}`} loading={loading} onPress={save} style={styles.save} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: spacing.lg },
  kicker: { ...typography.label, color: colors.accent, letterSpacing: 1.4 },
  title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  segment: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  segmentButton: { flex: 1, height: 48 },
  form: { marginTop: spacing.xl, gap: spacing.md },
  error: { ...typography.caption, color: colors.expense, marginTop: -spacing.xs },
  save: { marginTop: spacing.sm },
});

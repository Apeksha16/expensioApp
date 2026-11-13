import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { employmentOptions } from '../services/employmentService';
import { financialProfileService } from '../services/financialProfileService';
import { colors, radius, spacing, typography } from '../theme';

function formatBalance(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function BalanceConfirmationPrompt() {
  const {
    authPhase,
    isBalanceConfirmationDue,
    financialProfile,
    employment,
    updateFinancialProfile,
    confirmMonthlyBalances,
    snoozeMonthlyBalances,
    showToast,
  } = useApp();
  const [visibleAmounts, setVisibleAmounts] = useState(false);
  const [editing, setEditing] = useState(false);
  const [incomeText, setIncomeText] = useState('');
  const [cashText, setCashText] = useState('');
  const [savingsText, setSavingsText] = useState('');
  const [saving, setSaving] = useState(false);

  const income = financialProfileService.fromMinorUnits(financialProfile.monthlyIncomeMinor);
  const cash = financialProfileService.fromMinorUnits(financialProfile.cashBalanceMinor);
  const savings = financialProfileService.fromMinorUnits(financialProfile.savingsAmountMinor);

  useEffect(() => {
    setVisibleAmounts(false);
    setEditing(false);
    setIncomeText(income === null ? '' : String(income));
    setCashText(cash === null ? '' : String(cash));
    setSavingsText(savings === null ? '' : String(savings));
  }, [income, cash, savings]);

  const visible = authPhase === 'main' && isBalanceConfirmationDue;
  const setAmountText = (setter: (value: string) => void, value: string) => {
    if (/^\d*\.?\d{0,2}$/.test(value)) setter(value);
  };
  const perform = async (operation: () => Promise<void>, successMessage: string) => {
    if (saving) return;
    setSaving(true);
    try {
      await operation();
      showToast('success', successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save balance confirmation.';
      showToast('error', message);
    } finally {
      setSaving(false);
    }
  };
  const saveUpdates = () => perform(async () => {
    const changes: { monthlyIncome?: number; cashBalance?: number; savings?: number } = {};
    if (incomeText.trim()) changes.monthlyIncome = financialProfileService.toMinorUnits(Number(incomeText)) / 100;
    if (cashText.trim()) changes.cashBalance = financialProfileService.toMinorUnits(Number(cashText)) / 100;
    if (savingsText.trim()) changes.savings = financialProfileService.toMinorUnits(Number(savingsText)) / 100;
    await updateFinancialProfile(changes, employment?.type);
  }, 'Balances updated and confirmed.');

  const monthLabel = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const incomeLabel = employmentOptions.find((option) => option.type === employment?.type)?.incomeLabel ?? 'Monthly income';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => undefined}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.icon}><Ionicons name="wallet-outline" size={23} color={colors.accent} /></View>
            <Text style={styles.eyebrow}>MONTHLY CHECK-IN</Text>
            <Text style={styles.title}>Are your balances still right?</Text>
                <Text style={styles.subtitle}>Confirm or update the amounts you declared for {monthLabel}.</Text>

            <View style={styles.amountList}>
              <BalanceLine
                label={incomeLabel}
                value={income}
                visibleAmounts={visibleAmounts}
                editing={editing}
                text={incomeText}
                onChangeText={(value) => setAmountText(setIncomeText, value)}
              />
              <BalanceLine
                label="Cash balance"
                value={cash}
                visibleAmounts={visibleAmounts}
                editing={editing}
                text={cashText}
                onChangeText={(value) => setAmountText(setCashText, value)}
              />
              <BalanceLine
                label="Savings amount"
                value={savings}
                visibleAmounts={visibleAmounts}
                editing={editing}
                text={savingsText}
                onChangeText={(value) => setAmountText(setSavingsText, value)}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={visibleAmounts ? 'Hide balances' : 'Show balances'}
              onPress={() => setVisibleAmounts((current) => !current)}
              style={styles.visibilityButton}
            >
              <Ionicons name={visibleAmounts ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.accent} />
              <Text style={styles.visibilityText}>{visibleAmounts ? 'Hide amounts' : 'Show amounts'}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => {
                if (editing) void saveUpdates();
                else setEditing(true);
              }}
              style={[styles.primaryButton, saving && styles.disabledButton]}
            >
              <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : editing ? 'Save updates' : 'Update'}</Text>
            </Pressable>
            {!editing ? (
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={() => void perform(confirmMonthlyBalances, 'Balances confirmed for this month.')}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Confirm same amounts</Text>
              </Pressable>
            ) : (
              <Pressable disabled={saving} onPress={() => setEditing(false)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancel update</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => void perform(snoozeMonthlyBalances, 'We’ll remind you in five days.')}
              style={styles.snoozeButton}
            >
              <Text style={styles.snoozeText}>Remind me later</Text>
            </Pressable>
            <Text style={styles.footnote}>Values are stored on this device and are not bank-verified.</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function BalanceLine({
  label,
  value,
  visibleAmounts,
  editing,
  text,
  onChangeText,
}: {
  label: string;
  value: number | null;
  visibleAmounts: boolean;
  editing: boolean;
  text: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.line}>
      <Text style={styles.label}>{label}</Text>
      {editing ? (
        <View style={styles.inputRow}>
          <Text style={styles.currency}>₹</Text>
          <TextInput
            accessibilityLabel={label}
            value={text}
            onChangeText={onChangeText}
            keyboardType="decimal-pad"
            inputMode="decimal"
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
        </View>
      ) : (
        <Text style={styles.value}>{value === null ? 'Not provided' : visibleAmounts ? formatBalance(value) : '••••••'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(20, 32, 29, 0.62)' },
  card: { width: '100%', maxWidth: 440, maxHeight: '90%', alignSelf: 'center', borderRadius: radius.xl, backgroundColor: colors.background, overflow: 'hidden' },
  content: { padding: spacing.lg, alignItems: 'stretch', gap: spacing.sm },
  icon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  eyebrow: { ...typography.micro, color: colors.accent, letterSpacing: 1 },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, lineHeight: 20 },
  amountList: { marginTop: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  line: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  label: { ...typography.captionMedium, color: colors.textSecondary, flex: 1 },
  value: { ...typography.bodySemibold, color: colors.textPrimary },
  inputRow: { minWidth: 120, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.accent },
  currency: { ...typography.bodySemibold, color: colors.accent },
  input: { minWidth: 86, paddingVertical: spacing.xs, ...typography.bodySemibold, color: colors.textPrimary, textAlign: 'right' },
  visibilityButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  visibilityText: { ...typography.captionMedium, color: colors.accent },
  primaryButton: { minHeight: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  primaryButtonText: { ...typography.bodySemibold, color: colors.white },
  disabledButton: { opacity: 0.6 },
  secondaryButton: { minHeight: 46, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  secondaryButtonText: { ...typography.captionMedium, color: colors.accentDark },
  snoozeButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  snoozeText: { ...typography.captionMedium, color: colors.textSecondary },
  footnote: { ...typography.micro, color: colors.textTertiary, textAlign: 'center' },
});

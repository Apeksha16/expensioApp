import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrencyInput } from '../../components/CurrencyInput';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ProgressBar } from '../../components/ProgressBar';
import { useApp } from '../../context/AppContext';
import { colors, spacing, typography } from '../../theme';
import {
  isValidName,
  isValidUserId,
  normalizeUserId,
} from '../../utils/validation';

const STEPS = 3;

export function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { completeSetup } = useApp();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [income, setIncome] = useState(0);
  const [cash, setCash] = useState(0);
  const [savings, setSavings] = useState(0);
  const [error, setError] = useState('');

  const next = () => {
    if (step === 1) {
      if (!isValidName(name)) {
        setError('Enter your name');
        return;
      }
      if (!isValidUserId(userId)) {
        setError('User ID must be 3–20 chars, start with a letter');
        return;
      }
    }
    if (step === 2 && income <= 0) {
      setError('Enter your monthly income');
      return;
    }
    setError('');
    if (step < STEPS) {
      setStep((s) => s + 1);
      return;
    }
    completeSetup({
      name: name.trim(),
      userId: normalizeUserId(userId),
      monthlyIncome: income,
      cashInHand: cash,
      savings,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <Text style={styles.stepLabel}>
          Step {step} of {STEPS}
        </Text>
        <ProgressBar current={step} total={STEPS} height={6} style={styles.progress} />

        {step === 1 ? (
          <View style={styles.content}>
            <Text style={styles.title}>Who are you?</Text>
            <Text style={styles.subtitle}>
              Your User ID helps friends find you for splits.
            </Text>
            <InputField
              label="Your name"
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (error) setError('');
              }}
              placeholder="Apeksha Verma"
              autoCapitalize="words"
            />
            <InputField
              label="Choose User ID"
              value={userId}
              onChangeText={(v) => {
                const cleaned = v.replace(/[^a-zA-Z0-9_@]/g, '');
                setUserId(cleaned.startsWith('@') ? cleaned : `@${cleaned}`);
                if (error) setError('');
              }}
              placeholder="@apeksha"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.content}>
            <Text style={styles.title}>What's your monthly income?</Text>
            <Text style={styles.subtitle}>
              Used to personalize your budgets and insights.
            </Text>
            <CurrencyInput
              label="Monthly income"
              value={income}
              onChangeValue={(v) => {
                setIncome(v);
                if (error) setError('');
              }}
            />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.content}>
            <Text style={styles.title}>Starting money</Text>
            <Text style={styles.subtitle}>
              A quick snapshot of cash and savings today.
            </Text>
            <CurrencyInput
              label="Cash in hand"
              value={cash}
              onChangeValue={setCash}
            />
            <CurrencyInput
              label="Current savings"
              value={savings}
              onChangeValue={setSavings}
            />
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footer}>
          {step > 1 ? (
            <PrimaryButton
              title="Back"
              variant="secondary"
              onPress={() => {
                setError('');
                setStep((s) => s - 1);
              }}
              style={styles.backBtn}
            />
          ) : null}
          <PrimaryButton
            title={step === STEPS ? 'Start My Journey' : 'Continue'}
            onPress={next}
            style={styles.nextBtn}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  stepLabel: {
    ...typography.captionMedium,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  progress: {
    marginBottom: spacing.xl,
  },
  content: {
    flex: 1,
    gap: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  error: {
    ...typography.caption,
    color: colors.expense,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  backBtn: {
    flex: 0.4,
  },
  nextBtn: {
    flex: 1,
  },
});

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrencyInput } from '../../components/CurrencyInput';
import { FriendRow } from '../../components/FriendRow';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ProgressBar } from '../../components/ProgressBar';
import { useApp } from '../../context/AppContext';
import { CURRENT_USER_ID } from '../../data/splits';
import type { SplitStackParamList } from '../../navigation/SplitStack';
import { colors, radius, spacing, typography } from '../../theme';
import type { SplitMethod } from '../../types';
import { formatINR } from '../../utils/format';
import { buildEqualShares, getFriendMeta } from '../../utils/splits';

type Props = NativeStackScreenProps<SplitStackParamList, 'CreateSplit'>;

const STEPS = 4;

export function CreateSplitScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { friends, addSplit } = useApp();

  const [step, setStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState('Today');
  const [note, setNote] = useState('');
  const [paidById, setPaidById] = useState(CURRENT_USER_ID);
  const [method, setMethod] = useState<SplitMethod>('equal');
  const [customShares, setCustomShares] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  const participants = useMemo(
    () => [CURRENT_USER_ID, ...selectedIds],
    [selectedIds],
  );

  const equalPreview = useMemo(
    () => buildEqualShares(participants, amount || 0, paidById),
    [participants, amount, paidById],
  );

  const customTotal = participants.reduce(
    (sum, id) => sum + (customShares[id] ?? 0),
    0,
  );

  const toggleFriend = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setError('');
  };

  const goNext = () => {
    if (step === 1) {
      if (selectedIds.length === 0) {
        setError('Select at least one friend');
        return;
      }
    }
    if (step === 2) {
      if (!title.trim()) {
        setError('Enter a title');
        return;
      }
      if (amount <= 0) {
        setError('Enter an amount');
        return;
      }
      if (!participants.includes(paidById)) {
        setPaidById(CURRENT_USER_ID);
      }
      if (method === 'equal') {
        const next: Record<string, number> = {};
        equalPreview.forEach((share) => {
          next[share.friendId] = share.amount;
        });
        setCustomShares(next);
      }
    }
    if (step === 3 && method === 'custom') {
      if (customTotal !== amount) {
        setError(`Shares must total ${formatINR(amount)}`);
        return;
      }
    }
    setError('');
    if (step < STEPS) {
      setStep((s) => s + 1);
      return;
    }

    const created = addSplit({
      title,
      amount,
      paidById,
      date: date.trim() || 'Today',
      method,
      participantIds: participants,
      customShares: method === 'custom' ? customShares : undefined,
      note,
    });
    navigation.replace('SplitDetail', { splitId: created.id });
  };

  const payerOptions = participants.map((id) => ({
    id,
    ...getFriendMeta(id, friends),
  }));

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <Pressable
          onPress={() => (step === 1 ? navigation.goBack() : setStep((s) => s - 1))}
          hitSlop={8}
        >
          <Text style={styles.back}>{step === 1 ? '← Cancel' : '← Back'}</Text>
        </Pressable>

        <Text style={styles.stepLabel}>
          Step {step} of {STEPS}
        </Text>
        <ProgressBar current={step} total={STEPS} height={6} style={styles.progress} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? (
            <View style={styles.section}>
              <Text style={styles.title}>Select friends</Text>
              <Text style={styles.subtitle}>
                You'll be included automatically.
              </Text>
              {friends.map((friend) => (
                <FriendRow
                  key={friend.id}
                  friend={friend}
                  selected={selectedIds.includes(friend.id)}
                  onPress={() => toggleFriend(friend.id)}
                />
              ))}
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.section}>
              <Text style={styles.title}>Enter expense</Text>
              <InputField
                label="Title"
                value={title}
                onChangeText={(v) => {
                  setTitle(v);
                  if (error) setError('');
                }}
                placeholder="Dinner, Uber, Groceries…"
              />
              <CurrencyInput
                label="Amount"
                value={amount}
                onChangeValue={(v) => {
                  setAmount(v);
                  if (error) setError('');
                }}
              />
              <InputField
                label="Date"
                value={date}
                onChangeText={setDate}
                placeholder="Today"
              />
              <InputField
                label="Note (optional)"
                value={note}
                onChangeText={setNote}
                placeholder="Add a note"
              />
              <Text style={styles.fieldLabel}>Paid by</Text>
              <View style={styles.chips}>
                {payerOptions.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => setPaidById(option.id)}
                    style={[
                      styles.chip,
                      paidById === option.id && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        paidById === option.id && styles.chipTextActive,
                      ]}
                    >
                      {option.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.section}>
              <Text style={styles.title}>How to split?</Text>
              <View style={styles.methodRow}>
                {(['equal', 'custom'] as SplitMethod[]).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => {
                      setMethod(item);
                      setError('');
                      if (item === 'equal') {
                        const next: Record<string, number> = {};
                        equalPreview.forEach((share) => {
                          next[share.friendId] = share.amount;
                        });
                        setCustomShares(next);
                      }
                    }}
                    style={[
                      styles.methodCard,
                      method === item && styles.methodActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.methodTitle,
                        method === item && styles.methodTitleActive,
                      ]}
                    >
                      {item === 'equal' ? 'Equal' : 'Custom'}
                    </Text>
                    <Text style={styles.methodSub}>
                      {item === 'equal'
                        ? 'Split evenly across everyone'
                        : 'Set each person’s share'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {method === 'equal' ? (
                <View style={styles.shareList}>
                  {equalPreview.map((share) => {
                    const meta = getFriendMeta(share.friendId, friends);
                    return (
                      <View key={share.friendId} style={styles.shareRow}>
                        <Text style={styles.shareName}>{meta.name}</Text>
                        <Text style={styles.shareAmount}>
                          {formatINR(share.amount)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.shareList}>
                  {participants.map((id) => {
                    const meta = getFriendMeta(id, friends);
                    return (
                      <CurrencyInput
                        key={id}
                        label={meta.name}
                        value={customShares[id] ?? 0}
                        onChangeValue={(value) => {
                          setCustomShares((prev) => ({ ...prev, [id]: value }));
                          if (error) setError('');
                        }}
                      />
                    );
                  })}
                  <Text
                    style={[
                      styles.customHint,
                      customTotal !== amount && styles.customHintError,
                    ]}
                  >
                    Total shares {formatINR(customTotal)} / {formatINR(amount)}
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          {step === 4 ? (
            <View style={styles.section}>
              <Text style={styles.title}>Review split</Text>
              <View style={styles.reviewCard}>
                <Text style={styles.reviewTitle}>{title}</Text>
                <Text style={styles.reviewAmount}>{formatINR(amount)}</Text>
                <Text style={styles.reviewMeta}>
                  {date} · Paid by {getFriendMeta(paidById, friends).name} ·{' '}
                  {method === 'equal' ? 'Equal' : 'Custom'}
                </Text>
                {note ? <Text style={styles.reviewNote}>{note}</Text> : null}
              </View>
              <View style={styles.shareList}>
                {(method === 'equal' ? equalPreview : participants.map((id) => ({
                  friendId: id,
                  amount: customShares[id] ?? 0,
                  settled: id === paidById,
                }))).map((share) => {
                  const meta = getFriendMeta(share.friendId, friends);
                  return (
                    <View key={share.friendId} style={styles.shareRow}>
                      <Text style={styles.shareName}>{meta.name}</Text>
                      <Text style={styles.shareAmount}>
                        {formatINR(share.amount)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <PrimaryButton
          title={step === STEPS ? 'Save Split' : 'Continue'}
          onPress={goNext}
        />
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
  back: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  stepLabel: {
    ...typography.captionMedium,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  progress: {
    marginBottom: spacing.lg,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  chipText: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.accentDark,
  },
  methodRow: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  methodCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  methodActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  methodTitle: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
  },
  methodTitleActive: {
    color: colors.accentDark,
  },
  methodSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  shareList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  shareName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  shareAmount: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
  },
  customHint: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  customHintError: {
    color: colors.expense,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.xs,
  },
  reviewTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  reviewAmount: {
    ...typography.hero,
    color: colors.accent,
    marginVertical: spacing.xs,
  },
  reviewMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  reviewNote: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.expense,
    marginTop: spacing.sm,
  },
});

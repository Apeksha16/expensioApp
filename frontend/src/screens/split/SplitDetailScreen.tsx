import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { CURRENT_USER_ID } from '../../data/splits';
import type { SplitStackParamList } from '../../navigation/SplitStack';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatINR } from '../../utils/format';
import {
  getFriendMeta,
  isSplitSettled,
  yourShareLabel,
} from '../../utils/splits';

type Props = NativeStackScreenProps<SplitStackParamList, 'SplitDetail'>;

export function SplitDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { friends, splits, settleShare, settleMyShare } = useApp();
  const split = splits.find((item) => item.id === route.params.splitId);

  const status = useMemo(
    () => (split ? yourShareLabel(split) : null),
    [split],
  );

  if (!split || !status) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Split not found</Text>
      </View>
    );
  }

  const settled = isSplitSettled(split);
  const payer = getFriendMeta(split.paidById, friends);
  const myShare = split.shares.find((s) => s.friendId === CURRENT_USER_ID);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('SplitHome')} hitSlop={8}>
          <Text style={styles.back}>← Splits</Text>
        </Pressable>
        <Text style={styles.title}>{split.title}</Text>
        <Text style={styles.amount}>{formatINR(split.amount)}</Text>
        <Text style={styles.meta}>
          {split.date} · Paid by {payer.name} ·{' '}
          {split.method === 'equal' ? 'Equal split' : 'Custom split'}
        </Text>
        {split.note ? <Text style={styles.note}>{split.note}</Text> : null}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>{status.label}</Text>
          {status.amount > 0 ? (
            <Text
              style={[
                styles.statusValue,
                status.tone === 'owe' && styles.owe,
                status.tone === 'owed' && styles.owed,
              ]}
            >
              {formatINR(status.amount)}
            </Text>
          ) : (
            <Text style={styles.statusSettled}>All settled</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Shares</Text>
        <View style={styles.shareCard}>
          {split.shares.map((share, index) => {
            const meta = getFriendMeta(share.friendId, friends);
            return (
              <View
                key={share.friendId}
                style={[
                  styles.shareRow,
                  index < split.shares.length - 1 && styles.shareBorder,
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: meta.color }]}>
                  <Text style={styles.initials}>{meta.initials}</Text>
                </View>
                <View style={styles.shareMeta}>
                  <Text style={styles.shareName}>{meta.name}</Text>
                  <Text style={styles.shareState}>
                    {share.settled ? 'Settled' : 'Pending'}
                    {share.friendId === split.paidById ? ' · Payer' : ''}
                  </Text>
                </View>
                <Text style={styles.shareAmount}>{formatINR(share.amount)}</Text>
              </View>
            );
          })}
        </View>

        {!settled && status.tone === 'owe' && myShare && !myShare.settled ? (
          <PrimaryButton
            title="Mark my share settled"
            onPress={() => settleMyShare(split.id)}
          />
        ) : null}

        {!settled && split.paidById === CURRENT_USER_ID ? (
          <View style={styles.actions}>
            {split.shares
              .filter((s) => s.friendId !== CURRENT_USER_ID && !s.settled)
              .map((share) => {
                const meta = getFriendMeta(share.friendId, friends);
                return (
                  <PrimaryButton
                    key={share.friendId}
                    title={`Settle ${meta.name.split(' ')[0]}`}
                    variant="secondary"
                    onPress={() => settleShare(split.id, share.friendId)}
                  />
                );
              })}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  back: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  amount: {
    ...typography.hero,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  note: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.soft,
  },
  statusLabel: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  statusValue: {
    ...typography.h2,
    marginTop: spacing.xxs,
  },
  statusSettled: {
    ...typography.h3,
    color: colors.textTertiary,
    marginTop: spacing.xxs,
  },
  owe: { color: colors.expense },
  owed: { color: colors.income },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  shareCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  shareBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.bodySemibold,
    color: colors.white,
  },
  shareMeta: {
    flex: 1,
  },
  shareName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  shareState: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  shareAmount: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
  },
  actions: {
    gap: spacing.xs,
  },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CURRENT_USER_ID } from '../data/splits';
import { colors, radius, shadows, spacing, typography } from '../theme';
import type { Friend, SplitExpense } from '../types';
import { formatINR } from '../utils/format';
import {
  getFriendMeta,
  isSplitSettled,
  yourShareLabel,
} from '../utils/splits';
import { AvatarGroup } from './AvatarGroup';

interface Props {
  split: SplitExpense;
  friends: Friend[];
  onPress: () => void;
}

export function SplitListItem({ split, friends, onPress }: Props) {
  const status = yourShareLabel(split);
  const avatars = split.shares
    .filter((s) => s.friendId !== CURRENT_USER_ID)
    .map((s) => {
      const meta = getFriendMeta(s.friendId, friends);
      return {
        id: s.friendId,
        initials: meta.initials,
        color: meta.color,
      };
    });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.meta}>
          <Text style={styles.title}>{split.title}</Text>
          <Text style={styles.sub}>
            {split.date} · {formatINR(split.amount)}
          </Text>
        </View>
        <View style={styles.right}>
          <View style={[
            styles.statusPill,
            status.tone === 'owe' && styles.pillOwe,
            status.tone === 'owed' && styles.pillOwed,
            status.tone === 'settled' && styles.pillSettled,
          ]}>
            <Text style={[
              styles.statusLabel,
              status.tone === 'owe' && styles.owe,
              status.tone === 'owed' && styles.owed,
              status.tone === 'settled' && styles.settled,
            ]}>
              {status.tone === 'owe' ? '↑ ' : status.tone === 'owed' ? '↓ ' : ''}{status.label}
            </Text>
          </View>
          {status.amount > 0 ? (
            <Text
              style={[
                styles.amount,
                status.tone === 'owe' && styles.owe,
                status.tone === 'owed' && styles.owed,
              ]}
            >
              {formatINR(status.amount)}
            </Text>
          ) : null}
        </View>
      </View>
      <AvatarGroup avatars={avatars} size={26} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  pressed: {
    opacity: 0.90,
    transform: [{ scale: 0.99 }],
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  title: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
  },
  sub: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  pillOwe: { backgroundColor: '#FEE2E2' },
  pillOwed: { backgroundColor: '#D1FAE5' },
  pillSettled: { backgroundColor: colors.borderLight },
  statusLabel: {
    ...typography.micro,
    color: colors.textSecondary,
  },
  amount: {
    ...typography.captionMedium,
    fontSize: 14,
  },
  owe: {
    color: colors.expense,
  },
  owed: {
    color: colors.income,
  },
  settled: {
    color: colors.textTertiary,
  },
});

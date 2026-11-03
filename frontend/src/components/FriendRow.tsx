import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import type { Friend } from '../types';

interface Props {
  friend: Friend;
  selected?: boolean;
  onPress?: () => void;
  rightLabel?: string;
  rightTone?: 'owe' | 'owed' | 'neutral';
  showChevron?: boolean;
}

export function FriendRow({
  friend,
  selected,
  onPress,
  rightLabel,
  rightTone = 'neutral',
  showChevron,
}: Props) {
  const content = (
    <View style={[styles.row, selected && styles.selected]}>
      <View style={[styles.avatar, { backgroundColor: friend.color }]}>
        <Text style={styles.initials}>{friend.initials}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.name}>{friend.name}</Text>
        {friend.userId ? (
          <Text style={styles.userId}>{friend.userId}</Text>
        ) : null}
      </View>
      {rightLabel ? (
        <Text
          style={[
            styles.right,
            rightTone === 'owe' && styles.owe,
            rightTone === 'owed' && styles.owed,
          ]}
        >
          {rightLabel}
        </Text>
      ) : null}
      {selected ? (
        <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  selected: {
    backgroundColor: colors.accentSoft,
  },
  pressed: {
    opacity: 0.9,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.bodySemibold,
    color: colors.white,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  userId: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  right: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  owe: {
    color: colors.expense,
  },
  owed: {
    color: colors.income,
  },
});

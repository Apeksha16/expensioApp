import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  AccessibilityActionEvent,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { formatHandle, sanitizeDisplayText } from '../services/friendsStore';
import { colors, layout, radius, spacing, typography } from '../theme';
import type { Friend } from '../types';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { SwipeRevealRow } from './SwipeRevealRow';

export type GroupedCardPosition = 'single' | 'first' | 'middle' | 'last';

interface Props {
  friend: Friend;
  selected?: boolean;
  onPress?: () => void;
  rightLabel?: string;
  rightTone?: 'owe' | 'owed' | 'neutral';
  showChevron?: boolean;
  showGuestBadge?: boolean;
  grouped?: boolean;
  cardPosition?: GroupedCardPosition;
  showTopDivider?: boolean;
  onEditGuest?: () => void;
  onRemove?: () => void;
  actionLoading?: boolean;
  swipeOpen?: boolean;
  onSwipeOpen?: () => void;
  onSwipeClose?: () => void;
}

export const FriendRow = React.memo(function FriendRow({
  friend,
  selected,
  onPress,
  rightLabel,
  rightTone = 'neutral',
  showChevron = true,
  showGuestBadge = false,
  grouped = false,
  cardPosition,
  showTopDivider = false,
  onEditGuest,
  onRemove,
  actionLoading = false,
  swipeOpen,
  onSwipeOpen,
  onSwipeClose,
}: Props) {
  const safeName = sanitizeDisplayText(friend.name) || 'Expensio user';
  const formattedHandle = friend.userId ? formatHandle(friend.userId) : '';

  const actionsList: string[] = [];
  if (onEditGuest) actionsList.push('Edit avatar');
  if (onRemove) actionsList.push('Remove');

  const rowAccessibilityLabel = [
    safeName,
    formattedHandle,
    friend.isGuest ? 'Guest' : '',
    rightLabel || '',
    selected ? 'Selected' : '',
    actionsList.length ? `Actions: ${actionsList.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  const accessibilityActions = [
    ...(onPress ? [{ name: 'activate', label: 'Open details' }] : []),
    ...(onEditGuest ? [{ name: 'edit', label: `Edit ${safeName}'s avatar` }] : []),
    ...(onRemove ? [{ name: 'delete', label: `Remove ${safeName}` }] : []),
  ];

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    switch (event.nativeEvent.actionName) {
      case 'activate':
        onPress?.();
        break;
      case 'edit':
        onEditGuest?.();
        break;
      case 'delete':
        onRemove?.();
        break;
    }
  };

  const inner = (
    <View>
      {showTopDivider ? <View style={styles.topDivider} /> : null}
      <View
        style={[
          styles.row,
          !grouped && styles.rowCard,
          selected && styles.selected,
          actionLoading && styles.rowPending,
        ]}
      >
        <Avatar
          id={friend.id}
          name={safeName}
          uri={friend.avatarUri}
          presetId={friend.avatarId}
          size={44}
          isGuest={Boolean(friend.isGuest)}
        />

        <View style={styles.meta}>
          <View style={styles.titleLine}>
            <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">
              {safeName}
            </Text>
            {showGuestBadge && friend.isGuest ? <Badge label="Guest" variant="tag" size="sm" /> : null}
          </View>

          {formattedHandle ? (
            <Text style={styles.userId} numberOfLines={1} ellipsizeMode="tail">
              {formattedHandle}
            </Text>
          ) : null}
        </View>

        <View style={styles.trailing}>
          {rightLabel ? (
            <View
              style={[
                styles.balanceChip,
                rightTone === 'owe' && styles.balanceOwe,
                rightTone === 'owed' && styles.balanceOwed,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.balanceText,
                  rightTone === 'owe' && styles.balanceTextOwe,
                  rightTone === 'owed' && styles.balanceTextOwed,
                ]}
              >
                {rightLabel}
              </Text>
            </View>
          ) : null}

          {actionLoading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : selected ? (
            <View style={styles.selectedCheck}>
              <Ionicons name="checkmark-outline" size={16} color={colors.textInverse} />
            </View>
          ) : showChevron ? (
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          ) : null}
        </View>
      </View>
    </View>
  );

  const pressableRow = onPress ? (
    <Pressable
      onPress={onPress}
      disabled={actionLoading}
      accessibilityRole="button"
      accessibilityLabel={rowAccessibilityLabel}
      accessibilityHint={grouped ? 'Opens person options' : undefined}
      accessibilityState={{ selected: Boolean(selected), disabled: actionLoading, busy: actionLoading }}
      accessibilityActions={accessibilityActions.length ? accessibilityActions : undefined}
      onAccessibilityAction={accessibilityActions.length ? handleAccessibilityAction : undefined}
      style={({ pressed }) =>
        pressed && !actionLoading && (grouped ? styles.groupedPressed : styles.pressed)
      }
    >
      {inner}
    </Pressable>
  ) : (
    <View
      accessible
      accessibilityLabel={rowAccessibilityLabel}
      accessibilityActions={accessibilityActions.length ? accessibilityActions : undefined}
      onAccessibilityAction={accessibilityActions.length ? handleAccessibilityAction : undefined}
    >
      {inner}
    </View>
  );

  const content = grouped && onRemove ? (
    <SwipeRevealRow
      actionLabel="Remove"
      accessibilityActionLabel={`Remove ${safeName}`}
      onAction={onRemove}
      disabled={actionLoading}
      isOpen={swipeOpen}
      onSwipeOpen={onSwipeOpen}
      onSwipeClose={onSwipeClose}
    >
      {pressableRow}
    </SwipeRevealRow>
  ) : (
    pressableRow
  );

  if (!cardPosition) return content;

  return (
    <View
      style={[
        styles.cardShell,
        (cardPosition === 'single' || cardPosition === 'first') && styles.cardTop,
        (cardPosition === 'single' || cardPosition === 'last') && styles.cardBottom,
      ]}
    >
      {content}
    </View>
  );
});

const styles = StyleSheet.create({
  cardShell: {
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardTop: {
    borderTopWidth: 1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  cardBottom: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  topDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: layout.rowDividerInset,
  },
  row: {
    minHeight: layout.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: layout.cardPadding,
    backgroundColor: colors.surface,
  },
  rowCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentMuted,
  },
  rowPending: {
    opacity: 0.6,
  },
  groupedPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
    transform: [{ scale: 0.985 }],
  },
  meta: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 2,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    ...typography.rowTitle,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  userId: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  balanceChip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  balanceOwe: {
    backgroundColor: colors.dangerSoft,
  },
  balanceOwed: {
    backgroundColor: colors.accentSoft,
  },
  balanceText: {
    ...typography.micro,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  balanceTextOwe: {
    color: colors.expense,
    fontWeight: '600',
  },
  balanceTextOwed: {
    color: colors.income,
    fontWeight: '600',
  },
  selectedCheck: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

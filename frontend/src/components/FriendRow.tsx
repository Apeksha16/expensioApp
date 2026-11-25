import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useSyncExternalStore } from 'react';
import {
  AccessibilityActionEvent,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { FriendRowInteractionStore } from '../services/friendRowInteractionStore';
import { formatHandle, sanitizeDisplayText } from '../services/friendsStore';
import { fontFamilies, colors, layout, radius, spacing, typography } from '../theme';
import type { Friend } from '../types';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { SwipeRevealRow } from './SwipeRevealRow';

export type GroupedCardPosition = 'single' | 'first' | 'middle' | 'last';

interface Props {
  friend: Friend;
  selected?: boolean;
  onPress?: () => void;
  onPressItem?: (id: string) => void;
  rightLabel?: string;
  rightTone?: 'owe' | 'owed' | 'neutral';
  showChevron?: boolean;
  showGuestBadge?: boolean;
  grouped?: boolean;
  cardPosition?: GroupedCardPosition;
  showTopDivider?: boolean;
  onEditGuest?: () => void;
  onRemove?: () => void;
  onRemoveItem?: (id: string) => void;
  actionLoading?: boolean;
  swipeOpen?: boolean;
  onSwipeOpen?: () => void;
  onSwipeClose?: () => void;
  onSwipeOpenItem?: (id: string) => void;
  onSwipeCloseItem?: (id: string) => void;
  interactionStore?: FriendRowInteractionStore;
}

const noopUnsubscribe = () => () => {};
const alwaysFalse = () => false;

export const FriendRow = React.memo(function FriendRow({
  friend,
  selected,
  onPress,
  onPressItem,
  rightLabel,
  rightTone = 'neutral',
  showChevron = true,
  showGuestBadge = false,
  grouped = false,
  cardPosition,
  showTopDivider = false,
  onEditGuest,
  onRemove,
  onRemoveItem,
  actionLoading = false,
  swipeOpen,
  onSwipeOpen,
  onSwipeClose,
  onSwipeOpenItem,
  onSwipeCloseItem,
  interactionStore,
}: Props) {
  const rowId = friend.friendshipId ?? friend.id;
  const subscribe = interactionStore ? interactionStore.subscribe : noopUnsubscribe;
  const getPending = useCallback(
    () => (interactionStore ? interactionStore.isPending(rowId) : false),
    [interactionStore, rowId],
  );
  const getSwipe = useCallback(
    () => (interactionStore ? interactionStore.isSwipeOpen(rowId) : false),
    [interactionStore, rowId],
  );
  const storePending = useSyncExternalStore(subscribe, interactionStore ? getPending : alwaysFalse);
  const storeSwipeOpen = useSyncExternalStore(subscribe, interactionStore ? getSwipe : alwaysFalse);

  const resolvedLoading = actionLoading || storePending;
  const resolvedSwipeOpen = swipeOpen ?? (interactionStore ? storeSwipeOpen : undefined);

  const handlePress = useCallback(() => {
    if (onPressItem) {
      onPressItem(rowId);
      return;
    }
    onPress?.();
  }, [onPress, onPressItem, rowId]);

  const handleRemove = useCallback(() => {
    if (onRemoveItem) {
      onRemoveItem(rowId);
      return;
    }
    onRemove?.();
  }, [onRemove, onRemoveItem, rowId]);

  const handleSwipeOpen = useCallback(() => {
    if (onSwipeOpenItem) {
      onSwipeOpenItem(rowId);
      return;
    }
    onSwipeOpen?.();
  }, [onSwipeOpen, onSwipeOpenItem, rowId]);

  const handleSwipeClose = useCallback(() => {
    if (onSwipeCloseItem) {
      onSwipeCloseItem(rowId);
      return;
    }
    onSwipeClose?.();
  }, [onSwipeClose, onSwipeCloseItem, rowId]);

  const hasPress = Boolean(onPress || onPressItem);
  const hasRemove = Boolean(onRemove || onRemoveItem);

  const safeName = sanitizeDisplayText(friend.name) || 'Expensio user';
  const formattedHandle = friend.userId ? formatHandle(friend.userId) : '';

  const actionsList: string[] = [];
  if (onEditGuest) actionsList.push('Edit avatar');
  if (hasRemove) actionsList.push('Remove');

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
    ...(hasPress ? [{ name: 'activate', label: 'Open details' }] : []),
    ...(onEditGuest ? [{ name: 'edit', label: `Edit ${safeName}'s avatar` }] : []),
    ...(hasRemove ? [{ name: 'delete', label: `Remove ${safeName}` }] : []),
  ];

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    switch (event.nativeEvent.actionName) {
      case 'activate':
        handlePress();
        break;
      case 'edit':
        onEditGuest?.();
        break;
      case 'delete':
        handleRemove();
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
          resolvedLoading && styles.rowPending,
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

          {resolvedLoading ? (
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

  const pressableRow = hasPress ? (
    <Pressable
      onPress={handlePress}
      disabled={resolvedLoading}
      accessibilityRole="button"
      accessibilityLabel={rowAccessibilityLabel}
      accessibilityHint={grouped ? 'Opens person options' : undefined}
      accessibilityState={{ selected: Boolean(selected), disabled: resolvedLoading, busy: resolvedLoading }}
      accessibilityActions={accessibilityActions.length ? accessibilityActions : undefined}
      onAccessibilityAction={accessibilityActions.length ? handleAccessibilityAction : undefined}
      style={({ pressed }) =>
        pressed && !resolvedLoading && (grouped ? styles.groupedPressed : styles.pressed)
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

  const content = grouped && hasRemove ? (
    <SwipeRevealRow
      actionLabel="Remove"
      accessibilityActionLabel={`Remove ${safeName}`}
      onAction={handleRemove}
      disabled={resolvedLoading}
      isOpen={resolvedSwipeOpen}
      onSwipeOpen={handleSwipeOpen}
      onSwipeClose={handleSwipeClose}
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
    fontFamily: fontFamilies.semibold,
  },
  balanceTextOwed: {
    color: colors.income,
    fontFamily: fontFamilies.semibold,
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

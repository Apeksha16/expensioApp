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
import type { Friendship } from '../types/friends';
import { formatCompactAge } from '../utils/format';
import { Avatar } from './Avatar';
import type { GroupedCardPosition } from './FriendRow';

interface RequestRowProps {
  friendship: Friendship;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onAcceptItem?: (friendshipId: string) => void;
  onDeclineItem?: (friendshipId: string) => void;
  onCancelItem?: (friendshipId: string) => void;
  loading?: boolean;
  interactionStore?: FriendRowInteractionStore;
  cardPosition?: GroupedCardPosition;
  showTopDivider?: boolean;
}

const noopUnsubscribe = () => () => {};
const alwaysFalse = () => false;

export const RequestRow = React.memo(function RequestRow({
  friendship,
  onAccept,
  onDecline,
  onCancel,
  onAcceptItem,
  onDeclineItem,
  onCancelItem,
  loading = false,
  interactionStore,
  cardPosition,
  showTopDivider = false,
}: RequestRowProps) {
  const { friendshipId, person, direction, createdAt } = friendship;
  const isIncoming = direction === 'INCOMING';

  const subscribe = interactionStore ? interactionStore.subscribe : noopUnsubscribe;
  const getPending = useCallback(
    () => (interactionStore ? interactionStore.isPending(friendshipId) : false),
    [friendshipId, interactionStore],
  );
  const storePending = useSyncExternalStore(subscribe, interactionStore ? getPending : alwaysFalse);
  const resolvedLoading = loading || storePending;

  const handleAccept = useCallback(() => {
    if (resolvedLoading) return;
    if (onAcceptItem) {
      onAcceptItem(friendshipId);
      return;
    }
    onAccept?.();
  }, [friendshipId, onAccept, onAcceptItem, resolvedLoading]);

  const handleDecline = useCallback(() => {
    if (resolvedLoading) return;
    if (onDeclineItem) {
      onDeclineItem(friendshipId);
      return;
    }
    onDecline?.();
  }, [friendshipId, onDecline, onDeclineItem, resolvedLoading]);

  const handleCancel = useCallback(() => {
    if (resolvedLoading) return;
    if (onCancelItem) {
      onCancelItem(friendshipId);
      return;
    }
    onCancel?.();
  }, [friendshipId, onCancel, onCancelItem, resolvedLoading]);

  const safeName = sanitizeDisplayText(person.displayName) || 'Expensio user';
  const handle = formatHandle(person.username);
  const age = formatCompactAge(createdAt);

  const subline = isIncoming
    ? [handle, age].filter(Boolean).join(' · ')
    : [handle, age ? `Sent ${age}` : 'Pending'].filter(Boolean).join(' · ');

  const unitLabel = isIncoming
    ? `${safeName}, ${handle}, incoming request${age ? `, ${age}` : ''}`
    : `${safeName}, ${handle}, sent request pending${age ? `, sent ${age}` : ''}`;

  const accessibilityActions = isIncoming
    ? [
        { name: 'accept', label: `Accept request from ${safeName}` },
        { name: 'decline', label: `Decline request from ${safeName}` },
      ]
    : [{ name: 'cancel', label: `Cancel request to ${safeName}` }];

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === 'accept') {
        handleAccept();
      } else if (event.nativeEvent.actionName === 'decline') {
        handleDecline();
      } else if (event.nativeEvent.actionName === 'cancel') {
        handleCancel();
      }
    },
    [handleAccept, handleCancel, handleDecline],
  );

  const inner = (
    <View>
      {showTopDivider ? <View style={styles.topDivider} /> : null}
      <View
        accessible={true}
        accessibilityLabel={unitLabel}
        accessibilityActions={resolvedLoading ? undefined : accessibilityActions}
        onAccessibilityAction={resolvedLoading ? undefined : handleAccessibilityAction}
        style={[styles.row, resolvedLoading && styles.rowPending]}
      >
        <Avatar
          id={person.id}
          name={safeName}
          uri={person.avatarUri}
          presetId={person.avatarId}
          size={44}
          isGuest={person.isGuest}
        />

        <View style={styles.meta}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {safeName}
          </Text>
          {subline ? (
            <Text style={styles.subline} numberOfLines={1} ellipsizeMode="tail">
              {subline}
            </Text>
          ) : null}
        </View>

        {resolvedLoading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        ) : isIncoming ? (
          <View style={styles.incomingActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Accept request from ${safeName}`}
              accessibilityState={{ disabled: resolvedLoading }}
              onPress={handleAccept}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              style={({ pressed }) => [styles.acceptPill, pressed && styles.pressed]}
            >
              <Text style={styles.acceptText}>Accept</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Decline request from ${safeName}`}
              accessibilityState={{ disabled: resolvedLoading }}
              onPress={handleDecline}
              style={({ pressed }) => [styles.declineBtn, pressed && styles.iconPressed]}
            >
              <Ionicons name="close-outline" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Cancel request to ${safeName}`}
            accessibilityState={{ disabled: resolvedLoading }}
            onPress={handleCancel}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  if (!cardPosition) return inner;

  return (
    <View
      style={[
        styles.cardShell,
        (cardPosition === 'single' || cardPosition === 'first') && styles.cardTop,
        (cardPosition === 'single' || cardPosition === 'last') && styles.cardBottom,
      ]}
    >
      {inner}
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
  rowPending: {
    opacity: 0.6,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 2,
  },
  name: {
    ...typography.rowTitle,
    color: colors.textPrimary,
  },
  subline: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  loaderBox: {
    minWidth: layout.headerButtonSize,
    height: layout.headerButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  acceptPill: {
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    ...typography.captionMedium,
    color: colors.textInverse,
    fontFamily: fontFamilies.bold,
  },
  declineBtn: {
    width: layout.headerButtonSize,
    height: layout.headerButtonSize,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    minHeight: layout.headerButtonSize,
    minWidth: layout.headerButtonSize,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...typography.captionMedium,
    color: colors.expense,
    fontFamily: fontFamilies.semibold,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconPressed: {
    backgroundColor: colors.surfaceMuted,
  },
});

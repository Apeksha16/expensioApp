import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FriendsApiError } from '../services/api/friendsErrors';
import { formatHandle } from '../services/friendsStore';
import { colors, radius, spacing, typography } from '../theme';
import type { Friendship, PreflightRemovalResult } from '../types/friends';
import { formatINR } from '../utils/format';
import { triggerErrorHaptic } from '../utils/haptics';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { BottomSheet } from './BottomSheet';
import { PrimaryButton } from './PrimaryButton';

export type RelationshipConfirmMode = 'remove' | 'decline' | 'cancel';

interface Props {
  visible: boolean;
  friendship: Friendship | null;
  mode?: RelationshipConfirmMode;
  onClose: () => void;
  onConfirmRemove: (friendshipId: string) => Promise<void>;
  preflightCheck: PreflightRemovalResult;
  onNavigateToSplits?: () => void;
  loading?: boolean;
  returnFocusRef?: React.RefObject<any>;
}

export function FriendRemovalSheet({
  visible,
  friendship,
  mode = 'remove',
  onClose,
  onConfirmRemove,
  preflightCheck,
  onNavigateToSplits,
  loading = false,
  returnFocusRef,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [serverBlocked, setServerBlocked] = useState<{
    message: string;
    unsettledAmount?: number;
  } | null>(null);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (visible) {
      setSubmitting(false);
      setServerBlocked(null);
      setSubmitError('');
      if (mode === 'remove') {
        triggerErrorHaptic();
      }
    }
  }, [visible, friendship?.friendshipId, mode]);

  if (!friendship) return null;

  const { person } = friendship;
  const handle = formatHandle(person.username);
  const isBlocked = mode === 'remove' && (preflightCheck.blockedByDebt || serverBlocked !== null);
  const busy = loading || submitting;

  const handleConfirm = async () => {
    if (busy) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await onConfirmRemove(friendship.friendshipId);
      onClose();
    } catch (err) {
      triggerErrorHaptic();
      if (err instanceof FriendsApiError && err.blockedByDebt) {
        setServerBlocked({
          message: err.message,
          unsettledAmount: err.unsettledAmount,
        });
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Unable to complete this action.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const title =
    mode === 'decline'
      ? `Decline ${person.displayName}?`
      : mode === 'cancel'
        ? `Cancel request to ${person.displayName}?`
        : `Remove ${person.displayName}?`;

  const description =
    mode === 'decline'
      ? 'They will not be added to your friends list.'
      : mode === 'cancel'
        ? 'Your pending friend request will be withdrawn.'
        : "They won't be selectable for future splits. Existing split history stays intact.";

  const confirmLabel =
    mode === 'decline'
      ? 'Decline'
      : mode === 'cancel'
        ? 'Cancel request'
        : person.isGuest
          ? 'Remove guest'
          : 'Remove friend';

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      accessibilityLabel={title}
    >
      <View style={styles.header}>
        <Avatar
          id={person.id}
          name={person.displayName}
          uri={person.avatarUri}
          presetId={person.avatarId}
          size={56}
          isGuest={person.isGuest}
        />

        <View style={styles.meta}>
          <View style={styles.titleLine}>
            <Text style={styles.name} numberOfLines={2}>
              {person.displayName}
            </Text>
            {person.isGuest ? <Badge label="Guest" variant="tag" size="sm" /> : null}
          </View>
          {handle ? <Text style={styles.username}>{handle}</Text> : null}
        </View>
      </View>

      {isBlocked ? (
        <View style={styles.blockedBox}>
          <View style={styles.blockedHeader}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.expense} />
            <Text style={styles.blockedTitle}>Unsettled split obligations</Text>
          </View>
          <Text style={styles.blockedReason}>
            {serverBlocked?.message
              || preflightCheck.reason
              || `You have unsettled split balances of ${formatINR(preflightCheck.unsettledAmount)} with ${person.displayName}.`}
          </Text>

          <View style={styles.blockedActions}>
            {onNavigateToSplits ? (
              <PrimaryButton
                title="View in Splits"
                icon="people-outline"
                size="md"
                onPress={() => {
                  onClose();
                  onNavigateToSplits();
                }}
              />
            ) : null}
            <PrimaryButton
              title="Close"
              variant="secondary"
              size="md"
              onPress={onClose}
            />
          </View>
        </View>
      ) : (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmDescription}>{description}</Text>

          {submitError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.expense} />
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            <PrimaryButton
              title="Cancel"
              variant="secondary"
              size="md"
              disabled={busy}
              onPress={onClose}
              style={styles.flexButton}
            />
            <PrimaryButton
              title={confirmLabel}
              variant="danger"
              size="md"
              icon="trash-outline"
              loading={busy}
              onPress={() => void handleConfirm()}
              style={styles.flexButton}
            />
          </View>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  name: {
    ...typography.h3,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  username: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  blockedBox: {
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    marginBottom: spacing.sm,
  },
  blockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  blockedTitle: {
    ...typography.bodySemibold,
    color: colors.expense,
  },
  blockedReason: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  blockedActions: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  confirmBox: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  confirmTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  confirmDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerSoft,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  errorText: {
    ...typography.caption,
    color: colors.expense,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
});

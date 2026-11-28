import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FRIENDS_CONFIG } from '../config/friendsConfig';
import { formatHandle, isGuestOwnedByUser, sanitizeDisplayText } from '../services/friendsStore';
import { colors, layout, radius, spacing, typography } from '../theme';
import type { Friendship } from '../types/friends';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { BottomSheet } from './BottomSheet';
import { GroupedDivider, GroupedList } from './GroupedList';

interface PersonSheetProps {
  visible: boolean;
  friendship: Friendship | null;
  currentOwnerId?: string | null;
  onClose: () => void;
  onViewSplits?: () => void;
  onEditAvatar?: (friendship: Friendship) => void;
  onRemove: (friendship: Friendship) => void;
  returnFocusRef?: React.RefObject<any>;
}

export function PersonSheet({
  visible,
  friendship,
  currentOwnerId,
  onClose,
  onViewSplits,
  onEditAvatar,
  onRemove,
  returnFocusRef,
}: PersonSheetProps) {
  if (!friendship) return null;

  const { person } = friendship;
  const safeName = sanitizeDisplayText(person.displayName) || 'Expensio user';
  const handle = formatHandle(person.username);
  const canEditAvatar =
    Boolean(onEditAvatar)
    && FRIENDS_CONFIG.ENABLE_GUEST_AVATAR_EDIT
    && isGuestOwnedByUser(friendship, currentOwnerId);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      accessibilityLabel={`Options for ${safeName}`}
    >
      <View style={styles.hero}>
        <Avatar
          id={person.id}
          name={safeName}
          uri={person.avatarUri}
          presetId={person.avatarId}
          size={72}
          isGuest={person.isGuest}
        />
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={2}>
            {safeName}
          </Text>
          {person.isGuest ? <Badge label="Guest" variant="tag" size="sm" /> : null}
        </View>
        {handle ? <Text style={styles.handle}>{handle}</Text> : null}
      </View>

      <GroupedList style={styles.actionsCard}>
        {onViewSplits ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View splits with ${safeName}`}
            onPress={() => {
              onClose();
              onViewSplits();
            }}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          >
            <View style={styles.iconTile}>
              <Ionicons name="receipt-outline" size={20} color={colors.accent} />
            </View>
            <Text style={styles.actionLabel}>View splits</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>
        ) : null}

        {canEditAvatar ? (
          <>
            {onViewSplits ? <GroupedDivider inset={layout.rowDividerInset} /> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${safeName}'s avatar`}
              onPress={() => {
                onClose();
                onEditAvatar?.(friendship);
              }}
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
            >
              <View style={styles.iconTile}>
                <Ionicons name="color-palette-outline" size={20} color={colors.accent} />
              </View>
              <Text style={styles.actionLabel}>Edit avatar</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </Pressable>
          </>
        ) : null}

        {(onViewSplits || canEditAvatar) ? <GroupedDivider inset={layout.rowDividerInset} /> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${safeName}`}
          onPress={() => {
            onClose();
            onRemove(friendship);
          }}
          style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
        >
          <View style={[styles.iconTile, styles.dangerIconTile]}>
            <Ionicons name="trash-outline" size={20} color={colors.expense} />
          </View>
          <Text style={styles.dangerLabel}>
            {person.isGuest ? 'Remove guest' : 'Remove friend'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </Pressable>
      </GroupedList>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  handle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actionsCard: {
    marginBottom: spacing.sm,
  },
  actionRow: {
    minHeight: layout.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: layout.cardPadding,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerIconTile: {
    backgroundColor: colors.dangerSoft,
  },
  actionLabel: {
    ...typography.rowTitle,
    color: colors.textPrimary,
    flex: 1,
  },
  dangerLabel: {
    ...typography.rowTitle,
    color: colors.expense,
    flex: 1,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
});

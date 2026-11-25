import React from 'react';
import { FRIENDS_CONFIG } from '../config/friendsConfig';
import { isGuestOwnedByUser } from '../services/friendsStore';
import type { Friendship, UpdateGuestAvatarInput } from '../types/friends';
import { AvatarPickerBottomSheet } from './AvatarPickerBottomSheet';

interface Props {
  visible: boolean;
  friendship: Friendship | null;
  currentOwnerId?: string | null;
  onClose: () => void;
  onSaveAvatar: (guestId: string, payload: UpdateGuestAvatarInput | string) => Promise<void>;
  loading?: boolean;
}

export function GuestEditorSheet({
  visible,
  friendship,
  currentOwnerId,
  onClose,
  onSaveAvatar,
}: Props) {
  if (!friendship) return null;

  const canEdit =
    FRIENDS_CONFIG.ENABLE_GUEST_AVATAR_EDIT
    && isGuestOwnedByUser(friendship, currentOwnerId);

  if (!canEdit) return null;

  return (
    <AvatarPickerBottomSheet
      visible={visible}
      selectedAvatarId={friendship.person.avatarId}
      title="Choose guest avatar"
      confirmLabel="Save guest avatar"
      showNames={false}
      onSelect={(avatarId) => {
        void onSaveAvatar(friendship.person.id, { avatarId });
        onClose();
      }}
      onClose={onClose}
    />
  );
}

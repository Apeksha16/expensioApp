export interface ProfileAvatar {
  id: string;
  emoji: string;
  backgroundColor: string;
}

export const profileAvatars: readonly ProfileAvatar[] = [
  { id: 'sunny', emoji: '😊', backgroundColor: '#FFE5A8' },
  { id: 'fox', emoji: '🦊', backgroundColor: '#FFD4B8' },
  { id: 'panda', emoji: '🐼', backgroundColor: '#DDE8F4' },
  { id: 'frog', emoji: '🐸', backgroundColor: '#D9F0C7' },
  { id: 'bear', emoji: '🐻', backgroundColor: '#E8D4C1' },
  { id: 'cat', emoji: '😺', backgroundColor: '#F6D6E4' },
  { id: 'koala', emoji: '🐨', backgroundColor: '#DEE2E8' },
  { id: 'unicorn', emoji: '🦄', backgroundColor: '#E8D9FA' },
];

export const DEFAULT_AVATAR_ID = profileAvatars[0].id;

export function getProfileAvatar(avatarId: string | null | undefined): ProfileAvatar {
  return profileAvatars.find((avatar) => avatar.id === avatarId) ?? profileAvatars[0];
}

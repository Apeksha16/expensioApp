import { CARTOON_AVATARS, type CartoonAvatarMeta } from '../components/CartoonAvatar';

export type ProfileAvatar = CartoonAvatarMeta;

export const profileAvatars: readonly ProfileAvatar[] = CARTOON_AVATARS;

export const DEFAULT_AVATAR_ID = CARTOON_AVATARS[0]?.id || 'oliver';

export function getProfileAvatar(avatarId: string | null | undefined): ProfileAvatar {
  return profileAvatars.find((avatar) => avatar.id === avatarId) ?? profileAvatars[0];
}

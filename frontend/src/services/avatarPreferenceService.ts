import { profileAvatars } from '../data/avatars';
import { getLocalPreferences, updateLocalPreferences } from './modulePreferenceService';

export interface AvatarPreferenceService {
  getSelectedAvatarId(ownerId?: string | null): Promise<string | null>;
  saveSelectedAvatarId(avatarId: string | null, ownerId?: string | null): Promise<string | null>;
}

export const avatarPreferenceService: AvatarPreferenceService = {
  async getSelectedAvatarId(ownerId) {
    const preferences = await getLocalPreferences(ownerId);
    return preferences.avatarId;
  },
  async saveSelectedAvatarId(avatarId, ownerId) {
    if (avatarId !== null && !profileAvatars.some((avatar) => avatar.id === avatarId)) {
      throw new Error('Choose an available profile avatar.');
    }
    const updated = await updateLocalPreferences({ avatarId }, ownerId);
    return updated.avatarId;
  },
};

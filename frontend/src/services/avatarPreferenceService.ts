import { profileAvatars } from '../data/avatars';
import { getLocalPreferences, updateLocalPreferences } from './modulePreferenceService';

export interface AvatarPreferenceService {
  getSelectedAvatarId(): Promise<string | null>;
  saveSelectedAvatarId(avatarId: string | null): Promise<string | null>;
}

export const avatarPreferenceService: AvatarPreferenceService = {
  async getSelectedAvatarId() {
    const preferences = await getLocalPreferences();
    return preferences.avatarId;
  },
  async saveSelectedAvatarId(avatarId) {
    if (avatarId !== null && !profileAvatars.some((avatar) => avatar.id === avatarId)) {
      throw new Error('Choose an available profile avatar.');
    }
    const updated = await updateLocalPreferences({ avatarId });
    return updated.avatarId;
  },
};

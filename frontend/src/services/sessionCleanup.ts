import { DEFAULT_PREFERRED_MODULE_IDS } from '../data/modules';
import type { ValidatedLocalPreferences } from './modulePreferenceService';
import { clearSession } from '../core/storage/session';
import { removeValue, STORAGE_KEYS } from '../core/storage/localPersistence';
import { clearFriendsCache } from './api/friendsApi';
import { onboardingApi } from './api/onboardingApi';
import { clearPendingAuthState, purgeLegacyInsecureAuthKeys } from './authApi';
import { onboardingDraftService } from './onboardingDraftService';

export function createDefaultPreferences(): ValidatedLocalPreferences {
  return {
    preferredModuleIds: [...DEFAULT_PREFERRED_MODULE_IDS],
    preferredModuleOrder: DEFAULT_PREFERRED_MODULE_IDS.map((id, displayOrder) => ({ id, displayOrder })),
    avatarId: null,
    reportFrequency: 'monthly',
    reportsEnabled: false,
    reportDayOfWeek: 1,
    reportDayOfMonth: 1,
    reportEmail: '',
  };
}

export async function clearPersistedUserSession(options: {
  ownerId?: string | null;
  email?: string | null;
  phone?: string | null;
}): Promise<void> {
  clearPendingAuthState();
  onboardingApi.clearCache();
  await Promise.allSettled([
    clearSession(),
    clearFriendsCache(options.ownerId),
    onboardingDraftService.clearDraft(options.ownerId),
    removeValue(STORAGE_KEYS.emailVerification),
    purgeLegacyInsecureAuthKeys(options.email, options.phone),
  ]);
}

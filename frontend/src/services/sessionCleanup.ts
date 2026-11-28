import { DEFAULT_PREFERRED_MODULE_IDS } from '../data/modules';
import type { ValidatedLocalPreferences } from './modulePreferenceService';
import { clearSession } from '../core/storage/session';
import {
  listAppStorageKeys,
  removeAppStorageKeys,
  removeSecureValue,
  removeValue,
  sanitizeStorageKey,
  STORAGE_KEYS,
} from '../core/storage/localPersistence';
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

function buildOwnerScopedKeys(ownerId?: string | null): string[] {
  if (!ownerId) return [];
  const clean = sanitizeStorageKey(ownerId.trim().toLowerCase());
  return [
    `${STORAGE_KEYS.localDataAccountPrefix}${clean}`,
    `${STORAGE_KEYS.profileAccountPrefix}${clean}`,
    `${STORAGE_KEYS.splitGroupsAccountPrefix}${clean}`,
    `${STORAGE_KEYS.modulePreferencesAccountPrefix}${clean}`,
    `${STORAGE_KEYS.avatarAccountPrefix}${clean}`,
    `${STORAGE_KEYS.reportPreferencesAccountPrefix}${clean}`,
    `${STORAGE_KEYS.onboardingDraftAccountPrefix}${clean}`,
    `${STORAGE_KEYS.friendshipsAccountPrefix}${clean}`,
    `${STORAGE_KEYS.friendshipsAccountPrefix}cache_${clean}`,
  ];
}

const UNSCOPED_USER_KEYS: string[] = [
  STORAGE_KEYS.localData,
  STORAGE_KEYS.profile,
  STORAGE_KEYS.splitGroups,
  STORAGE_KEYS.modulePreferences,
  STORAGE_KEYS.avatar,
  STORAGE_KEYS.reportPreferences,
  STORAGE_KEYS.legacyPreferences,
  STORAGE_KEYS.onboardingDraft,
  STORAGE_KEYS.emailVerification,
  STORAGE_KEYS.pendingVerification,
  STORAGE_KEYS.friendships,
  `${STORAGE_KEYS.friendships}_cache`,
];

export async function clearPersistedUserSession(options: {
  ownerId?: string | null;
  email?: string | null;
  phone?: string | null;
}): Promise<void> {
  clearPendingAuthState();
  onboardingApi.clearCache();

  const scopedKeys = buildOwnerScopedKeys(options.ownerId);
  const allAppKeys = await listAppStorageKeys().catch(() => []);
  const cleanOwner = options.ownerId ? sanitizeStorageKey(options.ownerId.trim().toLowerCase()) : null;
  const matchingDynamicKeys = cleanOwner
    ? allAppKeys.filter((key) => key.endsWith(`_${cleanOwner}`) || key === cleanOwner)
    : [];

  const keysToRemove = Array.from(new Set([...scopedKeys, ...UNSCOPED_USER_KEYS, ...matchingDynamicKeys]));

  await Promise.allSettled([
    clearSession(),
    clearFriendsCache(options.ownerId),
    onboardingDraftService.clearDraft(options.ownerId),
    removeAppStorageKeys(keysToRemove),
    ...keysToRemove.map((key) => removeValue(key)),
    ...keysToRemove.map((key) => removeSecureValue(key)),
    purgeLegacyInsecureAuthKeys(options.email, options.phone),
  ]);
}

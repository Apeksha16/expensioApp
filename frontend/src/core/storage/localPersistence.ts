import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const STORAGE_KEYS = {
  session: 'expensio_session',
  legacyPreferences: 'expensio_local_preferences',
  profile: 'expensio_profile',
  profileAccountPrefix: 'expensio_profile_account_',
  avatar: 'expensio_avatar',
  modulePreferences: 'expensio_module_preferences',
  modulePreferencesAccountPrefix: 'expensio_module_preferences_account_',
  reportPreferences: 'expensio_report_preferences',
  reportPreferencesAccountPrefix: 'expensio_report_preferences_account_',
  avatarAccountPrefix: 'expensio_avatar_account_',
  emailVerification: 'expensio_email_verification',
  onboardingDraft: 'expensio_onboarding_draft',
  onboardingDraftAccountPrefix: 'expensio_onboarding_draft_account_',
  localData: 'expensio_local_data',
  localDataAccountPrefix: 'expensio_local_data_account_',
  splitGroups: 'expensio_split_groups',
  splitGroupsAccountPrefix: 'expensio_split_groups_account_',
  friendships: 'expensio_friendships',
  friendshipsAccountPrefix: 'expensio_friendships_account_',
  localAccountPrefix: 'expensio_local_account_',
  localAccountByPhonePrefix: 'expensio_local_account_phone_',
  localOtpPrefix: 'expensio_local_otp_',
} as const;

export interface KeyValueStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  getAllKeys?(): Promise<readonly string[]>;
  multiRemove?(keys: string[]): Promise<void>;
}

export class CorruptStoredDataError extends Error {
  constructor(key: string) {
    super(`Saved local data for "${key}" is unreadable.`);
    this.name = 'CorruptStoredDataError';
  }
}

export function sanitizeStorageKey(key: string): string {
  // Expo SecureStore keys must only contain alphanumeric, '.', '-', and '_'
  return key.replace(/[^a-zA-Z0-9.\-_]/g, '_') || 'default_key';
}

// Web tokens must never be persisted to localStorage (XSS exposure).
// On web, session storage is strictly in-memory; persistent secure keychain storage is native-only.
const webMemorySecureMap = new Map<string, string>();

const defaultSecureStorageAdapter: KeyValueStorage = Platform.OS === 'web'
  ? {
    async get(key) {
      return webMemorySecureMap.has(key) ? webMemorySecureMap.get(key)! : null;
    },
    async set(key, value) {
      webMemorySecureMap.set(key, value);
    },
    async remove(key) {
      webMemorySecureMap.delete(key);
    },
  }
  : {
    get: (key) => SecureStore.getItemAsync(sanitizeStorageKey(key)),
    set: (key, value) => SecureStore.setItemAsync(sanitizeStorageKey(key), value),
    remove: (key) => SecureStore.deleteItemAsync(sanitizeStorageKey(key)),
  };

const defaultAppStorageAdapter: KeyValueStorage = {
  get: (key) => AsyncStorage.getItem(sanitizeStorageKey(key)),
  set: (key, value) => AsyncStorage.setItem(sanitizeStorageKey(key), value),
  remove: (key) => AsyncStorage.removeItem(sanitizeStorageKey(key)),
  getAllKeys: () => AsyncStorage.getAllKeys(),
  multiRemove: (keys) => AsyncStorage.multiRemove(keys),
};

let secureStorage: KeyValueStorage = defaultSecureStorageAdapter;
let appStorage: KeyValueStorage = defaultAppStorageAdapter;

export function configureLocalStorage(adapter: KeyValueStorage): void {
  appStorage = adapter;
}

export function configureSecureStorage(adapter: KeyValueStorage): void {
  secureStorage = adapter;
}

export function readText(key: string): Promise<string | null> {
  return appStorage.get(key);
}

export async function writeText(key: string, value: string): Promise<void> {
  if (await appStorage.get(key) === value) return;
  await appStorage.set(key, value);
}

export function removeValue(key: string): Promise<void> {
  return appStorage.remove(key);
}

export async function readJson<T>(key: string): Promise<T | null> {
  const raw = await readText(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new CorruptStoredDataError(key);
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  await writeText(key, JSON.stringify(value));
}

export async function listAppStorageKeys(): Promise<string[]> {
  if (typeof appStorage.getAllKeys === 'function') {
    const keys = await appStorage.getAllKeys();
    return [...keys];
  }
  return [];
}

export async function removeAppStorageKeys(keys: string[]): Promise<void> {
  if (!keys.length) return;
  if (typeof appStorage.multiRemove === 'function') {
    await appStorage.multiRemove(keys);
    return;
  }
  await Promise.allSettled(keys.map((key) => appStorage.remove(key)));
}

export async function readSecureJson<T>(key: string): Promise<T | null> {
  const raw = await secureStorage.get(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new CorruptStoredDataError(key);
  }
}

export async function writeSecureJson(key: string, value: unknown): Promise<void> {
  const serialized = JSON.stringify(value);
  if (await secureStorage.get(key) === serialized) return;
  await secureStorage.set(key, serialized);
}

export function removeSecureValue(key: string): Promise<void> {
  return secureStorage.remove(key);
}

function buildBulkMigrationKeys(ownerId?: string | null): string[] {
  const keys: string[] = [
    STORAGE_KEYS.legacyPreferences,
    STORAGE_KEYS.profile,
    STORAGE_KEYS.avatar,
    STORAGE_KEYS.modulePreferences,
    STORAGE_KEYS.reportPreferences,
    STORAGE_KEYS.emailVerification,
    STORAGE_KEYS.onboardingDraft,
    STORAGE_KEYS.localData,
    STORAGE_KEYS.splitGroups,
    STORAGE_KEYS.friendships,
    `${STORAGE_KEYS.friendships}_cache`,
  ];
  if (ownerId) {
    const clean = sanitizeStorageKey(ownerId.trim().toLowerCase());
    keys.push(
      `${STORAGE_KEYS.profileAccountPrefix}${clean}`,
      `${STORAGE_KEYS.avatarAccountPrefix}${clean}`,
      `${STORAGE_KEYS.modulePreferencesAccountPrefix}${clean}`,
      `${STORAGE_KEYS.reportPreferencesAccountPrefix}${clean}`,
      `${STORAGE_KEYS.onboardingDraftAccountPrefix}${clean}`,
      `${STORAGE_KEYS.localDataAccountPrefix}${clean}`,
      `${STORAGE_KEYS.splitGroupsAccountPrefix}${clean}`,
      `${STORAGE_KEYS.friendshipsAccountPrefix}${clean}`,
      `${STORAGE_KEYS.friendshipsAccountPrefix}cache_${clean}`,
    );
  }
  return keys;
}

/**
 * One-time, crash-safe, idempotent migration of bulk app data out of SecureStore
 * into AsyncStorage. Verifies the target write before deleting the old SecureStore entry.
 */
export async function migrateLegacySecureStoreKeys(ownerId?: string | null): Promise<void> {
  if (Platform.OS === 'web') return;
  const candidateKeys = buildBulkMigrationKeys(ownerId);
  for (const key of candidateKeys) {
    try {
      const secureVal = await secureStorage.get(key);
      if (secureVal === null) continue;

      const existingAppVal = await appStorage.get(key);
      if (existingAppVal === null) {
        await appStorage.set(key, secureVal);
        const verified = await appStorage.get(key);
        if (verified !== secureVal) continue;
      }
      await secureStorage.remove(key);
    } catch {
      // Leave SecureStore entry intact if migration fails partway so next boot retries safely
    }
  }
}

import * as SecureStore from 'expo-secure-store';

export const STORAGE_KEYS = {
  session: 'expensio_session',
  legacyPreferences: 'expensio_local_preferences',
  profile: 'expensio_profile',
  avatar: 'expensio_avatar',
  modulePreferences: 'expensio_module_preferences',
  reportPreferences: 'expensio_report_preferences',
  emailVerification: 'expensio_email_verification',
  localData: 'expensio_local_data',
  localAccountPrefix: 'expensio_local_account_',
  localAccountByPhonePrefix: 'expensio_local_account_phone_',
  localOtpPrefix: 'expensio_local_otp_',
} as const;

export interface KeyValueStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export class CorruptStoredDataError extends Error {
  constructor(key: string) {
    super(`Saved local data for "${key}" is unreadable.`);
    this.name = 'CorruptStoredDataError';
  }
}

const secureStoreAdapter: KeyValueStorage = {
  get: (key) => SecureStore.getItemAsync(key),
  set: (key, value) => SecureStore.setItemAsync(key, value),
  remove: (key) => SecureStore.deleteItemAsync(key),
};

let storage: KeyValueStorage = secureStoreAdapter;

export function configureLocalStorage(adapter: KeyValueStorage): void {
  storage = adapter;
}

export function readText(key: string): Promise<string | null> {
  return storage.get(key);
}

export async function writeText(key: string, value: string): Promise<void> {
  if (await storage.get(key) === value) return;
  await storage.set(key, value);
}

export function removeValue(key: string): Promise<void> {
  return storage.remove(key);
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

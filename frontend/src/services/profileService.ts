import { CorruptStoredDataError, readJson, removeValue, STORAGE_KEYS, writeJson } from '../core/storage/localPersistence';

export interface ProfileRecord {
  firstName: string;
  lastName: string;
  mobile: string;
  countryCode: string;
  email: string;
}

export interface ProfileService {
  getProfile(ownerId?: string | null): Promise<ProfileRecord>;
  saveProfile(profile: ProfileRecord, ownerId?: string | null): Promise<ProfileRecord>;
  updateProfile(changes: Partial<ProfileRecord>, ownerId?: string | null): Promise<ProfileRecord>;
}

const EMPTY_PROFILE: ProfileRecord = {
  firstName: '',
  lastName: '',
  mobile: '',
  countryCode: '+91',
  email: '',
};

function isProfileRecord(value: unknown): value is ProfileRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.firstName === 'string'
    && typeof record.lastName === 'string'
    && typeof record.mobile === 'string'
    && typeof record.countryCode === 'string'
    && typeof record.email === 'string';
}

function normalizeProfile(profile: ProfileRecord): ProfileRecord {
  return {
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    mobile: profile.mobile.trim(),
    countryCode: profile.countryCode.trim() || '+91',
    email: profile.email.trim().toLowerCase(),
  };
}

function profileKey(ownerId?: string | null): string {
  return ownerId
    ? `${STORAGE_KEYS.profileAccountPrefix}${encodeURIComponent(ownerId.trim().toLowerCase())}`
    : STORAGE_KEYS.profile;
}

async function getLocalProfile(ownerId?: string | null): Promise<ProfileRecord> {
  const key = profileKey(ownerId);
  let stored: unknown;
  try {
    stored = await readJson<unknown>(key);
  } catch (error) {
    if (!(error instanceof CorruptStoredDataError)) throw error;
    await removeValue(key);
    return EMPTY_PROFILE;
  }
  if (stored === null) {
    if (ownerId) {
      try {
        const legacy = await readJson<unknown>(STORAGE_KEYS.profile);
        if (legacy !== null && isProfileRecord(legacy)) {
          await writeJson(key, normalizeProfile(legacy));
          await removeValue(STORAGE_KEYS.profile);
          return normalizeProfile(legacy);
        }
      } catch (error) {
        if (!(error instanceof CorruptStoredDataError)) throw error;
        await removeValue(STORAGE_KEYS.profile);
      }
    }
    return EMPTY_PROFILE;
  }
  if (!isProfileRecord(stored)) {
    await removeValue(key);
    return EMPTY_PROFILE;
  }
  return normalizeProfile(stored);
}

async function saveLocalProfile(profile: ProfileRecord, ownerId?: string | null): Promise<ProfileRecord> {
  const normalized = normalizeProfile(profile);
  await writeJson(profileKey(ownerId), normalized);
  return normalized;
}

async function updateLocalProfile(changes: Partial<ProfileRecord>, ownerId?: string | null): Promise<ProfileRecord> {
  const current = await getLocalProfile(ownerId);
  return saveLocalProfile({ ...current, ...changes }, ownerId);
}

export const profileService: ProfileService = {
  getProfile: getLocalProfile,
  saveProfile: saveLocalProfile,
  updateProfile: updateLocalProfile,
};

import { CorruptStoredDataError, readJson, removeValue, STORAGE_KEYS, writeJson } from '../core/storage/localPersistence';

export interface ProfileRecord {
  firstName: string;
  lastName: string;
  mobile: string;
  countryCode: string;
  email: string;
}

export interface ProfileService {
  getProfile(): Promise<ProfileRecord>;
  saveProfile(profile: ProfileRecord): Promise<ProfileRecord>;
  updateProfile(changes: Partial<ProfileRecord>): Promise<ProfileRecord>;
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

async function getLocalProfile(): Promise<ProfileRecord> {
  let stored: unknown;
  try {
    stored = await readJson<unknown>(STORAGE_KEYS.profile);
  } catch (error) {
    if (!(error instanceof CorruptStoredDataError)) throw error;
    await removeValue(STORAGE_KEYS.profile);
    return EMPTY_PROFILE;
  }
  if (stored === null) return EMPTY_PROFILE;
  if (!isProfileRecord(stored)) {
    await removeValue(STORAGE_KEYS.profile);
    return EMPTY_PROFILE;
  }
  return normalizeProfile(stored);
}

async function saveLocalProfile(profile: ProfileRecord): Promise<ProfileRecord> {
  const normalized = normalizeProfile(profile);
  await writeJson(STORAGE_KEYS.profile, normalized);
  return normalized;
}

async function updateLocalProfile(changes: Partial<ProfileRecord>): Promise<ProfileRecord> {
  const current = await getLocalProfile();
  return saveLocalProfile({ ...current, ...changes });
}

export const profileService: ProfileService = {
  getProfile: getLocalProfile,
  saveProfile: saveLocalProfile,
  updateProfile: updateLocalProfile,
};

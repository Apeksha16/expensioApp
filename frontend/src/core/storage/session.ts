import { CorruptStoredDataError, readJson, removeValue, STORAGE_KEYS, writeJson } from './localPersistence';

export interface StoredSession {
  accessToken: string;
  refreshToken?: string;
  user?: Record<string, unknown>;
  isProfileComplete: boolean;
  onboardingDraft?: Record<string, unknown>;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  onboardingStep?: number;
}

export async function readSession(): Promise<StoredSession | null> {
  let parsed: unknown;
  try {
    parsed = await readJson<unknown>(STORAGE_KEYS.session);
  } catch (error) {
    if (!(error instanceof CorruptStoredDataError)) throw error;
    await clearSession();
    return null;
  }
  if (parsed === null) return null;
  if (
    typeof parsed === 'object'
    && parsed !== null
    && 'accessToken' in parsed
    && typeof parsed.accessToken === 'string'
    && parsed.accessToken
  ) return parsed as StoredSession;
  else {
    await clearSession();
    return null;
  }
}

export function writeSession(session: StoredSession): Promise<void> {
  return writeJson(STORAGE_KEYS.session, session);
}

export function clearSession(): Promise<void> {
  return removeValue(STORAGE_KEYS.session);
}

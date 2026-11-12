import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'expensio_session';

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
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed.accessToken ? parsed : null;
  } catch {
    await clearSession();
    return null;
  }
}

export function writeSession(session: StoredSession): Promise<void> {
  return SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): Promise<void> {
  return SecureStore.deleteItemAsync(SESSION_KEY);
}

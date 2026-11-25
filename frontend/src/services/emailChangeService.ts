import { CorruptStoredDataError, readJson, removeValue, STORAGE_KEYS, writeJson } from '../core/storage/localPersistence';
import { verificationApi } from './api/verificationApi';

export const EMAIL_CHANGE_OTP_LIFETIME_MS = 5 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface StoredEmailChangeChallenge {
  email: string;
  challengeId: string;
  expiresAt: number;
}

export interface EmailVerificationService {
  requestCode(email: string): Promise<{ expiresAt: number; resendCooldownSeconds?: number }>;
  verifyCode(email: string, otp: string): Promise<void>;
  complete(): Promise<void>;
  cancel(): Promise<void>;
}

export const emailVerificationService: EmailVerificationService = {
  async requestCode(email) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) throw new Error('Enter a valid email address.');

    const res = await verificationApi.startEmailVerification({ email: normalizedEmail });
    const challengeId = res.data?.challengeId || '';
    const expiresAt = Date.now() + (res.data?.expiresInSeconds ? res.data.expiresInSeconds * 1000 : EMAIL_CHANGE_OTP_LIFETIME_MS);
    const record: StoredEmailChangeChallenge = { email: normalizedEmail, challengeId, expiresAt };
    await writeJson(STORAGE_KEYS.emailVerification, record);
    return {
      expiresAt,
      resendCooldownSeconds: res.data?.resendCooldownSeconds,
    };
  },

  async verifyCode(email, otp) {
    let parsed: unknown;
    try {
      parsed = await readJson<unknown>(STORAGE_KEYS.emailVerification);
    } catch (error) {
      if (!(error instanceof CorruptStoredDataError)) throw error;
      await removeValue(STORAGE_KEYS.emailVerification);
      throw new Error('Saved verification data is unreadable. Request a new code.');
    }
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Request a verification code to continue.');
    }

    const record = parsed as Partial<StoredEmailChangeChallenge>;
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) throw new Error('Enter a valid email address.');
    if (record.email !== normalizedEmail) throw new Error('This code was issued for a different email address.');
    if (typeof record.expiresAt === 'number' && Date.now() >= record.expiresAt) {
      await removeValue(STORAGE_KEYS.emailVerification);
      throw new Error('This code has expired. Request a new one.');
    }

    await verificationApi.verifyEmail({
      email: normalizedEmail,
      challengeId: record.challengeId,
      otp,
    });
  },

  complete: () => removeValue(STORAGE_KEYS.emailVerification),
  cancel: () => removeValue(STORAGE_KEYS.emailVerification),
};

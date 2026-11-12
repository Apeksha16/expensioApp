import { CorruptStoredDataError, readJson, removeValue, STORAGE_KEYS, writeJson } from '../core/storage/localPersistence';

export const EMAIL_CHANGE_OTP_LIFETIME_MS = 5 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface StoredEmailChangeOtp {
  email: string;
  code: string;
  expiresAt: number;
}

export interface EmailVerificationService {
  requestCode(email: string): Promise<{ developmentOtp: string; expiresAt: number }>;
  verifyCode(email: string, otp: string): Promise<void>;
  complete(): Promise<void>;
  cancel(): Promise<void>;
}

export const emailVerificationService: EmailVerificationService = {
  async requestCode(email) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) throw new Error('Enter a valid email address.');
    const developmentOtp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + EMAIL_CHANGE_OTP_LIFETIME_MS;
    const record: StoredEmailChangeOtp = { email: normalizedEmail, code: developmentOtp, expiresAt };
    await writeJson(STORAGE_KEYS.emailVerification, record);
    return { developmentOtp, expiresAt };
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
    if (!parsed) throw new Error('Request a verification code to continue.');
    if (
      typeof parsed !== 'object'
      || !('email' in parsed)
      || typeof parsed.email !== 'string'
      || !('code' in parsed)
      || typeof parsed.code !== 'string'
      || !('expiresAt' in parsed)
      || typeof parsed.expiresAt !== 'number'
    ) {
      await removeValue(STORAGE_KEYS.emailVerification);
      throw new Error('Saved verification data is invalid. Request a new code.');
    }

    const record = parsed as StoredEmailChangeOtp;
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) throw new Error('Enter a valid email address.');
    if (record.email !== normalizedEmail) throw new Error('This code was issued for a different email address.');
    if (Date.now() >= record.expiresAt) {
      await removeValue(STORAGE_KEYS.emailVerification);
      throw new Error('This code has expired. Request a new one.');
    }
    if (record.code !== otp) throw new Error('That code did not match. Try again.');
  },
  complete: () => removeValue(STORAGE_KEYS.emailVerification),
  cancel: () => removeValue(STORAGE_KEYS.emailVerification),
};

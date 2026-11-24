import { readSession } from '../core/storage/session';
import {
  CorruptStoredDataError,
  readJson,
  removeValue,
  STORAGE_KEYS,
  writeJson,
} from '../core/storage/localPersistence';
import { authApi } from './api/authApi';
import { verificationApi } from './api/verificationApi';
import { onboardingApi } from './api/onboardingApi';
import { ApiError } from './api/apiClient';

export interface AuthUser {
  id?: string;
  name?: string;
  username?: string;
  phone?: string;
  email?: string;
  salary?: number;
  incomeAmountMinor?: string;
  cashBalanceMinor?: string;
  savingsAmountMinor?: string;
  avatarId?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  tokenType?: string;
  onboardingStatus?: string;
  user?: AuthUser;
  isProfileComplete?: boolean;
  error?: string;
  message?: string;
  requiresVerification?: 'email' | 'phone';
  verifiedChannel?: 'email' | 'phone';
  debugOtp?: string;
  nextStep?: 'dashboard' | 'onboarding' | 'profile' | 'employment' | 'financial' | 'review' | 'verify_email' | 'verify_phone';
}

export interface CompleteOnboardingInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employmentType: 'salaried' | 'business' | 'student' | 'retired' | 'homemaker' | string;
  incomeAmountMinor: string;
  cashBalanceMinor: string;
  savingsAmountMinor?: string;
  currency?: string;
  avatarId?: string;
}

interface LocalAccount {
  email: string;
  password: string;
  user: AuthUser;
  isProfileComplete: boolean;
}

interface LocalOtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

export const LOCAL_OTP_LIFETIME_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

// In-memory cache for backend challenge IDs between start and verify steps
const activeChallenges: Record<string, string> = {};
// In-memory cache for credentials during email registration to auto-login after OTP verification
const pendingEmailCredentials: Record<string, { email: string; password: string; name?: string }> = {};

function accountKey(email: string) {
  return `${STORAGE_KEYS.localAccountPrefix}${email.trim().toLowerCase().replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
}

function otpKey(channel: 'phone' | 'email', target: string) {
  return `${STORAGE_KEYS.localOtpPrefix}${channel}_${target.trim().toLowerCase().replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
}

function phoneAccountKey(phone: string) {
  return `${STORAGE_KEYS.localAccountByPhonePrefix}${phone.trim().replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
}

function localToken() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createResponse(
  user: AuthUser,
  options: Pick<AuthResponse, 'isProfileComplete' | 'verifiedChannel'> = {},
): AuthResponse {
  return {
    success: true,
    token: localToken(),
    user,
    isProfileComplete: options.isProfileComplete ?? false,
    verifiedChannel: options.verifiedChannel,
  };
}

async function saveLocalAccount(account: LocalAccount) {
  if (!account.email) return;
  await writeJson(accountKey(account.email), account);
}

async function readLocalAccount(email: string): Promise<LocalAccount | null> {
  return readAccount(accountKey(email));
}

async function readAccount(key: string): Promise<LocalAccount | null> {
  let account: unknown;
  try {
    account = await readJson<unknown>(key);
  } catch (error) {
    if (!(error instanceof CorruptStoredDataError)) throw error;
    await removeValue(key);
    throw new Error('Saved local account data is unreadable.');
  }
  if (account === null) return null;
  if (
    typeof account !== 'object' ||
    account === null ||
    !('email' in account) ||
    typeof account.email !== 'string' ||
    !('password' in account) ||
    typeof account.password !== 'string' ||
    !('user' in account) ||
    typeof account.user !== 'object' ||
    account.user === null ||
    !('isProfileComplete' in account) ||
    typeof account.isProfileComplete !== 'boolean'
  ) {
    throw new Error('Saved local account data is invalid.');
  }
  return account as LocalAccount;
}

async function readPhoneAccount(phone: string): Promise<LocalAccount | null> {
  return readAccount(phoneAccountKey(phone));
}

export async function updateLocalAccountEmail(
  currentEmail: string,
  nextEmail: string,
  user: AuthUser,
): Promise<void> {
  const previous = currentEmail.trim().toLowerCase();
  const next = nextEmail.trim().toLowerCase();
  if (!next) throw new Error('Enter an email address.');
  if (previous === next) throw new Error('Enter a different email address.');

  const [existingAccount, targetAccount] = await Promise.all([
    previous ? readLocalAccount(previous) : (user.phone ? readPhoneAccount(user.phone) : Promise.resolve(null)),
    readLocalAccount(next),
  ]);
  if (targetAccount) throw new Error('An account already uses this email on this device.');

  const account: LocalAccount = {
    email: next,
    password: existingAccount?.password ?? '',
    user: { ...existingAccount?.user, ...user, email: next },
    isProfileComplete: existingAccount?.isProfileComplete ?? true,
  };
  const phoneKey = account.user.phone
    ? phoneAccountKey(account.user.phone)
    : null;
  try {
    await saveLocalAccount(account);
    if (phoneKey) await writeJson(phoneKey, account);
    if (previous) await removeValue(accountKey(previous));
  } catch (error) {
    await removeValue(accountKey(next));
    if (phoneKey && existingAccount) await writeJson(phoneKey, existingAccount);
    throw error;
  }
}

async function issueOtp(channel: 'phone' | 'email', target: string): Promise<AuthResponse> {
  const normalizedTarget = target.trim().toLowerCase();
  if (!normalizedTarget) throw new Error(`Enter a ${channel === 'phone' ? 'mobile number' : 'email address'} first.`);
  if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedTarget)) {
    throw new Error('Enter a valid email address.');
  }
  if (channel === 'phone' && !/^\+?\d{7,15}$/.test(normalizedTarget.replace(/[\s()-]/g, ''))) {
    throw new Error('Enter a valid mobile number.');
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + LOCAL_OTP_LIFETIME_MS;
  await writeJson(otpKey(channel, normalizedTarget), { code, expiresAt, attempts: 0 } satisfies LocalOtpRecord);
  return { success: true, debugOtp: code, message: `Development verification code expires at ${new Date(expiresAt).toLocaleTimeString()}.` };
}

async function verifyLocalOtp(
  channel: 'phone' | 'email',
  target: string,
  code: string,
): Promise<AuthResponse> {
  const normalizedTarget = target.trim().toLowerCase();
  const key = otpKey(channel, normalizedTarget);
  let stored: unknown;
  try {
    stored = await readJson<unknown>(key);
  } catch (error) {
    if (!(error instanceof CorruptStoredDataError)) throw error;
    await removeValue(key);
    throw new Error('Saved verification data is unreadable. Request a new code.');
  }
  if (
    typeof stored !== 'object'
    || stored === null
    || !('code' in stored)
    || typeof stored.code !== 'string'
    || !('expiresAt' in stored)
    || typeof stored.expiresAt !== 'number'
    || !('attempts' in stored)
    || typeof stored.attempts !== 'number'
  ) {
    if (stored !== null) await removeValue(key);
    throw new Error('Request a new verification code.');
  }
  const record = stored as LocalOtpRecord;
  if (Date.now() >= record.expiresAt) {
    await removeValue(key);
    throw new Error('This code has expired. Request a new one.');
  }
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await removeValue(key);
    throw new Error('Too many incorrect attempts. Request a new code.');
  }
  if (record.code !== code) {
    const attempts = record.attempts + 1;
    if (attempts >= MAX_OTP_ATTEMPTS) await removeValue(key);
    else await writeJson(key, { ...record, attempts });
    throw new Error('That code didn’t match. Try again.');
  }
  await removeValue(key);

  const account = channel === 'email'
    ? await readLocalAccount(normalizedTarget)
    : await readPhoneAccount(normalizedTarget);
  const user = account?.user ?? (channel === 'email'
    ? { email: normalizedTarget }
    : { phone: normalizedTarget });
  return createResponse(user, {
    isProfileComplete: account?.isProfileComplete,
    verifiedChannel: channel,
  });
}

// =============================================================================
// Live Backend Integration
// =============================================================================

export async function sendOtp(phone: string, countryCode?: string): Promise<AuthResponse & { resendCooldownSeconds?: number }> {
  const cleanPhone = phone.trim();
  const res = await authApi.mobileOtpStart({ phone: cleanPhone, countryCode });
  if (res.data?.challengeId) {
    activeChallenges[cleanPhone] = res.data.challengeId;
  }
  return {
    success: true,
    message: res.message || 'Verification code sent.',
    resendCooldownSeconds: res.data?.resendCooldownSeconds,
  };
}

export async function verifyOtp(phone: string, otp: string, countryCode?: string): Promise<AuthResponse> {
  const cleanPhone = phone.trim();
  const challengeId = activeChallenges[cleanPhone] || '';
  const res = await authApi.mobileOtpVerify({
    phone: cleanPhone,
    countryCode,
    challengeId,
    otp,
  });
  delete activeChallenges[cleanPhone];
  const isProfileComplete = res.data.isProfileComplete === true &&
    res.data.tokenType !== 'ONBOARDING' &&
    res.data.onboardingStatus !== 'PENDING_ONBOARDING';

  return {
    success: true,
    token: res.data.accessToken,
    refreshToken: res.data.refreshToken,
    tokenType: res.data.tokenType,
    onboardingStatus: res.data.onboardingStatus,
    user: {
      id: res.data.user?.id,
      name: res.data.user?.name,
      email: res.data.user?.email,
      phone: res.data.user?.phone || cleanPhone,
    },
    isProfileComplete,
    verifiedChannel: 'phone',
    message: res.message,
  };
}

export async function authenticateEmail(
  email: string,
  password: string,
  mode: 'login' | 'register',
  name?: string,
): Promise<AuthResponse> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    if (mode === 'login') {
      const res = await authApi.emailLogin({ email: normalizedEmail, password });
      const isProfileComplete = res.data.isProfileComplete === true &&
        res.data.tokenType !== 'ONBOARDING' &&
        res.data.onboardingStatus !== 'PENDING_ONBOARDING';

      return {
        success: true,
        token: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        tokenType: res.data.tokenType,
        onboardingStatus: res.data.onboardingStatus,
        user: {
          id: res.data.user?.id,
          name: res.data.user?.name,
          email: res.data.user?.email || normalizedEmail,
          phone: res.data.user?.phone,
        },
        isProfileComplete,
        verifiedChannel: 'email',
        message: res.message,
      };
    } else {
      const resolvedName = name?.trim() || normalizedEmail.split('@')[0];
      // Save pending registration credentials in memory so verifyEmailOtp can obtain session tokens
      pendingEmailCredentials[normalizedEmail] = {
        email: normalizedEmail,
        password,
        name: resolvedName,
      };

      const res = await authApi.emailSignup({ email: normalizedEmail, password, name: resolvedName });
      if (res.data?.challengeId) {
        activeChallenges[normalizedEmail] = res.data.challengeId;
      }
      return {
        success: true,
        token: localToken(),
        user: { email: normalizedEmail, name: resolvedName },
        isProfileComplete: false,
        requiresVerification: 'email',
        message: res.message,
      };
    }
  } catch (err: unknown) {
    // Fall back to local account storage if backend is unreachable
    if (err instanceof ApiError && err.isNetworkError) {
      if (mode === 'register') {
        const existing = await readLocalAccount(normalizedEmail);
        if (existing) throw new Error('A local account already exists for this email. Log in instead.');
        const account: LocalAccount = {
          email: normalizedEmail,
          password,
          user: { email: normalizedEmail, name: name?.trim() || normalizedEmail.split('@')[0] },
          isProfileComplete: false,
        };
        await saveLocalAccount(account);
        return createResponse(account.user);
      }
      const account = await readLocalAccount(normalizedEmail);
      if (!account || account.password !== password) {
        throw new Error('No matching local account. Create an account on this device first.');
      }
      return createResponse(account.user, { isProfileComplete: account.isProfileComplete });
    }
    throw err;
  }
}

export async function authenticateGoogle(idToken: string): Promise<AuthResponse> {
  try {
    const res = await authApi.googleAuth({ idToken });
    return {
      success: true,
      token: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      user: {
        id: res.data.user?.id,
        name: res.data.user?.name,
        email: res.data.user?.email,
      },
      isProfileComplete: res.data.isProfileComplete === true,
    };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.isNetworkError) {
      throw new Error('Google sign-in is unavailable while offline.');
    }
    throw err;
  }
}

export async function sendEmailOtp(email: string): Promise<AuthResponse> {
  const normalizedEmail = email.trim().toLowerCase();
  const res = await verificationApi.startEmailVerification({ email: normalizedEmail });
  if (res.data?.challengeId) {
    activeChallenges[normalizedEmail] = res.data.challengeId;
  }
  return {
    success: true,
    message: res.message || 'Verification code sent.',
  };
}

export async function verifyEmailOtp(email: string, otp: string): Promise<AuthResponse> {
  const normalizedEmail = email.trim().toLowerCase();
  const challengeId = activeChallenges[normalizedEmail] || 'default-challenge';
  try {
    await verificationApi.verifyEmail({ email: normalizedEmail, challengeId, otp });
    delete activeChallenges[normalizedEmail];

    // Check if we have pending signup credentials to auto-authenticate and retrieve JWT tokens
    const pending = pendingEmailCredentials[normalizedEmail];
    if (pending) {
      delete pendingEmailCredentials[normalizedEmail];
      const loginRes = await authApi.emailLogin({
        email: pending.email,
        password: pending.password,
      });
      return {
        success: true,
        token: loginRes.data.accessToken,
        refreshToken: loginRes.data.refreshToken,
        user: {
          id: loginRes.data.user?.id,
          name: loginRes.data.user?.name || pending.name,
          email: loginRes.data.user?.email || normalizedEmail,
          phone: loginRes.data.user?.phone,
        },
        isProfileComplete: loginRes.data.isProfileComplete === true,
        verifiedChannel: 'email',
        message: loginRes.message,
      };
    }

    const account = await readLocalAccount(normalizedEmail);
    return {
      success: true,
      user: account?.user ?? { email: normalizedEmail },
      isProfileComplete: account?.isProfileComplete ?? false,
      verifiedChannel: 'email',
    };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.isNetworkError) {
      return verifyLocalOtp('email', normalizedEmail, otp);
    }
    throw err;
  }
}

export async function completeOnboarding(input: CompleteOnboardingInput): Promise<AuthResponse> {
  const currency = input.currency || 'INR';
  try {
    // Run Step 1, 2, and 3 updates in parallel
    await Promise.all([
      onboardingApi.updateProfile({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
      }),
      onboardingApi.updateEmployment({
        employmentType: input.employmentType.toUpperCase(),
        monthlyIncomeMinor: Number(input.incomeAmountMinor) || 0,
        currency,
      }),
      onboardingApi.updateFinancialProfile({
        cashBalanceMinor: Number(input.cashBalanceMinor) || 0,
        savingsBalanceMinor: Number(input.savingsAmountMinor || '0') || 0,
        currency,
      }),
    ]);

    // 4. Complete onboarding and elevate session
    const res = await onboardingApi.completeOnboarding();
    const email = input.email.trim().toLowerCase();

    return {
      success: true,
      token: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      tokenType: 'APPLICATION',
      onboardingStatus: 'COMPLETED',
      user: {
        id: res.data.user.id,
        name: `${input.firstName} ${input.lastName}`.trim(),
        username: res.data.username,
        email,
        phone: input.phone,
        incomeAmountMinor: input.incomeAmountMinor,
        cashBalanceMinor: input.cashBalanceMinor,
        savingsAmountMinor: input.savingsAmountMinor ?? '0',
      },
      isProfileComplete: true,
      message: res.message || 'Account created successfully',
    };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.isNetworkError) {
      // Local offline fallback
      const session = await readSession();
      const email = input.email.trim().toLowerCase();
      const existing = await readLocalAccount(email);
      const user: AuthUser = {
        ...existing?.user,
        name: `${input.firstName} ${input.lastName}`.trim(),
        username: email || input.phone,
        email,
        phone: input.phone,
        incomeAmountMinor: input.incomeAmountMinor,
        cashBalanceMinor: input.cashBalanceMinor,
        savingsAmountMinor: input.savingsAmountMinor ?? '0',
      };
      const account = {
        email,
        password: existing?.password ?? '',
        user,
        isProfileComplete: true,
      };
      await saveLocalAccount(account);
      if (input.phone) {
        await writeJson(phoneAccountKey(input.phone), account);
      }
      return {
        success: true,
        token: session?.accessToken ?? localToken(),
        user,
        isProfileComplete: true,
      };
    }
    throw err;
  }
}

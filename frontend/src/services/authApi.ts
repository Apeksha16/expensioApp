import { readSession } from '../core/storage/session';
import {
  CorruptStoredDataError,
  readJson,
  readText,
  removeValue,
  STORAGE_KEYS,
  writeJson,
  writeText,
} from '../core/storage/localPersistence';

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
  employmentType: 'salaried' | 'business' | 'student' | 'retired' | 'homemaker';
  incomeAmountMinor: string;
  cashBalanceMinor: string;
  savingsAmountMinor?: string;
}

interface LocalAccount {
  email: string;
  password: string;
  user: AuthUser;
  isProfileComplete: boolean;
}

function accountKey(email: string) {
  return `${STORAGE_KEYS.localAccountPrefix}${encodeURIComponent(email.trim().toLowerCase())}`;
}

function otpKey(channel: 'phone' | 'email', target: string) {
  return `${STORAGE_KEYS.localOtpPrefix}${channel}_${encodeURIComponent(target.trim().toLowerCase())}`;
}

function phoneAccountKey(phone: string) {
  return `${STORAGE_KEYS.localAccountByPhonePrefix}${encodeURIComponent(phone)}`;
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
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await writeText(otpKey(channel, normalizedTarget), code);
  return { success: true, debugOtp: code };
}

async function verifyLocalOtp(
  channel: 'phone' | 'email',
  target: string,
  code: string,
): Promise<AuthResponse> {
  const normalizedTarget = target.trim().toLowerCase();
  const key = otpKey(channel, normalizedTarget);
  const storedCode = await readText(key);
  if (!storedCode || storedCode !== code) {
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

export function sendOtp(phone: string) {
  return issueOtp('phone', phone);
}

export function verifyOtp(phone: string, otp: string) {
  return verifyLocalOtp('phone', phone, otp);
}

export async function authenticateEmail(email: string, password: string, mode: 'login' | 'register'): Promise<AuthResponse> {
  const normalizedEmail = email.trim().toLowerCase();
  if (mode === 'register') {
    const existing = await readLocalAccount(normalizedEmail);
    if (existing) throw new Error('A local account already exists for this email. Log in instead.');
    const account: LocalAccount = {
      email: normalizedEmail,
      password,
      user: { email: normalizedEmail },
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

export function authenticateGoogle(_idToken: string): Promise<AuthResponse> {
  return Promise.reject(new Error('Google sign-in is unavailable in local-only mode.'));
}

export function sendEmailOtp(email: string) {
  return issueOtp('email', email);
}

export function verifyEmailOtp(email: string, otp: string) {
  return verifyLocalOtp('email', email, otp);
}

export async function completeOnboarding(input: CompleteOnboardingInput): Promise<AuthResponse> {
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

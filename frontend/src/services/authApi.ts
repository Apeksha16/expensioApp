import { readSession } from '../core/storage/session';
import { removeValue, STORAGE_KEYS } from '../core/storage/localPersistence';
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
  resendCooldownSeconds?: number;
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

// In-memory only challenge IDs & transient signup state (never persisted to storage)
const activeChallenges: Record<string, string> = {};
const pendingEmailCredentials: Record<string, { email: string; password: string; name?: string; expiresAt: number }> = {};

const PENDING_SIGNUP_TTL_MS = 10 * 60 * 1000;

export function clearPendingAuthState(): void {
  for (const key of Object.keys(activeChallenges)) {
    delete activeChallenges[key];
  }
  for (const key of Object.keys(pendingEmailCredentials)) {
    delete pendingEmailCredentials[key];
  }
}

/**
 * One-time migration cleanup: purge any legacy plaintext local account or OTP keys
 * created by older dev builds.
 */
export async function purgeLegacyInsecureAuthKeys(email?: string | null, phone?: string | null): Promise<void> {
  const removals: Array<Promise<void>> = [];
  if (email) {
    const clean = email.trim().toLowerCase().replace(/[^a-zA-Z0-9.\-_]/g, '_');
    removals.push(removeValue(`${STORAGE_KEYS.localAccountPrefix}${clean}`));
    removals.push(removeValue(`${STORAGE_KEYS.localOtpPrefix}email_${clean}`));
  }
  if (phone) {
    const cleanPhone = phone.trim().replace(/[^a-zA-Z0-9.\-_]/g, '_');
    removals.push(removeValue(`${STORAGE_KEYS.localAccountByPhonePrefix}${cleanPhone}`));
    removals.push(removeValue(`${STORAGE_KEYS.localOtpPrefix}phone_${cleanPhone}`));
  }
  await Promise.allSettled(removals);
}

export async function updateLocalAccountEmail(
  _currentEmail: string,
  _nextEmail: string,
  _user: AuthUser,
): Promise<void> {
  // No-op: email credentials are authoritative on the backend; no plaintext local account records are stored.
}

export async function sendOtp(phone: string, countryCode?: string): Promise<AuthResponse> {
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
  void purgeLegacyInsecureAuthKeys(normalizedEmail, null);

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
  }

  const resolvedName = name?.trim() || normalizedEmail.split('@')[0];
  pendingEmailCredentials[normalizedEmail] = {
    email: normalizedEmail,
    password,
    name: resolvedName,
    expiresAt: Date.now() + PENDING_SIGNUP_TTL_MS,
  };

  try {
    const res = await authApi.emailSignup({ email: normalizedEmail, password, name: resolvedName });
    if (res.data?.challengeId) {
      activeChallenges[normalizedEmail] = res.data.challengeId;
    }
    return {
      success: true,
      user: { email: normalizedEmail, name: resolvedName },
      isProfileComplete: false,
      requiresVerification: 'email',
      resendCooldownSeconds: res.data?.resendCooldownSeconds,
      message: res.message,
    };
  } catch (err) {
    delete pendingEmailCredentials[normalizedEmail];
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
    resendCooldownSeconds: res.data?.resendCooldownSeconds,
    message: res.message || 'Verification code sent.',
  };
}

export async function verifyEmailOtp(email: string, otp: string): Promise<AuthResponse> {
  const normalizedEmail = email.trim().toLowerCase();
  const challengeId = activeChallenges[normalizedEmail] || undefined;

  await verificationApi.verifyEmail({ email: normalizedEmail, challengeId, otp });
  delete activeChallenges[normalizedEmail];

  const pending = pendingEmailCredentials[normalizedEmail];
  delete pendingEmailCredentials[normalizedEmail];

  if (pending && Date.now() <= pending.expiresAt) {
    const loginRes = await authApi.emailLogin({
      email: pending.email,
      password: pending.password,
    });
    const isProfileComplete = loginRes.data.isProfileComplete === true &&
      loginRes.data.tokenType !== 'ONBOARDING' &&
      loginRes.data.onboardingStatus !== 'PENDING_ONBOARDING';

    return {
      success: true,
      token: loginRes.data.accessToken,
      refreshToken: loginRes.data.refreshToken,
      tokenType: loginRes.data.tokenType,
      onboardingStatus: loginRes.data.onboardingStatus,
      user: {
        id: loginRes.data.user?.id,
        name: loginRes.data.user?.name || pending.name,
        email: loginRes.data.user?.email || normalizedEmail,
        phone: loginRes.data.user?.phone,
      },
      isProfileComplete,
      verifiedChannel: 'email',
      message: loginRes.message,
    };
  }

  const session = await readSession();
  return {
    success: true,
    token: session?.accessToken,
    refreshToken: session?.refreshToken,
    user: { email: normalizedEmail },
    isProfileComplete: session?.isProfileComplete ?? false,
    verifiedChannel: 'email',
  };
}

export async function requestPasswordReset(email: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const res = await authApi.forgotPassword({ email: normalizedEmail });
  return res.message || 'If an account exists with this email, password reset instructions have been sent.';
}

export async function submitPasswordReset(payload: {
  email?: string;
  otp?: string;
  token?: string;
  newPassword: string;
}): Promise<string> {
  const res = await authApi.resetPassword({
    email: payload.email?.trim().toLowerCase(),
    otp: payload.otp?.trim(),
    token: payload.token?.trim(),
    newPassword: payload.newPassword,
  });
  return res.message || 'Password has been reset successfully.';
}

export async function completeOnboarding(input: CompleteOnboardingInput): Promise<AuthResponse> {
  const currency = input.currency || 'INR';
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
}

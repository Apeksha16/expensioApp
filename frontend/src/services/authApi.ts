import { Platform } from 'react-native';
import { readSession } from '../core/storage/session';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:5005' : 'http://localhost:5005');

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
  nextStep?: 'dashboard' | 'onboarding' | 'profile' | 'employment' | 'financial' | 'review' | 'verify_email' | 'verify_phone';
}

async function post(path: string, body: Record<string, unknown>, accessToken?: string): Promise<AuthResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    const session = accessToken ? null : await readSession();
    const token = accessToken || session?.accessToken;
    response = await fetch(`${API_URL}/api/auth${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: ['Bearer', token].join(' ') } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timeout);
    throw new Error('Unable to connect to Expensio. Check your internet connection.');
  }
  clearTimeout(timeout);

  const rawPayload = await response.text();
  if (!rawPayload.trim()) {
    throw new Error(`Expensio server returned HTTP ${response.status}.`);
  }
  let payload: AuthResponse;
  try {
    payload = JSON.parse(rawPayload) as AuthResponse;
  } catch {
    throw new Error('Expensio returned an invalid server response.');
  }
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || payload.message || 'Authentication failed.');
  }
  return payload;
}

export function sendOtp(phone: string) {
  return post('/send-otp', { phone });
}

export function verifyOtp(phone: string, otp: string) {
  return post('/verify-otp', { phone, otp, channel: 'phone' });
}

export function authenticateEmail(email: string, password: string, mode: 'login' | 'register') {
  return post('/email', { email, password, mode });
}

export function authenticateGoogle(idToken: string) {
  return post('/social', { provider: 'google', token: idToken });
}

export function refreshSession(refreshToken: string) {
  return post('/refresh', { refreshToken });
}

export function logoutSession(refreshToken?: string) {
  return post('/logout', { refreshToken });
}

export function sendEmailOtp(email: string) {
  return post('/send-email-otp', { email });
}

export function verifyEmailOtp(email: string, otp: string) {
  return post('/verify-email-otp', { email, otp });
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

export function completeOnboarding(input: CompleteOnboardingInput) {
  return post('/complete-onboarding', input as unknown as Record<string, unknown>);
}

export function getAuthProfile() {
  return post('/profile', {});
}

export function updateOnboardingProgress(step: number) {
  return post('/onboarding-progress', { step });
}

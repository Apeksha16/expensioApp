import { ApiError } from '../services/api/apiError';

export type AuthErrorKind =
  | 'offline'
  | 'timeout'
  | 'rate_limit'
  | 'lockout'
  | 'expired_otp'
  | 'invalid_otp'
  | 'invalid_credentials'
  | 'server'
  | 'validation'
  | 'unknown';

export interface NormalizedAuthError {
  kind: AuthErrorKind;
  message: string;
  retryAfterSeconds?: number;
  isLockedOut: boolean;
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function parseRetryAfterHeader(value: string | null | undefined, nowMs = Date.now()): number | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d+$/.test(trimmed)) {
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }
  const timestamp = Date.parse(trimmed);
  if (!Number.isNaN(timestamp)) {
    const diffSec = Math.ceil((timestamp - nowMs) / 1000);
    return diffSec > 0 ? diffSec : undefined;
  }
  return undefined;
}

export function normalizeAuthError(
  error: unknown,
  context: 'login' | 'signup' | 'otp' | 'recovery' = 'login',
): NormalizedAuthError {
  if (error instanceof ApiError) {
    const msg = error.message || '';
    const lower = msg.toLowerCase();

    if (error.status === 408 || /timed out/i.test(msg)) {
      return {
        kind: 'timeout',
        message: 'Request timed out. Check your connection and try again.',
        isLockedOut: false,
      };
    }

    if (error.isNetworkError || error.status === 0) {
      return {
        kind: 'offline',
        message: 'You appear to be offline. Connect to the internet and try again.',
        isLockedOut: false,
      };
    }

    if (error.status === 429 || /too many requests/i.test(lower)) {
      const retryAfter = error.retryAfterSeconds;
      const waitMatch = msg.match(/wait\s+(\d+)\s+seconds/i);
      const seconds = retryAfter ?? (waitMatch ? Number.parseInt(waitMatch[1], 10) : undefined);
      return {
        kind: 'rate_limit',
        retryAfterSeconds: seconds,
        message: seconds
          ? `Too many attempts. Please wait ${formatCountdown(seconds)} before trying again.`
          : 'Too many requests right now. Please wait a moment and try again.',
        isLockedOut: false,
      };
    }

    if (
      error.status === 423
      || /maximum verification attempts|too many failed login attempts|temporarily locked|account is locked|account locked/i.test(lower)
      || error.code === 'ACCOUNT_LOCKED'
      || error.code === 'OTP_LOCKED'
    ) {
      return {
        kind: 'lockout',
        message: context === 'otp'
          ? 'Too many incorrect attempts. Request a new code to continue.'
          : msg || 'Account is temporarily locked. Please try again later.',
        isLockedOut: true,
      };
    }

    if (/expired/i.test(lower) && context === 'otp') {
      return {
        kind: 'expired_otp',
        message: 'This code has expired. Request a new code to continue.',
        isLockedOut: false,
      };
    }

    if (context === 'otp' && /invalid otp|didn.?t match|invalid or expired otp/i.test(lower)) {
      return {
        kind: 'invalid_otp',
        message: "That code didn't match. Try again.",
        isLockedOut: false,
      };
    }

    if (error.status === 401 && context === 'login') {
      return {
        kind: 'invalid_credentials',
        message: /locked/i.test(lower) ? msg : 'Email or password is incorrect.',
        isLockedOut: /locked/i.test(lower),
      };
    }

    if (error.status >= 500) {
      return {
        kind: 'server',
        message: 'Our servers are temporarily unavailable. Please try again shortly.',
        isLockedOut: false,
      };
    }

    if (error.status === 400 || error.status === 422) {
      return {
        kind: 'validation',
        message: msg || 'Please check your details and try again.',
        isLockedOut: false,
      };
    }

    return {
      kind: 'unknown',
      message: msg || 'Something went wrong. Please try again.',
      isLockedOut: false,
    };
  }

  if (error instanceof Error) {
    return {
      kind: 'unknown',
      message: error.message || 'Something went wrong. Please try again.',
      isLockedOut: false,
    };
  }

  return {
    kind: 'unknown',
    message: 'Something went wrong. Please try again.',
    isLockedOut: false,
  };
}

import { ApiError } from './apiError';
import type {
  FriendsErrorAction,
  FriendsErrorKind,
  FriendsFieldErrors,
} from '../../types/friends';

export interface FriendsApiErrorOptions {
  message: string;
  kind: FriendsErrorKind;
  status: number;
  action: FriendsErrorAction;
  code?: string;
  fieldErrors?: FriendsFieldErrors;
  blockedByDebt?: boolean;
  unsettledAmount?: number;
  splitTitle?: string;
}

export class FriendsApiError extends Error {
  readonly kind: FriendsErrorKind;
  readonly status: number;
  readonly action: FriendsErrorAction;
  readonly code?: string;
  readonly fieldErrors?: FriendsFieldErrors;
  readonly blockedByDebt?: boolean;
  readonly unsettledAmount?: number;
  readonly splitTitle?: string;

  constructor(options: FriendsApiErrorOptions) {
    super(options.message);
    this.name = 'FriendsApiError';
    this.kind = options.kind;
    this.status = options.status;
    this.action = options.action;
    this.code = options.code;
    this.fieldErrors = options.fieldErrors;
    this.blockedByDebt = options.blockedByDebt;
    this.unsettledAmount = options.unsettledAmount;
    this.splitTitle = options.splitTitle;
  }
}

export function isAbortError(error: unknown): boolean {
  return Boolean(
    error
    && typeof error === 'object'
    && 'name' in error
    && (error as { name?: string }).name === 'AbortError',
  );
}

function extractErrorData(data: unknown): Record<string, unknown> | null {
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
}

function extractFieldErrors(data: Record<string, unknown> | null, code?: string, message?: string): FriendsFieldErrors | undefined {
  if (!data && !code) return undefined;
  const rawFields = data?.fieldErrors && typeof data.fieldErrors === 'object'
    ? (data.fieldErrors as Record<string, unknown>)
    : null;

  const fieldErrors: FriendsFieldErrors = {};
  if (typeof rawFields?.name === 'string') fieldErrors.name = rawFields.name;
  if (typeof rawFields?.displayName === 'string' && !fieldErrors.name) fieldErrors.name = rawFields.displayName;
  if (typeof rawFields?.username === 'string') fieldErrors.username = rawFields.username;

  if (!fieldErrors.username && (code === 'USERNAME_TAKEN' || code === 'DUPLICATE_USERNAME' || code === 'GUEST_USERNAME_TAKEN')) {
    fieldErrors.username = message || 'This username is already taken.';
  }
  if (!fieldErrors.name && code === 'INVALID_DISPLAY_NAME') {
    fieldErrors.name = message || 'Enter a valid display name.';
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

function defaultMessageForKind(kind: FriendsErrorKind): string {
  switch (kind) {
    case 'offline':
      return 'You appear to be offline. Check your connection and try again.';
    case 'timeout':
      return 'Request timed out. Please try again.';
    case '401':
      return 'Your session has expired. Please sign in again.';
    case '403':
      return 'You do not have permission to perform this action.';
    case '404':
      return 'This friend or request is no longer available.';
    case '409':
      return 'This action conflicts with your current relationships or balances.';
    case '429':
      return 'Too many requests right now. Please wait a moment and try again.';
    case '5xx':
      return 'Our servers are temporarily unavailable. Please try again shortly.';
    case 'unknown':
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function normalizeFriendsError(error: unknown): FriendsApiError {
  if (error instanceof FriendsApiError) {
    return error;
  }

  if (error instanceof ApiError) {
    const data = extractErrorData(error.data);
    const code = error.code ?? (typeof data?.code === 'string' ? data.code : undefined);

    if (error.isNetworkError || error.status === 0 || error.status === 408) {
      const kind: FriendsErrorKind = error.status === 408 || /timed out/i.test(error.message) ? 'timeout' : 'offline';
      return new FriendsApiError({
        kind,
        status: error.status,
        code,
        action: 'retry',
        message: error.message || defaultMessageForKind(kind),
      });
    }

    if (error.status === 401) {
      return new FriendsApiError({
        kind: '401',
        status: 401,
        code,
        action: 'relogin',
        message: defaultMessageForKind('401'),
      });
    }

    if (error.status === 403) {
      return new FriendsApiError({
        kind: '403',
        status: 403,
        code,
        action: 'none',
        message: error.message || defaultMessageForKind('403'),
      });
    }

    if (error.status === 404) {
      return new FriendsApiError({
        kind: '404',
        status: 404,
        code,
        action: 'retry',
        message: error.message || defaultMessageForKind('404'),
      });
    }

    if (error.status === 409) {
      const blockedByDebt =
        code === 'UNSETTLED_OBLIGATIONS'
        || code === 'DEBT_BLOCKED'
        || data?.blockedByDebt === true;
      const unsettledAmount = typeof data?.unsettledAmount === 'number' ? data.unsettledAmount : undefined;
      const splitTitle = typeof data?.splitTitle === 'string' ? data.splitTitle : undefined;
      const message = error.message || defaultMessageForKind('409');
      return new FriendsApiError({
        kind: '409',
        status: 409,
        code,
        action: blockedByDebt ? 'view_in_splits' : 'none',
        message,
        fieldErrors: extractFieldErrors(data, code, message),
        blockedByDebt,
        unsettledAmount,
        splitTitle,
      });
    }

    if (error.status === 429) {
      return new FriendsApiError({
        kind: '429',
        status: 429,
        code,
        action: 'retry',
        message: error.message || defaultMessageForKind('429'),
      });
    }

    if (error.status >= 500 && error.status <= 599) {
      return new FriendsApiError({
        kind: '5xx',
        status: error.status,
        code,
        action: 'retry',
        message: error.message || defaultMessageForKind('5xx'),
      });
    }

    return new FriendsApiError({
      kind: 'unknown',
      status: error.status,
      code,
      action: 'retry',
      message: error.message || defaultMessageForKind('unknown'),
      fieldErrors: extractFieldErrors(data, code, error.message),
    });
  }

  if (error instanceof Error) {
    const errWithMeta = error as Error & {
      status?: number;
      code?: string;
      data?: unknown;
      isNetworkError?: boolean;
    };
    if (typeof errWithMeta.status === 'number' || errWithMeta.code || errWithMeta.isNetworkError) {
      return normalizeFriendsError(
        new ApiError({
          message: errWithMeta.message,
          status: errWithMeta.status ?? 0,
          code: errWithMeta.code,
          data: errWithMeta.data,
          isNetworkError: errWithMeta.isNetworkError,
        }),
      );
    }
    return new FriendsApiError({
      kind: 'unknown',
      status: 0,
      action: 'retry',
      message: error.message || defaultMessageForKind('unknown'),
    });
  }

  return new FriendsApiError({
    kind: 'unknown',
    status: 0,
    action: 'retry',
    message: defaultMessageForKind('unknown'),
  });
}

export function isRetryableFriendsReadError(err: FriendsApiError): boolean {
  return err.kind === 'timeout' || err.kind === '5xx';
}

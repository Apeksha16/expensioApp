// =============================================================================
// Dev-only redacted logger (no-op in production builds)
// =============================================================================

const runtimeGlobal = globalThis as {
  __DEV__?: boolean;
  process?: { env?: Record<string, string | undefined> };
};

const isDevRuntime =
  typeof runtimeGlobal.__DEV__ === 'boolean'
    ? runtimeGlobal.__DEV__
    : runtimeGlobal.process?.env?.NODE_ENV !== 'production';

const SENSITIVE_KEYS = new Set([
  'password',
  'newpassword',
  'confirmpassword',
  'otp',
  'code',
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'authorization',
  'email',
  'phone',
  'mobile',
  'secret',
]);

export function redactSensitiveData(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || value === undefined) return value;
  if (typeof value === 'string') {
    if (value.length > 24 && /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(value)) {
      return '[REDACTED_JWT]';
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redactSensitiveData(item, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redactSensitiveData(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

export const logger = {
  debug(message: string, payload?: unknown): void {
    if (!isDevRuntime) return;
    if (payload !== undefined) {
      // eslint-disable-next-line no-console
      console.log(message, redactSensitiveData(payload));
    } else {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  },
  warn(message: string, payload?: unknown): void {
    if (!isDevRuntime) return;
    if (payload !== undefined) {
      // eslint-disable-next-line no-console
      console.warn(message, redactSensitiveData(payload));
    } else {
      // eslint-disable-next-line no-console
      console.warn(message);
    }
  },
  error(message: string, payload?: unknown): void {
    if (!isDevRuntime) return;
    if (payload !== undefined) {
      // eslint-disable-next-line no-console
      console.error(message, redactSensitiveData(payload));
    } else {
      // eslint-disable-next-line no-console
      console.error(message);
    }
  },
};

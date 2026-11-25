// =============================================================================
// Expensio Frontend - Environment Variable Configuration
// =============================================================================

const runtimeGlobal = globalThis as {
  __DEV__?: boolean;
  process?: { env?: Record<string, string | undefined> };
};

const rawEnv: Record<string, string | undefined> = runtimeGlobal.process?.env ?? {};

const isDevRuntime =
  typeof runtimeGlobal.__DEV__ === 'boolean'
    ? runtimeGlobal.__DEV__
    : rawEnv.NODE_ENV !== 'production';

function resolveApiBaseUrl(rawUrl?: string): string {
  const candidate = (rawUrl || 'https://expensio-api.duckdns.org').trim().replace(/\/+$/, '');
  if (!isDevRuntime && !candidate.startsWith('https://')) {
    return 'https://expensio-api.duckdns.org';
  }
  return candidate;
}

export const ENV = {
  API_BASE_URL: resolveApiBaseUrl(rawEnv.API_URL),
  GOOGLE_CLIENT_ID: rawEnv.GOOGLE_CLIENT_ID || '',
  TIMEOUT_MS: Math.min(Math.max(Number(rawEnv.API_TIMEOUT_MS) || 15000, 5000), 30000),
  ENABLE_NETWORK_LOGS: isDevRuntime && rawEnv.ENABLE_NETWORK_LOGS !== 'false',
  IS_DEV: isDevRuntime,
} as const;

export type AppEnvironment = typeof ENV;

// =============================================================================
// Expensio Frontend - Environment Variable Configuration
// =============================================================================

// Safe fallback for process.env across Hermes, Node, and browser runtimes
const rawEnv: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? process.env : {};

export const ENV = {
  API_BASE_URL: (rawEnv.API_URL || 'https://expensio-api.duckdns.org').replace(/\/+$/, ''),
  GOOGLE_CLIENT_ID: rawEnv.GOOGLE_CLIENT_ID || '',
  TIMEOUT_MS: Number(rawEnv.API_TIMEOUT_MS) || 15000,
  ENABLE_NETWORK_LOGS: rawEnv.ENABLE_NETWORK_LOGS !== 'false',
} as const;

export type AppEnvironment = typeof ENV;

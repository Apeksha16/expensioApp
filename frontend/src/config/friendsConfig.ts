// =============================================================================
// Friends Module Configuration & Feature Flags
// Single place to adjust route prefixes, mock mode, polling, and feature gates.
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

export const FRIENDS_CONFIG = {
  /**
   * Proposed REST prefix from the Friends spec (/api/v1/friends).
   * Change here in one place if the Spring Boot server mounts at /v1/friends.
   */
  API_PREFIX: (rawEnv.FRIENDS_API_PREFIX || '/api/v1/friends').replace(/\/+$/, ''),

  /**
   * Mock adapter is strictly prohibited in production builds.
   * In dev/test, defaults to true until Spring Boot /api/v1/friends routes go live
   * (override with USE_FRIENDS_MOCK=false to hit live server).
   */
  USE_FRIENDS_MOCK: isDevRuntime && rawEnv.USE_FRIENDS_MOCK !== 'false',

  /**
   * Gate guest avatar editing UI behind a flag until
   * PATCH /api/v1/friends/guests/{guestId}/avatar exists on backend.
   */
  ENABLE_GUEST_AVATAR_EDIT:
    rawEnv.ENABLE_GUEST_AVATAR_EDIT === 'true'
    || (isDevRuntime && rawEnv.USE_FRIENDS_MOCK !== 'false' && rawEnv.ENABLE_GUEST_AVATAR_EDIT !== 'false'),

  /**
   * Optional real-time SSE/WebSocket adapter (off by default per §4).
   */
  ENABLE_REALTIME: rawEnv.ENABLE_FRIENDS_REALTIME === 'true',

  /**
   * Light foreground polling while Friends screen is visible.
   */
  ENABLE_POLLING: rawEnv.ENABLE_FRIENDS_POLLING !== 'false',
  POLL_INTERVAL_MS: 25_000,
  POLL_MAX_BACKOFF_MS: 120_000,

  /**
   * Search behavior constants (§3.2 / §5).
   */
  SEARCH_DEBOUNCE_MS: 500,
  SEARCH_MIN_CHARS: 1,
  SEARCH_REVEAL_THRESHOLD: 8,
  SEARCH_PAGE_SIZE: 25,
  LIST_PAGE_SIZE: 50,

  /**
   * Optional non-zero balance chip on accepted friend rows (off by default:
   * Friends does not own balances).
   */
  ENABLE_SPLIT_BALANCE_CHIPS: rawEnv.ENABLE_FRIEND_BALANCE_CHIPS === 'true',
} as const;

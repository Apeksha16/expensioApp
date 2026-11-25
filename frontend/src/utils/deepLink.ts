// =============================================================================
// Deep-Link Validation & Parameter Sanitization
// Security rules (§2):
// - Allow only verified schemes and hosts.
// - Never authenticate a session directly from a URL.
// - Never prefill OTP verification codes from a URL.
// =============================================================================

const ALLOWED_SCHEMES = new Set(['com.aptech.expensio.app:', 'com.expensio.app:', 'expensio:']);
const ALLOWED_ROUTES = new Set(['friends', 'splits', 'reset-password']);

export type ParsedDeepLink =
  | { route: 'friends' }
  | { route: 'splits'; splitId?: string }
  | { route: 'reset-password'; token?: string };

export function parseSafeDeepLink(rawUrl: string | null | undefined): ParsedDeepLink | null {
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.length > 512) return null;
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (!ALLOWED_SCHEMES.has(parsed.protocol.toLowerCase())) {
    return null;
  }

  // Never trust auth tokens, session JWTs, or OTP codes passed in deep-link params
  const host = parsed.hostname.toLowerCase();
  const pathSegment = parsed.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const target = host || pathSegment;

  if (!ALLOWED_ROUTES.has(target)) {
    return null;
  }

  if (target === 'friends') {
    return { route: 'friends' };
  }

  if (target === 'splits') {
    const rawSplitId = parsed.searchParams.get('splitId')?.trim();
    const safeSplitId = rawSplitId && /^[a-zA-Z0-9_-]{1,64}$/.test(rawSplitId) ? rawSplitId : undefined;
    return { route: 'splits', splitId: safeSplitId };
  }

  if (target === 'reset-password') {
    const rawToken = parsed.searchParams.get('token')?.trim();
    // Password reset tokens are opaque hex/base64url strings; never treat them as OTPs or session JWTs
    const safeToken = rawToken && /^[A-Za-z0-9._-]{16,128}$/.test(rawToken) ? rawToken : undefined;
    return { route: 'reset-password', token: safeToken };
  }

  return null;
}

export type DeepLinkResolution =
  | { kind: 'ignore' }
  | { kind: 'auth_phase'; phase: 'reset_password'; token?: string }
  | { kind: 'queue'; link: ParsedDeepLink }
  | {
      kind: 'navigate_main';
      screen: 'Split';
      params:
        | { screen: 'Friends' }
        | { screen: 'SplitHome' }
        | { screen: 'SplitDetail'; params: { splitId: string } };
    };

export interface DeepLinkDispatchContext {
  isAuthenticated: boolean;
  friendsEnabled: boolean;
  ownedSplitIds: ReadonlySet<string>;
}

/**
 * Resolves a validated deep link against authentication state, feature flags,
 * and split ownership before performing any navigation action (F-09).
 */
export function resolveDeepLinkNavigation(
  rawOrParsed: string | ParsedDeepLink | null | undefined,
  context: DeepLinkDispatchContext,
): DeepLinkResolution {
  const parsed =
    typeof rawOrParsed === 'string'
      ? parseSafeDeepLink(rawOrParsed)
      : rawOrParsed ?? null;

  if (!parsed) {
    return { kind: 'ignore' };
  }

  if (parsed.route === 'reset-password') {
    if (context.isAuthenticated) {
      return { kind: 'ignore' };
    }
    return {
      kind: 'auth_phase',
      phase: 'reset_password',
      token: parsed.token,
    };
  }

  if (parsed.route === 'friends') {
    if (!context.friendsEnabled) {
      return { kind: 'ignore' };
    }
    if (!context.isAuthenticated) {
      return { kind: 'queue', link: parsed };
    }
    return {
      kind: 'navigate_main',
      screen: 'Split',
      params: { screen: 'Friends' },
    };
  }

  if (parsed.route === 'splits') {
    if (!context.isAuthenticated) {
      return { kind: 'queue', link: parsed };
    }
    if (parsed.splitId && context.ownedSplitIds.has(parsed.splitId)) {
      return {
        kind: 'navigate_main',
        screen: 'Split',
        params: { screen: 'SplitDetail', params: { splitId: parsed.splitId } },
      };
    }
    return {
      kind: 'navigate_main',
      screen: 'Split',
      params: { screen: 'SplitHome' },
    };
  }

  return { kind: 'ignore' };
}

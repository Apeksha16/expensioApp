// =============================================================================
// Deep-Link Validation & Parameter Sanitization
// Security rules (§2):
// - Allow only verified schemes and hosts.
// - Never authenticate a session directly from a URL.
// - Never prefill OTP verification codes from a URL.
// =============================================================================

const ALLOWED_SCHEMES = new Set(['com.expensio.app:', 'expensio:']);
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

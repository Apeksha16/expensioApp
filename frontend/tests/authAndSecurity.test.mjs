import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import Module from 'node:module';

import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../.test-dist/cjs');

// In-memory SecureStore + React Native stub before loading compiled modules
const secureStoreMap = new Map();
const asyncStorageMap = new Map();
const mockPlatform = { OS: 'ios' };
const originalLoad = Module._load;

Module._load = function patchedLoad(request, parent, isMain) {
  if (request === '@react-native-async-storage/async-storage') {
    const adapter = {
      getItem: async (key) => (asyncStorageMap.has(key) ? asyncStorageMap.get(key) : null),
      setItem: async (key, value) => {
        asyncStorageMap.set(key, String(value));
      },
      removeItem: async (key) => {
        asyncStorageMap.delete(key);
      },
      getAllKeys: async () => Array.from(asyncStorageMap.keys()),
      multiRemove: async (keys) => {
        for (const key of keys) asyncStorageMap.delete(key);
      },
    };
    return {
      __esModule: true,
      default: adapter,
      ...adapter,
    };
  }
  if (request === 'expo-secure-store') {
    return {
      getItemAsync: async (key) => (secureStoreMap.has(key) ? secureStoreMap.get(key) : null),
      setItemAsync: async (key, value) => {
        secureStoreMap.set(key, String(value));
      },
      deleteItemAsync: async (key) => {
        secureStoreMap.delete(key);
      },
    };
  }
  if (request === 'expo-status-bar') {
    return { StatusBar: 'ExpoStatusBar' };
  }
  if (request === 'react') {
    return {
      default: { createElement: () => null },
      createElement: () => null,
      useEffect: () => {},
      useRef: (v) => ({ current: v }),
      useState: (v) => [v, () => {}],
      Fragment: 'Fragment',
    };
  }
  if (request === 'react-native') {
    return {
      Platform: mockPlatform,
      StyleSheet: {
        create: (styles) => styles,
        hairlineWidth: 1,
        absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
      },
      StatusBar: {
        setBarStyle: () => {},
      },
      Animated: {
        Value: function Value(v) {
          this._v = v;
          this.setValue = (next) => {
            this._v = next;
          };
          this.interpolate = () => 0;
        },
        timing: () => ({ start: () => {} }),
        spring: () => ({ start: () => {} }),
        parallel: () => ({ start: () => {} }),
        loop: () => ({ start: () => {}, stop: () => {} }),
        sequence: () => ({ start: () => {} }),
        Text: 'Animated.Text',
        View: 'Animated.View',
      },
      AccessibilityInfo: {
        isReduceMotionEnabled: async () => false,
        announceForAccessibility: () => {},
      },
      View: 'View',
      Text: 'Text',
      TextInput: 'TextInput',
      Pressable: 'Pressable',
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

globalThis.__DEV__ = true;

const requireFromDist = (relativePath) => {
  const target = path.join(distDir, relativePath);
  const loaded = originalLoad.call(Module, target, module, false);
  return loaded;
};

const req = Module.createRequire(import.meta.url);
const loadDist = (relativePath) => req(path.join(distDir, relativePath));

const { redactSensitiveData } = loadDist('utils/logger.js');
const { parseSafeDeepLink } = loadDist('utils/deepLink.js');
const { formatCountdown, parseRetryAfterHeader, normalizeAuthError } = loadDist('utils/errorNormalization.js');
const { getPasswordRequirementChecks } = loadDist('utils/validation.js');
const { processOtpTextChange } = loadDist('components/OtpInput.js');
const { getStatusBarStyleForSurface, getAndroidSystemBarColor } = loadDist('components/ScreenStatusBar.js');
const { sanitizeDisplayText, partitionFriendships, filterFriendshipsByQuery } = loadDist('services/friendsStore.js');
const { colors } = loadDist('theme/index.js');
const { readSession, writeSession } = loadDist('core/storage/session.js');
const { STORAGE_KEYS, readText, writeText } = loadDist('core/storage/localPersistence.js');
const { onboardingDraftService } = loadDist('services/onboardingDraftService.js');
const { writeFriendsCache, readFriendsCache } = loadDist('services/api/friendsApi.js');
const { clearPersistedUserSession } = loadDist('services/sessionCleanup.js');
const { ApiClient, ApiError } = loadDist('services/api/apiClient.js');

test('Logger redacts sensitive fields, JWTs, and is a no-op in production', () => {
  const redacted = redactSensitiveData({
    email: 'alice@example.com',
    password: 'SecretPassword1!',
    otp: '482910',
    token: 'headerPayload12345.bodyPayload12345.sigPayload12345',
    nested: {
      refreshToken: 'ref-secret',
      safeField: 'visible',
    },
  });

  assert.equal(redacted.email, '[REDACTED]');
  assert.equal(redacted.password, '[REDACTED]');
  assert.equal(redacted.otp, '[REDACTED]');
  assert.equal(redacted.token, '[REDACTED]');
  assert.equal(redacted.nested.refreshToken, '[REDACTED]');
  assert.equal(redacted.nested.safeField, 'visible');
  assert.equal(
    redactSensitiveData('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.signature123456'),
    '[REDACTED_JWT]',
  );

  // Verify prod logger emits nothing when __DEV__ === false
  const loggerPath = req.resolve(path.join(distDir, 'utils/logger.js'));
  delete req.cache[loggerPath];
  const prevDev = globalThis.__DEV__;
  const origWarn = console.warn;
  let called = 0;
  console.warn = () => {
    called += 1;
  };
  try {
    globalThis.__DEV__ = false;
    const prodLogger = req(loggerPath).logger;
    prodLogger.warn('should not log', { password: 'secret' });
    assert.equal(called, 0);
  } finally {
    globalThis.__DEV__ = prevDev;
    console.warn = origWarn;
    delete req.cache[loggerPath];
  }
});

test('Deep link parser validates scheme/route and rejects auth/OTP injection', () => {
  const validFriends = parseSafeDeepLink('com.expensio.app://friends?requestId=req_42&otp=123456&token=evil');
  assert.deepEqual(validFriends, { route: 'friends' });

  const validSplits = parseSafeDeepLink('expensio://splits?splitId=sp_99');
  assert.deepEqual(validSplits, { route: 'splits', splitId: 'sp_99' });

  const badSplitId = parseSafeDeepLink('expensio://splits?splitId=../../etc/passwd');
  assert.deepEqual(badSplitId, { route: 'splits', splitId: undefined });

  const validReset = parseSafeDeepLink('com.expensio.app://reset-password?token=opaqueResetToken123456&otp=999999');
  assert.deepEqual(validReset, { route: 'reset-password', token: 'opaqueResetToken123456' });

  const badScheme = parseSafeDeepLink('https://evil.example.com/friends');
  assert.equal(badScheme, null);

  const badRoute = parseSafeDeepLink('com.expensio.app://admin-bypass');
  assert.equal(badRoute, null);
});

test('OTP processing supports paste, backspace, errored-code overwrite, and countdown formatting', () => {
  assert.equal(processOtpTextChange('', '482910', false, 6), '482910');
  assert.equal(processOtpTextChange('', ' 482-910 ', false, 6), '482910');
  assert.equal(processOtpTextChange('482910', '48291', false, 6), '48291');
  // Typing a new digit while errored replaces the failed 6-digit code smoothly
  assert.equal(processOtpTextChange('123456', '1234567', true, 6), '7');

  assert.equal(formatCountdown(42), '0:42');
  assert.equal(formatCountdown(5), '0:05');
  assert.equal(formatCountdown(0), '0:00');
});

test('Error normalization handles offline, timeout, 429 Retry-After, lockout, OTP, 401 non-enumeration, and 5xx', () => {
  assert.equal(parseRetryAfterHeader('45'), 45);
  const futureDate = new Date(Date.now() + 30_000).toUTCString();
  const parsedDate = parseRetryAfterHeader(futureDate);
  assert.ok(typeof parsedDate === 'number' && parsedDate >= 25 && parsedDate <= 35);

  const offline = normalizeAuthError(new ApiError({ message: 'Network request failed', status: 0 }), 'login');
  assert.equal(offline.kind, 'offline');

  const timeout = normalizeAuthError(new ApiError({ message: 'Request timed out', status: 408 }), 'login');
  assert.equal(timeout.kind, 'timeout');

  const rateLimited = normalizeAuthError(
    new ApiError({ message: 'Too many attempts', status: 429, retryAfterSeconds: 42 }),
    'otp',
  );
  assert.equal(rateLimited.kind, 'rate_limit');
  assert.equal(rateLimited.retryAfterSeconds, 42);
  assert.match(rateLimited.message, /0:42/);

  const lockout = normalizeAuthError(
    new ApiError({ message: 'Account locked after too many attempts', status: 423 }),
    'otp',
  );
  assert.equal(lockout.kind, 'lockout');
  assert.equal(lockout.isLockedOut, true);

  const expiredOtp = normalizeAuthError(new ApiError({ message: 'Verification code expired', status: 400 }), 'otp');
  assert.equal(expiredOtp.kind, 'expired_otp');

  const badLogin = normalizeAuthError(new ApiError({ message: 'User not found', status: 401 }), 'login');
  assert.equal(badLogin.kind, 'invalid_credentials');
  assert.doesNotMatch(badLogin.message, /not found/i);

  const serverErr = normalizeAuthError(new ApiError({ message: 'Internal server error', status: 503 }), 'signup');
  assert.equal(serverErr.kind, 'server');
});

test('Status bar switching maps surfaces accurately for dark, light, and lime', () => {
  assert.equal(getStatusBarStyleForSurface('dark'), 'light');
  assert.equal(getStatusBarStyleForSurface('light'), 'dark');
  assert.equal(getStatusBarStyleForSurface('lime'), 'dark');
  assert.equal(getAndroidSystemBarColor('dark'), colors.heroBg);
  assert.equal(getAndroidSystemBarColor('light'), colors.background);
  assert.equal(getAndroidSystemBarColor('lime'), colors.surprise);
});

test('Display text sanitizer strips RTL/zero-width spoofing and password policy checks all rules', () => {
  const dirty = 'Aarav\u202Eevil\u200B Sharma\uFEFF';
  assert.equal(sanitizeDisplayText(dirty), 'Aaravevil Sharma');

  const weak = getPasswordRequirementChecks('abc');
  assert.equal(weak.every((r) => r.met), false);

  const strong = getPasswordRequirementChecks('Str0ng!Pass');
  assert.equal(strong.every((r) => r.met), true);
});

test('SecureStore token lifecycle & Account A -> Logout -> Account B zero-leak cleanup', async () => {
  secureStoreMap.clear();
  asyncStorageMap.clear();

  // Simulate Account A signed in with tokens, draft, cached friends, and legacy insecure key
  await writeSession({
    accessToken: 'access.a.token',
    refreshToken: 'refresh.a.token',
    tokenType: 'Bearer',
    userId: 'user_A',
    email: 'alice@example.com',
  });
  await onboardingDraftService.saveDraft(
    {
      name: 'Alice Secret Draft',
      monthlyIncome: 95000,
      cashBalance: 12000,
      savingsBalance: 45000,
      preferredModuleIds: ['expenses'],
    },
    'user_A',
  );
  await writeFriendsCache(
    {
      accepted: [],
      incoming: [],
      outgoing: [],
      counts: { accepted: 0, incoming: 0, outgoing: 0, guests: 0 },
    },
    'user_A',
  );
  const legacyAccountKey = `${STORAGE_KEYS.localAccountPrefix}alice_example.com`;
  const legacyOtpKey = `${STORAGE_KEYS.localOtpPrefix}email_alice_example.com`;
  await writeText(legacyAccountKey, JSON.stringify({ email: 'alice@example.com', password: 'plaintext' }));
  await writeText(legacyOtpKey, JSON.stringify({ code: '123456' }));
  await writeText(STORAGE_KEYS.emailVerification, JSON.stringify({ email: 'alice@example.com', code: '123456' }));

  // Confirm session lives in SecureStore
  assert.ok(secureStoreMap.has(STORAGE_KEYS.session));
  assert.equal((await readSession())?.userId, 'user_A');

  // Perform full persisted cleanup on logout / account switch
  await clearPersistedUserSession({
    ownerId: 'user_A',
    email: 'alice@example.com',
    phone: '+919000000001',
  });

  // Assert zero Account A state remains in SecureStore or scoped caches
  assert.equal(await readSession(), null);
  const draftA = await onboardingDraftService.getDraft('user_A');
  const draftB = await onboardingDraftService.getDraft('user_B');
  assert.equal(draftA.firstName, '');
  assert.equal(draftA.incomeRupees, '');
  assert.equal(draftB.firstName, '');
  assert.equal(draftB.incomeRupees, '');
  assert.equal(await readFriendsCache('user_A'), null);
  assert.equal(await readText(legacyAccountKey), null);
  assert.equal(await readText(legacyOtpKey), null);
  assert.equal(await readText(STORAGE_KEYS.emailVerification), null);
});

test('Friends 250-item partition & search benchmark completes within UI frame budget', () => {
  const dataset = Array.from({ length: 250 }, (_, index) => ({
    friendshipId: `fr_${index}`,
    status: index < 230 ? 'ACCEPTED' : 'PENDING',
    direction: index < 230 ? 'NONE' : index < 240 ? 'INCOMING' : 'OUTGOING',
    person: {
      id: `user_${index}`,
      displayName: `Friend Person ${index}`,
      username: `person_${index}`,
      avatarId: null,
      isGuest: false,
    },
    createdAt: '2026-01-01T00:00:00Z',
  }));
  const start = performance.now();
  const partitioned = partitionFriendships(dataset);
  const filtered = filterFriendshipsByQuery(partitioned.accepted, 'person_19');
  const elapsedMs = performance.now() - start;
  assert.equal(partitioned.accepted.length, 230);
  assert.ok(filtered.length >= 1);
  assert.ok(elapsedMs < 25, `Expected <25ms for 250-item partition+filter, got ${elapsedMs.toFixed(2)}ms`);
});

test('ApiClient executes single-flight refresh on concurrent 401s and clears session when refresh fails', async () => {
  secureStoreMap.clear();
  asyncStorageMap.clear();
  await writeSession({
    accessToken: 'expired.access',
    refreshToken: 'valid.refresh',
    tokenType: 'Bearer',
    userId: 'user_A',
  });

  const client = new ApiClient('https://api.example.test', 5000);
  const origFetch = globalThis.fetch;
  let refreshCount = 0;

  try {
    globalThis.fetch = async (url, init) => {
      const target = String(url);
      if (target.endsWith('/v1/auth/refresh')) {
        refreshCount += 1;
        return new Response(
          JSON.stringify({
            success: true,
            data: { accessToken: 'fresh.access', refreshToken: 'rotated.refresh' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      const authHeader = init?.headers?.Authorization;
      if (authHeader === 'Bearer expired.access') {
        return new Response(JSON.stringify({ message: 'Expired token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      assert.equal(authHeader, 'Bearer fresh.access');
      return new Response(JSON.stringify({ success: true, data: { ok: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const [res1, res2] = await Promise.all([
      client.get('/v1/friends'),
      client.get('/v1/dashboard'),
    ]);

    assert.equal(res1.success, true);
    assert.equal(res2.success, true);
    assert.equal(refreshCount, 1);
    const updatedSession = await readSession();
    assert.equal(updatedSession?.accessToken, 'fresh.access');
    assert.equal(updatedSession?.refreshToken, 'rotated.refresh');

    // Now test 401 when refresh itself rejects -> clears session & notifies listeners
    let unauthorizedFired = 0;
    const unsub = client.onUnauthorized(() => {
      unauthorizedFired += 1;
    });
    globalThis.fetch = async (url) => {
      if (String(url).endsWith('/v1/auth/refresh')) {
        return new Response(JSON.stringify({ message: 'Invalid refresh token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    await assert.rejects(() => client.get('/v1/friends'), (err) => err instanceof ApiError && err.status === 401);
    assert.equal(unauthorizedFired, 1);
    assert.equal(await readSession(), null);
    unsub();
  } finally {
    globalThis.fetch = origFetch;
  }
});

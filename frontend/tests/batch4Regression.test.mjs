import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, '..');
const srcDir = path.join(frontendDir, 'src');
const distDir = path.resolve(frontendDir, '.test-dist/cjs');
const originalLoad = Module._load;

const asyncStorageMap = new Map();
const asyncStorageAdapter = {
  getItem: async (k) => (asyncStorageMap.has(k) ? asyncStorageMap.get(k) : null),
  setItem: async (k, v) => { asyncStorageMap.set(k, String(v)); },
  removeItem: async (k) => { asyncStorageMap.delete(k); },
  multiRemove: async (keys) => { keys.forEach((k) => asyncStorageMap.delete(k)); },
  getAllKeys: async () => Array.from(asyncStorageMap.keys()),
};
const secureStoreMap = new Map();

Module._load = function patchedLoad(request, parent, isMain) {
  if (request === '@react-native-async-storage/async-storage') {
    return { __esModule: true, default: asyncStorageAdapter, ...asyncStorageAdapter };
  }
  if (request === 'expo-secure-store') {
    return {
      getItemAsync: async (k) => (secureStoreMap.has(k) ? secureStoreMap.get(k) : null),
      setItemAsync: async (k, v) => { secureStoreMap.set(k, String(v)); },
      deleteItemAsync: async (k) => { secureStoreMap.delete(k); },
    };
  }
  if (request === 'react-native') {
    return {
      Platform: { OS: 'ios' },
      StyleSheet: { create: (s) => s, hairlineWidth: 1, absoluteFill: {} },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

globalThis.__DEV__ = false;

const req = Module.createRequire(import.meta.url);
const loadDist = (relPath) => req(path.join(distDir, relPath));

function walkTsFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkTsFiles(p, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

test('F-06: AuthEntry wires Google Sign-In to authenticateGoogle and Terms/Privacy have active handlers', async () => {
  const authEntrySrc = fs.readFileSync(path.join(srcDir, 'screens/auth/AuthEntryScreen.tsx'), 'utf8');
  const mobileLoginSrc = fs.readFileSync(path.join(srcDir, 'screens/auth/MobileLoginScreen.tsx'), 'utf8');

  // Verify Google Sign-In wiring in AuthEntryScreen (not dead code) and empty GOOGLE_CLIENT_ID hides button
  assert.match(authEntrySrc, /authenticateGoogle/, 'AuthEntryScreen must wire authenticateGoogle');
  assert.match(authEntrySrc, /Continue with Google/, 'AuthEntryScreen must render Continue with Google CTA');
  assert.match(
    authEntrySrc,
    /hasGoogleClientId\s*=\s*ENV\.GOOGLE_CLIENT_ID\.trim\(\)\.length\s*>\s*0/,
    'AuthEntryScreen must hide Google Sign-In button when GOOGLE_CLIENT_ID is empty/whitespace',
  );
  assert.match(authEntrySrc, /hasGoogleClientId\s*\?\s*\(/, 'GoogleSignInButton must be gated on hasGoogleClientId');

  // Verify Terms & Privacy links are not dead <Text> elements without onPress
  for (const [label, src] of [['AuthEntryScreen', authEntrySrc], ['MobileLoginScreen', mobileLoginSrc]]) {
    assert.match(
      src,
      /onPress=\{[^}]+\}[^>]*>Terms<\/Text>/,
      `${label} Terms link must have an active onPress handler`,
    );
    assert.match(
      src,
      /onPress=\{[^}]+\}[^>]*>Privacy Policy<\/Text>/,
      `${label} Privacy Policy link must have an active onPress handler`,
    );
  }

  // Verify real authenticateGoogle contract call (transport mock only)
  const { authenticateGoogle } = loadDist('services/authApi.js');
  const origFetch = globalThis.fetch;
  try {
    let calledUrl = '';
    globalThis.fetch = async (url) => {
      calledUrl = String(url);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            accessToken: 'jwt-google-access',
            refreshToken: 'jwt-google-refresh',
            isProfileComplete: true,
            user: { id: 'u-google-1', name: 'Asha Rao', email: 'asha@example.com' },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    };
    const res = await authenticateGoogle('id-tok-123');
    assert.ok(calledUrl.endsWith('/v1/auth/google'));
    assert.equal(res.token, 'jwt-google-access');
    assert.equal(res.user?.id, 'u-google-1');
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('F-09: Linking listeners are wired through parseSafeDeepLink with auth gate and ownership check', () => {
  const rootNavSrc = fs.readFileSync(path.join(srcDir, 'navigation/RootNavigator.tsx'), 'utf8');
  assert.match(rootNavSrc, /Linking\.getInitialURL/, 'RootNavigator must read initial deep link via Linking.getInitialURL');
  assert.match(rootNavSrc, /Linking\.addEventListener\(['"]url['"]/, 'RootNavigator must subscribe to url events');
  assert.match(rootNavSrc, /parseSafeDeepLink/, 'RootNavigator must validate URLs through parseSafeDeepLink');

  const deepLinkMod = loadDist('utils/deepLink.js');
  assert.equal(
    typeof deepLinkMod.resolveDeepLinkNavigation,
    'function',
    'utils/deepLink must export resolveDeepLinkNavigation for auth-gated + ownership-checked dispatch',
  );

  // Unauthenticated protected routes must be queued, never bypass auth
  const queued = deepLinkMod.resolveDeepLinkNavigation('com.expensio.app://splits?splitId=sp-1', {
    isAuthenticated: false,
    friendsEnabled: true,
    ownedSplitIds: new Set(['sp-1']),
  });
  assert.equal(queued.kind, 'queue');

  // Unauthenticated reset-password deep link routes directly to reset_password with sanitized token
  const reset = deepLinkMod.resolveDeepLinkNavigation(
    'com.aptech.expensio.app://reset-password?token=valid_reset_token_123456',
    {
      isAuthenticated: false,
      friendsEnabled: false,
      ownedSplitIds: new Set(),
    },
  );
  assert.deepEqual(reset, {
    kind: 'auth_phase',
    phase: 'reset_password',
    token: 'valid_reset_token_123456',
  });

  // app.json and AuthEntry must use com.aptech.expensio.app consistently
  const appJson = JSON.parse(fs.readFileSync(path.join(frontendDir, 'app.json'), 'utf8'));
  assert.equal(appJson.expo.scheme, 'com.aptech.expensio.app');
  assert.equal(appJson.expo.ios.bundleIdentifier, 'com.aptech.expensio.app');
  assert.equal(appJson.expo.android.package, 'com.aptech.expensio.app');

  // Authenticated split deep link enforces ownership check
  const ownedSplit = deepLinkMod.resolveDeepLinkNavigation('com.expensio.app://splits?splitId=sp-owned', {
    isAuthenticated: true,
    friendsEnabled: false,
    ownedSplitIds: new Set(['sp-owned']),
  });
  assert.deepEqual(ownedSplit, {
    kind: 'navigate_main',
    screen: 'Split',
    params: { screen: 'SplitDetail', params: { splitId: 'sp-owned' } },
  });

  const foreignSplit = deepLinkMod.resolveDeepLinkNavigation('com.expensio.app://splits?splitId=sp-foreign', {
    isAuthenticated: true,
    friendsEnabled: false,
    ownedSplitIds: new Set(['sp-owned']),
  });
  assert.deepEqual(foreignSplit, {
    kind: 'navigate_main',
    screen: 'Split',
    params: { screen: 'SplitHome' },
  });

  // Friends deep link respects FRIENDS_ENABLED flag
  const friendsBlocked = deepLinkMod.resolveDeepLinkNavigation('com.expensio.app://friends', {
    isAuthenticated: true,
    friendsEnabled: false,
    ownedSplitIds: new Set(),
  });
  assert.deepEqual(friendsBlocked, { kind: 'ignore' });
});

test('F-13: EmailChangeScreen has synchronous double-submit ref locks and local-only email mutation is disabled', async () => {
  const emailChangeSrc = fs.readFileSync(path.join(srcDir, 'screens/home/EmailChangeScreen.tsx'), 'utf8');
  const appCtxSrc = fs.readFileSync(path.join(srcDir, 'context/AppContext.tsx'), 'utf8');
  const profileSrc = fs.readFileSync(path.join(srcDir, 'screens/home/ProfileScreen.tsx'), 'utf8');

  assert.match(emailChangeSrc, /sendingRef\s*=\s*useRef/, 'EmailChangeScreen must guard sendCode with sendingRef');
  assert.match(emailChangeSrc, /verifyingRef\s*=\s*useRef/, 'EmailChangeScreen must guard verifyCode with verifyingRef');

  const emailSvc = loadDist('services/emailChangeService.js');
  assert.equal(emailSvc.EMAIL_CHANGE_ENABLED, false, 'EMAIL_CHANGE_ENABLED must be false until backend supports email change');
  assert.equal(typeof emailSvc.createSingleFlightGuard, 'function', 'createSingleFlightGuard helper must exist');

  // Verify double-submit guard drops concurrent second invocation synchronously
  const guard = emailSvc.createSingleFlightGuard();
  let runs = 0;
  let releaseFirst;
  const firstCall = guard.run(() => new Promise((resolve) => {
    runs += 1;
    releaseFirst = resolve;
  }));
  const secondCall = guard.run(async () => {
    runs += 1;
  });
  assert.equal(runs, 1, 'Second concurrent call must not start while first is in-flight');
  releaseFirst();
  await Promise.all([firstCall, secondCall]);

  // Verify AppContext updateProfileEmail, ProfileScreen, and MainTabs honor EMAIL_CHANGE_ENABLED gate
  assert.match(appCtxSrc, /EMAIL_CHANGE_ENABLED/, 'AppContext must check EMAIL_CHANGE_ENABLED');
  assert.match(profileSrc, /EMAIL_CHANGE_ENABLED/, 'ProfileScreen must gate EmailChange navigation by EMAIL_CHANGE_ENABLED');
  const mainTabsSrc = fs.readFileSync(path.join(srcDir, 'navigation/MainTabs.tsx'), 'utf8');
  assert.match(
    mainTabsSrc,
    /EMAIL_CHANGE_ENABLED\s*\?\s*<Tab\.Screen name="EmailChange"/,
    'MainTabs must gate EmailChange route registration by EMAIL_CHANGE_ENABLED',
  );
});

test('F-17: dead files removed, ScreenHeader & ScreenStatusBar unified, tokens & per-weight Android fonts enforced', () => {
  // Dead files and shim must be deleted
  const removedFiles = [
    'components/GuestEditorSheet.tsx',
    'components/BalanceCard.tsx',
    'components/MonthlyOverviewCard.tsx',
    'components/JourneyTimeline.tsx',
    'screens/split/FriendsScreen.tsx',
  ];
  for (const rel of removedFiles) {
    assert.equal(fs.existsSync(path.join(srcDir, rel)), false, `${rel} should be deleted`);
  }

  // SplitStack must import FriendsScreen directly from screens/friends/FriendsScreen
  const splitStackSrc = fs.readFileSync(path.join(srcDir, 'navigation/SplitStack.tsx'), 'utf8');
  assert.match(splitStackSrc, /\.\.\/screens\/friends\/FriendsScreen/);

  // Shared header and status bar across Profile, ModuleLanding, CreateSplit, SplitDetail
  for (const rel of [
    'screens/home/ProfileScreen.tsx',
    'screens/home/ModuleLandingScreen.tsx',
    'screens/split/CreateSplitScreen.tsx',
    'screens/split/SplitDetailScreen.tsx',
  ]) {
    const content = fs.readFileSync(path.join(srcDir, rel), 'utf8');
    assert.match(content, /<ScreenHeader/, `${rel} must render ScreenHeader`);
    assert.match(content, /<ScreenStatusBar/, `${rel} must render ScreenStatusBar`);
  }

  // Theme tokens standardized and no typography preset pairs fontWeight with fontFamily
  const { layout, typography } = loadDist('theme/index.js');
  assert.equal(layout.screenMargin, 20);
  assert.equal(layout.inputHeight, 56);
  assert.equal(layout.buttonHeight, 56);
  assert.equal(layout.authButtonHeight, undefined, 'authButtonHeight should be removed in favor of standardized buttonHeight (56)');
  for (const [name, preset] of Object.entries(typography)) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(preset, 'fontWeight'),
      false,
      `typography.${name} must omit fontWeight on custom PlusJakartaSans fontFamily for Android`,
    );
  }

  // No fontWeight or authButtonHeight overrides anywhere in src/
  const allFiles = walkTsFiles(srcDir);
  for (const file of allFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(srcDir, file);
    assert.doesNotMatch(src, /\bfontWeight\s*:/, `${rel} must use fontFamilies.* instead of fontWeight`);
    assert.doesNotMatch(src, /authButtonHeight/, `${rel} must not use authButtonHeight`);
  }
});

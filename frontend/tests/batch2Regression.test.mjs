import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, '..');
const distDir = path.resolve(frontendDir, '.test-dist/cjs');

const asyncStorageMap = new Map();
const secureStoreMap = new Map();
const originalLoad = Module._load;

function createElementTree(type, props, ...children) {
  return {
    type,
    props: {
      ...(props || {}),
      children: children.length === 1 ? children[0] : children.length > 1 ? children : props?.children,
    },
  };
}

function collectNodes(node, predicate, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const child of node) collectNodes(child, predicate, out);
    return out;
  }
  if (predicate(node)) out.push(node);
  if (node.props?.children !== undefined) {
    collectNodes(node.props.children, predicate, out);
  }
  return out;
}

Module._load = function patchedLoad(request, parent, isMain) {
  if (request === '@react-native-async-storage/async-storage') {
    const adapter = {
      getItem: async (k) => (asyncStorageMap.has(k) ? asyncStorageMap.get(k) : null),
      setItem: async (k, v) => { asyncStorageMap.set(k, String(v)); },
      removeItem: async (k) => { asyncStorageMap.delete(k); },
      getAllKeys: async () => Array.from(asyncStorageMap.keys()),
      multiRemove: async (keys) => { for (const k of keys) asyncStorageMap.delete(k); },
    };
    return { __esModule: true, default: adapter, ...adapter };
  }
  if (request === 'expo-secure-store') {
    return {
      getItemAsync: async (k) => (secureStoreMap.has(k) ? secureStoreMap.get(k) : null),
      setItemAsync: async (k, v) => { secureStoreMap.set(k, String(v)); },
      deleteItemAsync: async (k) => { secureStoreMap.delete(k); },
    };
  }
  if (request === 'react') {
    const ReactStub = {
      createElement: createElementTree,
      memo: (c) => c,
      useEffect: () => {},
      useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
      useRef: (init) => ({ current: init }),
      useCallback: (fn) => fn,
      useMemo: (fn) => fn(),
      Fragment: 'Fragment',
    };
    return { __esModule: true, default: ReactStub, ...ReactStub };
  }
  if (request === 'react-native-svg') {
    const SvgStub = {
      __esModule: true,
      default: 'Svg',
      Circle: 'Circle',
      Path: 'Path',
      Rect: 'Rect',
      G: 'G',
    };
    return SvgStub;
  }
  if (request === 'react-native') {
    return {
      Platform: { OS: 'ios' },
      processColor: (c) => c,
      StyleSheet: {
        create: (s) => s,
        hairlineWidth: 1,
        absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
      },
      View: 'View',
      Text: 'Text',
      Image: 'Image',
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

globalThis.__DEV__ = true;

const req = Module.createRequire(import.meta.url);
const loadDist = (relPath) => req(path.join(distDir, relPath));

test('F-05: Avatar renders chosen CartoonAvatar presetId for guests & friends and initials when null', () => {
  const { Avatar } = loadDist('components/Avatar.js');
  const { CartoonAvatar } = loadDist('components/CartoonAvatar.js');

  const guestWithPreset = Avatar({
    id: 'g-1',
    name: 'Roommate Rohan',
    presetId: 'maya',
    size: 44,
    isGuest: true,
  });

  const cartoonNodes = collectNodes(guestWithPreset, (n) => n.type === CartoonAvatar);
  assert.equal(cartoonNodes.length, 1, 'Expected Avatar to render CartoonAvatar when presetId is provided');
  assert.equal(cartoonNodes[0].props.id, 'maya');

  const guestNoPreset = Avatar({
    id: 'g-2',
    name: 'Guest No Preset',
    presetId: null,
    size: 44,
    isGuest: true,
  });
  assert.equal(collectNodes(guestNoPreset, (n) => n.type === CartoonAvatar).length, 0);
  const textNodes = collectNodes(guestNoPreset, (n) => n.type === 'Text');
  assert.equal(textNodes[0].props.children, 'GN');
});

test('F-05: getAccountDataOwner unifies owner ID for email-only, phone-only, and UUID profiles', () => {
  const friendsStore = loadDist('services/friendsStore.js');
  assert.equal(
    typeof friendsStore.getAccountDataOwner,
    'function',
    'Expected getAccountDataOwner to be exported from friendsStore.ts',
  );

  const emailOwner = friendsStore.getAccountDataOwner({ email: 'Alice@Example.com', phone: '' });
  const phoneOwner = friendsStore.getAccountDataOwner({ email: '', phone: '+919876543210' });
  const uuidOwner = friendsStore.getAccountDataOwner({ id: 'uuid-999', email: 'Alice@Example.com', phone: '' });

  assert.equal(emailOwner, 'alice_example.com');
  assert.equal(phoneOwner, '_919876543210');
  assert.equal(uuidOwner, 'uuid-999');

  const emailGuest = {
    friendshipId: 'fr-g1',
    status: 'ACCEPTED',
    direction: 'NONE',
    person: { id: 'g1', displayName: 'Guest 1', username: 'g1', avatarId: 'maya', isGuest: true, ownerUserId: emailOwner },
    createdAt: '2026-11-24T00:00:00Z',
  };
  assert.equal(friendsStore.isGuestOwnedByUser(emailGuest, emailOwner), true);
  assert.equal(friendsStore.isGuestOwnedByUser(emailGuest, phoneOwner), false);

  const friendsScreenSrc = fs.readFileSync(path.join(frontendDir, 'src/screens/friends/FriendsScreen.tsx'), 'utf8');
  assert.match(friendsScreenSrc, /getAccountDataOwner\(/, 'FriendsScreen must use shared getAccountDataOwner');
  assert.doesNotMatch(
    friendsScreenSrc,
    /profile\?\.phone \|\| profile\?\.email\?\.toLowerCase\(\)/,
    'FriendsScreen must not compute unsanitized ownerId inline',
  );
});

test('F-08: onboarding blocks offline progression, sends countryCode, omits empty email, and uses Avatar instead of emoji fallback', async () => {
  const profileSetupSrc = fs.readFileSync(path.join(frontendDir, 'src/screens/setup/ProfileSetupScreen.tsx'), 'utf8');
  const dashboardSrc = fs.readFileSync(path.join(frontendDir, 'src/screens/home/DashboardScreen.tsx'), 'utf8');
  const profileSrc = fs.readFileSync(path.join(frontendDir, 'src/screens/home/ProfileScreen.tsx'), 'utf8');
  const avatarsSrc = fs.readFileSync(path.join(frontendDir, 'src/data/avatars.ts'), 'utf8');

  assert.doesNotMatch(
    profileSetupSrc,
    /isNetworkError\)\s*\{\s*setStep\(/,
    'ProfileSetupScreen must not advance steps on network error',
  );
  assert.doesNotMatch(avatarsSrc, /emoji:\s*['"]👤['"]/, 'data/avatars.ts must not map cartoon avatars to 👤 emoji');
  assert.doesNotMatch(dashboardSrc, /avatar\.emoji/, 'DashboardScreen must not render emoji fallback');
  assert.doesNotMatch(profileSrc, /avatar\.emoji/, 'ProfileScreen must not render emoji fallback');

  // Verify completeOnboarding payload omits empty email and forwards countryCode
  const { onboardingApi } = loadDist('services/api/onboardingApi.js');
  const { completeOnboarding } = loadDist('services/authApi.js');

  const capturedCalls = [];
  const origUpdateProfile = onboardingApi.updateProfile;
  const origUpdateEmp = onboardingApi.updateEmployment;
  const origUpdateFin = onboardingApi.updateFinancialProfile;
  const origComplete = onboardingApi.completeOnboarding;

  onboardingApi.updateProfile = async (payload) => {
    capturedCalls.push(payload);
    return { success: true, message: 'ok', data: {} };
  };
  onboardingApi.updateEmployment = async () => ({ success: true, message: 'ok', data: {} });
  onboardingApi.updateFinancialProfile = async () => ({ success: true, message: 'ok', data: {} });
  onboardingApi.completeOnboarding = async () => ({
    success: true,
    message: 'ok',
    data: {
      username: 'rahul_1',
      accessToken: 'acc',
      refreshToken: 'ref',
      tokenType: 'APPLICATION',
      user: { id: 'uuid-1', name: 'Rahul Rao', phone: '9876543210' },
    },
  });

  try {
    await completeOnboarding({
      firstName: 'Rahul',
      lastName: 'Rao',
      email: '',
      phone: '9876543210',
      countryCode: '+91',
      employmentType: 'salaried',
      incomeAmountMinor: '5000000',
      cashBalanceMinor: '100000',
      savingsAmountMinor: '200000',
      currency: 'INR',
      avatarId: 'oliver',
    });
    assert.equal(capturedCalls.length, 1);
    assert.equal(capturedCalls[0].email, undefined, 'Empty email must be omitted (undefined), not ""');
    assert.equal(capturedCalls[0].countryCode, '+91', 'countryCode must be forwarded in onboarding profile payload');
  } finally {
    onboardingApi.updateProfile = origUpdateProfile;
    onboardingApi.updateEmployment = origUpdateEmp;
    onboardingApi.updateFinancialProfile = origUpdateFin;
    onboardingApi.completeOnboarding = origComplete;
  }
});

test('F-07 & F-14: ResetPassword defaults to token mode, OtpScreen uses ref guards, and MobileLogin forwards cooldown', () => {
  const resetSrc = fs.readFileSync(path.join(frontendDir, 'src/screens/auth/ResetPasswordScreen.tsx'), 'utf8');
  const otpSrc = fs.readFileSync(path.join(frontendDir, 'src/screens/auth/OtpScreen.tsx'), 'utf8');
  const mobileSrc = fs.readFileSync(path.join(frontendDir, 'src/screens/auth/MobileLoginScreen.tsx'), 'utf8');

  assert.match(
    resetSrc,
    /useState<RecoveryCredentialMode>\(['"]token['"]\)/,
    'ResetPasswordScreen must default credentialMode to token',
  );
  assert.match(otpSrc, /lockedOutRef/, 'OtpScreen must track lockout via lockedOutRef');
  assert.match(otpSrc, /isResendingRef/, 'OtpScreen must guard resend via isResendingRef');
  assert.match(mobileSrc, /resendCooldownSeconds/, 'MobileLoginScreen must forward resendCooldownSeconds from server response');
});

test('F-10: SplitHome navigation target, BottomNavigation global Add wiring, and removal toast order', async () => {
  const friendsScreenSrc = fs.readFileSync(path.join(frontendDir, 'src/screens/friends/FriendsScreen.tsx'), 'utf8');
  const bottomNavSrc = fs.readFileSync(path.join(frontendDir, 'src/components/BottomNavigation.tsx'), 'utf8');
  const appContextSrc = fs.readFileSync(path.join(frontendDir, 'src/context/AppContext.tsx'), 'utf8');

  assert.doesNotMatch(
    friendsScreenSrc,
    /navigation\.navigate\(['"]Split['"]\s+as\s+never\)/,
    'FriendsScreen must not navigate to bare Split tab without SplitHome screen target',
  );
  assert.match(
    bottomNavSrc,
    /triggerGlobalAddFriend/,
    'BottomNavigation must wire triggerGlobalAddFriend when Friends is active',
  );

  // Check removeFriend refreshes before showing success toast
  const removeBlockMatch = appContextSrc.match(/removeFriend:\s*async[\s\S]*?finally\s*\{/);
  assert.ok(removeBlockMatch, 'removeFriend block not found');
  const refreshIdx = removeBlockMatch[0].indexOf("await refreshFriendsInternal('mutation')");
  const toastIdx = removeBlockMatch[0].indexOf("showToast('success', 'Friend removed");
  assert.ok(refreshIdx !== -1 && toastIdx !== -1 && refreshIdx < toastIdx, 'removeFriend must await refresh before showing success toast');

  // Verify real React Navigation TabRouter + StackRouter behavior when Friends is inside SplitStack
  const { StackRouter, TabRouter, CommonActions } = await import('@react-navigation/routers');
  const splitRouter = StackRouter({});
  const splitOpts = {
    routeNames: ['SplitHome', 'Friends', 'CreateSplit', 'SplitDetail'],
    routeParamList: {},
    routeGetIdList: {},
  };
  const splitStart = splitRouter.getInitialState(splitOpts);
  const pushedFriends = splitRouter.getStateForAction(
    splitStart,
    CommonActions.navigate('Friends'),
    splitOpts,
  );
  assert.equal(pushedFriends.routes[pushedFriends.index].name, 'Friends');
  const afterSplitHomeNav = splitRouter.getStateForAction(
    pushedFriends,
    CommonActions.navigate('SplitHome'),
    splitOpts,
  );
  assert.equal(
    afterSplitHomeNav.routes[afterSplitHomeNav.index].name,
    'SplitHome',
    'Navigating to SplitHome from Friends inside SplitStack must land on SplitHome',
  );

  const tabRouter = TabRouter({});
  const tabOpts = {
    routeNames: ['Home', 'Split', 'Friends'],
    routeParamList: {},
    routeGetIdList: {},
  };
  const tabStart = tabRouter.getInitialState(tabOpts);
  const onFriendsTab = tabRouter.getStateForAction(tabStart, CommonActions.navigate('Friends'), tabOpts);
  assert.equal(onFriendsTab.routes[onFriendsTab.index].name, 'Friends');
  const afterTabNav = tabRouter.getStateForAction(
    onFriendsTab,
    CommonActions.navigate('Split', { screen: 'SplitHome' }),
    tabOpts,
  );
  assert.equal(afterTabNav.routes[afterTabNav.index].name, 'Split');
  assert.equal(afterTabNav.routes[afterTabNav.index].params?.screen, 'SplitHome');
});

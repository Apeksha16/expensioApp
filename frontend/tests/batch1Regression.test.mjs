import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, '..');
const distDir = path.resolve(frontendDir, '.test-dist/cjs');

const secureStoreMap = new Map();
const asyncStorageMap = new Map();
const webLocalStorageMap = new Map();
const mockPlatform = { OS: 'ios' };
const originalLoad = Module._load;

globalThis.localStorage = {
  getItem: (k) => (webLocalStorageMap.has(k) ? webLocalStorageMap.get(k) : null),
  setItem: (k, v) => {
    webLocalStorageMap.set(k, String(v));
  },
  removeItem: (k) => {
    webLocalStorageMap.delete(k);
  },
};

Module._load = function patchedLoad(request, parent, isMain) {
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
  if (request === 'react') {
    return {
      default: { createElement: () => null, memo: (c) => c },
      createElement: () => null,
      memo: (c) => c,
    };
  }
  if (request === 'react-native-svg') {
    return { default: 'Svg', Circle: 'Circle', Path: 'Path', Rect: 'Rect', G: 'G' };
  }
  if (request === 'react-native') {
    return {
      Platform: mockPlatform,
      processColor: (c) => c,
      StyleSheet: { create: (s) => s, hairlineWidth: 1, absoluteFill: {} },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

globalThis.__DEV__ = true;

const req = Module.createRequire(import.meta.url);
const loadDist = (relPath) => req(path.join(distDir, relPath));

function resetStores() {
  secureStoreMap.clear();
  asyncStorageMap.clear();
  webLocalStorageMap.clear();
}

test('F-02: bulk app data routes to AsyncStorage, session stays in SecureStore, web tokens never hit localStorage', async () => {
  resetStores();
  mockPlatform.OS = 'ios';

  const { STORAGE_KEYS, readJson, writeJson } = loadDist('core/storage/localPersistence.js');
  const { readSession, writeSession } = loadDist('core/storage/session.js');
  const { readLocalData, writeLocalData } = loadDist('core/storage/localData.js');
  const { writeFriendsCache, readFriendsCache } = loadDist('services/api/friendsApi.js');

  await writeSession({
    accessToken: 'jwt.access.token',
    refreshToken: 'jwt.refresh.token',
    isProfileComplete: true,
    dataOwnerId: 'owner_a',
  });

  // Large payload: 220 friends + 1200 transactions (~200+ KB)
  const manyTransactions = Array.from({ length: 1200 }, (_, i) => ({
    id: `tx_${i}`,
    type: i % 2 === 0 ? 'expense' : 'income',
    merchant: `Merchant Number ${i}`,
    category: 'Food & Dining',
    icon: 'restaurant',
    iconColor: '#146B45',
    amount: 100 + i,
    date: 'Today',
    time: '10:00 AM',
    occurredAt: 1764000000000 + i,
  }));
  const manyFriendships = Array.from({ length: 220 }, (_, i) => ({
    friendshipId: `fr_${i}`,
    status: 'ACCEPTED',
    direction: 'NONE',
    person: {
      id: `user_${i}`,
      displayName: `Friend Name ${i}`,
      username: `friend_${i}`,
      avatarId: 'oliver',
      isGuest: false,
    },
    createdAt: '2026-11-20T10:00:00.000Z',
  }));

  await writeLocalData(
    {
      transactions: manyTransactions,
      friends: [],
      splits: [],
      budgets: [],
      goals: [],
      recurringPayments: [],
    },
    'owner_a',
  );
  await writeFriendsCache(
    {
      accepted: manyFriendships,
      incoming: [],
      outgoing: [],
      counts: { accepted: 220, incoming: 0, outgoing: 0, guests: 0 },
    },
    'owner_a',
  );
  await writeJson(`${STORAGE_KEYS.profileAccountPrefix}owner_a`, {
    firstName: 'Alice',
    lastName: 'Tester',
    mobile: '9876543210',
    countryCode: '+91',
    email: 'alice@example.com',
  });

  // Only session should live in SecureStore; bulk data must be in AsyncStorage
  assert.deepEqual(Array.from(secureStoreMap.keys()), [STORAGE_KEYS.session]);
  assert.ok(asyncStorageMap.size >= 3, 'Expected bulk data keys in AsyncStorage');

  const loadedData = await readLocalData('owner_a');
  assert.equal(loadedData.transactions.length, 1200);
  const loadedCache = await readFriendsCache('owner_a');
  assert.equal(loadedCache?.grouped.accepted.length, 220);

  // Web platform must never store session tokens in localStorage
  mockPlatform.OS = 'web';
  webLocalStorageMap.clear();
  await writeSession({
    accessToken: 'web.secret.jwt',
    refreshToken: 'web.secret.refresh',
    isProfileComplete: true,
  });
  assert.equal(webLocalStorageMap.size, 0, 'Session tokens must not be stored in localStorage on web');
  assert.equal((await readSession())?.accessToken, 'web.secret.jwt');
  mockPlatform.OS = 'ios';
});

test('F-02: one-time SecureStore -> AsyncStorage migration is idempotent and crash-safe', async () => {
  resetStores();
  mockPlatform.OS = 'ios';

  const persistence = loadDist('core/storage/localPersistence.js');
  assert.equal(
    typeof persistence.migrateLegacySecureStoreKeys,
    'function',
    'Expected migrateLegacySecureStoreKeys helper to exist',
  );

  const { STORAGE_KEYS } = persistence;
  const localKey = `${STORAGE_KEYS.localDataAccountPrefix}owner_m`;
  const profileKey = `${STORAGE_KEYS.profileAccountPrefix}owner_m`;
  const crashKey = `${STORAGE_KEYS.splitGroupsAccountPrefix}owner_m`;

  secureStoreMap.set(localKey, JSON.stringify({ transactions: [{ id: 't1', type: 'expense', merchant: 'Tea', category: 'Food', icon: 'cafe', iconColor: '#000', amount: 50, date: 'Today', time: '9:00 AM' }], friends: [], splits: [], budgets: [], goals: [], recurringPayments: [] }));
  secureStoreMap.set(profileKey, JSON.stringify({ firstName: 'Maya', lastName: 'Rao', mobile: '999', countryCode: '+91', email: 'maya@example.com' }));
  // Simulate partial crash: key already copied to AsyncStorage, not yet removed from SecureStore
  const crashVal = JSON.stringify([{ id: 'g1', name: 'Trip', friendIds: ['f1'], createdAt: 1700000000000 }]);
  asyncStorageMap.set(crashKey, crashVal);
  secureStoreMap.set(crashKey, crashVal);

  await persistence.migrateLegacySecureStoreKeys('owner_m');

  assert.equal(secureStoreMap.has(localKey), false);
  assert.equal(secureStoreMap.has(profileKey), false);
  assert.equal(secureStoreMap.has(crashKey), false);
  assert.ok(asyncStorageMap.has(localKey));
  assert.ok(asyncStorageMap.has(profileKey));
  assert.equal(asyncStorageMap.get(crashKey), crashVal);

  // Idempotent re-run does not fail or lose data
  await persistence.migrateLegacySecureStoreKeys('owner_m');
  assert.ok(asyncStorageMap.has(localKey));
});

test('F-04: logout wipes all user-scoped data and new user never inherits legacy unscoped keys', async () => {
  resetStores();
  mockPlatform.OS = 'ios';

  const { STORAGE_KEYS, writeJson, readJson } = loadDist('core/storage/localPersistence.js');
  const { writeSession, readSession } = loadDist('core/storage/session.js');
  const { readLocalData, writeLocalData } = loadDist('core/storage/localData.js');
  const { profileService } = loadDist('services/profileService.js');
  const { getSplitGroups, saveSplitGroups } = loadDist('services/splitGroupService.js');
  const { readPreferences, writePreferences } = loadDist('core/storage/preferences.js');
  const { clearPersistedUserSession, createDefaultPreferences } = loadDist('services/sessionCleanup.js');

  // Account A creates session, localData, profile, splitGroups, preferences
  await writeSession({ accessToken: 'a.jwt', refreshToken: 'a.ref', isProfileComplete: true, dataOwnerId: 'user_a' });
  await writeLocalData({
    transactions: [{ id: 'tx-a', type: 'expense', merchant: 'Coffee', category: 'Food', icon: 'cafe', iconColor: '#000', amount: 250, date: 'Today', time: '8:00 AM' }],
    friends: [],
    splits: [],
    budgets: [],
    goals: [],
    recurringPayments: [],
  }, 'user_a');
  await profileService.saveProfile({ firstName: 'Alice', lastName: 'A', mobile: '9999999999', countryCode: '+91', email: 'alice@a.com' }, 'user_a');
  await saveSplitGroups([{ id: 'grp-a', name: 'Alice Group', friendIds: ['f1'], createdAt: 1700000000000 }], 'user_a');
  await writePreferences({ ...createDefaultPreferences(), avatarId: 'zara', reportEmail: 'alice@a.com' }, 'user_a');

  await clearPersistedUserSession({ ownerId: 'user_a', email: 'alice@a.com', phone: '9999999999' });

  assert.equal(await readSession(), null);
  assert.equal((await readLocalData('user_a')).transactions.length, 0);
  assert.equal((await profileService.getProfile('user_a')).firstName, '');
  assert.equal((await getSplitGroups('user_a')).length, 0);
  assert.equal((await readPreferences('user_a')).avatarId, null);

  // Legacy unscoped keys present + new user B signup -> B must get an empty account
  await writeJson(STORAGE_KEYS.localData, {
    transactions: [{ id: 'legacy-tx', type: 'expense', merchant: 'Legacy Leak', category: 'Food', icon: 'cafe', iconColor: '#000', amount: 999, date: 'Today', time: '8:00 AM' }],
    friends: [],
    splits: [],
    budgets: [],
    goals: [],
    recurringPayments: [],
  });
  await writeJson(STORAGE_KEYS.profile, { firstName: 'LegacyUser', lastName: 'Leak', mobile: '111', countryCode: '+91', email: 'legacy@leak.com' });
  await writeJson(STORAGE_KEYS.splitGroups, [{ id: 'legacy-grp', name: 'Legacy Group', friendIds: ['f1'], createdAt: 1700000000000 }]);
  await writeJson(STORAGE_KEYS.avatar, { avatarId: 'kai' });

  const bData = await readLocalData('user_b');
  const bProfile = await profileService.getProfile('user_b');
  const bGroups = await getSplitGroups('user_b');
  const bPrefs = await readPreferences('user_b');

  assert.equal(bData.transactions.length, 0, 'New user B must not inherit legacy localData');
  assert.equal(bProfile.firstName, '', 'New user B must not inherit legacy profile');
  assert.equal(bGroups.length, 0, 'New user B must not inherit legacy splitGroups');
  assert.equal(bPrefs.avatarId, null, 'New user B must not inherit legacy avatar preference');
});

test('F-01 & F-03: Friends is release-gated via FRIENDS_ENABLED and dev/mock modules have no static release imports', () => {
  const rootNavSrc = fs.readFileSync(path.join(frontendDir, 'src/navigation/RootNavigator.tsx'), 'utf8');
  const friendsApiSrc = fs.readFileSync(path.join(frontendDir, 'src/services/api/friendsApi.ts'), 'utf8');
  const appContextSrc = fs.readFileSync(path.join(frontendDir, 'src/context/AppContext.tsx'), 'utf8');

  assert.equal(/from ['"]\.\.\/dev\/AuditPreview['"]/.test(rootNavSrc), false, 'RootNavigator must not statically import AuditPreview');
  assert.equal(/from ['"]\.\.\/dev\/auditTarget['"]/.test(rootNavSrc), false, 'RootNavigator must not statically import auditTarget');
  assert.equal(/from ['"]\.\/friendsMockAdapter['"]/.test(friendsApiSrc), false, 'friendsApi must not statically import friendsMockAdapter');
  assert.equal(/from ['"]\.\.\/services\/api\/friendsMockAdapter['"]/.test(appContextSrc), false, 'AppContext must not statically import friendsMockAdapter');

  // Verify FRIENDS_ENABLED defaults to false in production (__DEV__ = false)
  const configPath = req.resolve(path.join(distDir, 'config/friendsConfig.js'));
  const modulesPath = req.resolve(path.join(distDir, 'data/modules.js'));
  const registryPath = req.resolve(path.join(distDir, 'services/moduleRegistryService.js'));
  delete req.cache[configPath];
  delete req.cache[modulesPath];
  delete req.cache[registryPath];

  const prevDev = globalThis.__DEV__;
  try {
    globalThis.__DEV__ = false;
    const { FRIENDS_CONFIG } = req(configPath);
    const { normalizePreferredModuleIds } = req(modulesPath);
    const { moduleRegistryService } = req(registryPath);

    assert.equal(FRIENDS_CONFIG.FRIENDS_ENABLED, false, 'FRIENDS_ENABLED must be false in production');
    assert.equal(FRIENDS_CONFIG.USE_FRIENDS_MOCK, false, 'USE_FRIENDS_MOCK must be false in production');
    assert.equal(
      moduleRegistryService.getAvailableModules().some((m) => m.id === 'friends'),
      false,
      'Friends module must be hidden when FRIENDS_ENABLED is false',
    );
    assert.equal(
      normalizePreferredModuleIds(['friends', 'dashboard', 'splits', 'ledger', 'budgets']).includes('friends'),
      false,
      'normalizePreferredModuleIds must strip friends when FRIENDS_ENABLED is false',
    );
  } finally {
    globalThis.__DEV__ = prevDev;
    delete req.cache[configPath];
    delete req.cache[modulesPath];
    delete req.cache[registryPath];
  }
});

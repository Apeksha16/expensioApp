import assert from 'node:assert/strict';
import Module from 'node:module';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve(__dirname, '../.test-dist/cjs');
const req = Module.createRequire(import.meta.url);
const loadModule = (relPath) => req(path.join(buildDir, relPath));

const { ApiError } = loadModule('services/api/apiError.js');
const { isRetryableFriendsReadError, normalizeFriendsError } = loadModule('services/api/friendsErrors.js');
const { createDebouncedSearchController } = loadModule('services/friendsSearch.js');
const {
  createParticipantSnapshotMap,
  createPendingActionTracker,
  filterDefensivelyForSearch,
  filterFriendshipsByQuery,
  friendshipsToSelectableFriends,
  hashToneIndex,
  isGuestOwnedByUser,
  partitionFriendships,
  suggestUsernameSlug,
} = loadModule('services/friendsStore.js');
const { FriendsSyncController } = loadModule('services/friendsSync.js');
const { computeSplitBalances, getFriendMeta } = loadModule('utils/splits.js');
const { formatClockTime, formatCompactAge } = loadModule('utils/format.js');

function makeFriendship(overrides = {}) {
  const {
    id = 'p-1',
    name = 'Priya Sharma',
    username = 'priya_s',
    isGuest = false,
    ownerUserId = null,
    ...rest
  } = overrides;
  return {
    friendshipId: rest.friendshipId ?? `fr-${id}`,
    status: rest.status ?? 'ACCEPTED',
    direction: rest.direction ?? 'NONE',
    person: rest.person ?? {
      id,
      displayName: name,
      username,
      avatarId: 'maya',
      isGuest,
      ownerUserId,
    },
    createdAt: rest.createdAt ?? '2026-11-20T10:00:00.000Z',
    acceptedAt: rest.acceptedAt ?? '2026-11-20T11:00:00.000Z',
  };
}

test('partitionFriendships separates incoming, outgoing, and sorts accepted + guests alphabetically', () => {
  const items = [
    makeFriendship({ id: 'p1', name: 'Zoya Khan', username: 'zoya', status: 'ACCEPTED', isGuest: false }),
    makeFriendship({ id: 'g1', name: 'Arjun Guest', username: 'arjun_g', status: 'ACCEPTED', isGuest: true, ownerUserId: 'me' }),
    makeFriendship({ id: 'p2', name: 'Meera Nair', username: 'meera', status: 'ACCEPTED', isGuest: false }),
    makeFriendship({ id: 'in1', name: 'Ananya', username: 'ananya', status: 'PENDING', direction: 'INCOMING', createdAt: '2026-11-21T10:00:00.000Z' }),
    makeFriendship({ id: 'out1', name: 'Vikram', username: 'vikram', status: 'PENDING', direction: 'OUTGOING', createdAt: '2026-11-22T10:00:00.000Z' }),
  ];

  const grouped = partitionFriendships(items);
  assert.equal(grouped.counts.accepted, 3);
  assert.equal(grouped.counts.guests, 1);
  assert.equal(grouped.counts.incoming, 1);
  assert.equal(grouped.counts.outgoing, 1);
  assert.deepEqual(
    grouped.accepted.map((f) => f.person.displayName),
    ['Arjun Guest', 'Meera Nair', 'Zoya Khan'],
  );
  assert.equal(grouped.incoming[0].friendshipId, 'fr-in1');
  assert.equal(grouped.outgoing[0].friendshipId, 'fr-out1');

  const selectable = friendshipsToSelectableFriends(grouped.accepted);
  assert.equal(selectable.length, 3);
  assert.equal(selectable[0].isGuest, true);
  assert.equal(selectable[0].userId, '@arjun_g');
});

test('filterFriendshipsByQuery filters by display name, handle, and guest keyword', () => {
  const items = [
    makeFriendship({ id: 'p1', name: 'Priya Sharma', username: 'priya_s', isGuest: false }),
    makeFriendship({ id: 'g1', name: 'Rohan', username: 'rohan_roomie', isGuest: true }),
  ];

  assert.equal(filterFriendshipsByQuery(items, '@priya').length, 1);
  assert.equal(filterFriendshipsByQuery(items, 'guest').length, 1);
  assert.equal(filterFriendshipsByQuery(items, '  ').length, 2);
});

test('createPendingActionTracker prevents duplicate concurrent submissions per ID only', () => {
  const tracker = createPendingActionTracker();
  assert.equal(tracker.tryAcquire('fr-1'), true);
  assert.equal(tracker.tryAcquire('fr-1'), false);
  assert.equal(tracker.tryAcquire('fr-2'), true);
  assert.deepEqual(tracker.getIds().sort(), ['fr-1', 'fr-2']);

  tracker.release('fr-1');
  assert.equal(tracker.isPending('fr-1'), false);
  assert.equal(tracker.isPending('fr-2'), true);
  assert.equal(tracker.tryAcquire('fr-1'), true);

  tracker.clear();
  assert.deepEqual(tracker.getIds(), []);
});

test('filterDefensivelyForSearch excludes self, ineligible, and existing relationships', () => {
  const existing = [
    makeFriendship({ id: 'u-friend', name: 'Friend', username: 'friend_user' }),
  ];
  const candidates = [
    { id: 'me-1', displayName: 'Self', username: 'me_user', avatarId: null, isEligible: true, relationshipStatus: 'NONE' },
    { id: 'u-capped', displayName: 'Capped', username: 'capped', avatarId: null, isEligible: false, relationshipStatus: 'NONE' },
    { id: 'u-friend', displayName: 'Friend', username: 'friend_user', avatarId: null, isEligible: true, relationshipStatus: 'NONE' },
    { id: 'u-eligible', displayName: 'Rahul', username: 'rahul_m', avatarId: 'oliver', isEligible: true, relationshipStatus: 'NONE' },
  ];

  const filtered = filterDefensivelyForSearch(candidates, 'me-1', existing);
  assert.deepEqual(filtered.map((c) => c.id), ['u-eligible']);
});

test('isGuestOwnedByUser allows owner and blocks non-owner', () => {
  const owned = makeFriendship({ id: 'g1', isGuest: true, ownerUserId: 'user-a' });
  const other = makeFriendship({ id: 'g2', isGuest: true, ownerUserId: 'user-b' });
  const regular = makeFriendship({ id: 'p1', isGuest: false });

  assert.equal(isGuestOwnedByUser(owned, 'user-a'), true);
  assert.equal(isGuestOwnedByUser(other, 'user-a'), false);
  assert.equal(isGuestOwnedByUser(regular, 'user-a'), false);
});

test('normalizeFriendsError maps offline, timeout, 401, 403, 404, 409 debt/username, 429, 5xx', () => {
  const offline = normalizeFriendsError(new ApiError({ message: 'No connection', status: 0, isNetworkError: true }));
  assert.equal(offline.kind, 'offline');
  assert.equal(offline.action, 'retry');

  const timeout = normalizeFriendsError(new ApiError({ message: 'Request timed out', status: 408, isNetworkError: true }));
  assert.equal(timeout.kind, 'timeout');
  assert.equal(isRetryableFriendsReadError(timeout), true);

  const unauth = normalizeFriendsError(new ApiError({ message: 'Unauthorized', status: 401 }));
  assert.equal(unauth.kind, '401');
  assert.equal(unauth.action, 'relogin');
  assert.equal(isRetryableFriendsReadError(unauth), false);

  const debtBlock = normalizeFriendsError(new ApiError({
    message: 'Settle ₹450 before removing.',
    status: 409,
    code: 'UNSETTLED_OBLIGATIONS',
    data: { blockedByDebt: true, unsettledAmount: 450, splitTitle: 'Dinner' },
  }));
  assert.equal(debtBlock.kind, '409');
  assert.equal(debtBlock.action, 'view_in_splits');
  assert.equal(debtBlock.blockedByDebt, true);
  assert.equal(debtBlock.unsettledAmount, 450);

  const usernameTaken = normalizeFriendsError(new ApiError({
    message: 'Taken',
    status: 409,
    code: 'USERNAME_TAKEN',
  }));
  assert.equal(usernameTaken.fieldErrors?.username, 'Taken');

  const rateLimited = normalizeFriendsError(new ApiError({ message: 'Slow down', status: 429 }));
  assert.equal(rateLimited.kind, '429');

  const serverErr = normalizeFriendsError(new ApiError({ message: 'Bad gateway', status: 502 }));
  assert.equal(serverErr.kind, '5xx');
  assert.equal(isRetryableFriendsReadError(serverErr), true);
});

test('createDebouncedSearchController debounces, trims, aborts stale requests, and ignores stale responses', async () => {
  const calls = [];
  const signals = [];
  const resolvers = [];

  const controller = createDebouncedSearchController({
    debounceMs: 40,
    onSearch: (query, signal) => {
      calls.push(query);
      if (signal) signals.push(signal);
      return new Promise((resolve) => {
        resolvers.push(resolve);
      });
    },
    onStateChange: () => {},
  });

  // Whitespace only should not trigger search
  controller.search('   ');
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(calls.length, 0);

  // Rapid typing debounces to trimmed latest query
  controller.search('ra');
  controller.search('  rahul  ');
  await new Promise((r) => setTimeout(r, 60));
  assert.deepEqual(calls, ['rahul']);

  // Second query aborts first in-flight request
  controller.search('kavita', true);
  assert.equal(signals[0]?.aborted, true);

  // Resolve stale first request AFTER second request started -> must be ignored
  resolvers[0]([
    { id: 'stale-rahul', displayName: 'Rahul', username: 'rahul', avatarId: null, isEligible: true, relationshipStatus: 'NONE' },
  ]);
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(controller.getState().candidates.length, 0);

  // Resolve current second request -> accepted
  resolvers[1]([
    { id: 'kavita-1', displayName: 'Kavita', username: 'kavita', avatarId: null, isEligible: true, relationshipStatus: 'NONE' },
  ]);
  await new Promise((r) => setTimeout(r, 10));
  assert.deepEqual(controller.getState().candidates.map((c) => c.id), ['kavita-1']);
  assert.equal(controller.getState().searched, true);

  controller.dispose();
});

test('FriendsSyncController applies exponential backoff and stops cleanly on logout', async () => {
  const reasons = [];
  const sync = new FriendsSyncController(
    {
      onSync: async (reason) => {
        reasons.push(reason);
      },
    },
    { baseIntervalMs: 1000, maxBackoffMs: 4000 },
  );

  assert.equal(sync.getCurrentPollDelayMs(), 1000);
  sync.recordError();
  assert.equal(sync.getCurrentPollDelayMs(), 2000);
  sync.recordError();
  assert.equal(sync.getCurrentPollDelayMs(), 4000);
  sync.recordError();
  assert.equal(sync.getCurrentPollDelayMs(), 4000);
  sync.recordSuccess();
  assert.equal(sync.getCurrentPollDelayMs(), 1000);

  sync.setVisible(true);
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(reasons.includes('focus'), true);

  sync.setAppActive(false);
  sync.setAppActive(true);
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(reasons.includes('foreground'), true);

  sync.stopAll();
  sync.dispose();
});

test('Removed friends remain identifiable in historical splits and balances', () => {
  const activeFriends = friendshipsToSelectableFriends([
    makeFriendship({ id: 'f-removed', name: 'Riya Kapoor', username: 'riya_k' }),
  ]);
  const snapshots = createParticipantSnapshotMap(['me', 'f-removed'], activeFriends);

  const historicalSplit = {
    id: 'sp-1',
    title: 'Goa Dinner',
    amount: 1000,
    paidById: 'me',
    date: 'Today',
    method: 'equal',
    shares: [
      { friendId: 'me', amount: 500, settled: true },
      { friendId: 'f-removed', amount: 500, settled: false },
    ],
    participantSnapshots: snapshots,
    createdAt: Date.now(),
  };

  // Friend is now removed from active directory
  const afterRemovalFriends = friendshipsToSelectableFriends([]);
  const meta = getFriendMeta('f-removed', afterRemovalFriends, historicalSplit);
  assert.equal(meta.name, 'Riya Kapoor');
  assert.equal(meta.initials, 'RK');

  const balances = computeSplitBalances([historicalSplit], afterRemovalFriends);
  assert.equal(balances.youAreOwed, 500);
  assert.equal(balances.pending.length, 1);
  assert.equal(balances.pending[0].name, 'Riya Kapoor');
});

test('suggestUsernameSlug, hashToneIndex, and compact timestamps behave deterministically', () => {
  assert.equal(suggestUsernameSlug('  Arjun Sharma! '), 'arjun_sharma');
  assert.equal(suggestUsernameSlug(''), '');

  const toneA = hashToneIndex('user-123', 6);
  const toneB = hashToneIndex('user-123', 6);
  assert.equal(toneA, toneB);
  assert.ok(toneA >= 0 && toneA < 6);

  const now = Date.UTC(2026, 10, 24, 12, 0, 0);
  assert.equal(formatCompactAge(new Date(now - 2 * 3600_000).toISOString(), now), '2h ago');
  assert.equal(formatCompactAge(new Date(now - 3 * 86400_000).toISOString(), now), '3d ago');
  assert.equal(formatCompactAge(null, now), '');
  assert.ok(formatClockTime(now).length >= 4);
});

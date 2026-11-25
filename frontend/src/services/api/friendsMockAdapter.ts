// =============================================================================
// DEV / TEST MOCK ADAPTER for Friends Module
// Isolated behind FRIENDS_CONFIG.USE_FRIENDS_MOCK; never active in production.
// Simulates Spring Boot domain rules: limits, conflicts, ownership, debt block.
// =============================================================================

import { readJson, STORAGE_KEYS, sanitizeStorageKey, writeJson } from '../../core/storage/localPersistence';
import type {
  CreateGuestInput,
  FriendPerson,
  FriendsGroupedData,
  Friendship,
  PreflightRemovalResult,
  SearchCandidate,
  UpdateGuestAvatarInput,
} from '../../types/friends';
import { MAX_FRIEND_RELATIONSHIPS, MAX_GUESTS_PER_OWNER } from '../../types/friends';
import { partitionFriendships, normalizeHandle } from '../friendsStore';
import { FriendsApiError } from './friendsErrors';

const MOCK_DIRECTORY_USERS: FriendPerson[] = [
  { id: 'user-cand-1', displayName: 'Rahul Mehta', username: 'rahul_m', avatarId: 'oliver', isGuest: false },
  { id: 'user-cand-2', displayName: 'Kavita Rao', username: 'kavita_r', avatarId: 'chloe', isGuest: false },
  { id: 'user-cand-3', displayName: 'Dev Patel', username: 'dev_p', avatarId: 'sam', isGuest: false },
  { id: 'user-cand-4', displayName: 'Tanvi Nair', username: 'tanvi_n', avatarId: 'kai', isGuest: false },
  { id: 'user-cand-5', displayName: 'Aditya Roy', username: 'aditya_roy', avatarId: 'leo', isGuest: false },
  // Intentionally includes an ineligible capped account to verify backend-driven exclusion
  { id: 'user-cand-capped', displayName: 'Rhea Kapoor', username: 'rhea_capped', avatarId: 'maya', isGuest: false },
];

const INITIAL_SEED_FRIENDSHIPS: Friendship[] = [
  {
    friendshipId: 'fr-initial-1',
    status: 'ACCEPTED',
    direction: 'NONE',
    person: {
      id: 'friend-p-1',
      displayName: 'Priya Sharma',
      username: 'priya_sharma',
      avatarId: 'maya',
      isGuest: false,
    },
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    acceptedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    friendshipId: 'fr-initial-2',
    status: 'ACCEPTED',
    direction: 'NONE',
    person: {
      id: 'friend-p-2',
      displayName: 'Roommate Rohan',
      username: 'rohan_guest',
      avatarId: 'leo',
      isGuest: true,
      ownerUserId: 'me',
    },
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    acceptedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    friendshipId: 'fr-initial-3',
    status: 'PENDING',
    direction: 'INCOMING',
    person: {
      id: 'friend-p-3',
      displayName: 'Ananya Verma',
      username: 'ananya_v',
      avatarId: 'zara',
      isGuest: false,
    },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    friendshipId: 'fr-initial-4',
    status: 'PENDING',
    direction: 'OUTGOING',
    person: {
      id: 'friend-p-4',
      displayName: 'Vikram Singh',
      username: 'vikram_s',
      avatarId: 'finn',
      isGuest: false,
    },
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// Optional test/dev debt check hook injected by AppContext/tests
let debtInspector: ((personId: string) => PreflightRemovalResult) | null = null;

export function setMockDebtInspector(
  inspector: ((personId: string) => PreflightRemovalResult) | null,
): void {
  debtInspector = inspector;
}

function getStorageKey(ownerId?: string | null): string {
  return ownerId
    ? `${STORAGE_KEYS.friendshipsAccountPrefix}${sanitizeStorageKey(ownerId)}`
    : STORAGE_KEYS.friendships;
}

async function readMockFriendships(ownerId?: string | null): Promise<Friendship[]> {
  try {
    const key = getStorageKey(ownerId);
    const data = await readJson<Friendship[]>(key);
    if (Array.isArray(data)) return data;
    await writeJson(key, INITIAL_SEED_FRIENDSHIPS);
    return INITIAL_SEED_FRIENDSHIPS;
  } catch {
    return INITIAL_SEED_FRIENDSHIPS;
  }
}

async function writeMockFriendships(items: Friendship[], ownerId?: string | null): Promise<void> {
  await writeJson(getStorageKey(ownerId), items);
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const err = new Error('Request cancelled');
    err.name = 'AbortError';
    throw err;
  }
}

export const friendsMockAdapter = {
  async listFriends(ownerId?: string | null, signal?: AbortSignal): Promise<FriendsGroupedData> {
    throwIfAborted(signal);
    const items = await readMockFriendships(ownerId);
    return partitionFriendships(items);
  },

  async searchCandidates(
    query: string,
    currentUserId = 'me',
    ownerId?: string | null,
    signal?: AbortSignal,
  ): Promise<SearchCandidate[]> {
    throwIfAborted(signal);
    const trimmed = normalizeHandle(query).toLowerCase();
    if (!trimmed) return [];

    // Small realistic latency to exercise skeletons & cancellation
    await new Promise((resolve) => setTimeout(resolve, 120));
    throwIfAborted(signal);

    const existing = await readMockFriendships(ownerId);
    const existingIds = new Set(existing.map((f) => f.person.id));
    const existingHandles = new Set(existing.map((f) => normalizeHandle(f.person.username).toLowerCase()));

    return MOCK_DIRECTORY_USERS
      .filter((user) => {
        if (user.id === currentUserId || user.id === 'user-cand-capped') return false;
        if (user.isGuest) return false;
        if (existingIds.has(user.id)) return false;
        if (existingHandles.has(user.username.toLowerCase())) return false;
        return (
          user.username.toLowerCase().includes(trimmed)
          || user.displayName.toLowerCase().includes(trimmed)
        );
      })
      .map((user): SearchCandidate => ({
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        avatarId: user.avatarId,
        isEligible: true,
        relationshipStatus: 'NONE',
      }));
  },

  async sendRequest(
    targetUser: Pick<FriendPerson, 'id' | 'displayName' | 'username' | 'avatarId'>,
    ownerId?: string | null,
  ): Promise<Friendship> {
    const current = await readMockFriendships(ownerId);
    if (current.length >= MAX_FRIEND_RELATIONSHIPS) {
      throw new FriendsApiError({
        kind: '409',
        status: 409,
        code: 'FRIEND_LIMIT_REACHED',
        action: 'none',
        message: `You have reached the maximum limit of ${MAX_FRIEND_RELATIONSHIPS} friend relationships.`,
      });
    }

    const normalizedUsername = normalizeHandle(targetUser.username).toLowerCase();
    const exists = current.some(
      (f) =>
        f.person.id === targetUser.id
        || normalizeHandle(f.person.username).toLowerCase() === normalizedUsername,
    );
    if (exists) {
      throw new FriendsApiError({
        kind: '409',
        status: 409,
        code: 'RELATIONSHIP_EXISTS',
        action: 'none',
        message: 'A relationship or pending request already exists with this user.',
      });
    }

    const created: Friendship = {
      friendshipId: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: 'PENDING',
      direction: 'OUTGOING',
      person: {
        id: targetUser.id,
        displayName: targetUser.displayName,
        username: normalizeHandle(targetUser.username),
        avatarId: targetUser.avatarId ?? null,
        isGuest: false,
      },
      createdAt: new Date().toISOString(),
    };

    await writeMockFriendships([...current, created], ownerId);
    return created;
  },

  async acceptRequest(friendshipId: string, ownerId?: string | null): Promise<Friendship> {
    const current = await readMockFriendships(ownerId);
    const target = current.find((item) => item.friendshipId === friendshipId);
    if (!target) {
      throw new FriendsApiError({
        kind: '404',
        status: 404,
        code: 'REQUEST_NOT_FOUND',
        action: 'retry',
        message: 'This friend request has expired or is no longer available.',
      });
    }
    if (target.status === 'ACCEPTED') {
      return target;
    }

    const accepted: Friendship = {
      ...target,
      status: 'ACCEPTED',
      direction: 'NONE',
      acceptedAt: new Date().toISOString(),
    };

    await writeMockFriendships(
      current.map((item) => (item.friendshipId === friendshipId ? accepted : item)),
      ownerId,
    );
    return accepted;
  },

  async checkRemovalPreflight(
    friendshipId: string,
    ownerId?: string | null,
  ): Promise<PreflightRemovalResult> {
    const current = await readMockFriendships(ownerId);
    const target = current.find((item) => item.friendshipId === friendshipId);
    if (!target || target.status !== 'ACCEPTED') {
      return { canRemove: true, blockedByDebt: false, unsettledAmount: 0 };
    }
    if (debtInspector) {
      return debtInspector(target.person.id);
    }
    return { canRemove: true, blockedByDebt: false, unsettledAmount: 0 };
  },

  async deleteRelationship(friendshipId: string, ownerId?: string | null): Promise<void> {
    const current = await readMockFriendships(ownerId);
    const target = current.find((item) => item.friendshipId === friendshipId);
    if (!target) {
      throw new FriendsApiError({
        kind: '404',
        status: 404,
        code: 'RELATIONSHIP_NOT_FOUND',
        action: 'retry',
        message: 'This relationship has already been removed or expired.',
      });
    }

    if (target.status === 'ACCEPTED' && debtInspector) {
      const preflight = debtInspector(target.person.id);
      if (preflight.blockedByDebt) {
        throw new FriendsApiError({
          kind: '409',
          status: 409,
          code: 'UNSETTLED_OBLIGATIONS',
          action: 'view_in_splits',
          message: preflight.reason || 'Unsettled split obligations must be settled before removal.',
          blockedByDebt: true,
          unsettledAmount: preflight.unsettledAmount,
          splitTitle: preflight.splitTitle,
        });
      }
    }

    await writeMockFriendships(
      current.filter((item) => item.friendshipId !== friendshipId),
      ownerId,
    );
  },

  async createGuest(input: CreateGuestInput, ownerId?: string | null): Promise<Friendship> {
    const name = input.name.trim();
    const username = normalizeHandle(input.username);

    if (!name || !username) {
      throw new FriendsApiError({
        kind: 'unknown',
        status: 400,
        code: 'VALIDATION_ERROR',
        action: 'none',
        message: 'Please enter both display name and username for the guest.',
        fieldErrors: {
          ...(!name ? { name: 'Display name is required.' } : {}),
          ...(!username ? { username: 'Username is required.' } : {}),
        },
      });
    }

    const current = await readMockFriendships(ownerId);
    const currentGuests = current.filter((item) => item.status === 'ACCEPTED' && item.person.isGuest);

    if (currentGuests.length >= MAX_GUESTS_PER_OWNER) {
      throw new FriendsApiError({
        kind: '409',
        status: 409,
        code: 'GUEST_LIMIT_REACHED',
        action: 'none',
        message: `Guest limit reached: you can create up to ${MAX_GUESTS_PER_OWNER} guests.`,
      });
    }

    if (current.length >= MAX_FRIEND_RELATIONSHIPS) {
      throw new FriendsApiError({
        kind: '409',
        status: 409,
        code: 'FRIEND_LIMIT_REACHED',
        action: 'none',
        message: `Participant limit reached: maximum ${MAX_FRIEND_RELATIONSHIPS} relationships allowed.`,
      });
    }

    const usernameExists = current.some(
      (item) => normalizeHandle(item.person.username).toLowerCase() === username.toLowerCase(),
    );
    if (usernameExists) {
      throw new FriendsApiError({
        kind: '409',
        status: 409,
        code: 'USERNAME_TAKEN',
        action: 'none',
        message: `Username @${username} is already taken.`,
        fieldErrors: { username: `@${username} is already used by an existing participant.` },
      });
    }

    const created: Friendship = {
      friendshipId: `fr-guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: 'ACCEPTED',
      direction: 'NONE',
      person: {
        id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        displayName: name,
        username,
        avatarId: input.avatarId ?? null,
        isGuest: true,
        ownerUserId: ownerId ?? 'me',
      },
      createdAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
    };

    await writeMockFriendships([...current, created], ownerId);
    return created;
  },

  async updateGuestAvatar(
    guestId: string,
    payload: UpdateGuestAvatarInput,
    ownerId?: string | null,
  ): Promise<Friendship> {
    const current = await readMockFriendships(ownerId);
    const target = current.find((item) => item.person.id === guestId);
    if (!target) {
      throw new FriendsApiError({
        kind: '404',
        status: 404,
        code: 'GUEST_NOT_FOUND',
        action: 'retry',
        message: 'Guest participant not found.',
      });
    }
    if (!target.person.isGuest) {
      throw new FriendsApiError({
        kind: '403',
        status: 403,
        code: 'GUEST_ONLY',
        action: 'none',
        message: 'Only guest participants can be edited.',
      });
    }
    const owner = target.person.ownerUserId;
    if (owner && owner !== 'me' && ownerId && owner !== ownerId) {
      throw new FriendsApiError({
        kind: '403',
        status: 403,
        code: 'GUEST_NOT_OWNED',
        action: 'none',
        message: 'Only the guest owner can edit this avatar.',
      });
    }

    const updated: Friendship = {
      ...target,
      person: {
        ...target.person,
        avatarId: payload.avatarId !== undefined ? payload.avatarId : target.person.avatarId,
        avatarUri: payload.avatarUri !== undefined ? payload.avatarUri : target.person.avatarUri,
      },
    };

    await writeMockFriendships(
      current.map((item) => (item.person.id === guestId ? updated : item)),
      ownerId,
    );
    return updated;
  },
};

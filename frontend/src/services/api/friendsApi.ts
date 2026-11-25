import { FRIENDS_CONFIG } from '../../config/friendsConfig';
import {
  readJson,
  removeValue,
  sanitizeStorageKey,
  STORAGE_KEYS,
  writeJson,
} from '../../core/storage/localPersistence';
import type {
  CreateGuestInput,
  FriendPerson,
  FriendsGroupedData,
  FriendsPaginationParams,
  Friendship,
  PreflightRemovalResult,
  SearchCandidate,
  UpdateGuestAvatarInput,
} from '../../types/friends';
import { partitionFriendships, normalizeHandle } from '../friendsStore';
import { apiClient } from './apiClient';
import {
  isAbortError,
  isRetryableFriendsReadError,
  normalizeFriendsError,
} from './friendsErrors';
import { friendsMockAdapter } from './friendsMockAdapter';

export interface FriendsCachePayload {
  grouped: FriendsGroupedData;
  cachedAt: number;
}

export interface ListFriendsOptions extends FriendsPaginationParams {
  ownerId?: string | null;
  signal?: AbortSignal;
}

export interface SearchCandidatesOptions extends FriendsPaginationParams {
  currentUserId?: string;
  ownerId?: string | null;
  signal?: AbortSignal;
}

function buildQueryString(params: Record<string, string | number | null | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, val]) => val !== undefined && val !== null && val !== '',
  );
  if (!entries.length) return '';
  return `?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')}`;
}

function cacheStorageKey(ownerId?: string | null): string {
  return ownerId
    ? `${STORAGE_KEYS.friendshipsAccountPrefix}cache_${sanitizeStorageKey(ownerId)}`
    : `${STORAGE_KEYS.friendships}_cache`;
}

function sanitizeFriendshipForCache(item: Friendship): Friendship {
  return {
    friendshipId: item.friendshipId,
    status: item.status,
    direction: item.direction,
    person: {
      id: item.person.id,
      displayName: item.person.displayName,
      username: item.person.username,
      avatarId: item.person.avatarId,
      avatarUri: item.person.avatarUri ?? null,
      isGuest: item.person.isGuest,
      ownerUserId: item.person.ownerUserId ?? null,
    },
    createdAt: item.createdAt,
    acceptedAt: item.acceptedAt ?? null,
  };
}

export async function readFriendsCache(ownerId?: string | null): Promise<FriendsCachePayload | null> {
  try {
    const raw = await readJson<FriendsCachePayload>(cacheStorageKey(ownerId));
    if (!raw?.grouped || !Array.isArray(raw.grouped.accepted)) return null;
    const all = [
      ...raw.grouped.accepted,
      ...(raw.grouped.incoming ?? []),
      ...(raw.grouped.outgoing ?? []),
    ];
    return {
      grouped: partitionFriendships(all),
      cachedAt: typeof raw.cachedAt === 'number' ? raw.cachedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export async function writeFriendsCache(
  grouped: FriendsGroupedData,
  ownerId?: string | null,
): Promise<number> {
  const cachedAt = Date.now();
  const payload: FriendsCachePayload = {
    grouped: {
      accepted: grouped.accepted.map(sanitizeFriendshipForCache),
      incoming: grouped.incoming.map(sanitizeFriendshipForCache),
      outgoing: grouped.outgoing.map(sanitizeFriendshipForCache),
      counts: grouped.counts,
      nextCursor: grouped.nextCursor ?? null,
    },
    cachedAt,
  };
  try {
    await writeJson(cacheStorageKey(ownerId), payload);
  } catch {
    // Non-fatal cache write error
  }
  return cachedAt;
}

export async function clearFriendsCache(ownerId?: string | null): Promise<void> {
  try {
    await removeValue(cacheStorageKey(ownerId));
    if (ownerId) {
      await removeValue(`${STORAGE_KEYS.friendshipsAccountPrefix}${sanitizeStorageKey(ownerId)}`);
    }
    await removeValue(STORAGE_KEYS.friendships);
    await removeValue(`${STORAGE_KEYS.friendships}_cache`);
  } catch {
    // Best-effort cleanup
  }
}

async function withSafeReadRetry<T>(
  operation: () => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    if (isAbortError(err) || signal?.aborted) throw err;
    const normalized = normalizeFriendsError(err);
    if (!isRetryableFriendsReadError(normalized)) {
      throw normalized;
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (signal?.aborted) {
      const abortErr = new Error('Request cancelled');
      abortErr.name = 'AbortError';
      throw abortErr;
    }
    try {
      return await operation();
    } catch (retryErr) {
      if (isAbortError(retryErr) || signal?.aborted) throw retryErr;
      throw normalizeFriendsError(retryErr);
    }
  }
}

export const friendsApi = {
  /**
   * GET /api/v1/friends
   */
  async listFriends(options: ListFriendsOptions = {}): Promise<FriendsGroupedData> {
    const { ownerId, signal, page, limit = FRIENDS_CONFIG.LIST_PAGE_SIZE, cursor } = options;

    if (FRIENDS_CONFIG.USE_FRIENDS_MOCK) {
      const grouped = await friendsMockAdapter.listFriends(ownerId, signal);
      await writeFriendsCache(grouped, ownerId);
      return grouped;
    }

    return withSafeReadRetry(async () => {
      const qs = buildQueryString({ page, limit, cursor });
      const response = await apiClient.get<FriendsGroupedData>(
        `${FRIENDS_CONFIG.API_PREFIX}${qs}`,
        { requiresAuth: true, signal },
      );
      const raw = response.data;
      const all = [
        ...(raw?.accepted ?? []),
        ...(raw?.incoming ?? []),
        ...(raw?.outgoing ?? []),
      ];
      const grouped: FriendsGroupedData = {
        ...partitionFriendships(all),
        nextCursor: raw?.nextCursor ?? null,
      };
      await writeFriendsCache(grouped, ownerId);
      return grouped;
    }, signal);
  },

  /**
   * GET /api/v1/friends/search?q=...
   */
  async searchCandidates(
    query: string,
    options: SearchCandidatesOptions = {},
  ): Promise<SearchCandidate[]> {
    const trimmed = normalizeHandle(query);
    if (trimmed.length < FRIENDS_CONFIG.SEARCH_MIN_CHARS) return [];

    const {
      currentUserId = 'me',
      ownerId,
      signal,
      page,
      limit = FRIENDS_CONFIG.SEARCH_PAGE_SIZE,
      cursor,
    } = options;

    if (FRIENDS_CONFIG.USE_FRIENDS_MOCK) {
      return friendsMockAdapter.searchCandidates(trimmed, currentUserId, ownerId, signal);
    }

    return withSafeReadRetry(async () => {
      const qs = buildQueryString({ q: trimmed, page, limit, cursor });
      const response = await apiClient.get<SearchCandidate[]>(
        `${FRIENDS_CONFIG.API_PREFIX}/search${qs}`,
        { requiresAuth: true, signal },
      );
      return Array.isArray(response.data) ? response.data : [];
    }, signal);
  },

  /**
   * POST /api/v1/friends/requests
   */
  async sendRequest(
    targetUser: Pick<FriendPerson, 'id' | 'displayName' | 'username' | 'avatarId'>,
    ownerId?: string | null,
  ): Promise<Friendship> {
    if (FRIENDS_CONFIG.USE_FRIENDS_MOCK) {
      return friendsMockAdapter.sendRequest(targetUser, ownerId);
    }

    try {
      const response = await apiClient.post<Friendship>(
        `${FRIENDS_CONFIG.API_PREFIX}/requests`,
        { addresseeId: targetUser.id },
        { requiresAuth: true },
      );
      return response.data;
    } catch (err) {
      throw normalizeFriendsError(err);
    }
  },

  /**
   * POST /api/v1/friends/{friendshipId}/accept
   */
  async acceptRequest(friendshipId: string, ownerId?: string | null): Promise<Friendship> {
    if (FRIENDS_CONFIG.USE_FRIENDS_MOCK) {
      return friendsMockAdapter.acceptRequest(friendshipId, ownerId);
    }

    try {
      const response = await apiClient.post<Friendship>(
        `${FRIENDS_CONFIG.API_PREFIX}/${encodeURIComponent(friendshipId)}/accept`,
        {},
        { requiresAuth: true },
      );
      return response.data;
    } catch (err) {
      throw normalizeFriendsError(err);
    }
  },

  /**
   * Optional preflight check if backend exposes it; returns null when unavailable
   * so caller always falls back to honoring DELETE /api/v1/friends/{friendshipId}.
   */
  async getRemovalPreflight(
    friendshipId: string,
    ownerId?: string | null,
  ): Promise<PreflightRemovalResult | null> {
    if (FRIENDS_CONFIG.USE_FRIENDS_MOCK) {
      return friendsMockAdapter.checkRemovalPreflight(friendshipId, ownerId);
    }

    try {
      const response = await apiClient.get<PreflightRemovalResult>(
        `${FRIENDS_CONFIG.API_PREFIX}/${encodeURIComponent(friendshipId)}/removal-preflight`,
        { requiresAuth: true },
      );
      return response.data ?? null;
    } catch (err) {
      const normalized = normalizeFriendsError(err);
      if (normalized.kind === '404') return null;
      return null;
    }
  },

  /**
   * DELETE /api/v1/friends/{friendshipId}
   */
  async deleteRelationship(friendshipId: string, ownerId?: string | null): Promise<void> {
    if (FRIENDS_CONFIG.USE_FRIENDS_MOCK) {
      await friendsMockAdapter.deleteRelationship(friendshipId, ownerId);
      return;
    }

    try {
      await apiClient.delete(
        `${FRIENDS_CONFIG.API_PREFIX}/${encodeURIComponent(friendshipId)}`,
        undefined,
        { requiresAuth: true },
      );
    } catch (err) {
      throw normalizeFriendsError(err);
    }
  },

  /**
   * POST /api/v1/friends/guests
   */
  async createGuest(input: CreateGuestInput, ownerId?: string | null): Promise<Friendship> {
    if (FRIENDS_CONFIG.USE_FRIENDS_MOCK) {
      return friendsMockAdapter.createGuest(input, ownerId);
    }

    try {
      const response = await apiClient.post<Friendship>(
        `${FRIENDS_CONFIG.API_PREFIX}/guests`,
        {
          name: input.name.trim(),
          username: normalizeHandle(input.username),
          avatarId: input.avatarId ?? null,
        },
        { requiresAuth: true },
      );
      return response.data;
    } catch (err) {
      throw normalizeFriendsError(err);
    }
  },

  /**
   * PATCH /api/v1/friends/guests/{guestId}/avatar
   */
  async updateGuestAvatar(
    guestId: string,
    payload: UpdateGuestAvatarInput,
    ownerId?: string | null,
  ): Promise<Friendship> {
    if (FRIENDS_CONFIG.USE_FRIENDS_MOCK) {
      return friendsMockAdapter.updateGuestAvatar(guestId, payload, ownerId);
    }

    try {
      const response = await apiClient.patch<Friendship>(
        `${FRIENDS_CONFIG.API_PREFIX}/guests/${encodeURIComponent(guestId)}/avatar`,
        payload,
        { requiresAuth: true },
      );
      return response.data;
    } catch (err) {
      throw normalizeFriendsError(err);
    }
  },
};

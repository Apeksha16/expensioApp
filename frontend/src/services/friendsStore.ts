import type {
  Friend,
  FriendsCounts,
  FriendsGroupedData,
  Friendship,
  ParticipantSnapshot,
  SearchCandidate,
} from '../types';

const FRIEND_PALETTE = ['#146B45', '#D97706', '#7C3AED', '#2563EB', '#DB2777'] as const;

/**
 * Strips Unicode bidirectional control characters and zero-width characters
 * so user-supplied display names / handles cannot spoof another identity or break layout.
 */
export function sanitizeDisplayText(value: string, maxLength = 60): string {
  return value
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\u061C\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function getInitials(name: string, fallback = 'FR'): string {
  const safeName = sanitizeDisplayText(name);
  const parts = safeName.split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function suggestUsernameSlug(displayName: string): string {
  return sanitizeDisplayText(displayName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
}

export function hashToneIndex(seed: string, count: number): number {
  if (count <= 0) return 0;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % count;
}

export function normalizeHandle(username: string): string {
  return sanitizeDisplayText(username, 32).replace(/^@+/, '');
}

export function formatHandle(username: string): string {
  const clean = normalizeHandle(username);
  return clean ? `@${clean}` : '';
}

const NAME_COLLATOR = new Intl.Collator(undefined, { sensitivity: 'base' });

function compareAcceptedAlphabetical(a: Friendship, b: Friendship): number {
  const nameCmp = NAME_COLLATOR.compare(a.person.displayName, b.person.displayName);
  if (nameCmp !== 0) return nameCmp;
  return NAME_COLLATOR.compare(a.person.username, b.person.username);
}

function compareCreatedDesc(a: Friendship, b: Friendship): number {
  const timeA = Date.parse(a.createdAt) || 0;
  const timeB = Date.parse(b.createdAt) || 0;
  return timeB - timeA;
}

/**
 * Partitions raw friendships into Incoming, Outgoing, and Accepted (alphabetical,
 * mixing regular friends and guests together) with authoritative counts.
 */
export function partitionFriendships(items: readonly Friendship[]): FriendsGroupedData {
  const sanitized = items.map((item) => ({
    ...item,
    person: {
      ...item.person,
      displayName: sanitizeDisplayText(item.person.displayName) || 'Expensio user',
      username: normalizeHandle(item.person.username),
    },
  }));

  const accepted = sanitized
    .filter((item) => item.status === 'ACCEPTED')
    .slice()
    .sort(compareAcceptedAlphabetical);

  const incoming = sanitized
    .filter((item) => item.status === 'PENDING' && item.direction === 'INCOMING')
    .slice()
    .sort(compareCreatedDesc);

  const outgoing = sanitized
    .filter((item) => item.status === 'PENDING' && item.direction === 'OUTGOING')
    .slice()
    .sort(compareCreatedDesc);

  const counts: FriendsCounts = {
    accepted: accepted.length,
    incoming: incoming.length,
    outgoing: outgoing.length,
    guests: accepted.filter((item) => item.person.isGuest).length,
  };

  return {
    accepted,
    incoming,
    outgoing,
    counts,
  };
}

/**
 * Local filter over already-loaded relationships by display name, username, or "guest".
 */
export function filterFriendshipsByQuery(
  items: readonly Friendship[],
  query: string,
): Friendship[] {
  const needle = query.trim().toLowerCase().replace(/^@+/, '');
  if (!needle) return items as Friendship[];

  return items.filter((item) => {
    const nameMatch = item.person.displayName.toLowerCase().includes(needle);
    const usernameMatch = normalizeHandle(item.person.username).toLowerCase().includes(needle);
    const guestMatch = item.person.isGuest && 'guest'.includes(needle);
    return nameMatch || usernameMatch || guestMatch;
  });
}

/**
 * Converts active accepted friendships (friends + owner's guests) into
 * the selectable participant directory consumed by Splits & Groups.
 * Removed or pending friends are never included.
 */
export function friendshipsToSelectableFriends(accepted: readonly Friendship[]): Friend[] {
  return accepted
    .filter((item) => item.status === 'ACCEPTED')
    .map((item, index) => ({
      id: item.person.id,
      name: item.person.displayName,
      userId: formatHandle(item.person.username),
      initials: getInitials(item.person.displayName),
      color: FRIEND_PALETTE[index % FRIEND_PALETTE.length],
      avatarId: item.person.avatarId,
      avatarUri: item.person.avatarUri ?? null,
      isGuest: item.person.isGuest,
      friendshipId: item.friendshipId,
      ownerUserId: item.person.ownerUserId,
    }));
}

/**
 * Captures immutable participant snapshots at split creation time so historical
 * financial records keep identifying friends even after removal.
 */
export function createParticipantSnapshotMap(
  participantIds: readonly string[],
  friends: readonly Friend[],
): Record<string, ParticipantSnapshot> {
  const snapshots: Record<string, ParticipantSnapshot> = {};
  for (const id of participantIds) {
    const friend = friends.find((f) => f.id === id);
    if (friend) {
      snapshots[id] = {
        name: friend.name,
        initials: friend.initials,
        color: friend.color,
        isGuest: friend.isGuest,
      };
    }
  }
  return snapshots;
}

/**
 * Defensive UI filter on top of backend search results:
 * excludes self, ineligible results, and existing relationships.
 */
export function filterDefensivelyForSearch(
  candidates: readonly SearchCandidate[],
  currentUserId?: string | null,
  existingFriendships: readonly Friendship[] = [],
): SearchCandidate[] {
  const existingPersonIds = new Set(existingFriendships.map((f) => f.person.id));
  const existingHandles = new Set(
    existingFriendships.map((f) => normalizeHandle(f.person.username).toLowerCase()),
  );

  return candidates
    .filter((candidate) => {
      if (!candidate.isEligible) return false;
      if (candidate.relationshipStatus && candidate.relationshipStatus !== 'NONE') return false;
      if (currentUserId && candidate.id === currentUserId) return false;
      if (existingPersonIds.has(candidate.id)) return false;
      if (existingHandles.has(normalizeHandle(candidate.username).toLowerCase())) return false;
      return true;
    })
    .map((candidate) => ({
      ...candidate,
      displayName: sanitizeDisplayText(candidate.displayName) || 'Expensio user',
      username: normalizeHandle(candidate.username),
    }));
}

export interface PendingActionTracker {
  tryAcquire(id: string): boolean;
  release(id: string): void;
  isPending(id: string): boolean;
  getIds(): string[];
  clear(): void;
}

/**
 * Synchronous per-ID lock preventing duplicate submissions from rapid double-taps
 * before React state flushes.
 */
export function createPendingActionTracker(): PendingActionTracker {
  const active = new Set<string>();

  return {
    tryAcquire(id: string): boolean {
      if (!id || active.has(id)) return false;
      active.add(id);
      return true;
    },
    release(id: string): void {
      active.delete(id);
    },
    isPending(id: string): boolean {
      return active.has(id);
    },
    getIds(): string[] {
      return Array.from(active);
    },
    clear(): void {
      active.clear();
    },
  };
}

export function isGuestOwnedByUser(
  friendship: Friendship,
  currentOwnerId?: string | null,
): boolean {
  if (!friendship.person.isGuest) return false;
  const guestOwner = friendship.person.ownerUserId;
  if (!guestOwner) return true;
  if (!currentOwnerId) return guestOwner === 'me';
  return guestOwner === currentOwnerId || guestOwner === 'me';
}

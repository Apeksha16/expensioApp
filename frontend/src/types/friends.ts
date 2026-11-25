export type FriendshipStatus = 'ACCEPTED' | 'PENDING';
export type FriendshipDirection = 'INCOMING' | 'OUTGOING' | 'NONE';

export interface FriendPerson {
  id: string;
  displayName: string;
  username: string;
  avatarId: string | null;
  avatarUri?: string | null;
  isGuest: boolean;
  ownerUserId?: string | null;
}

export interface Friendship {
  friendshipId: string;
  status: FriendshipStatus;
  direction: FriendshipDirection;
  person: FriendPerson;
  createdAt: string;
  acceptedAt?: string | null;
}

export interface FriendsCounts {
  accepted: number;
  incoming: number;
  outgoing: number;
  guests: number;
}

export interface FriendsGroupedData {
  accepted: Friendship[];
  incoming: Friendship[];
  outgoing: Friendship[];
  counts: FriendsCounts;
  nextCursor?: string | null;
}

export interface SearchCandidate {
  id: string;
  displayName: string;
  username: string;
  avatarId: string | null;
  isEligible: boolean;
  relationshipStatus?: 'NONE' | 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';
}

export interface CreateGuestInput {
  name: string;
  username: string;
  avatarId?: string | null;
}

export interface UpdateGuestAvatarInput {
  avatarId?: string | null;
  avatarUri?: string | null;
}

export type GuestAvatarMode = 'preset' | 'upload';

export interface PreflightRemovalResult {
  canRemove: boolean;
  blockedByDebt: boolean;
  unsettledAmount: number;
  reason?: string;
  splitTitle?: string;
}

export type FriendsErrorKind =
  | 'offline'
  | 'timeout'
  | '401'
  | '403'
  | '404'
  | '409'
  | '429'
  | '5xx'
  | 'unknown';

export type FriendsErrorAction = 'retry' | 'relogin' | 'view_in_splits' | 'none';

export interface FriendsFieldErrors {
  name?: string;
  username?: string;
}

export interface FriendsPaginationParams {
  page?: number;
  limit?: number;
  cursor?: string | null;
}

export interface FriendsSyncMeta {
  lastUpdatedAt: number | null;
  isStaleOffline: boolean;
  hasNewIncomingAlert: boolean;
}

export const MAX_GUESTS_PER_OWNER = 5;
export const MAX_FRIEND_RELATIONSHIPS = 10;


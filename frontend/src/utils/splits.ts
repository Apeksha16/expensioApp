import { CURRENT_USER_ID } from '../data/splits';
import type {
  CreateSplitInput,
  Friend,
  PendingBalance,
  SplitBalances,
  SplitExpense,
  SplitShare,
} from '../types';

export function buildEqualShares(
  participantIds: string[],
  amount: number,
  paidById: string,
): SplitShare[] {
  const count = participantIds.length;
  const base = Math.floor(amount / count);
  let remainder = amount - base * count;

  return participantIds.map((friendId) => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return {
      friendId,
      amount: base + extra,
      settled: friendId === paidById,
    };
  });
}

export function buildCustomShares(
  participantIds: string[],
  customShares: Record<string, number>,
  paidById: string,
): SplitShare[] {
  return participantIds.map((friendId) => ({
    friendId,
    amount: customShares[friendId] ?? 0,
    settled: friendId === paidById,
  }));
}

export function createSplitExpense(input: CreateSplitInput): SplitExpense {
  const shares =
    input.method === 'equal'
      ? buildEqualShares(input.participantIds, input.amount, input.paidById)
      : buildCustomShares(
          input.participantIds,
          input.customShares ?? {},
          input.paidById,
        );

  return {
    id: `sp_${Date.now()}`,
    title: input.title.trim(),
    amount: input.amount,
    paidById: input.paidById,
    date: input.date,
    method: input.method,
    shares,
    note: input.note?.trim() || undefined,
    createdAt: Date.now(),
  };
}

export function isSplitSettled(split: SplitExpense): boolean {
  return split.shares.every((share) => share.settled);
}

export function getFriendName(
  friendId: string,
  friends: Friend[],
  selfName = 'You',
): string {
  if (friendId === CURRENT_USER_ID) return selfName;
  return friends.find((f) => f.id === friendId)?.name ?? 'Friend';
}

export function getFriendMeta(
  friendId: string,
  friends: Friend[],
): Pick<Friend, 'name' | 'initials' | 'color'> {
  if (friendId === CURRENT_USER_ID) {
    return { name: 'You', initials: 'Y', color: '#0F766E' };
  }
  const friend = friends.find((f) => f.id === friendId);
  return {
    name: friend?.name ?? 'Friend',
    initials: friend?.initials ?? '?',
    color: friend?.color ?? '#6B7280',
  };
}

/** Net balance vs a friend: positive = they owe you */
export function netWithFriend(
  splits: SplitExpense[],
  friendId: string,
): number {
  let net = 0;

  for (const split of splits) {
    const myShare = split.shares.find((s) => s.friendId === CURRENT_USER_ID);
    const theirShare = split.shares.find((s) => s.friendId === friendId);
    if (!myShare || !theirShare) continue;

    if (split.paidById === CURRENT_USER_ID && !theirShare.settled) {
      net += theirShare.amount;
    }
    if (split.paidById === friendId && !myShare.settled) {
      net -= myShare.amount;
    }
  }

  return net;
}

export function computeSplitBalances(
  splits: SplitExpense[],
  friends: Friend[],
): SplitBalances {
  let youOwe = 0;
  let youAreOwed = 0;
  let settledCount = 0;
  let pendingCount = 0;

  for (const split of splits) {
    if (isSplitSettled(split)) {
      settledCount += 1;
      continue;
    }
    pendingCount += 1;

    if (split.paidById === CURRENT_USER_ID) {
      for (const share of split.shares) {
        if (share.friendId !== CURRENT_USER_ID && !share.settled) {
          youAreOwed += share.amount;
        }
      }
    } else {
      const myShare = split.shares.find((s) => s.friendId === CURRENT_USER_ID);
      if (myShare && !myShare.settled) {
        youOwe += myShare.amount;
      }
    }
  }

  const pending: PendingBalance[] = friends
    .map((friend) => {
      const amount = netWithFriend(splits, friend.id);
      return {
        friendId: friend.id,
        name: friend.name,
        initials: friend.initials,
        color: friend.color,
        amount,
      };
    })
    .filter((item) => item.amount !== 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  return { youOwe, youAreOwed, settledCount, pendingCount, pending };
}

export function yourShareLabel(split: SplitExpense): {
  label: string;
  amount: number;
  tone: 'owe' | 'owed' | 'settled';
} {
  if (isSplitSettled(split)) {
    return { label: 'Settled', amount: 0, tone: 'settled' };
  }

  const myShare = split.shares.find((s) => s.friendId === CURRENT_USER_ID);
  if (!myShare) {
    return { label: 'Settled', amount: 0, tone: 'settled' };
  }

  if (split.paidById === CURRENT_USER_ID) {
    const owed = split.shares
      .filter((s) => s.friendId !== CURRENT_USER_ID && !s.settled)
      .reduce((sum, s) => sum + s.amount, 0);
    return { label: 'You are owed', amount: owed, tone: 'owed' };
  }

  if (!myShare.settled) {
    return { label: 'You owe', amount: myShare.amount, tone: 'owe' };
  }

  return { label: 'Settled', amount: 0, tone: 'settled' };
}

import type { Friend, SplitExpense } from '../types';

export const CURRENT_USER_ID = 'me';

export const mockFriends: Friend[] = [
  { id: 'f1', name: 'Riya Sharma', userId: '@riya', initials: 'R', color: '#0F766E' },
  { id: 'f2', name: 'Arjun Mehta', userId: '@arjun', initials: 'A', color: '#D97706' },
  { id: 'f3', name: 'Neha Kapoor', userId: '@neha', initials: 'N', color: '#7C3AED' },
  { id: 'f4', name: 'Kabir Singh', userId: '@kabir', initials: 'K', color: '#2563EB' },
  { id: 'f5', name: 'Ishita Rao', userId: '@ishita', initials: 'I', color: '#DB2777' },
];

export const mockSplits: SplitExpense[] = [
  {
    id: 'sp1',
    title: 'Dinner at Olive',
    amount: 3600,
    paidById: CURRENT_USER_ID,
    date: 'Today',
    method: 'equal',
    shares: [
      { friendId: CURRENT_USER_ID, amount: 1200, settled: true },
      { friendId: 'f1', amount: 1200, settled: false },
      { friendId: 'f2', amount: 1200, settled: false },
    ],
    note: 'Birthday dinner',
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    id: 'sp2',
    title: 'Uber to Airport',
    amount: 850,
    paidById: 'f3',
    date: 'Yesterday',
    method: 'equal',
    shares: [
      { friendId: CURRENT_USER_ID, amount: 425, settled: false },
      { friendId: 'f3', amount: 425, settled: true },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 30,
  },
  {
    id: 'sp3',
    title: 'Groceries',
    amount: 2400,
    paidById: CURRENT_USER_ID,
    date: '2 Mar',
    method: 'custom',
    shares: [
      { friendId: CURRENT_USER_ID, amount: 900, settled: true },
      { friendId: 'f1', amount: 800, settled: true },
      { friendId: 'f4', amount: 700, settled: true },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
  },
  {
    id: 'sp4',
    title: 'Movie night',
    amount: 1200,
    paidById: 'f2',
    date: '28 Feb',
    method: 'equal',
    shares: [
      { friendId: CURRENT_USER_ID, amount: 400, settled: false },
      { friendId: 'f2', amount: 400, settled: true },
      { friendId: 'f5', amount: 400, settled: false },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 96,
  },
];

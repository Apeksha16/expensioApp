export type AccountType = 'salary' | 'cash' | 'savings';

export interface AccountData {
  title: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  centerLabel: string;
  amount: string;
  stat1Label: string;
  stat1Value: string;
  stat1IsPositive: boolean;
  stat2Label: string;
  stat2Value: string;
  arcColor: string;
  dotColor: string;
  progress: number;
}

export type ExpenseCategory =
  | 'food'
  | 'travel'
  | 'shopping'
  | 'bills'
  | 'entertainment'
  | 'health'
  | 'general';

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  method: 'UPI' | 'Card' | 'Cash' | 'NetBanking';
  account?: AccountType;
  type?: 'expense' | 'income';
}

export interface PaymentItem {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  category: ExpenseCategory;
  account: AccountType;
  recurring: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: 'pending' | 'paid';
  notes?: string;
  method?: 'UPI' | 'Card' | 'Cash' | 'NetBanking';
}

export interface SplitItem {
  id: string;
  title: string;
  amount: number;
  date: string;
  paidBy: 'YOU' | string;
  status: 'PENDING' | 'SETTLED';
  youGet?: number;
  youOwe?: number;
  group?: string;
  participants?: string[];
  strategy?: 'equally' | 'custom' | 'settlement';
  shares?: Record<string, number>; // Maps participant to their exact share
  transactionId?: string; // Links this split back to the actual ExpenseItem
}

export interface SplitSummaryData {
  youllGet: number;
  youOwe: number;
  getPeopleCount: number;
  owePeopleCount: number;
  peopleBalances: { name: string; balance: number }[]; // Positive: they owe you, Negative: you owe them
}

export interface SplitGroup {
  id: string;
  name: string;
  membersCount: number;
  youOwe?: number;
  youllGet?: number;
}

export interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: 'UPCOMING' | 'PAID' | 'OVERDUE';
  daysLeft?: number;
}

export type NavTab = 'dashboard' | 'expenses' | 'splits' | 'subscriptions' | 'analytics' | 'ledger';
export type AuthStep = 'splash' | 'phone' | 'otp' | 'authenticated';

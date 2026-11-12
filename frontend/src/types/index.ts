export type AuthPhase = 'restoring' | 'onboarding' | 'login' | 'mobile' | 'email' | 'otp' | 'setup' | 'main';

export interface UserProfile {
  name: string;
  userId: string;
  monthlyIncome: number;
  cashInHand: number;
  savings: number;
  phone: string;
  countryCode: string;
  email?: string;
}

export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  merchant: string;
  category: string;
  icon: string;
  iconColor: string;
  amount: number;
  date: string;
  time: string;
  occurredAt?: number;
}

export interface BudgetSummary {
  spent: number;
  limit: number;
}

export interface MonthlyOverview {
  income: number;
  spent: number;
  remaining: number;
}

export interface BalanceSummary {
  total: number;
  cash: number;
  savings: number;
}

export interface SplitSummary {
  owedAmount: number;
  friends: { id: string; name: string; initials: string; color: string }[];
}

export interface SavingsGoal {
  id: string;
  title: string;
  current: number;
  target: number;
  targetDate?: string;
  contributions?: GoalContribution[];
}

export interface GoalContribution {
  id: string;
  amount: number;
  occurredAt: number;
}

export interface CategoryBudget {
  id: string;
  category: string;
  limit: number;
  createdAt: number;
  alertThreshold?: number;
}

export type PaymentKind = 'emi' | 'subscription';
export type PaymentCadence = 'weekly' | 'monthly' | 'yearly';

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  kind: PaymentKind;
  cadence: PaymentCadence;
  nextDueDate: string;
  category: string;
  active: boolean;
  completed?: boolean;
  outstandingBalance?: number;
  remainingInstallments?: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  icon: string;
  color: string;
  nextDate: string;
}

export interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  visual: 'overview' | 'split' | 'budget' | 'allinone';
}

export interface CountryCode {
  code: string;
  dial: string;
  flag: string;
  name: string;
}

export interface Friend {
  id: string;
  name: string;
  userId: string;
  initials: string;
  color: string;
}

export interface SplitGroup {
  id: string;
  name: string;
  friendIds: string[];
  createdAt: number;
}

export type SplitMethod = 'equal' | 'custom';

export interface SplitShare {
  friendId: string;
  amount: number;
  settled: boolean;
}

export interface SplitExpense {
  id: string;
  title: string;
  amount: number;
  paidById: string;
  date: string;
  method: SplitMethod;
  shares: SplitShare[];
  note?: string;
  createdAt: number;
  ledgerTransactionId?: string;
}

export interface PendingBalance {
  friendId: string;
  name: string;
  initials: string;
  color: string;
  /** Positive = they owe you; negative = you owe them */
  amount: number;
}

export interface SplitBalances {
  youOwe: number;
  youAreOwed: number;
  settledCount: number;
  pendingCount: number;
  pending: PendingBalance[];
}

export interface CreateSplitInput {
  title: string;
  amount: number;
  paidById: string;
  date: string;
  method: SplitMethod;
  participantIds: string[];
  customShares?: Record<string, number>;
  note?: string;
}

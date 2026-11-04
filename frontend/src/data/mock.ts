import type {
  BalanceSummary,
  BudgetSummary,
  CountryCode,
  MonthlyOverview,
  OnboardingSlide,
  SavingsGoal,
  SplitSummary,
  Subscription,
  Transaction,
} from '../types';

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Your money, finally organized.',
    subtitle: 'See expenses, accounts and cashflow in one calm view.',
    visual: 'overview',
  },
  {
    id: '2',
    title: 'Split expenses. Skip the awkward math.',
    subtitle: 'Share bills with friends and settle up without the hassle.',
    visual: 'split',
  },
  {
    id: '3',
    title: 'Budget with purpose.',
    subtitle: 'Track progress toward goals that actually matter to you.',
    visual: 'budget',
  },
  {
    id: '4',
    title: 'Everything money. One place.',
    subtitle: 'Expenses, subscriptions, goals and savings, together.',
    visual: 'allinone',
  },
];

export const countryCodes: CountryCode[] = [
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore' },
];

export const mockBalance: BalanceSummary = {
  total: 124500,
  cash: 12500,
  savings: 112000,
};

export const mockMonthly: MonthlyOverview = {
  income: 85000,
  spent: 28400,
  remaining: 56600,
};

export const mockBudget: BudgetSummary = {
  spent: 28400,
  limit: 50000,
};

export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    merchant: 'Swiggy',
    category: 'Food',
    icon: 'restaurant',
    iconColor: '#EA580C',
    amount: 420,
    date: 'Today',
    time: '1:24 PM',
  },
  {
    id: 't2',
    merchant: 'Uber',
    category: 'Travel',
    icon: 'car',
    iconColor: '#111827',
    amount: 186,
    date: 'Today',
    time: '9:10 AM',
  },
  {
    id: 't3',
    merchant: 'Netflix',
    category: 'Subscription',
    icon: 'tv',
    iconColor: '#DC2626',
    amount: 649,
    date: 'Yesterday',
    time: '11:00 PM',
  },
  {
    id: 't4',
    merchant: 'Amazon',
    category: 'Shopping',
    icon: 'cart',
    iconColor: '#D97706',
    amount: 2499,
    date: '2 Mar',
    time: '4:32 PM',
  },
  {
    id: 't5',
    merchant: 'Electricity',
    category: 'Bills',
    icon: 'flash',
    iconColor: '#2563EB',
    amount: 1850,
    date: '1 Mar',
    time: '8:15 AM',
  },
];

export const mockSplit: SplitSummary = {
  owedAmount: 1850,
  friends: [
    { id: 'f1', name: 'Riya', initials: 'R', color: '#0F766E' },
    { id: 'f2', name: 'Arjun', initials: 'A', color: '#D97706' },
    { id: 'f3', name: 'Neha', initials: 'N', color: '#7C3AED' },
  ],
};

export const mockGoal: SavingsGoal = {
  id: 'g1',
  title: 'MacBook',
  current: 45000,
  target: 120000,
};

export const mockSubscriptions: Subscription[] = [
  {
    id: 's1',
    name: 'Netflix',
    amount: 649,
    icon: 'tv',
    color: '#DC2626',
    nextDate: '12 Mar',
  },
  {
    id: 's2',
    name: 'Spotify',
    amount: 119,
    icon: 'musical-notes',
    color: '#059669',
    nextDate: '15 Mar',
  },
  {
    id: 's3',
    name: 'iCloud',
    amount: 75,
    icon: 'cloud',
    color: '#2563EB',
    nextDate: '18 Mar',
  },
];

export const upcomingPaymentsTotal = 1276;

import { Platform } from 'react-native';
import type { ExpenseItem, SplitItem, AccountType } from '../types';
import { storage, STORAGE_KEYS } from './storage';
import { secureStore } from './secureStore';

// Android emulator uses 10.0.2.2, iOS simulator/Web uses localhost
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getBaseUrl();

// Default offline fallback seed
const DEFAULT_EXPENSES: ExpenseItem[] = [
  { id: 'tx_1', title: 'Zepto order', amount: 120, category: 'shopping', date: 'Sep 18, 11:40 PM', method: 'UPI', account: 'salary' },
  { id: 'tx_2', title: 'Zepto quick-cart', amount: 68.67, category: 'shopping', date: 'Sep 18, 11:40 PM', method: 'UPI', account: 'salary' },
  { id: 'tx_3', title: 'Fresh Milk', amount: 12.50, category: 'food', date: 'Sep 18, 11:37 PM', method: 'UPI', account: 'salary' },
  { id: 'tx_4', title: 'Dahi / Yogurt', amount: 5, category: 'food', date: 'Sep 18, 11:35 PM', method: 'UPI', account: 'salary' },
  { id: 'tx_5', title: 'Dishwash Soap', amount: 1.67, category: 'bills', date: 'Sep 18, 11:29 PM', method: 'UPI', account: 'salary' },
];

const DEFAULT_SPLITS = {
  summary: {
    youllGet: 8774,
    youOwe: 0,
    fromPeopleCount: 2,
    toPeopleCount: 0,
  },
  expenses: [
    { id: 'split_1', title: 'Meds & Pharmacy', amount: 10000, date: 'Sep 17, 2:31 PM', paidBy: 'YOU', status: 'SETTLED' as const },
    { id: 'split_2', title: 'Headphones', amount: 5000, date: 'Sep 17, 2:31 PM', paidBy: 'YOU', status: 'PENDING' as const, youGet: 5000 },
    { id: 'split_3', title: 'Monitor EMI split', amount: 4000, date: 'Sep 17, 2:29 PM', paidBy: 'YOU', status: 'PENDING' as const, youGet: 4000 },
  ],
  groups: [
    { id: 'grp_1', name: 'Room GGN', membersCount: 3, youOwe: 226 },
    { id: 'grp_2', name: 'Goa Trip 2026', membersCount: 5, youllGet: 3400 },
  ],
};

export const api = {
  // Auth: Social Sign-In (Apple & Google)
  socialAuth: async (payload: {
    provider: 'google' | 'apple';
    token: string;
    email?: string;
    name?: string;
  }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data && data.token) {
        // Securely store JWT in hardware-backed SecureStore (iOS Keychain / Android Keystore)
        await secureStore.setAuthToken(data.token);
      }
      if (data && data.user) {
        await storage.set(STORAGE_KEYS.AUTH_USER, data.user);
      }
      return data;
    } catch (e) {
      console.warn('API socialAuth fallback:', e);
      const fallbackUser = {
        name: payload.name || 'Apeksha Verma',
        email: payload.email || `${payload.provider}_user@expensio.app`,
        username: '',
        salary: null,
        avatarId: null,
      };
      const fallbackToken = `jwt_social_${Date.now()}`;
      await secureStore.setAuthToken(fallbackToken);
      await storage.set(STORAGE_KEYS.AUTH_USER, fallbackUser);
      return {
        success: true,
        token: fallbackToken,
        user: fallbackUser,
        isProfileComplete: false,
      };
    }
  },

  // Auth: Phone OTP
  sendOtp: async (phone: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      return await res.json();
    } catch (e) {
      console.warn('API sendOtp network fallback:', e);
      return { success: true, message: 'OTP sent (offline mode)', devOtp: '123456' };
    }
  },

  verifyOtp: async (phone: string, otp: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (data && data.token) {
        // SecureStore hardware Keychain/Keystore
        await secureStore.setAuthToken(data.token);
      }
      if (data && data.user) {
        await storage.set(STORAGE_KEYS.AUTH_USER, data.user);
      }
      return data;
    } catch (e) {
      console.warn('API verifyOtp offline fallback:', e);
      const fallbackUser = { name: 'Apeksha', username: '@apeksha', phone, salary: 31627, avatarId: 'avatar_1' };
      const fallbackToken = `dev_jwt_${Date.now()}`;
      await secureStore.setAuthToken(fallbackToken);
      await storage.set(STORAGE_KEYS.AUTH_USER, fallbackUser);
      return {
        success: true,
        token: fallbackToken,
        user: fallbackUser,
        isProfileComplete: true,
      };
    }
  },

  // Phase 2: Onboarding & User Profile
  getProfile: async () => {
    const token = await secureStore.getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/user/profile`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data && data.user) {
        await storage.set(STORAGE_KEYS.AUTH_USER, data.user);
      }
      return data;
    } catch (e) {
      console.warn('API getProfile fallback:', e);
      const cached = await storage.get(STORAGE_KEYS.AUTH_USER, {
        name: 'Apeksha',
        username: '@apeksha',
        salary: 31627,
        avatarId: 'avatar_1',
      });
      return {
        success: true,
        user: cached,
        isProfileComplete: Boolean(cached?.salary && cached?.avatarId && cached?.username),
      };
    }
  },

  updateProfile: async (profile: {
    username: string;
    salary: number;
    avatarId: string;
    name?: string;
  }) => {
    const token = await secureStore.getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data && data.user) {
        await storage.set(STORAGE_KEYS.AUTH_USER, data.user);
      }
      return data;
    } catch (e) {
      console.warn('API updateProfile offline fallback:', e);
      const existing = await storage.get<any>(STORAGE_KEYS.AUTH_USER, {});
      const updated = { ...existing, ...profile };
      await storage.set(STORAGE_KEYS.AUTH_USER, updated);
      return {
        success: true,
        user: updated,
        isProfileComplete: true,
      };
    }
  },

  // Phase 3: MPIN
  verifyMpin: async (mpin: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/mpin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mpin }),
      });
      return await res.json();
    } catch (e) {
      // Local fallback: Accept 1234 or locally saved MPIN
      const savedPin = await secureStore.getMpin();
      const isValid = (savedPin && savedPin === mpin) || mpin === '1234';
      return {
        success: isValid,
        message: isValid ? 'MPIN verified' : 'Incorrect MPIN',
      };
    }
  },

  setMpin: async (mpin: string) => {
    await secureStore.setMpin(mpin);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/mpin/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mpin }),
      });
      return await res.json();
    } catch (e) {
      return { success: true, message: 'MPIN configured offline' };
    }
  },

  // Accounts
  getAccounts: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/expenses/accounts`);
      const data = await res.json();
      if (data && data.accounts) {
        await storage.set(STORAGE_KEYS.ACCOUNTS, data.accounts);
      }
      return data;
    } catch (e) {
      return await storage.get(STORAGE_KEYS.ACCOUNTS, null);
    }
  },

  // Expenses & Transactions (Offline-first)
  getExpenses: async (): Promise<{ success: boolean; transactions: ExpenseItem[] }> => {
    // 1. Check local storage cache first
    const cached = await storage.get<ExpenseItem[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);

    try {
      const res = await fetch(`${API_BASE_URL}/expenses`);
      const data = await res.json();
      if (data && data.transactions) {
        await storage.set(STORAGE_KEYS.EXPENSES, data.transactions);
        return data;
      }
    } catch (e) {
      console.warn('API getExpenses using offline storage cache');
    }

    return { success: true, transactions: cached };
  },

  addExpense: async (data: {
    title: string;
    amount: number;
    category?: string;
    method?: string;
    account?: AccountType;
    type?: 'expense' | 'income';
  }) => {
    const localItem: ExpenseItem = {
      id: `tx_${Date.now()}`,
      title: data.title,
      amount: data.amount,
      category: (data.category as any) || 'general',
      date: 'Just now',
      method: (data.method as any) || 'UPI',
      account: data.account || 'salary',
      type: data.type || 'expense',
    };

    // Optimistically update local cache
    const existing = await storage.get<ExpenseItem[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
    await storage.set(STORAGE_KEYS.EXPENSES, [localItem, ...existing]);

    try {
      const res = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e) {
      console.warn('API addExpense recorded to offline storage');
      return {
        success: true,
        message: 'Expense recorded offline',
        transaction: localItem,
      };
    }
  },

  // Splits (Offline-first)
  getSplits: async () => {
    const cached = await storage.get(STORAGE_KEYS.SPLITS, DEFAULT_SPLITS);

    try {
      const res = await fetch(`${API_BASE_URL}/splits`);
      const data = await res.json();
      if (data && data.splits) {
        await storage.set(STORAGE_KEYS.SPLITS, data.splits);
        return data;
      }
    } catch (e) {
      console.warn('API getSplits using offline storage cache');
    }

    return { success: true, splits: cached };
  },

  settleSplit: async (id: string) => {
    // Update local cache optimistically
    const cached = await storage.get(STORAGE_KEYS.SPLITS, DEFAULT_SPLITS);
    if (cached && cached.expenses) {
      const updated = cached.expenses.map((item: SplitItem) =>
        item.id === id ? { ...item, status: 'SETTLED', youGet: 0, youOwe: 0 } : item
      );
      await storage.set(STORAGE_KEYS.SPLITS, { ...cached, expenses: updated });
    }

    try {
      const res = await fetch(`${API_BASE_URL}/splits/${id}/settle`, {
        method: 'POST',
      });
      return await res.json();
    } catch (e) {
      return { success: true, message: 'Expense settled offline' };
    }
  },

  // Subscriptions
  getSubscriptions: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions`);
      return await res.json();
    } catch (e) {
      return {
        success: true,
        totalMonthly: 180,
        subscriptions: [
          { id: 'sub_1', name: 'YouTube Premium', amount: 50, dueDate: 'Sep 15', status: 'OVERDUE', daysLeft: -3 },
          { id: 'sub_2', name: 'Netflix 4K', amount: 130, dueDate: 'Sep 27', status: 'UPCOMING', daysLeft: 2 },
        ],
      };
    }
  },
};

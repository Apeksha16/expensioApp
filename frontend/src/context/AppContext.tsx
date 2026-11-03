import React, { createContext, useContext, useMemo, useState } from 'react';
import { MOCK_EXISTING_USER } from '../data/config';
import { CURRENT_USER_ID, mockFriends, mockSplits } from '../data/splits';
import type {
  AuthPhase,
  CreateSplitInput,
  Friend,
  SplitExpense,
  UserProfile,
} from '../types';
import { createSplitExpense } from '../utils/splits';

interface AppState {
  authPhase: AuthPhase;
  setAuthPhase: (phase: AuthPhase) => void;
  phone: string;
  countryCode: string;
  setPhoneCredentials: (countryCode: string, phone: string) => void;
  profile: UserProfile | null;
  completeSetup: (profile: Omit<UserProfile, 'phone' | 'countryCode'>) => void;
  isExistingUser: boolean;
  setIsExistingUser: (value: boolean) => void;
  logout: () => void;
  friends: Friend[];
  splits: SplitExpense[];
  addSplit: (input: CreateSplitInput) => SplitExpense;
  settleShare: (splitId: string, friendId: string) => void;
  settleMyShare: (splitId: string) => void;
}

const AppContext = createContext<AppState | null>(null);

const emptyProfile = (
  countryCode: string,
  phone: string,
): UserProfile => ({
  name: 'Apeksha',
  userId: '@apeksha',
  monthlyIncome: 85000,
  cashInHand: 12500,
  savings: 112000,
  phone,
  countryCode,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authPhase, setAuthPhase] = useState<AuthPhase>('onboarding');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(MOCK_EXISTING_USER);
  const [friends] = useState<Friend[]>(mockFriends);
  const [splits, setSplits] = useState<SplitExpense[]>(mockSplits);

  const value = useMemo<AppState>(
    () => ({
      authPhase,
      setAuthPhase,
      phone,
      countryCode,
      setPhoneCredentials: (code, number) => {
        setCountryCode(code);
        setPhone(number);
      },
      profile,
      completeSetup: (data) => {
        setProfile({ ...data, phone, countryCode });
        setAuthPhase('main');
      },
      isExistingUser,
      setIsExistingUser,
      logout: () => {
        setProfile(null);
        setPhone('');
        setAuthPhase('onboarding');
      },
      friends,
      splits,
      addSplit: (input) => {
        const next = createSplitExpense(input);
        setSplits((prev) => [next, ...prev]);
        return next;
      },
      settleShare: (splitId, friendId) => {
        setSplits((prev) =>
          prev.map((split) => {
            if (split.id !== splitId) return split;
            return {
              ...split,
              shares: split.shares.map((share) =>
                share.friendId === friendId
                  ? { ...share, settled: true }
                  : share,
              ),
            };
          }),
        );
      },
      settleMyShare: (splitId) => {
        setSplits((prev) =>
          prev.map((split) => {
            if (split.id !== splitId) return split;
            return {
              ...split,
              shares: split.shares.map((share) =>
                share.friendId === CURRENT_USER_ID
                  ? { ...share, settled: true }
                  : share,
              ),
            };
          }),
        );
      },
    }),
    [authPhase, phone, countryCode, profile, isExistingUser, friends, splits],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useDisplayProfile(): UserProfile {
  const { profile, phone, countryCode } = useApp();
  return profile ?? emptyProfile(countryCode || '+91', phone || '9876543210');
}

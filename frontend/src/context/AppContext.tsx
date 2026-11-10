import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CURRENT_USER_ID, mockFriends, mockSplits } from '../data/splits';
import type {
  AuthPhase,
  CreateSplitInput,
  Friend,
  SplitExpense,
  UserProfile,
} from '../types';
import { createSplitExpense } from '../utils/splits';
import type { AuthResponse } from '../services/authApi';
import { clearSession, readSession, writeSession } from '../core/storage/session';
import { refreshSession, logoutSession } from '../services/authApi';

interface AppState {
  authPhase: AuthPhase;
  setAuthPhase: (phase: AuthPhase) => void;
  phone: string;
  countryCode: string;
  verificationChannel: 'phone' | 'email';
  verificationTarget: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  onboardingDraft: OnboardingDraft;
  setPhoneCredentials: (countryCode: string, phone: string) => void;
  setVerification: (channel: 'phone' | 'email', target: string) => void;
  markVerified: (channel: 'phone' | 'email') => void;
  updateOnboardingDraft: (draft: Partial<OnboardingDraft>) => void;
  profile: UserProfile | null;
  completeSetup: (profile: Omit<UserProfile, 'phone' | 'countryCode'>) => void;
  logout: () => void;
  friends: Friend[];
  splits: SplitExpense[];
  addSplit: (input: CreateSplitInput) => SplitExpense;
  settleShare: (splitId: string, friendId: string) => void;
  settleMyShare: (splitId: string) => void;
  applyAuthSession: (response: AuthResponse) => void;
  beginVerification: (response: AuthResponse, channel: 'phone' | 'email', target: string) => void;
}

export interface OnboardingDraft {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employmentType: 'salaried' | 'business' | 'student' | 'retired' | 'homemaker' | '';
  incomeRupees: string;
  cashRupees: string;
  savingsRupees: string;
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
  const [verificationChannel, setVerificationChannel] = useState<'phone' | 'email'>('phone');
  const [verificationTarget, setVerificationTarget] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [onboardingDraft, setOnboardingDraft] = useState<OnboardingDraft>({
    firstName: '', lastName: '', email: '', phone: '', employmentType: '',
    incomeRupees: '', cashRupees: '', savingsRupees: '',
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends] = useState<Friend[]>(mockFriends);
  const [splits, setSplits] = useState<SplitExpense[]>(mockSplits);

  useEffect(() => {
    void readSession().then(async (session) => {
      if (!session?.user) return;
      if (session.refreshToken) {
        try {
          const refreshed = await refreshSession(session.refreshToken);
          if (refreshed.token) {
            session = { ...session, accessToken: refreshed.token, refreshToken: refreshed.refreshToken };
            await writeSession(session);
          }
        } catch {
          await clearSession();
          return;
        }
      }
      const user = session.user as unknown as UserProfile;
      setProfile(user);
      setPhoneVerified(session.phoneVerified === true);
      setEmailVerified(session.emailVerified === true);
      if (session.onboardingDraft) {
        setOnboardingDraft((current) => ({ ...current, ...session.onboardingDraft }));
      }
      setAuthPhase(session.isProfileComplete ? 'main' : 'setup');
    });
  }, []);

  const value = useMemo<AppState>(
    () => ({
      authPhase,
      setAuthPhase,
      phone,
      countryCode,
      verificationChannel,
      verificationTarget,
      phoneVerified,
      emailVerified,
      onboardingDraft,
      setPhoneCredentials: (code, number) => {
        setCountryCode(code);
        setPhone(number);
      },
      setVerification: (channel, target) => {
        setVerificationChannel(channel);
        setVerificationTarget(target);
      },
      markVerified: (channel) => {
        const nextPhoneVerified = channel === 'phone' ? true : phoneVerified;
        const nextEmailVerified = channel === 'email' ? true : emailVerified;
        if (channel === 'phone') setPhoneVerified(true);
        else setEmailVerified(true);
        void readSession().then((session) => {
          if (session) {
            return writeSession({
              ...session,
              phoneVerified: nextPhoneVerified,
              emailVerified: nextEmailVerified,
            });
          }
          return undefined;
        });
      },
      updateOnboardingDraft: (draft) => {
        setOnboardingDraft((current) => ({ ...current, ...draft }));
        void readSession().then((session) => {
          if (session) {
            return writeSession({ ...session, onboardingDraft: { ...onboardingDraft, ...draft } });
          }
          return undefined;
        });
      },
      profile,
      completeSetup: (data) => {
        const nextProfile = { ...data, phone, countryCode };
        setProfile(nextProfile);
        void readSession().then((session) => {
          if (!session) return;
          return writeSession({ ...session, user: nextProfile, isProfileComplete: true });
        });
        setAuthPhase('main');
      },
      logout: () => {
        setProfile(null);
        setPhone('');
        setCountryCode('+91');
        setPhoneVerified(false);
        setEmailVerified(false);
        setVerificationTarget('');
        setOnboardingDraft({
          firstName: '', lastName: '', email: '', phone: '', employmentType: '',
          incomeRupees: '', cashRupees: '', savingsRupees: '',
        });
        void readSession().then((session) => {
          void logoutSession(session?.refreshToken).catch(() => undefined);
          void clearSession();
        });
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
      applyAuthSession: (response) => {
        if (!response.token || !response.user) {
          throw new Error('Authentication response was incomplete.');
        }
        const authenticatedUser = response.user;
        const nextProfile: UserProfile = {
          name: authenticatedUser.name || '',
          userId: authenticatedUser.username || '',
          monthlyIncome: Number(authenticatedUser.incomeAmountMinor?.slice(0, -2) || authenticatedUser.salary || 0),
          cashInHand: Number((authenticatedUser.cashBalanceMinor || '0').slice(0, -2) || 0),
          savings: Number((authenticatedUser.savingsAmountMinor || '0').slice(0, -2) || 0),
          phone: authenticatedUser.phone || phone,
          countryCode,
        };
        setProfile(nextProfile);
        setOnboardingDraft((current) => ({
          ...current,
          firstName: authenticatedUser.name?.split(/\s+/)[0] || current.firstName,
          lastName: authenticatedUser.name?.split(/\s+/).slice(1).join(' ') || current.lastName,
          email: authenticatedUser.email || current.email,
          phone: authenticatedUser.phone || current.phone,
        }));
        void writeSession({
          accessToken: response.token,
          refreshToken: response.refreshToken,
          user: nextProfile as unknown as Record<string, unknown>,
          isProfileComplete: response.isProfileComplete === true,
          phoneVerified,
          emailVerified,
        });
        setAuthPhase(response.isProfileComplete ? 'main' : 'setup');
      },
      beginVerification: (response, channel, target) => {
        if (!response.token || !response.user) {
          throw new Error('Authentication response was incomplete.');
        }
        const nextProfile: UserProfile = {
          name: response.user.name || '',
          userId: response.user.username || '',
          monthlyIncome: Number(response.user.incomeAmountMinor?.slice(0, -2) || response.user.salary || 0),
          cashInHand: 0,
          savings: 0,
          phone: response.user.phone || phone,
          countryCode,
        };
        setProfile(nextProfile);
        setOnboardingDraft((current) => ({
          ...current,
          firstName: response.user?.name?.split(/\s+/)[0] || current.firstName,
          lastName: response.user?.name?.split(/\s+/).slice(1).join(' ') || current.lastName,
          email: response.user?.email || current.email,
          phone: response.user?.phone || current.phone,
        }));
        setVerificationChannel(channel);
        setVerificationTarget(target);
        void writeSession({
          accessToken: response.token,
          refreshToken: response.refreshToken,
          user: nextProfile as unknown as Record<string, unknown>,
          isProfileComplete: false,
          phoneVerified,
          emailVerified,
        });
        setAuthPhase('otp');
      },
    }),
    [authPhase, phone, countryCode, profile, friends, splits, verificationChannel, verificationTarget, phoneVerified, emailVerified, onboardingDraft],
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

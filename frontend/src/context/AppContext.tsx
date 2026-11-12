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
import { getAuthProfile, refreshSession, logoutSession, updateOnboardingProgress } from '../services/authApi';

interface AppState {
  authPhase: AuthPhase;
  setAuthPhase: (phase: AuthPhase) => void;
  phone: string;
  countryCode: string;
  verificationChannel: 'phone' | 'email';
  verificationTarget: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  onboardingStep: number;
  onboardingDraft: OnboardingDraft;
  setPhoneCredentials: (countryCode: string, phone: string) => void;
  setVerification: (channel: 'phone' | 'email', target: string) => void;
  markVerified: (channel: 'phone' | 'email') => void;
  updateOnboardingDraft: (draft: Partial<OnboardingDraft>) => void;
  setOnboardingStep: (step: number) => void;
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
  const [authPhase, setAuthPhase] = useState<AuthPhase>('restoring');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [verificationChannel, setVerificationChannel] = useState<'phone' | 'email'>('phone');
  const [verificationTarget, setVerificationTarget] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [onboardingStep, setOnboardingStepState] = useState(1);
  const [onboardingDraft, setOnboardingDraft] = useState<OnboardingDraft>({
    firstName: '', lastName: '', email: '', phone: '', employmentType: '',
    incomeRupees: '', cashRupees: '', savingsRupees: '',
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends] = useState<Friend[]>(mockFriends);
  const [splits, setSplits] = useState<SplitExpense[]>(mockSplits);

  useEffect(() => {
    void readSession().then(async (session) => {
      if (!session?.user) {
        setAuthPhase('onboarding');
        return;
      }
      if (session.refreshToken) {
        try {
          const refreshed = await refreshSession(session.refreshToken);
          if (refreshed.token) {
            session = { ...session, accessToken: refreshed.token, refreshToken: refreshed.refreshToken };
            await writeSession(session);
          }
        } catch {
          await clearSession();
          setAuthPhase('onboarding');
          return;
        }
      }
      let user = session.user as unknown as UserProfile;
      let isProfileComplete = session.isProfileComplete;
      let serverOnboardingStep: number | null = null;
      try {
        const status = await getAuthProfile();
        if (status.user) {
          user = status.user as UserProfile;
          isProfileComplete = status.isProfileComplete === true;
          if (status.nextStep) {
            const step = status.nextStep === 'employment' ? 2 : status.nextStep === 'financial' ? 3 : status.nextStep === 'review' ? 4 : 1;
            setOnboardingStepState(step);
            serverOnboardingStep = step;
          }
        }
      } catch {
        await clearSession();
        setAuthPhase('onboarding');
        return;
      }
      setProfile(user);
      setPhoneVerified(session.phoneVerified === true);
      setEmailVerified(session.emailVerified === true);
      if (session.onboardingDraft) {
        setOnboardingDraft((current) => ({ ...current, ...session.onboardingDraft }));
      }
      if (!isProfileComplete && serverOnboardingStep === null) {
        setOnboardingStepState(session.onboardingStep || 1);
      }
      setAuthPhase(isProfileComplete ? 'main' : 'setup');
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
      onboardingStep,
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
        setOnboardingDraft((current) => {
          const next = { ...current, ...draft };
          void readSession().then((session) => {
            if (session) void writeSession({ ...session, onboardingDraft: next });
          });
          return next;
        });
      },
      setOnboardingStep: (step) => {
        const nextStep = Math.min(4, Math.max(1, step));
        setOnboardingStepState(nextStep);
        void updateOnboardingProgress(nextStep).catch(() => undefined);
        void readSession().then((session) => {
          if (session) void writeSession({ ...session, onboardingStep: nextStep });
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
        setOnboardingStepState(1);
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
          onboardingStep,
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
          onboardingStep,
        });
        setAuthPhase('otp');
      },
    }),
    [authPhase, phone, countryCode, profile, friends, splits, verificationChannel, verificationTarget, phoneVerified, emailVerified, onboardingDraft, onboardingStep],
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

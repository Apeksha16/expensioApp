import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppToast, type ToastMessage } from '../components/AppToast';
import { CURRENT_USER_ID } from '../data/splits';
import { DEFAULT_PREFERRED_MODULE_IDS, type AppModuleId } from '../data/modules';
import type {
  ReportDayOfWeek,
  ReportFrequency,
} from '../core/storage/preferences';
import {
  getLocalPreferences,
  modulePreferenceService,
  updateLocalPreferences,
  type ValidatedLocalPreferences,
} from '../services/modulePreferenceService';
import { reportPreferenceService, type ReportPreferenceChanges } from '../services/reportPreferenceService';
import type {
  AuthPhase,
  CategoryBudget,
  CreateSplitInput,
  Friend,
  RecurringPayment,
  SavingsGoal,
  SplitExpense,
  Transaction,
  UserProfile,
} from '../types';
import { createSplitExpense } from '../utils/splits';
import { updateLocalAccountEmail, type AuthResponse } from '../services/authApi';
import { clearSession, readSession, writeSession } from '../core/storage/session';
import { readLocalData, writeLocalData } from '../core/storage/localData';
import { avatarPreferenceService } from '../services/avatarPreferenceService';
import { profileService, type ProfileRecord } from '../services/profileService';
import { advancePaymentDate, localDateString, validateDate, validatePositiveAmount } from '../services/moneyService';
import { colors } from '../theme';

interface AppState {
  authPhase: AuthPhase;
  setAuthPhase: (phase: AuthPhase) => void;
  restoreError: string | null;
  retryRestore: () => void;
  showToast: (kind: ToastMessage['kind'], message: string) => void;
  phone: string;
  countryCode: string;
  verificationChannel: 'phone' | 'email';
  verificationTarget: string;
  verificationReturnPhase: 'mobile' | 'email';
  phoneVerified: boolean;
  emailVerified: boolean;
  onboardingStep: number;
  onboardingDraft: OnboardingDraft;
  setPhoneCredentials: (countryCode: string, phone: string) => void;
  setVerification: (channel: 'phone' | 'email', target: string) => void;
  updateOnboardingDraft: (draft: Partial<OnboardingDraft>) => void;
  setOnboardingStep: (step: number) => void;
  profile: UserProfile | null;
  profileState: AppProfileState;
  preferredModuleIds: AppModuleId[];
  avatarId: string | null;
  reportFrequency: ReportFrequency;
  reportsEnabled: boolean;
  reportDayOfWeek: ReportDayOfWeek;
  reportDayOfMonth: number;
  reportEmail: string;
  saveAvatarPreference: (avatarId: string | null) => Promise<void>;
  saveReportPreferences: (changes: Partial<ReportPreferenceChanges>) => Promise<void>;
  savePreferredModules: (moduleIds: unknown) => Promise<void>;
  updateProfileEmail: (email: string) => Promise<void>;
  completeSetup: (profile: Omit<UserProfile, 'phone' | 'countryCode'>) => Promise<void>;
  logout: () => Promise<void>;
  friends: Friend[];
  splits: SplitExpense[];
  transactions: Transaction[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  recurringPayments: RecurringPayment[];
  addTransaction: (input: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, changes: Pick<Transaction, 'merchant' | 'category' | 'amount'>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  addBudget: (input: Pick<CategoryBudget, 'category' | 'limit'>) => Promise<void>;
  removeBudget: (budgetId: string) => Promise<void>;
  addGoal: (input: Pick<SavingsGoal, 'title' | 'target' | 'targetDate'>) => Promise<void>;
  removeGoal: (goalId: string) => Promise<void>;
  contributeToGoal: (goalId: string, amount: number) => Promise<void>;
  addRecurringPayment: (input: Pick<RecurringPayment, 'name' | 'amount' | 'kind' | 'cadence' | 'nextDueDate' | 'category' | 'outstandingBalance' | 'remainingInstallments'>) => Promise<void>;
  removeRecurringPayment: (paymentId: string) => Promise<void>;
  markRecurringPaymentPaid: (paymentId: string) => Promise<void>;
  addFriend: (input: Pick<Friend, 'name' | 'userId'>) => Promise<void>;
  addSplit: (input: CreateSplitInput) => Promise<SplitExpense>;
  settleShare: (splitId: string, friendId: string) => Promise<void>;
  settleMyShare: (splitId: string) => Promise<void>;
  applyAuthSession: (response: AuthResponse) => Promise<void>;
  beginVerification: (response: AuthResponse, channel: 'phone' | 'email', target: string) => Promise<void>;
}

export interface AppProfileState extends ProfileRecord {
  avatarId: string | null;
  preferredModuleIds: AppModuleId[];
  reportFrequency: ReportFrequency;
  reportsEnabled: boolean;
  reportDayOfWeek: ReportDayOfWeek;
  reportDayOfMonth: number;
  reportEmail: string;
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

const colorsForFriend = ['#146B45', '#D97706', '#7C3AED', '#2563EB', '#DB2777'];

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authPhase, setAuthPhase] = useState<AuthPhase>('restoring');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [verificationChannel, setVerificationChannel] = useState<'phone' | 'email'>('phone');
  const [verificationTarget, setVerificationTarget] = useState('');
  const [verificationReturnPhase, setVerificationReturnPhase] = useState<'mobile' | 'email'>('mobile');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [onboardingStep, setOnboardingStepState] = useState(1);
  const [onboardingDraft, setOnboardingDraft] = useState<OnboardingDraft>({
    firstName: '', lastName: '', email: '', phone: '', employmentType: '',
    incomeRupees: '', cashRupees: '', savingsRupees: '',
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<ValidatedLocalPreferences>({
    preferredModuleIds: [...DEFAULT_PREFERRED_MODULE_IDS],
    preferredModuleOrder: DEFAULT_PREFERRED_MODULE_IDS.map((id, displayOrder) => ({ id, displayOrder })),
    avatarId: null,
    reportFrequency: 'monthly',
    reportsEnabled: false,
    reportDayOfWeek: 1,
    reportDayOfMonth: 1,
    reportEmail: '',
  });
  const [profileState, setProfileState] = useState<AppProfileState>({
    firstName: '',
    lastName: '',
    mobile: '',
    countryCode: '+91',
    email: '',
    avatarId: null,
    preferredModuleIds: [...DEFAULT_PREFERRED_MODULE_IDS],
    reportFrequency: 'monthly',
    reportsEnabled: false,
    reportDayOfWeek: 1,
    reportDayOfMonth: 1,
    reportEmail: '',
  });
  const [friends, setFriends] = useState<Friend[]>([]);
  const [splits, setSplits] = useState<SplitExpense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);

  const restoreLocalState = useCallback(async () => {
    setAuthPhase('restoring');
    setRestoreError(null);
    try {
      const [session, localData, savedPreferences, storedProfile] = await Promise.all([
        readSession(),
        readLocalData(),
        getLocalPreferences(),
        profileService.getProfile(),
      ]);
      setPreferences(savedPreferences);
      setTransactions(localData.transactions);
      setFriends(localData.friends);
      setSplits(localData.splits);
      setBudgets(localData.budgets);
      setGoals(localData.goals);
      setRecurringPayments(localData.recurringPayments);
      const user = session?.user as unknown as UserProfile | undefined;
      const draft = session?.onboardingDraft as Partial<OnboardingDraft> | undefined;
      const sessionName = user?.name?.trim().split(/\s+/) ?? [];
      const firstName = storedProfile.firstName || draft?.firstName || sessionName[0] || '';
      const lastName = storedProfile.lastName || draft?.lastName || sessionName.slice(1).join(' ');
      const nextProfileRecord: ProfileRecord = {
        firstName,
        lastName,
        mobile: storedProfile.mobile || user?.phone || draft?.phone || '',
        countryCode: storedProfile.countryCode || user?.countryCode || '+91',
        email: storedProfile.email || user?.email || draft?.email || '',
      };
      let nextPreferences = savedPreferences;
      if (nextProfileRecord.email && savedPreferences.reportEmail !== nextProfileRecord.email.toLowerCase()) {
        nextPreferences = await updateLocalPreferences({ reportEmail: nextProfileRecord.email.toLowerCase() });
        setPreferences(nextPreferences);
      }
      if (user) await profileService.saveProfile(nextProfileRecord);
      setProfileState({
        ...nextProfileRecord,
        avatarId: nextPreferences.avatarId,
        preferredModuleIds: nextPreferences.preferredModuleIds,
        reportFrequency: nextPreferences.reportFrequency,
        reportsEnabled: nextPreferences.reportsEnabled,
        reportDayOfWeek: nextPreferences.reportDayOfWeek,
        reportDayOfMonth: nextPreferences.reportDayOfMonth,
        reportEmail: nextPreferences.reportEmail,
      });
      if (!session?.user || !user) {
        setAuthPhase('onboarding');
        return;
      }

      setProfile({
        ...user,
        monthlyIncome: Number(user.monthlyIncome) || 0,
        cashInHand: Number(user.cashInHand) || 0,
        savings: Number(user.savings) || 0,
        phone: user.phone || '',
        countryCode: user.countryCode || '+91',
        email: nextProfileRecord.email,
      });
      setPhone(user.phone || '');
      setCountryCode(user.countryCode || '+91');
      setPhoneVerified(session.phoneVerified === true);
      setEmailVerified(session.emailVerified === true);
      if (draft) {
        setOnboardingDraft((current) => ({ ...current, ...draft }));
      }
      if (nextProfileRecord.email) setOnboardingDraft((current) => ({ ...current, email: nextProfileRecord.email }));
      if (nextProfileRecord.firstName || nextProfileRecord.lastName) {
        setOnboardingDraft((current) => ({
          ...current,
          firstName: nextProfileRecord.firstName,
          lastName: nextProfileRecord.lastName,
        }));
      }
      setOnboardingStepState(session.onboardingStep || 1);
      setAuthPhase(session.isProfileComplete ? 'main' : 'setup');
    } catch (error) {
      setRestoreError(error instanceof Error ? error.message : 'Unable to load saved data from this device.');
      setAuthPhase('onboarding');
    }
  }, []);

  useEffect(() => {
    void restoreLocalState();
  }, [restoreLocalState]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = useCallback((kind: ToastMessage['kind'], message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    const id = Date.now();
    setToast({ id, kind, message });
    toastTimer.current = setTimeout(() => setToast((current) => current?.id === id ? null : current), 3200);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      authPhase,
      setAuthPhase,
      restoreError,
      retryRestore: () => { void restoreLocalState(); },
      showToast,
      phone,
      countryCode,
      verificationChannel,
      verificationTarget,
      verificationReturnPhase,
      phoneVerified,
      emailVerified,
      onboardingStep,
      onboardingDraft,
      setPhoneCredentials: (code, number) => {
        setCountryCode(code);
        setPhone(number);
        setProfileState((current) => ({ ...current, countryCode: code, mobile: number }));
      },
      setVerification: (channel, target) => {
        setVerificationChannel(channel);
        setVerificationTarget(target);
        setVerificationReturnPhase('mobile');
      },
      updateOnboardingDraft: (draft) => {
        const next = { ...onboardingDraft, ...draft };
        setOnboardingDraft(next);
        setProfileState((current) => ({
          ...current,
          firstName: draft.firstName ?? current.firstName,
          lastName: draft.lastName ?? current.lastName,
          email: draft.email ?? current.email,
          mobile: draft.phone ?? current.mobile,
        }));
        void readSession()
          .then((session) => session ? writeSession({ ...session, onboardingDraft: next }) : undefined)
          .catch((error: unknown) => showToast('error', error instanceof Error ? error.message : 'Unable to save onboarding details locally.'));
      },
      setOnboardingStep: (step) => {
        const nextStep = Math.min(4, Math.max(1, step));
        setOnboardingStepState(nextStep);
        void readSession()
          .then((session) => session ? writeSession({ ...session, onboardingStep: nextStep }) : undefined)
          .catch((error: unknown) => showToast('error', error instanceof Error ? error.message : 'Unable to save onboarding progress locally.'));
      },
      profile,
      profileState,
      preferredModuleIds: preferences.preferredModuleIds,
      avatarId: preferences.avatarId,
      reportFrequency: preferences.reportFrequency,
      reportsEnabled: preferences.reportsEnabled,
      reportDayOfWeek: preferences.reportDayOfWeek,
      reportDayOfMonth: preferences.reportDayOfMonth,
      reportEmail: preferences.reportEmail,
      saveAvatarPreference: async (nextAvatarId) => {
        const savedAvatarId = await avatarPreferenceService.saveSelectedAvatarId(nextAvatarId);
        setPreferences((current) => ({ ...current, avatarId: savedAvatarId }));
        setProfileState((current) => ({ ...current, avatarId: savedAvatarId }));
      },
      saveReportPreferences: async (changes) => {
        const updated = await reportPreferenceService.saveReportPreferences(changes);
        setPreferences((current) => ({ ...current, ...updated }));
        setProfileState((current) => ({ ...current, ...updated }));
      },
      savePreferredModules: async (moduleIds) => {
        const preferredModuleIds = await modulePreferenceService.savePreferredModules(moduleIds);
        setPreferences((current) => ({
          ...current,
          preferredModuleIds,
          preferredModuleOrder: preferredModuleIds.map((id, displayOrder) => ({ id, displayOrder })),
        }));
        setProfileState((current) => ({ ...current, preferredModuleIds }));
      },
      updateProfileEmail: async (email) => {
        const nextEmail = email.trim().toLowerCase();
        const currentEmail = profileState.email || onboardingDraft.email || profile?.email || '';
        if (nextEmail === currentEmail.trim().toLowerCase()) {
          throw new Error('Enter a different email address.');
        }
        const nextProfile = profile ? { ...profile, email: nextEmail } : null;
        const session = await readSession();
        const previousStoredProfile = await profileService.getProfile();
        const accountUser = {
          ...(profile ?? {}),
          name: profile?.name || `${profileState.firstName} ${profileState.lastName}`.trim(),
          email: nextEmail,
          phone: profile?.phone || profileState.mobile || phone,
          username: profile?.userId || nextEmail,
        };
        let accountUpdated = false;
        let profileUpdated = false;
        let updatedPreferences: ValidatedLocalPreferences | null = null;
        try {
          await updateLocalAccountEmail(currentEmail, nextEmail, accountUser);
          accountUpdated = true;
          await profileService.saveProfile({ ...previousStoredProfile, email: nextEmail });
          profileUpdated = true;
          updatedPreferences = await updateLocalPreferences({ reportEmail: nextEmail });
          if (session) {
            await writeSession({
              ...session,
              user: { ...session.user, ...(nextProfile ?? {}), email: nextEmail },
              onboardingDraft: { ...session.onboardingDraft, email: nextEmail },
            });
          }
        } catch (error) {
          const rollbackErrors: string[] = [];
          if (updatedPreferences) {
            try { await updateLocalPreferences({ reportEmail: preferences.reportEmail }); }
            catch (rollbackError) { rollbackErrors.push(rollbackError instanceof Error ? rollbackError.message : 'Unable to restore report destination.'); }
          }
          if (profileUpdated) {
            try { await profileService.saveProfile(previousStoredProfile); }
            catch (rollbackError) { rollbackErrors.push(rollbackError instanceof Error ? rollbackError.message : 'Unable to restore saved profile.'); }
          }
          if (accountUpdated && currentEmail) {
            try { await updateLocalAccountEmail(nextEmail, currentEmail, accountUser); }
            catch (rollbackError) { rollbackErrors.push(rollbackError instanceof Error ? rollbackError.message : 'Unable to restore local account email.'); }
          }
          if (rollbackErrors.length) {
            throw new Error(`Email change failed. ${rollbackErrors.join(' ')}`);
          }
          throw error;
        }
        if (updatedPreferences) setPreferences(updatedPreferences);
        setProfileState((current) => ({ ...current, email: nextEmail, reportEmail: nextEmail }));
        setProfile(nextProfile);
        setOnboardingDraft((current) => ({ ...current, email: nextEmail }));
      },
      completeSetup: async (data) => {
        const nextProfile = { ...data, phone, countryCode };
        const [firstName = '', ...lastNameParts] = nextProfile.name.trim().split(/\s+/);
        const storedProfile = await profileService.saveProfile({
          firstName,
          lastName: lastNameParts.join(' '),
          mobile: nextProfile.phone,
          countryCode: nextProfile.countryCode,
          email: nextProfile.email || '',
        });
        const nextPreferences = storedProfile.email
          ? await updateLocalPreferences({ reportEmail: storedProfile.email })
          : preferences;
        const session = await readSession();
        if (session) await writeSession({ ...session, user: nextProfile, isProfileComplete: true });
        setProfile(nextProfile);
        setPreferences(nextPreferences);
        setProfileState((current) => ({ ...current, ...storedProfile, ...nextPreferences }));
        setAuthPhase('main');
      },
      logout: async () => {
        try {
          await clearSession();
        } catch (error) {
          setRestoreError(error instanceof Error ? error.message : 'Unable to clear the local session.');
          return;
        }
        setProfile(null);
        setProfileState((current) => ({
          ...current,
          firstName: '',
          lastName: '',
          mobile: '',
          countryCode: '+91',
          email: '',
        }));
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
        setAuthPhase('onboarding');
      },
      friends,
      splits,
      transactions,
      budgets,
      goals,
      recurringPayments,
      addTransaction: async (input) => {
        const transaction: Transaction = { ...input, id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
        const nextTransactions = [transaction, ...transactions];
        await writeLocalData({ transactions: nextTransactions, friends, splits, budgets, goals, recurringPayments });
        setTransactions(nextTransactions);
      },
      updateTransaction: async (id, changes) => {
        const merchant = changes.merchant.trim();
        if (!merchant) throw new Error('Enter a name for this transaction.');
        validatePositiveAmount(changes.amount, 'transaction amount');
        if (!transactions.some((transaction) => transaction.id === id)) {
          throw new Error('This transaction is no longer available.');
        }
        const nextTransactions = transactions.map((transaction) => transaction.id === id
          ? {
            ...transaction,
            merchant,
            category: changes.category.trim() || transaction.category,
            amount: Math.trunc(changes.amount),
          }
          : transaction);
        await writeLocalData({ transactions: nextTransactions, friends, splits, budgets, goals, recurringPayments });
        setTransactions(nextTransactions);
      },
      removeTransaction: async (id) => {
        const nextTransactions = transactions.filter((transaction) => transaction.id !== id);
        if (nextTransactions.length === transactions.length) return;
        await writeLocalData({ transactions: nextTransactions, friends, splits, budgets, goals, recurringPayments });
        setTransactions(nextTransactions);
      },
      addBudget: async (input) => {
        const category = input.category.trim();
        if (!category) throw new Error('Enter a budget category.');
        validatePositiveAmount(input.limit, 'budget limit');
        if (budgets.some((budget) => budget.category.toLowerCase() === category.toLowerCase())) {
          throw new Error('A budget for this category already exists.');
        }
        const budget: CategoryBudget = {
          id: `budget-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          category,
          limit: Math.trunc(input.limit),
          createdAt: Date.now(),
        };
        const nextBudgets = [budget, ...budgets];
        await writeLocalData({ transactions, friends, splits, budgets: nextBudgets, goals, recurringPayments });
        setBudgets(nextBudgets);
      },
      removeBudget: async (budgetId) => {
        const nextBudgets = budgets.filter((budget) => budget.id !== budgetId);
        if (nextBudgets.length === budgets.length) return;
        await writeLocalData({ transactions, friends, splits, budgets: nextBudgets, goals, recurringPayments });
        setBudgets(nextBudgets);
      },
      addGoal: async (input) => {
        const title = input.title.trim();
        if (!title) throw new Error('Enter a name for your goal.');
        validatePositiveAmount(input.target, 'goal target');
        if (input.targetDate) validateDate(input.targetDate, 'target date');
        const goal: SavingsGoal = {
          id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title,
          current: 0,
          target: Math.trunc(input.target),
          targetDate: input.targetDate,
        };
        const nextGoals = [goal, ...goals];
        await writeLocalData({ transactions, friends, splits, budgets, goals: nextGoals, recurringPayments });
        setGoals(nextGoals);
      },
      removeGoal: async (goalId) => {
        const nextGoals = goals.filter((goal) => goal.id !== goalId);
        if (nextGoals.length === goals.length) return;
        await writeLocalData({ transactions, friends, splits, budgets, goals: nextGoals, recurringPayments });
        setGoals(nextGoals);
      },
      contributeToGoal: async (goalId, amount) => {
        validatePositiveAmount(amount, 'contribution');
        const goal = goals.find((item) => item.id === goalId);
        if (!goal) throw new Error('This goal is no longer available.');
        const nextGoals = goals.map((item) => item.id === goalId
          ? { ...item, current: item.current + Math.trunc(amount) }
          : item);
        await writeLocalData({ transactions, friends, splits, budgets, goals: nextGoals, recurringPayments });
        setGoals(nextGoals);
      },
      addRecurringPayment: async (input) => {
        const name = input.name.trim();
        const category = input.category.trim();
        if (!name) throw new Error('Enter a name for this payment.');
        if (!category) throw new Error('Enter a category for this payment.');
        validatePositiveAmount(input.amount, 'payment amount');
        validateDate(input.nextDueDate, 'due date');
        if (!['weekly', 'monthly', 'yearly'].includes(input.cadence)) throw new Error('Choose a valid payment frequency.');
        if (input.outstandingBalance !== undefined && (!Number.isFinite(input.outstandingBalance) || input.outstandingBalance < 0)) {
          throw new Error('Enter a valid outstanding balance.');
        }
        if (input.remainingInstallments !== undefined && (!Number.isInteger(input.remainingInstallments) || input.remainingInstallments < 1)) {
          throw new Error('Remaining installments must be a whole number greater than zero.');
        }
        const payment: RecurringPayment = {
          ...input,
          id: `payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name,
          category,
          amount: Math.trunc(input.amount),
          active: true,
        };
        const nextPayments = [payment, ...recurringPayments];
        await writeLocalData({ transactions, friends, splits, budgets, goals, recurringPayments: nextPayments });
        setRecurringPayments(nextPayments);
      },
      removeRecurringPayment: async (paymentId) => {
        const nextPayments = recurringPayments.filter((payment) => payment.id !== paymentId);
        if (nextPayments.length === recurringPayments.length) return;
        await writeLocalData({ transactions, friends, splits, budgets, goals, recurringPayments: nextPayments });
        setRecurringPayments(nextPayments);
      },
      markRecurringPaymentPaid: async (paymentId) => {
        const payment = recurringPayments.find((item) => item.id === paymentId);
        if (!payment || !payment.active) throw new Error('This recurring payment is unavailable.');
        const now = new Date();
        const nextPayments = recurringPayments.map((item) => item.id === paymentId
          ? {
            ...item,
            nextDueDate: advancePaymentDate(item.nextDueDate, item.cadence, now),
            outstandingBalance: item.kind === 'emi' && item.outstandingBalance !== undefined
              ? Math.max(0, item.outstandingBalance - item.amount)
              : item.outstandingBalance,
            remainingInstallments: item.kind === 'emi' && item.remainingInstallments !== undefined
              ? Math.max(0, item.remainingInstallments - 1)
              : item.remainingInstallments,
            active: item.kind === 'emi' && item.remainingInstallments === 1 ? false : item.active,
          }
          : item);
        const transaction: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'expense',
          merchant: payment.name,
          category: payment.category,
          icon: payment.kind === 'emi' ? 'cash' : 'receipt',
          iconColor: colors.expense,
          amount: payment.amount,
          date: localDateString(now),
          time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          occurredAt: now.getTime(),
        };
        const nextTransactions = [transaction, ...transactions];
        await writeLocalData({ transactions: nextTransactions, friends, splits, budgets, goals, recurringPayments: nextPayments });
        setTransactions(nextTransactions);
        setRecurringPayments(nextPayments);
      },
      addFriend: async (input) => {
        const name = input.name.trim();
        const userId = input.userId.trim().replace(/^@+/, '');
        if (!name || !userId) throw new Error('Enter a name and User ID for this friend.');
        if (friends.some((friend) => friend.userId.replace(/^@+/, '').toLowerCase() === userId.toLowerCase())) {
          throw new Error('A friend with this User ID already exists.');
        }
        const friend: Friend = {
          id: `friend-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name,
          userId: `@${userId}`,
          initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
          color: colorsForFriend[friends.length % colorsForFriend.length],
        };
        const nextFriends = [...friends, friend];
        await writeLocalData({ transactions, friends: nextFriends, splits, budgets, goals, recurringPayments });
        setFriends(nextFriends);
      },
      addSplit: async (input) => {
        const next = createSplitExpense(input);
        const nextSplits = [next, ...splits];
        await writeLocalData({ transactions, friends, splits: nextSplits, budgets, goals, recurringPayments });
        setSplits(nextSplits);
        return next;
      },
      settleShare: async (splitId, friendId) => {
        const nextSplits = splits.map((split) => {
            if (split.id !== splitId) return split;
            return {
              ...split,
              shares: split.shares.map((share) =>
                share.friendId === friendId
                  ? { ...share, settled: true }
                  : share,
              ),
            };
          });
        await writeLocalData({ transactions, friends, splits: nextSplits, budgets, goals, recurringPayments });
        setSplits(nextSplits);
      },
      settleMyShare: async (splitId) => {
        const nextSplits = splits.map((split) => {
            if (split.id !== splitId) return split;
            return {
              ...split,
              shares: split.shares.map((share) =>
                share.friendId === CURRENT_USER_ID
                  ? { ...share, settled: true }
                  : share,
              ),
            };
          });
        await writeLocalData({ transactions, friends, splits: nextSplits, budgets, goals, recurringPayments });
        setSplits(nextSplits);
      },
      applyAuthSession: async (response) => {
        if (!response.token || !response.user) {
          throw new Error('Authentication response was incomplete.');
        }
        const nextEmailVerified = response.verifiedChannel === 'email' || emailVerified;
        const nextPhoneVerified = response.verifiedChannel === 'phone' || phoneVerified;
        if (nextEmailVerified && !emailVerified) setEmailVerified(true);
        if (nextPhoneVerified && !phoneVerified) setPhoneVerified(true);
        const authenticatedUser = response.user;
        const nextProfile: UserProfile = {
          name: authenticatedUser.name || '',
          userId: authenticatedUser.username || '',
          monthlyIncome: Number(authenticatedUser.incomeAmountMinor?.slice(0, -2) || authenticatedUser.salary || 0),
          cashInHand: Number((authenticatedUser.cashBalanceMinor || '0').slice(0, -2) || 0),
          savings: Number((authenticatedUser.savingsAmountMinor || '0').slice(0, -2) || 0),
          phone: authenticatedUser.phone || phone,
          countryCode,
          email: authenticatedUser.email || '',
        };
        const [firstName = '', ...lastNameParts] = nextProfile.name.trim().split(/\s+/);
        const savedProfile = await profileService.saveProfile({
          firstName,
          lastName: lastNameParts.join(' '),
          mobile: nextProfile.phone,
          countryCode: nextProfile.countryCode,
          email: nextProfile.email || '',
        });
        const nextPreferences = nextProfile.email
          ? await updateLocalPreferences({ reportEmail: nextProfile.email.toLowerCase() })
          : preferences;
        await writeSession({
          accessToken: response.token,
          user: nextProfile as unknown as Record<string, unknown>,
          isProfileComplete: response.isProfileComplete === true,
          phoneVerified: nextPhoneVerified,
          emailVerified: nextEmailVerified,
          onboardingStep,
        });
        setPreferences(nextPreferences);
        setProfile(nextProfile);
        setProfileState((current) => ({ ...current, ...savedProfile, ...nextPreferences }));
        setOnboardingDraft((current) => ({
          ...current,
          firstName: authenticatedUser.name?.split(/\s+/)[0] || current.firstName,
          lastName: authenticatedUser.name?.split(/\s+/).slice(1).join(' ') || current.lastName,
          email: authenticatedUser.email || current.email,
          phone: authenticatedUser.phone || current.phone,
        }));
        setAuthPhase(response.isProfileComplete ? 'main' : 'setup');
      },
      beginVerification: async (response, channel, target) => {
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
          email: response.user.email || '',
        };
        const [firstName = '', ...lastNameParts] = nextProfile.name.trim().split(/\s+/);
        const savedProfile = await profileService.saveProfile({
          firstName,
          lastName: lastNameParts.join(' '),
          mobile: nextProfile.phone,
          countryCode: nextProfile.countryCode,
          email: nextProfile.email || '',
        });
        const nextPreferences = nextProfile.email
          ? await updateLocalPreferences({ reportEmail: nextProfile.email.toLowerCase() })
          : preferences;
        await writeSession({
          accessToken: response.token,
          user: nextProfile as unknown as Record<string, unknown>,
          isProfileComplete: false,
          phoneVerified,
          emailVerified,
          onboardingStep,
        });
        setPreferences(nextPreferences);
        setProfile(nextProfile);
        setProfileState((current) => ({ ...current, ...savedProfile, ...nextPreferences }));
        setOnboardingDraft((current) => ({
          ...current,
          firstName: response.user?.name?.split(/\s+/)[0] || current.firstName,
          lastName: response.user?.name?.split(/\s+/).slice(1).join(' ') || current.lastName,
          email: response.user?.email || current.email,
          phone: response.user?.phone || current.phone,
        }));
        setVerificationChannel(channel);
        setVerificationTarget(target);
        setVerificationReturnPhase(channel === 'email' ? 'email' : 'mobile');
        setAuthPhase('otp');
      },
    }),
    [authPhase, restoreError, restoreLocalState, showToast, phone, countryCode, profile, profileState, preferences, friends, splits, transactions, budgets, goals, recurringPayments, verificationChannel, verificationTarget, phoneVerified, emailVerified, onboardingDraft, onboardingStep],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <AppToast toast={toast} />
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useDisplayProfile(): UserProfile {
  const { profile, phone, countryCode } = useApp();
  return profile ?? {
    name: '',
    userId: '',
    monthlyIncome: 0,
    cashInHand: 0,
    savings: 0,
    phone,
    countryCode: countryCode || '+91',
  };
}

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
  SplitGroup,
  Transaction,
  UserProfile,
  GoalContribution,
} from '../types';
import { createSplitExpense } from '../utils/splits';
import { updateLocalAccountEmail, type AuthResponse } from '../services/authApi';
import { clearSession, readSession, writeSession } from '../core/storage/session';
import { readLocalData, writeLocalData } from '../core/storage/localData';
import { avatarPreferenceService } from '../services/avatarPreferenceService';
import { profileService, type ProfileRecord } from '../services/profileService';
import { advancePaymentDate, localDateString, validateDate, validatePositiveAmount } from '../services/moneyService';
import { colors } from '../theme';
import { formatINR, formatTransactionDate } from '../utils/format';
import { getSplitGroups, saveSplitGroups } from '../services/splitGroupService';

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
  updateProfileDetails: (changes: Pick<ProfileRecord, 'firstName' | 'lastName'>) => Promise<void>;
  saveAvatarPreference: (avatarId: string | null) => Promise<void>;
  saveReportPreferences: (changes: Partial<ReportPreferenceChanges>) => Promise<void>;
  savePreferredModules: (moduleIds: unknown) => Promise<void>;
  updateProfileEmail: (email: string) => Promise<void>;
  completeSetup: (profile: Omit<UserProfile, 'phone' | 'countryCode'>) => Promise<void>;
  logout: () => Promise<void>;
  friends: Friend[];
  splitGroups: SplitGroup[];
  addSplitGroup: (input: Pick<SplitGroup, 'name' | 'friendIds'>) => Promise<void>;
  updateSplitGroup: (groupId: string, changes: Pick<SplitGroup, 'name' | 'friendIds'>) => Promise<void>;
  removeSplitGroup: (groupId: string) => Promise<void>;
  splits: SplitExpense[];
  transactions: Transaction[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  recurringPayments: RecurringPayment[];
  addTransaction: (input: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, changes: Pick<Transaction, 'merchant' | 'category' | 'amount' | 'type' | 'date' | 'occurredAt'>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  addBudget: (input: Pick<CategoryBudget, 'category' | 'limit'>) => Promise<void>;
  updateBudget: (budgetId: string, changes: Pick<CategoryBudget, 'category' | 'limit'>) => Promise<void>;
  removeBudget: (budgetId: string) => Promise<void>;
  addGoal: (input: Pick<SavingsGoal, 'title' | 'target' | 'targetDate'>) => Promise<void>;
  removeGoal: (goalId: string) => Promise<void>;
  contributeToGoal: (goalId: string, amount: number) => Promise<void>;
  addRecurringPayment: (input: Pick<RecurringPayment, 'name' | 'amount' | 'kind' | 'cadence' | 'nextDueDate' | 'category' | 'outstandingBalance' | 'remainingInstallments'>) => Promise<void>;
  updateRecurringPayment: (paymentId: string, changes: Pick<RecurringPayment, 'name' | 'amount' | 'kind' | 'cadence' | 'nextDueDate' | 'category' | 'outstandingBalance' | 'remainingInstallments'>) => Promise<void>;
  setRecurringPaymentActive: (paymentId: string, active: boolean) => Promise<void>;
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

function getAccountDataOwner(user: Pick<UserProfile, 'email' | 'phone'> | null | undefined): string | null {
  const identity = user?.phone?.trim() || user?.email?.trim().toLowerCase();
  return identity || null;
}

function isInCurrentMonth(transaction: Transaction, now = new Date()): boolean {
  if (typeof transaction.occurredAt === 'number') {
    const date = new Date(transaction.occurredAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  if (transaction.date === 'Today' || transaction.date === 'Yesterday') return true;
  const date = new Date(`${transaction.date} ${now.getFullYear()}`);
  return !Number.isNaN(date.getTime()) && date.getMonth() === now.getMonth();
}

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
  const [splitGroups, setSplitGroups] = useState<SplitGroup[]>([]);
  const [splits, setSplits] = useState<SplitExpense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const localDataOwnerRef = useRef<string | null>(null);
  const operationLocksRef = useRef(new Set<string>());

  const persistLocalData = useCallback((data: Parameters<typeof writeLocalData>[0]) =>
    writeLocalData(data, localDataOwnerRef.current), []);

  const runWithLocalLock = useCallback(async (key: string, operation: () => Promise<void>) => {
    if (operationLocksRef.current.has(key)) return;
    operationLocksRef.current.add(key);
    try {
      await operation();
    } finally {
      operationLocksRef.current.delete(key);
    }
  }, []);

  const restoreAccountData = useCallback(async (ownerId: string | null) => {
    const [localData, groups] = await Promise.all([readLocalData(ownerId), getSplitGroups(ownerId)]);
    localDataOwnerRef.current = ownerId;
    setTransactions(localData.transactions);
    setFriends(localData.friends);
    setSplits(localData.splits);
    setBudgets(localData.budgets);
    setGoals(localData.goals);
    setRecurringPayments(localData.recurringPayments);
    setSplitGroups(groups);
  }, []);

  const restoreLocalState = useCallback(async () => {
    setAuthPhase('restoring');
    setRestoreError(null);
    try {
      const session = await readSession();
      const sessionUser = session?.user as unknown as UserProfile | undefined;
      const ownerId = session?.dataOwnerId ?? getAccountDataOwner(sessionUser);
      const [savedPreferences, storedProfile] = await Promise.all([
        getLocalPreferences(ownerId),
        profileService.getProfile(ownerId),
      ]);
      await restoreAccountData(ownerId);
      setPreferences(savedPreferences);
      const user = sessionUser;
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
        nextPreferences = await updateLocalPreferences({ reportEmail: nextProfileRecord.email.toLowerCase() }, ownerId);
        setPreferences(nextPreferences);
      }
      if (user) await profileService.saveProfile(nextProfileRecord, ownerId);
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
  }, [restoreAccountData]);

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

  const notifyBudgetThresholds = useCallback((nextTransactions: Transaction[]) => {
    const now = new Date();
    for (const budget of budgets) {
      const spendFor = (items: Transaction[]) => items
        .filter((transaction) => transaction.type === 'expense'
          && isInCurrentMonth(transaction, now)
          && transaction.category.toLowerCase() === budget.category.toLowerCase())
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const spent = spendFor(nextTransactions);
      const oldSpent = spendFor(transactions);
      const threshold = budget.limit * (budget.alertThreshold ?? 0.8);
      if (spent >= budget.limit && oldSpent < budget.limit) {
        showToast('error', `${budget.category} budget exceeded.`);
      } else if (spent >= threshold && oldSpent < threshold) {
        showToast('success', `${budget.category} budget is ${Math.round((spent / budget.limit) * 100)}% used.`);
      }
    }
  }, [budgets, showToast, transactions]);

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
        const ownerId = localDataOwnerRef.current;
        const savedAvatarId = await avatarPreferenceService.saveSelectedAvatarId(nextAvatarId, ownerId);
        setPreferences((current) => ({ ...current, avatarId: savedAvatarId }));
        setProfileState((current) => ({ ...current, avatarId: savedAvatarId }));
      },
      updateProfileDetails: async (changes) => {
        const firstName = changes.firstName.trim();
        const lastName = changes.lastName.trim();
        if (!firstName || !lastName) throw new Error('Enter both your first and last name.');
        const ownerId = localDataOwnerRef.current;
        const previous = await profileService.getProfile(ownerId);
        const updated = await profileService.saveProfile({ ...previous, firstName, lastName }, ownerId);
        const session = await readSession();
        try {
          if (session) {
            const user = session.user ?? {};
            await writeSession({
              ...session,
              user: { ...user, name: `${firstName} ${lastName}`.trim() },
            });
          }
        } catch (error) {
          await profileService.saveProfile(previous, ownerId);
          throw error;
        }
        setProfileState((current) => ({ ...current, ...updated }));
        setOnboardingDraft((current) => ({ ...current, firstName, lastName }));
        setProfile((current) => current ? { ...current, name: `${firstName} ${lastName}`.trim() } : current);
      },
      saveReportPreferences: async (changes) => {
        const updated = await reportPreferenceService.saveReportPreferences(changes, localDataOwnerRef.current);
        setPreferences((current) => ({ ...current, ...updated }));
        setProfileState((current) => ({ ...current, ...updated }));
      },
      savePreferredModules: async (moduleIds) => {
        const preferredModuleIds = await modulePreferenceService.savePreferredModules(moduleIds, localDataOwnerRef.current);
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
        const ownerId = localDataOwnerRef.current;
        const previousStoredProfile = await profileService.getProfile(ownerId);
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
          await profileService.saveProfile({ ...previousStoredProfile, email: nextEmail }, ownerId);
          profileUpdated = true;
          updatedPreferences = await updateLocalPreferences({ reportEmail: nextEmail }, ownerId);
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
            try { await updateLocalPreferences({ reportEmail: preferences.reportEmail }, ownerId); }
            catch (rollbackError) { rollbackErrors.push(rollbackError instanceof Error ? rollbackError.message : 'Unable to restore report destination.'); }
          }
          if (profileUpdated) {
            try { await profileService.saveProfile(previousStoredProfile, ownerId); }
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
        const ownerId = localDataOwnerRef.current ?? getAccountDataOwner(nextProfile);
        if (ownerId !== localDataOwnerRef.current) await restoreAccountData(ownerId);
        const [firstName = '', ...lastNameParts] = nextProfile.name.trim().split(/\s+/);
        const storedProfile = await profileService.saveProfile({
          firstName,
          lastName: lastNameParts.join(' '),
          mobile: nextProfile.phone,
          countryCode: nextProfile.countryCode,
          email: nextProfile.email || '',
        }, ownerId);
        const nextPreferences = storedProfile.email
          ? await updateLocalPreferences({ reportEmail: storedProfile.email }, ownerId)
          : preferences;
        const session = await readSession();
        if (session) await writeSession({ ...session, user: nextProfile, isProfileComplete: true, dataOwnerId: ownerId ?? undefined });
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
        localDataOwnerRef.current = null;
        setTransactions([]);
        setFriends([]);
        setSplitGroups([]);
        setSplits([]);
        setBudgets([]);
        setGoals([]);
        setRecurringPayments([]);
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
      splitGroups,
      addSplitGroup: async (input) => {
        const name = input.name.trim();
        const friendIds = [...new Set(input.friendIds)];
        if (!name) throw new Error('Enter a name for this group.');
        if (!friendIds.length) throw new Error('Add at least one friend to this group.');
        if (friendIds.length !== input.friendIds.length) throw new Error('A friend can only be added once.');
        if (friendIds.some((id) => !friends.some((friend) => friend.id === id))) throw new Error('One or more selected friends are unavailable.');
        if (splitGroups.some((group) => group.name.toLowerCase() === name.toLowerCase())) throw new Error('A group with this name already exists.');
        const group: SplitGroup = { id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, friendIds, createdAt: Date.now() };
        const nextGroups = [group, ...splitGroups];
        await saveSplitGroups(nextGroups, localDataOwnerRef.current);
        setSplitGroups(nextGroups);
      },
      updateSplitGroup: async (groupId, changes) => {
        const name = changes.name.trim();
        const friendIds = [...new Set(changes.friendIds)];
        if (!name) throw new Error('Enter a name for this group.');
        if (!friendIds.length || friendIds.length !== changes.friendIds.length) throw new Error('Choose at least one friend without duplicates.');
        if (friendIds.some((id) => !friends.some((friend) => friend.id === id))) throw new Error('One or more selected friends are unavailable.');
        if (splitGroups.some((group) => group.id !== groupId && group.name.toLowerCase() === name.toLowerCase())) throw new Error('A group with this name already exists.');
        if (!splitGroups.some((group) => group.id === groupId)) throw new Error('This group is no longer available.');
        const nextGroups = splitGroups.map((group) => group.id === groupId ? { ...group, name, friendIds } : group);
        await saveSplitGroups(nextGroups, localDataOwnerRef.current);
        setSplitGroups(nextGroups);
      },
      removeSplitGroup: async (groupId) => {
        const nextGroups = splitGroups.filter((group) => group.id !== groupId);
        if (nextGroups.length === splitGroups.length) return;
        await saveSplitGroups(nextGroups, localDataOwnerRef.current);
        setSplitGroups(nextGroups);
      },
      splits,
      transactions,
      budgets,
      goals,
      recurringPayments,
      addTransaction: async (input) => {
        const transaction: Transaction = { ...input, id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
        const nextTransactions = [transaction, ...transactions];
        await persistLocalData({ transactions: nextTransactions, friends, splits, budgets, goals, recurringPayments });
        setTransactions(nextTransactions);
        if (transaction.type === 'expense') notifyBudgetThresholds(nextTransactions);
      },
      updateTransaction: async (id, changes) => {
        const merchant = changes.merchant.trim();
        if (!merchant) throw new Error('Enter a name for this transaction.');
        validatePositiveAmount(changes.amount, 'transaction amount');
        validateDate(changes.date, 'transaction date');
        const selectedDate = new Date(`${changes.date}T12:00:00`);
        const occurredAt = typeof changes.occurredAt === 'number' && Number.isFinite(changes.occurredAt)
          ? changes.occurredAt
          : selectedDate.getTime();
        if (!transactions.some((transaction) => transaction.id === id)) {
          throw new Error('This transaction is no longer available.');
        }
        const nextTransactions = transactions.map((transaction) => transaction.id === id
          ? {
            ...transaction,
            merchant,
            category: changes.category.trim() || transaction.category,
            amount: Math.trunc(changes.amount),
            type: changes.type,
            date: formatTransactionDate(new Date(occurredAt)),
            occurredAt,
          }
          : transaction);
        await persistLocalData({ transactions: nextTransactions, friends, splits, budgets, goals, recurringPayments });
        setTransactions(nextTransactions);
        if (changes.type === 'expense') notifyBudgetThresholds(nextTransactions);
      },
      removeTransaction: async (id) => {
        const nextTransactions = transactions.filter((transaction) => transaction.id !== id);
        if (nextTransactions.length === transactions.length) return;
        await persistLocalData({ transactions: nextTransactions, friends, splits, budgets, goals, recurringPayments });
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
          alertThreshold: 0.8,
        };
        const nextBudgets = [budget, ...budgets];
        await persistLocalData({ transactions, friends, splits, budgets: nextBudgets, goals, recurringPayments });
        setBudgets(nextBudgets);
      },
      updateBudget: async (budgetId, changes) => {
        const category = changes.category.trim();
        if (!category) throw new Error('Enter a budget category.');
        validatePositiveAmount(changes.limit, 'budget limit');
        if (budgets.some((budget) => budget.id !== budgetId && budget.category.toLowerCase() === category.toLowerCase())) {
          throw new Error('A budget for this category already exists.');
        }
        if (!budgets.some((budget) => budget.id === budgetId)) throw new Error('This budget is no longer available.');
        const nextBudgets = budgets.map((budget) => budget.id === budgetId
          ? { ...budget, category, limit: Math.trunc(changes.limit) }
          : budget);
        await persistLocalData({ transactions, friends, splits, budgets: nextBudgets, goals, recurringPayments });
        setBudgets(nextBudgets);
      },
      removeBudget: async (budgetId) => {
        const nextBudgets = budgets.filter((budget) => budget.id !== budgetId);
        if (nextBudgets.length === budgets.length) return;
        await persistLocalData({ transactions, friends, splits, budgets: nextBudgets, goals, recurringPayments });
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
          contributions: [],
        };
        const nextGoals = [goal, ...goals];
        await persistLocalData({ transactions, friends, splits, budgets, goals: nextGoals, recurringPayments });
        setGoals(nextGoals);
      },
      removeGoal: async (goalId) => {
        const nextGoals = goals.filter((goal) => goal.id !== goalId);
        if (nextGoals.length === goals.length) return;
        await persistLocalData({ transactions, friends, splits, budgets, goals: nextGoals, recurringPayments });
        setGoals(nextGoals);
      },
      contributeToGoal: async (goalId, amount) => {
        validatePositiveAmount(amount, 'contribution');
        const goal = goals.find((item) => item.id === goalId);
        if (!goal) throw new Error('This goal is no longer available.');
        const contributionAmount = Math.trunc(amount);
        if (contributionAmount > goal.target - goal.current) {
          throw new Error(`This goal only needs ${formatINR(Math.max(0, goal.target - goal.current))} more.`);
        }
        const contribution: GoalContribution = {
          id: `contribution-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          amount: contributionAmount,
          occurredAt: Date.now(),
        };
        const nextGoals = goals.map((item) => item.id === goalId
          ? { ...item, current: item.current + contributionAmount, contributions: [...(item.contributions ?? []), contribution] }
          : item);
        await persistLocalData({ transactions, friends, splits, budgets, goals: nextGoals, recurringPayments });
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
        await persistLocalData({ transactions, friends, splits, budgets, goals, recurringPayments: nextPayments });
        setRecurringPayments(nextPayments);
      },
      updateRecurringPayment: async (paymentId, changes) => {
        const name = changes.name.trim();
        const category = changes.category.trim();
        if (!name || !category) throw new Error('Enter a name and category for this payment.');
        validatePositiveAmount(changes.amount, 'payment amount');
        validateDate(changes.nextDueDate, 'due date');
        if (changes.remainingInstallments !== undefined && (!Number.isInteger(changes.remainingInstallments) || changes.remainingInstallments < 1)) {
          throw new Error('Remaining installments must be a whole number greater than zero.');
        }
        if (changes.outstandingBalance !== undefined && (!Number.isFinite(changes.outstandingBalance) || changes.outstandingBalance < 0)) {
          throw new Error('Enter a valid outstanding balance.');
        }
        if (!recurringPayments.some((payment) => payment.id === paymentId)) throw new Error('This payment is no longer available.');
        const nextPayments = recurringPayments.map((payment) => payment.id === paymentId
          ? { ...payment, ...changes, name, category, amount: Math.trunc(changes.amount) }
          : payment);
        await persistLocalData({ transactions, friends, splits, budgets, goals, recurringPayments: nextPayments });
        setRecurringPayments(nextPayments);
      },
      setRecurringPaymentActive: async (paymentId, active) => {
        const payment = recurringPayments.find((item) => item.id === paymentId);
        if (!payment) throw new Error('This payment is no longer available.');
        if (payment.completed && active) throw new Error('A completed payment cannot be resumed.');
        if (payment.kind === 'emi' && !payment.active && active
          && ((payment.remainingInstallments !== undefined && payment.remainingInstallments === 0)
            || (payment.outstandingBalance !== undefined && payment.outstandingBalance === 0))) {
          throw new Error('A completed EMI cannot be resumed. Edit its remaining balance or installments first.');
        }
        const nextPayments = recurringPayments.map((item) => item.id === paymentId ? { ...item, active } : item);
        await persistLocalData({ transactions, friends, splits, budgets, goals, recurringPayments: nextPayments });
        setRecurringPayments(nextPayments);
      },
      removeRecurringPayment: async (paymentId) => {
        const nextPayments = recurringPayments.filter((payment) => payment.id !== paymentId);
        if (nextPayments.length === recurringPayments.length) return;
        await persistLocalData({ transactions, friends, splits, budgets, goals, recurringPayments: nextPayments });
        setRecurringPayments(nextPayments);
      },
      markRecurringPaymentPaid: async (paymentId) => {
        await runWithLocalLock(`payment:${paymentId}`, async () => {
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
            active: item.kind === 'emi'
              && ((item.remainingInstallments !== undefined && item.remainingInstallments <= 1)
                || (item.outstandingBalance !== undefined && item.outstandingBalance <= item.amount))
              ? false
              : item.active,
            completed: item.kind === 'emi'
              && ((item.remainingInstallments !== undefined && item.remainingInstallments <= 1)
                || (item.outstandingBalance !== undefined && item.outstandingBalance <= item.amount))
              ? true
              : item.completed,
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
          await persistLocalData({ transactions: nextTransactions, friends, splits, budgets, goals, recurringPayments: nextPayments });
          setTransactions(nextTransactions);
          setRecurringPayments(nextPayments);
          notifyBudgetThresholds(nextTransactions);
        });
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
        await persistLocalData({ transactions, friends: nextFriends, splits, budgets, goals, recurringPayments });
        setFriends(nextFriends);
      },
      addSplit: async (input) => {
        let next = createSplitExpense(input);
        const nextTransactions = input.paidById === CURRENT_USER_ID
          ? [{
            id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'expense' as const,
            merchant: input.title.trim(),
            category: 'Shared expense',
            icon: 'people',
            iconColor: colors.expense,
            amount: input.amount,
            date: formatTransactionDate(new Date()),
            time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            occurredAt: Date.now(),
          }, ...transactions]
          : transactions;
        if (input.paidById === CURRENT_USER_ID) {
          next = { ...next, ledgerTransactionId: nextTransactions[0].id };
        }
        const nextSplits = [next, ...splits];
        await persistLocalData({ transactions: nextTransactions, friends, splits: nextSplits, budgets, goals, recurringPayments });
        setTransactions(nextTransactions);
        setSplits(nextSplits);
        if (input.paidById === CURRENT_USER_ID) notifyBudgetThresholds(nextTransactions);
        return next;
      },
      settleShare: async (splitId, friendId) => {
        await runWithLocalLock(`split:${splitId}:${friendId}`, async () => {
        const split = splits.find((item) => item.id === splitId);
        const share = split?.shares.find((item) => item.friendId === friendId);
        if (!split || !share) throw new Error('This split share is no longer available.');
        if (share.settled) return;
        if (friendId === CURRENT_USER_ID) throw new Error('Use your own settlement action for this share.');
        const nextSplits = splits.map((item) => item.id !== splitId ? item : {
          ...item,
          shares: item.shares.map((itemShare) => itemShare.friendId === friendId
            ? { ...itemShare, settled: true }
            : itemShare),
        });
        const nextTransactions = split.paidById === CURRENT_USER_ID
          ? [{
            id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'income' as const,
            merchant: `Split settlement · ${split.title}`,
            category: 'Split settlement',
            icon: 'people',
            iconColor: colors.income,
            amount: share.amount,
            date: formatTransactionDate(new Date()),
            time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            occurredAt: Date.now(),
          }, ...transactions]
          : transactions;
        await persistLocalData({ transactions: nextTransactions, friends, splits: nextSplits, budgets, goals, recurringPayments });
        setTransactions(nextTransactions);
        setSplits(nextSplits);
        });
      },
      settleMyShare: async (splitId) => {
        await runWithLocalLock(`split:${splitId}:${CURRENT_USER_ID}`, async () => {
        const split = splits.find((item) => item.id === splitId);
        const share = split?.shares.find((item) => item.friendId === CURRENT_USER_ID);
        if (!split || !share) throw new Error('Your share is no longer available.');
        if (share.settled) return;
        if (split.paidById === CURRENT_USER_ID) throw new Error('You already paid this split.');
        const nextSplits = splits.map((item) => item.id !== splitId ? item : {
          ...item,
          shares: item.shares.map((itemShare) => itemShare.friendId === CURRENT_USER_ID
            ? { ...itemShare, settled: true }
            : itemShare),
        });
        const now = new Date();
        const transaction: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'expense',
          merchant: `Split settlement · ${split.title}`,
          category: 'Shared expense',
          icon: 'people',
          iconColor: colors.expense,
          amount: share.amount,
          date: formatTransactionDate(now),
          time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          occurredAt: now.getTime(),
        };
        const nextTransactions = [transaction, ...transactions];
        await persistLocalData({ transactions: nextTransactions, friends, splits: nextSplits, budgets, goals, recurringPayments });
        setTransactions(nextTransactions);
        setSplits(nextSplits);
        });
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
        const ownerId = getAccountDataOwner(nextProfile);
        const savedProfile = await profileService.saveProfile({
          firstName,
          lastName: lastNameParts.join(' '),
          mobile: nextProfile.phone,
          countryCode: nextProfile.countryCode,
          email: nextProfile.email || '',
        }, ownerId);
        const nextPreferences = nextProfile.email
          ? await updateLocalPreferences({ reportEmail: nextProfile.email.toLowerCase() }, ownerId)
          : preferences;
        await writeSession({
          accessToken: response.token,
          user: nextProfile as unknown as Record<string, unknown>,
          isProfileComplete: response.isProfileComplete === true,
          phoneVerified: nextPhoneVerified,
          emailVerified: nextEmailVerified,
          onboardingStep,
          dataOwnerId: getAccountDataOwner(nextProfile) ?? undefined,
        });
        await restoreAccountData(getAccountDataOwner(nextProfile));
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
        const ownerId = getAccountDataOwner(nextProfile);
        const savedProfile = await profileService.saveProfile({
          firstName,
          lastName: lastNameParts.join(' '),
          mobile: nextProfile.phone,
          countryCode: nextProfile.countryCode,
          email: nextProfile.email || '',
        }, ownerId);
        const nextPreferences = nextProfile.email
          ? await updateLocalPreferences({ reportEmail: nextProfile.email.toLowerCase() }, ownerId)
          : preferences;
        await writeSession({
          accessToken: response.token,
          user: nextProfile as unknown as Record<string, unknown>,
          isProfileComplete: false,
          phoneVerified,
          emailVerified,
          onboardingStep,
          dataOwnerId: getAccountDataOwner(nextProfile) ?? undefined,
        });
        await restoreAccountData(getAccountDataOwner(nextProfile));
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
    [authPhase, restoreError, restoreLocalState, restoreAccountData, persistLocalData, runWithLocalLock, notifyBudgetThresholds, showToast, phone, countryCode, profile, profileState, preferences, friends, splitGroups, splits, transactions, budgets, goals, recurringPayments, verificationChannel, verificationTarget, phoneVerified, emailVerified, onboardingDraft, onboardingStep],
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

import { CorruptStoredDataError, readJson, removeValue, STORAGE_KEYS, writeJson } from './localPersistence';
import type { CategoryBudget, Friend, MonthlyBudgetAvailability, RecurringPayment, SavingsGoal, SplitExpense, Transaction } from '../../types';

export interface LocalAppData {
  transactions: Transaction[];
  friends: Friend[];
  splits: SplitExpense[];
  budgets: CategoryBudget[];
  budgetAvailability?: MonthlyBudgetAvailability[];
  goals: SavingsGoal[];
  recurringPayments: RecurringPayment[];
}

const emptyData = (): LocalAppData => ({
  transactions: [],
  friends: [],
  splits: [],
  budgets: [],
  budgetAvailability: [],
  goals: [],
  recurringPayments: [],
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTransaction(value: unknown): value is Transaction {
  return isRecord(value)
    && typeof value.id === 'string'
    && (value.type === 'expense' || value.type === 'income')
    && typeof value.merchant === 'string'
    && typeof value.category === 'string'
    && typeof value.icon === 'string'
    && typeof value.iconColor === 'string'
    && typeof value.amount === 'number'
    && Number.isFinite(value.amount)
    && value.amount >= 0
    && typeof value.date === 'string'
    && typeof value.time === 'string'
    && (value.budgetId === undefined || typeof value.budgetId === 'string')
    && (value.occurredAt === undefined || (typeof value.occurredAt === 'number' && Number.isFinite(value.occurredAt)))
    && (value.source === undefined || value.source === 'salary' || value.source === 'cash')
    && (value.paymentMode === undefined || value.paymentMode === 'cash' || value.paymentMode === 'debit_card' || value.paymentMode === 'credit_card')
    && (value.splitExpenseId === undefined || typeof value.splitExpenseId === 'string')
    && (value.createdByName === undefined || typeof value.createdByName === 'string')
    && (value.canEdit === undefined || typeof value.canEdit === 'boolean')
    && (value.canDelete === undefined || typeof value.canDelete === 'boolean');
}

function isFriend(value: unknown): value is Friend {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.userId === 'string'
    && typeof value.initials === 'string'
    && typeof value.color === 'string';
}

function isSplit(value: unknown): value is SplitExpense {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.amount === 'number'
    && Number.isFinite(value.amount)
    && typeof value.paidById === 'string'
    && typeof value.date === 'string'
    && (value.source === undefined || value.source === 'salary' || value.source === 'cash')
    && (value.category === undefined || typeof value.category === 'string')
    && (value.iconId === undefined || typeof value.iconId === 'string')
    && (value.paymentMode === undefined || value.paymentMode === 'cash' || value.paymentMode === 'debit_card' || value.paymentMode === 'credit_card')
    && (value.createdById === undefined || typeof value.createdById === 'string')
    && (value.createdByName === undefined || typeof value.createdByName === 'string')
    && (value.method === 'equal' || value.method === 'custom')
    && (value.ledgerTransactionId === undefined || typeof value.ledgerTransactionId === 'string')
    && Array.isArray(value.shares)
    && value.shares.every((share) => isRecord(share)
      && typeof share.friendId === 'string'
      && typeof share.amount === 'number'
      && Number.isFinite(share.amount)
      && typeof share.settled === 'boolean');
}

function isBudget(value: unknown): value is CategoryBudget {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.category === 'string'
    && (value.name === undefined || typeof value.name === 'string')
    && (value.categoryId === undefined || typeof value.categoryId === 'string')
    && (value.iconId === undefined || typeof value.iconId === 'string')
    && typeof value.limit === 'number'
    && Number.isFinite(value.limit)
    && value.limit > 0
    && typeof value.createdAt === 'number'
    && (value.updatedAt === undefined || (typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)))
    && (value.month === undefined || (typeof value.month === 'string' && /^\d{4}-\d{2}$/.test(value.month)))
    && (value.year === undefined || (typeof value.year === 'number' && Number.isInteger(value.year)))
    && (value.source === undefined || value.source === 'salary' || value.source === 'cash')
    && (value.carryForward === undefined || typeof value.carryForward === 'boolean')
    && (value.originalBudgetId === undefined || typeof value.originalBudgetId === 'string')
    && (value.budgetType === undefined || value.budgetType === 'category')
    && (value.alertThreshold === undefined || (typeof value.alertThreshold === 'number' && value.alertThreshold > 0 && value.alertThreshold <= 1));
}

function isBudgetAvailability(value: unknown): value is MonthlyBudgetAvailability {
  return isRecord(value)
    && typeof value.month === 'string'
    && /^\d{4}-(0[1-9]|1[0-2])$/.test(value.month)
    && typeof value.salary === 'number'
    && Number.isFinite(value.salary)
    && value.salary >= 0
    && typeof value.cash === 'number'
    && Number.isFinite(value.cash)
    && value.cash >= 0
    && typeof value.updatedAt === 'number'
    && Number.isFinite(value.updatedAt);
}

function isGoal(value: unknown): value is SavingsGoal {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.current === 'number'
    && Number.isFinite(value.current)
    && value.current >= 0
    && typeof value.target === 'number'
    && Number.isFinite(value.target)
    && value.target > 0
    && (value.targetDate === undefined || typeof value.targetDate === 'string')
    && (value.contributions === undefined || (Array.isArray(value.contributions) && value.contributions.every((item) =>
      isRecord(item)
      && typeof item.id === 'string'
      && typeof item.amount === 'number'
      && Number.isFinite(item.amount)
      && item.amount > 0
      && typeof item.occurredAt === 'number'
      && Number.isFinite(item.occurredAt))));
}

function isRecurringPayment(value: unknown): value is RecurringPayment {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.amount === 'number'
    && Number.isFinite(value.amount)
    && value.amount > 0
    && (value.kind === 'emi' || value.kind === 'subscription')
    && (value.cadence === 'weekly' || value.cadence === 'monthly' || value.cadence === 'yearly')
    && typeof value.nextDueDate === 'string'
    && typeof value.category === 'string'
    && typeof value.active === 'boolean'
    && (value.source === undefined || value.source === 'salary' || value.source === 'cash')
    && (value.completed === undefined || typeof value.completed === 'boolean')
    && (value.outstandingBalance === undefined || (typeof value.outstandingBalance === 'number' && Number.isFinite(value.outstandingBalance) && value.outstandingBalance >= 0))
    && (value.remainingInstallments === undefined || (typeof value.remainingInstallments === 'number' && Number.isInteger(value.remainingInstallments) && value.remainingInstallments >= 0));
}

function localDataKey(ownerId?: string | null): string {
  return ownerId
    ? `${STORAGE_KEYS.localDataAccountPrefix}${encodeURIComponent(ownerId.trim().toLowerCase())}`
    : STORAGE_KEYS.localData;
}

export async function readLocalData(ownerId?: string | null): Promise<LocalAppData> {
  const key = localDataKey(ownerId);
  let parsed: unknown;
  try {
    parsed = await readJson<unknown>(key);
  } catch (error) {
    if (!(error instanceof CorruptStoredDataError)) throw error;
    await removeValue(key);
    return emptyData();
  }
  if (parsed === null) {
    if (ownerId) {
      const legacyData = await readJson<unknown>(STORAGE_KEYS.localData);
      if (legacyData !== null) {
        await writeJson(key, legacyData);
        await removeValue(STORAGE_KEYS.localData);
        return readLocalData(ownerId);
      }
    }
    return emptyData();
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('transactions' in parsed) ||
    !Array.isArray(parsed.transactions) ||
    !('friends' in parsed) ||
    !Array.isArray(parsed.friends) ||
    !('splits' in parsed) ||
    !Array.isArray(parsed.splits)
  ) {
    await removeValue(key);
    return emptyData();
  }
  const record = parsed as Partial<LocalAppData>;
  return {
    transactions: (record.transactions ?? []).filter(isTransaction),
    friends: (record.friends ?? []).filter(isFriend),
    splits: (record.splits ?? []).filter(isSplit),
    budgets: Array.isArray(record.budgets) ? record.budgets.filter(isBudget) : [],
    budgetAvailability: Array.isArray(record.budgetAvailability) ? record.budgetAvailability.filter(isBudgetAvailability) : [],
    goals: Array.isArray(record.goals) ? record.goals.filter(isGoal) : [],
    recurringPayments: Array.isArray(record.recurringPayments) ? record.recurringPayments.filter(isRecurringPayment) : [],
  };
}

export function writeLocalData(data: LocalAppData, ownerId?: string | null): Promise<void> {
  return writeJson(localDataKey(ownerId), data);
}

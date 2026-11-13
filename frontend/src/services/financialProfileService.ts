import { CorruptStoredDataError, readJson, removeValue, STORAGE_KEYS, writeJson } from '../core/storage/localPersistence';

export type FinancialField = 'monthlyIncome' | 'cashBalance' | 'savings';

export interface FinancialProfileRecord {
  monthlyIncomeMinor: number | null;
  cashBalanceMinor: number | null;
  savingsAmountMinor: number | null;
  updatedAt: Partial<Record<FinancialField, number>>;
}

export type FinancialProfileChanges = Partial<Record<FinancialField, number>>;

const EMPTY_FINANCIAL_PROFILE: FinancialProfileRecord = {
  monthlyIncomeMinor: null,
  cashBalanceMinor: null,
  savingsAmountMinor: null,
  updatedAt: {},
};

function financialProfileKey(ownerId?: string | null): string {
  return ownerId
    ? `${STORAGE_KEYS.financialProfileAccountPrefix}${encodeURIComponent(ownerId.trim().toLowerCase())}`
    : STORAGE_KEYS.financialProfile;
}

function isMinorAmount(value: unknown): value is number {
  return value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0);
}

export function toMinorUnits(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0 || amount > 999_999_999.99) {
    throw new Error('Enter an amount between ₹0 and ₹999,999,999.99.');
  }
  const minor = Math.round(amount * 100);
  if (!Number.isSafeInteger(minor)) throw new Error('This amount is outside the supported range.');
  return minor;
}

export function fromMinorUnits(amount: number | null): number | null {
  return amount === null ? null : amount / 100;
}

export async function getFinancialProfile(ownerId?: string | null): Promise<FinancialProfileRecord> {
  const key = financialProfileKey(ownerId);
  let stored: unknown;
  try {
    stored = await readJson<unknown>(key);
  } catch (error) {
    if (!(error instanceof CorruptStoredDataError)) throw error;
    await removeValue(key);
    return EMPTY_FINANCIAL_PROFILE;
  }
  if (typeof stored !== 'object' || stored === null) return EMPTY_FINANCIAL_PROFILE;
  const value = stored as Record<string, unknown>;
  const updatedAtValue = typeof value.updatedAt === 'object' && value.updatedAt !== null
    ? value.updatedAt as Record<string, unknown>
    : {};
  const updatedAt: FinancialProfileRecord['updatedAt'] = {};
  for (const field of ['monthlyIncome', 'cashBalance', 'savings'] as const) {
    const timestamp = updatedAtValue[field];
    if (typeof timestamp === 'number' && Number.isFinite(timestamp)) updatedAt[field] = timestamp;
  }
  return {
    monthlyIncomeMinor: isMinorAmount(value.monthlyIncomeMinor) ? value.monthlyIncomeMinor : null,
    cashBalanceMinor: isMinorAmount(value.cashBalanceMinor) ? value.cashBalanceMinor : null,
    savingsAmountMinor: isMinorAmount(value.savingsAmountMinor) ? value.savingsAmountMinor : null,
    updatedAt,
  };
}

export async function saveFinancialProfile(
  changes: FinancialProfileChanges,
  ownerId?: string | null,
): Promise<FinancialProfileRecord> {
  const current = await getFinancialProfile(ownerId);
  const next = { ...current, updatedAt: { ...current.updatedAt } };
  for (const [field, amount] of Object.entries(changes) as [FinancialField, number][]) {
    const minor = toMinorUnits(amount);
    if (field === 'monthlyIncome') next.monthlyIncomeMinor = minor;
    if (field === 'cashBalance') next.cashBalanceMinor = minor;
    if (field === 'savings') next.savingsAmountMinor = minor;
    next.updatedAt[field] = Date.now();
  }
  await replaceFinancialProfile(next, ownerId);
  return next;
}

export async function replaceFinancialProfile(
  record: FinancialProfileRecord,
  ownerId?: string | null,
): Promise<void> {
  if (
    !isMinorAmount(record.monthlyIncomeMinor)
    || !isMinorAmount(record.cashBalanceMinor)
    || !isMinorAmount(record.savingsAmountMinor)
  ) throw new Error('Saved financial amounts are invalid.');
  await writeJson(financialProfileKey(ownerId), record);
}

export async function seedFinancialProfile(
  values: FinancialProfileChanges,
  ownerId?: string | null,
): Promise<FinancialProfileRecord> {
  const current = await getFinancialProfile(ownerId);
  const missing: FinancialProfileChanges = {};
  if (current.monthlyIncomeMinor === null && values.monthlyIncome !== undefined) missing.monthlyIncome = values.monthlyIncome;
  if (current.cashBalanceMinor === null && values.cashBalance !== undefined) missing.cashBalance = values.cashBalance;
  if (current.savingsAmountMinor === null && values.savings !== undefined) missing.savings = values.savings;
  return Object.keys(missing).length ? saveFinancialProfile(missing, ownerId) : current;
}

export const financialProfileService = {
  getFinancialProfile,
  saveFinancialProfile,
  replaceFinancialProfile,
  seedFinancialProfile,
  toMinorUnits,
  fromMinorUnits,
};

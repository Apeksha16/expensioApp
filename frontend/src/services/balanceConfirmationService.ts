import { CorruptStoredDataError, readJson, removeValue, STORAGE_KEYS, writeJson } from '../core/storage/localPersistence';

export type BalanceConfirmationStatus = 'PENDING' | 'CONFIRMED' | 'SNOOZED';

export interface BalanceConfirmationEntry {
  monthKey: string;
  status: BalanceConfirmationStatus;
  confirmedAt?: number;
  snoozedUntil?: number;
}

export type BalanceConfirmationEntries = Record<string, BalanceConfirmationEntry>;
export const BALANCE_CONFIRMATION_SNOOZE_MS = 5 * 24 * 60 * 60 * 1000;

function confirmationKey(ownerId?: string | null): string {
  return ownerId
    ? `${STORAGE_KEYS.balanceConfirmationAccountPrefix}${encodeURIComponent(ownerId.trim().toLowerCase())}`
    : STORAGE_KEYS.balanceConfirmation;
}

export function getMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isValidMonthKey(value: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  return Boolean(match && Number(match[2]) >= 1 && Number(match[2]) <= 12);
}

export function isBalanceConfirmationDue(
  entries: BalanceConfirmationEntries,
  monthKey: string,
  now = Date.now(),
): boolean {
  const entry = entries[monthKey];
  if (!entry || entry.status === 'PENDING') return true;
  if (entry.status === 'CONFIRMED') return false;
  return entry.status === 'SNOOZED' && (entry.snoozedUntil ?? 0) <= now;
}

export async function getBalanceConfirmations(ownerId?: string | null): Promise<BalanceConfirmationEntries> {
  const key = confirmationKey(ownerId);
  let stored: unknown;
  try {
    stored = await readJson<unknown>(key);
  } catch (error) {
    if (!(error instanceof CorruptStoredDataError)) throw error;
    await removeValue(key);
    return {};
  }
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return {};
  const entries: BalanceConfirmationEntries = {};
  for (const [monthKey, value] of Object.entries(stored)) {
    if (
      !isValidMonthKey(monthKey)
      || typeof value !== 'object'
      || value === null
      || !('status' in value)
      || !['PENDING', 'CONFIRMED', 'SNOOZED'].includes(String(value.status))
    ) continue;
    const record = value as Record<string, unknown>;
    entries[monthKey] = {
      monthKey,
      status: record.status as BalanceConfirmationStatus,
      ...(typeof record.confirmedAt === 'number' ? { confirmedAt: record.confirmedAt } : {}),
      ...(typeof record.snoozedUntil === 'number' ? { snoozedUntil: record.snoozedUntil } : {}),
    };
  }
  return entries;
}

async function saveEntry(
  monthKey: string,
  entry: BalanceConfirmationEntry,
  ownerId?: string | null,
): Promise<BalanceConfirmationEntries> {
  if (!isValidMonthKey(monthKey)) throw new Error('Choose a valid confirmation month.');
  const entries = await getBalanceConfirmations(ownerId);
  const next = { ...entries, [monthKey]: entry };
  await writeJson(confirmationKey(ownerId), next);
  return next;
}

export function confirmBalanceMonth(monthKey: string, ownerId?: string | null): Promise<BalanceConfirmationEntries> {
  return saveEntry(monthKey, { monthKey, status: 'CONFIRMED', confirmedAt: Date.now() }, ownerId);
}

export function snoozeBalanceMonth(
  monthKey: string,
  ownerId?: string | null,
  now = Date.now(),
): Promise<BalanceConfirmationEntries> {
  return saveEntry(monthKey, {
    monthKey,
    status: 'SNOOZED',
    snoozedUntil: now + BALANCE_CONFIRMATION_SNOOZE_MS,
  }, ownerId);
}

export const balanceConfirmationService = {
  getBalanceConfirmations,
  isBalanceConfirmationDue,
  getMonthKey,
  confirmBalanceMonth,
  snoozeBalanceMonth,
};

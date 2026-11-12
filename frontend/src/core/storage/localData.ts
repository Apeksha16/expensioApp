import { CorruptStoredDataError, readJson, removeValue, STORAGE_KEYS, writeJson } from './localPersistence';
import type { Friend, SplitExpense, Transaction } from '../../types';

export interface LocalAppData {
  transactions: Transaction[];
  friends: Friend[];
  splits: SplitExpense[];
}

const emptyData = (): LocalAppData => ({
  transactions: [],
  friends: [],
  splits: [],
});

export async function readLocalData(): Promise<LocalAppData> {
  let parsed: unknown;
  try {
    parsed = await readJson<unknown>(STORAGE_KEYS.localData);
  } catch (error) {
    if (!(error instanceof CorruptStoredDataError)) throw error;
    await removeValue(STORAGE_KEYS.localData);
    return emptyData();
  }
  if (parsed === null) return emptyData();
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
    await removeValue(STORAGE_KEYS.localData);
    return emptyData();
  }
  return parsed as LocalAppData;
}

export function writeLocalData(data: LocalAppData): Promise<void> {
  return writeJson(STORAGE_KEYS.localData, data);
}

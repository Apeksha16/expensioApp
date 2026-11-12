import { CorruptStoredDataError, readJson, removeValue, STORAGE_KEYS, writeJson } from '../core/storage/localPersistence';
import type { SplitGroup } from '../types';

function groupsKey(ownerId?: string | null): string {
  return ownerId
    ? `${STORAGE_KEYS.splitGroupsAccountPrefix}${encodeURIComponent(ownerId.trim().toLowerCase())}`
    : STORAGE_KEYS.splitGroups;
}

function isSplitGroup(value: unknown): value is SplitGroup {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === 'string'
    && typeof record.name === 'string'
    && record.name.trim().length > 0
    && Array.isArray(record.friendIds)
    && record.friendIds.every((friendId) => typeof friendId === 'string')
    && new Set(record.friendIds).size === record.friendIds.length
    && typeof record.createdAt === 'number'
    && Number.isFinite(record.createdAt);
}

export async function getSplitGroups(ownerId?: string | null): Promise<SplitGroup[]> {
  const key = groupsKey(ownerId);
  let stored: unknown;
  try {
    stored = await readJson<unknown>(key);
  } catch (error) {
    if (!(error instanceof CorruptStoredDataError)) throw error;
    await removeValue(key);
    return [];
  }
  if (stored === null && ownerId) {
    try {
      const legacy = await readJson<unknown>(STORAGE_KEYS.splitGroups);
      if (legacy !== null) {
        const groups = Array.isArray(legacy) ? legacy.filter(isSplitGroup) : [];
        await writeJson(key, groups);
        await removeValue(STORAGE_KEYS.splitGroups);
        return groups;
      }
    } catch (error) {
      if (!(error instanceof CorruptStoredDataError)) throw error;
      await removeValue(STORAGE_KEYS.splitGroups);
    }
  }
  return Array.isArray(stored) ? stored.filter(isSplitGroup) : [];
}

export async function saveSplitGroups(groups: SplitGroup[], ownerId?: string | null): Promise<void> {
  if (!groups.every(isSplitGroup)) throw new Error('One or more split groups are invalid.');
  await writeJson(groupsKey(ownerId), groups);
}

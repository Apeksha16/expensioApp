import { DEFAULT_PREFERRED_MODULE_IDS } from '../../data/modules';
import { profileAvatars } from '../../data/avatars';
import {
  CorruptStoredDataError,
  readJson,
  readText,
  removeValue,
  STORAGE_KEYS,
  writeText,
} from './localPersistence';

export type ReportFrequency = 'weekly' | 'twice-monthly' | 'monthly';
export type ReportDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface LocalPreferences {
  preferredModuleIds: string[];
  preferredModuleOrder: { id: string; displayOrder: number }[];
  avatarId: string | null;
  reportFrequency: ReportFrequency;
  reportsEnabled: boolean;
  reportDayOfWeek: ReportDayOfWeek;
  reportDayOfMonth: number;
  reportEmail: string;
}

interface StoredModulePreferences {
  preferredModuleIds: string[];
}

interface StoredReportPreferences {
  reportFrequency: ReportFrequency;
  reportsEnabled: boolean;
  reportDayOfWeek: ReportDayOfWeek;
  reportDayOfMonth: number;
  reportEmail: string;
}

const defaults = (): LocalPreferences => ({
  preferredModuleIds: [...DEFAULT_PREFERRED_MODULE_IDS],
  preferredModuleOrder: DEFAULT_PREFERRED_MODULE_IDS.map((id, displayOrder) => ({ id, displayOrder })),
  avatarId: null,
  reportFrequency: 'monthly',
  reportsEnabled: false,
  reportDayOfWeek: 1,
  reportDayOfMonth: 1,
  reportEmail: '',
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isReportFrequency(value: unknown): value is ReportFrequency {
  return value === 'weekly' || value === 'twice-monthly' || value === 'monthly';
}

function isReportDayOfWeek(value: unknown): value is ReportDayOfWeek {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6;
}

async function readObject(key: string): Promise<unknown> {
  try {
    return await readJson<unknown>(key);
  } catch (error) {
    if (!(error instanceof CorruptStoredDataError)) throw error;
    await removeValue(key);
    return null;
  }
}

function parseModuleIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((id) => typeof id === 'string') ? value : null;
}

function parsePreferences(value: unknown): LocalPreferences | null {
  if (!isRecord(value)) return null;
  const ids = parseModuleIds(value.preferredModuleIds);
  if (!ids) return null;
  const storedAvatar = value.avatarId;
  const avatarId = typeof storedAvatar === 'string'
    && profileAvatars.some((avatar) => avatar.id === storedAvatar)
    ? storedAvatar
    : null;
  return {
    preferredModuleIds: ids,
    preferredModuleOrder: ids.map((id, displayOrder) => ({ id, displayOrder })),
    avatarId,
    reportFrequency: isReportFrequency(value.reportFrequency) ? value.reportFrequency : 'monthly',
    reportsEnabled: value.reportsEnabled === true,
    reportDayOfWeek: isReportDayOfWeek(value.reportDayOfWeek) ? value.reportDayOfWeek : 1,
    reportDayOfMonth: typeof value.reportDayOfMonth === 'number'
      && Number.isInteger(value.reportDayOfMonth)
      && value.reportDayOfMonth >= 1
      && value.reportDayOfMonth <= 31
      ? value.reportDayOfMonth
      : 1,
    reportEmail: typeof value.reportEmail === 'string' ? value.reportEmail.trim().toLowerCase() : '',
  };
}

function parseStoredPreferences(
  moduleValue: unknown,
  avatarValue: unknown,
  reportValue: unknown,
): LocalPreferences | null {
  const base = defaults();
  const modules = isRecord(moduleValue) ? parseModuleIds(moduleValue.preferredModuleIds) : null;
  const storedAvatarId = isRecord(avatarValue) ? avatarValue.avatarId : avatarValue;
  const avatarId = typeof storedAvatarId === 'string'
    && profileAvatars.some((avatar) => avatar.id === storedAvatarId)
    ? storedAvatarId
    : null;
  const report = isRecord(reportValue) ? reportValue : {};
  const hasSavedConfiguration = moduleValue !== null || avatarValue !== null || reportValue !== null;
  if (!hasSavedConfiguration) return null;
  const ids = modules ?? base.preferredModuleIds;
  return {
    ...base,
    preferredModuleIds: ids,
    preferredModuleOrder: ids.map((id, displayOrder) => ({ id, displayOrder })),
    avatarId,
    reportFrequency: isReportFrequency(report.reportFrequency) ? report.reportFrequency : base.reportFrequency,
    reportsEnabled: report.reportsEnabled === true,
    reportDayOfWeek: isReportDayOfWeek(report.reportDayOfWeek) ? report.reportDayOfWeek : base.reportDayOfWeek,
    reportDayOfMonth: typeof report.reportDayOfMonth === 'number'
      && Number.isInteger(report.reportDayOfMonth)
      && report.reportDayOfMonth >= 1
      && report.reportDayOfMonth <= 31
      ? report.reportDayOfMonth
      : base.reportDayOfMonth,
    reportEmail: typeof report.reportEmail === 'string' ? report.reportEmail.trim().toLowerCase() : '',
  };
}

async function readLegacyPreferences(): Promise<LocalPreferences | null> {
  const raw = await readText(STORAGE_KEYS.legacyPreferences);
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    await removeValue(STORAGE_KEYS.legacyPreferences);
    return null;
  }
  if (!isRecord(parsed)) {
    await removeValue(STORAGE_KEYS.legacyPreferences);
    return null;
  }
  const ids = parseModuleIds(parsed.preferredModuleIds)
    ?? (Array.isArray(parsed.preferredModuleOrder)
      ? parsed.preferredModuleOrder
        .filter((entry): entry is { id: string; displayOrder: number } =>
          isRecord(entry)
          && typeof entry.id === 'string'
          && typeof entry.displayOrder === 'number',
        )
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((entry) => entry.id)
      : defaults().preferredModuleIds);
  return parsePreferences({ ...defaults(), ...parsed, preferredModuleIds: ids }) ?? defaults();
}

function preferenceKeys(ownerId?: string | null): { modules: string; avatar: string; reports: string } {
  if (!ownerId) return {
    modules: STORAGE_KEYS.modulePreferences,
    avatar: STORAGE_KEYS.avatar,
    reports: STORAGE_KEYS.reportPreferences,
  };
  const suffix = encodeURIComponent(ownerId.trim().toLowerCase());
  return {
    modules: `${STORAGE_KEYS.modulePreferencesAccountPrefix}${suffix}`,
    avatar: `${STORAGE_KEYS.avatarAccountPrefix}${suffix}`,
    reports: `${STORAGE_KEYS.reportPreferencesAccountPrefix}${suffix}`,
  };
}

export async function readPreferences(ownerId?: string | null): Promise<LocalPreferences> {
  const keys = preferenceKeys(ownerId);
  const [moduleValue, avatarValue, reportValue] = await Promise.all([
    readObject(keys.modules),
    readObject(keys.avatar),
    readObject(keys.reports),
  ]);
  const saved = parseStoredPreferences(moduleValue, avatarValue, reportValue);
  if (saved) return saved;

  if (ownerId && moduleValue === null && avatarValue === null && reportValue === null) {
    const legacyKeys = preferenceKeys();
    const legacyValues = await Promise.all([
      readObject(legacyKeys.modules),
      readObject(legacyKeys.avatar),
      readObject(legacyKeys.reports),
    ]);
    if (legacyValues.some((value) => value !== null)) {
      const legacySaved = parseStoredPreferences(legacyValues[0], legacyValues[1], legacyValues[2]);
      if (legacySaved) {
        await writePreferences(legacySaved, ownerId);
        await Promise.all(Object.values(legacyKeys).map((key) => removeValue(key)));
        return legacySaved;
      }
    }
  }

  const legacy = await readLegacyPreferences();
  const initial = legacy ?? defaults();
  await writePreferences(initial, ownerId);
  if (legacy) await removeValue(STORAGE_KEYS.legacyPreferences);
  return initial;
}

export async function writePreferences(preferences: LocalPreferences, ownerId?: string | null): Promise<void> {
  const keys = preferenceKeys(ownerId);
  const ids = [...preferences.preferredModuleIds];
  const reports: StoredReportPreferences = {
    reportFrequency: preferences.reportFrequency,
    reportsEnabled: preferences.reportsEnabled,
    reportDayOfWeek: preferences.reportDayOfWeek,
    reportDayOfMonth: preferences.reportDayOfMonth,
    reportEmail: preferences.reportEmail,
  };
  const entries: [string, string][] = [
    [keys.modules, JSON.stringify({ preferredModuleIds: ids } satisfies StoredModulePreferences)],
    [keys.avatar, JSON.stringify({ avatarId: preferences.avatarId })],
    [keys.reports, JSON.stringify(reports)],
  ];
  const previous = await Promise.all(entries.map(async ([key]) => [key, await readText(key)] as const));
  const previousByKey = new Map(previous);
  try {
    for (const [key, serialized] of entries) await writeText(key, serialized);
  } catch (error) {
    const rollbackErrors: string[] = [];
    for (const [key] of entries) {
      try {
        const oldValue = previousByKey.get(key);
        if (oldValue === null || oldValue === undefined) await removeValue(key);
        else await writeText(key, oldValue);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError instanceof Error ? rollbackError.message : 'unknown storage error');
      }
    }
    if (rollbackErrors.length) {
      throw new Error(
        `Unable to save local preferences and rollback was incomplete: ${rollbackErrors.join('; ')}`,
      );
    }
    throw error;
  }
}

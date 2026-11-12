import {
  DEFAULT_PREFERRED_MODULE_IDS,
  normalizePreferredModuleIds,
  PREFERRED_MODULE_LIMIT,
  type AppModule,
  type AppModuleId,
} from '../data/modules';
import { readPreferences, writePreferences, type LocalPreferences } from '../core/storage/preferences';
import { moduleRegistryService } from './moduleRegistryService';
import { validateReportSchedule } from './reportScheduleService';

let writeQueue: Promise<void> = Promise.resolve();
const pendingPreferredModuleSaves = new Map<string, Promise<AppModuleId[]>>();

export interface ValidatedLocalPreferences extends Omit<LocalPreferences, 'preferredModuleIds'> {
  preferredModuleIds: AppModuleId[];
}
export type LocalPreferenceChanges = Partial<Pick<
  LocalPreferences,
  'avatarId'
  | 'reportFrequency'
  | 'reportsEnabled'
  | 'reportDayOfWeek'
  | 'reportDayOfMonth'
  | 'reportEmail'
>>;

export interface ModulePreferenceService {
  getPreferredModules(): Promise<AppModuleId[]>;
  savePreferredModules(value: unknown): Promise<AppModuleId[]>;
  validatePreferredModules(value: unknown): AppModuleId[];
  getAvailableModules(): AppModule[];
  resetPreferredModules(): Promise<AppModuleId[]>;
}

function serializeWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

function isAppModuleId(value: unknown): value is AppModuleId {
  return typeof value === 'string' && moduleRegistryService.getModuleById(value) !== undefined;
}

export function getAvailableModules(): AppModule[] {
  return moduleRegistryService.getModules()
    .filter((module) => module.available && module.navigationVisible)
}

export function validatePreferredModules(value: unknown): AppModuleId[] {
  if (!Array.isArray(value)) {
    throw new Error('Preferred modules must be provided as a list.');
  }
  if (value.length !== PREFERRED_MODULE_LIMIT) {
    throw new Error(`Select exactly ${PREFERRED_MODULE_LIMIT} preferred modules.`);
  }

  const selected: AppModuleId[] = [];
  for (const id of value) {
    if (!isAppModuleId(id)) throw new Error('A selected module no longer exists. Review your selection and try again.');
    const module = moduleRegistryService.getModuleById(id);
    if (!module?.available || !module.navigationVisible) {
      throw new Error(`${module?.name ?? 'A selected module'} is currently unavailable.`);
    }
    if (selected.includes(id)) throw new Error('A module cannot be selected more than once.');
    if (!moduleRegistryService.isKnownRoute(module.route)) {
      throw new Error(`${module.name} has an invalid destination and cannot be selected.`);
    }
    selected.push(id);
  }
  return selected;
}

async function loadAndRepairPreferences(): Promise<{
  preferences: LocalPreferences;
  preferredModuleIds: AppModuleId[];
}> {
  const preferences = await readPreferences();
  const preferredModuleIds = normalizePreferredModuleIds(preferences.preferredModuleIds);
  const needsRepair = preferredModuleIds.length !== preferences.preferredModuleIds.length
    || preferredModuleIds.some((id, index) => id !== preferences.preferredModuleIds[index])
    || preferences.preferredModuleOrder.length !== preferredModuleIds.length
    || preferences.preferredModuleOrder.some((entry, index) =>
      entry.id !== preferredModuleIds[index] || entry.displayOrder !== index,
    );

  if (needsRepair) {
    const repaired = { ...preferences, preferredModuleIds };
    await writePreferences(repaired);
    return { preferences: repaired, preferredModuleIds };
  }
  return { preferences, preferredModuleIds };
}

export async function getPreferredModules(): Promise<AppModuleId[]> {
  return (await getLocalPreferences()).preferredModuleIds;
}

export function savePreferredModules(value: unknown): Promise<AppModuleId[]> {
  const preferredModuleIds = validatePreferredModules(value);
  const key = preferredModuleIds.join('|');
  const pending = pendingPreferredModuleSaves.get(key);
  if (pending) return pending;

  const save = serializeWrite(async () => {
    const preferences = await readPreferences();
    const updated = { ...preferences, preferredModuleIds };
    await writePreferences(updated);
    return preferredModuleIds;
  });
  pendingPreferredModuleSaves.set(key, save);
  void save.then(
    () => pendingPreferredModuleSaves.delete(key),
    () => pendingPreferredModuleSaves.delete(key),
  );
  return save;
}

export function updateLocalPreferences(
  changes: LocalPreferenceChanges,
): Promise<ValidatedLocalPreferences> {
  if (
    changes.reportsEnabled !== undefined
    && typeof changes.reportsEnabled !== 'boolean'
  ) {
    return Promise.reject(new Error('Automatic report preference must be enabled or disabled.'));
  }
  if (
    changes.reportFrequency !== undefined
    && !['weekly', 'twice-monthly', 'monthly'].includes(changes.reportFrequency)
  ) {
    return Promise.reject(new Error('Choose a supported report frequency.'));
  }
  if (
    changes.reportDayOfWeek !== undefined
    && (!Number.isInteger(changes.reportDayOfWeek) || changes.reportDayOfWeek < 0 || changes.reportDayOfWeek > 6)
  ) {
    return Promise.reject(new Error('Choose a valid weekly delivery day.'));
  }
  if (
    changes.reportDayOfMonth !== undefined
    && (!Number.isInteger(changes.reportDayOfMonth) || changes.reportDayOfMonth < 1 || changes.reportDayOfMonth > 31)
  ) {
    return Promise.reject(new Error('Choose a monthly delivery date between 1 and 31.'));
  }
  if (
    changes.reportEmail !== undefined
    && (
      typeof changes.reportEmail !== 'string'
      || (changes.reportEmail !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(changes.reportEmail))
    )
  ) {
    return Promise.reject(new Error('Enter a valid report destination email address.'));
  }
  return serializeWrite(async () => {
    const { preferences, preferredModuleIds } = await loadAndRepairPreferences();
    const updated: LocalPreferences = { ...preferences, ...changes };
    if (
      changes.reportFrequency !== undefined
      || changes.reportDayOfWeek !== undefined
      || changes.reportDayOfMonth !== undefined
    ) {
      validateReportSchedule({
        frequency: updated.reportFrequency,
        dayOfWeek: updated.reportDayOfWeek,
        dayOfMonth: updated.reportDayOfMonth,
      });
    }
    await writePreferences(updated);
    return { ...updated, preferredModuleIds };
  });
}

export function resetPreferredModules(): Promise<AppModuleId[]> {
  return savePreferredModules(DEFAULT_PREFERRED_MODULE_IDS);
}

export async function getLocalPreferences(): Promise<ValidatedLocalPreferences> {
  await writeQueue;
  const { preferences, preferredModuleIds } = await loadAndRepairPreferences();
  return { ...preferences, preferredModuleIds };
}

export const modulePreferenceService: ModulePreferenceService = {
  getPreferredModules,
  savePreferredModules,
  validatePreferredModules,
  getAvailableModules,
  resetPreferredModules,
};

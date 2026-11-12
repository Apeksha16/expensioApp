import type { LocalPreferences } from '../core/storage/preferences';
import { getLocalPreferences, updateLocalPreferences } from './modulePreferenceService';

export type ReportPreferenceChanges = Pick<
  LocalPreferences,
  'reportFrequency'
  | 'reportsEnabled'
  | 'reportDayOfWeek'
  | 'reportDayOfMonth'
  | 'reportEmail'
>;

export interface ReportPreferenceService {
  getReportPreferences(ownerId?: string | null): Promise<ReportPreferenceChanges>;
  saveReportPreferences(changes: Partial<ReportPreferenceChanges>, ownerId?: string | null): Promise<ReportPreferenceChanges>;
}

export async function getReportPreferences(ownerId?: string | null): Promise<ReportPreferenceChanges> {
  const preferences = await getLocalPreferences(ownerId);
  return {
    reportFrequency: preferences.reportFrequency,
    reportsEnabled: preferences.reportsEnabled,
    reportDayOfWeek: preferences.reportDayOfWeek,
    reportDayOfMonth: preferences.reportDayOfMonth,
    reportEmail: preferences.reportEmail,
  };
}

export async function saveReportPreferences(
  changes: Partial<ReportPreferenceChanges>,
  ownerId?: string | null,
): Promise<ReportPreferenceChanges> {
  const updated = await updateLocalPreferences(changes, ownerId);
  return {
    reportFrequency: updated.reportFrequency,
    reportsEnabled: updated.reportsEnabled,
    reportDayOfWeek: updated.reportDayOfWeek,
    reportDayOfMonth: updated.reportDayOfMonth,
    reportEmail: updated.reportEmail,
  };
}

export const reportPreferenceService: ReportPreferenceService = {
  getReportPreferences,
  saveReportPreferences,
};

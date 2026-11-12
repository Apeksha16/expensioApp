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
  getReportPreferences(): Promise<ReportPreferenceChanges>;
  saveReportPreferences(changes: Partial<ReportPreferenceChanges>): Promise<ReportPreferenceChanges>;
}

export async function getReportPreferences(): Promise<ReportPreferenceChanges> {
  const preferences = await getLocalPreferences();
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
): Promise<ReportPreferenceChanges> {
  const updated = await updateLocalPreferences(changes);
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

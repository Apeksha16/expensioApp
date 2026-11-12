import type { ReportDayOfWeek, ReportFrequency } from '../core/storage/preferences';

export interface ReportSchedule {
  frequency: ReportFrequency;
  dayOfWeek: ReportDayOfWeek;
  dayOfMonth: number;
}

export function validateReportSchedule(value: unknown): asserts value is ReportSchedule {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Choose a valid report schedule.');
  }
  const schedule = value as Partial<ReportSchedule>;
  if (!['weekly', 'twice-monthly', 'monthly'].includes(schedule.frequency ?? '')) {
    throw new Error('Choose a supported report frequency.');
  }
  if (
    schedule.frequency === 'weekly'
    && (!Number.isInteger(schedule.dayOfWeek) || (schedule.dayOfWeek ?? -1) < 0 || (schedule.dayOfWeek ?? 7) > 6)
  ) {
    throw new Error('Choose a valid weekly delivery day.');
  }
  if (
    schedule.frequency === 'monthly'
    && (!Number.isInteger(schedule.dayOfMonth) || (schedule.dayOfMonth ?? 0) < 1 || (schedule.dayOfMonth ?? 32) > 31)
  ) {
    throw new Error('Choose a monthly delivery date between 1 and 31.');
  }
}

function localDay(year: number, month: number, day: number): Date {
  return new Date(year, month, day, 12, 0, 0, 0);
}

function monthlyDate(year: number, month: number, selectedDay: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return localDay(year, month, Math.min(selectedDay, lastDay));
}

export function getNextReportDates(
  schedule: ReportSchedule,
  from: Date = new Date(),
): Date[] {
  validateReportSchedule(schedule);
  if (Number.isNaN(from.getTime())) throw new Error('A valid local date is required to preview the schedule.');
  const today = localDay(from.getFullYear(), from.getMonth(), from.getDate());

  if (schedule.frequency === 'weekly') {
    const daysUntil = (schedule.dayOfWeek - today.getDay() + 7) % 7;
    const first = new Date(today);
    first.setDate(today.getDate() + daysUntil);
    return [first];
  }

  if (schedule.frequency === 'twice-monthly') {
    const dates: Date[] = [];
    for (let monthOffset = 0; dates.length < 2; monthOffset += 1) {
      const month = today.getMonth() + monthOffset;
      const year = today.getFullYear() + Math.floor(month / 12);
      const normalizedMonth = month % 12;
      for (const day of [1, 15]) {
        const candidate = localDay(year, normalizedMonth, day);
        if (candidate >= today) dates.push(candidate);
        if (dates.length === 2) break;
      }
    }
    return dates;
  }

  for (let monthOffset = 0; monthOffset < 24; monthOffset += 1) {
    const month = today.getMonth() + monthOffset;
    const year = today.getFullYear() + Math.floor(month / 12);
    const candidate = monthlyDate(year, month % 12, schedule.dayOfMonth);
    if (candidate >= today) return [candidate];
  }
  return [];
}

export function formatLocalReportDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

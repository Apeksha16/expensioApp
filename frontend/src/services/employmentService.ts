import { CorruptStoredDataError, readJson, removeValue, STORAGE_KEYS, writeJson } from '../core/storage/localPersistence';

export type EmploymentType = 'salaried' | 'business' | 'student' | 'retired' | 'homemaker';

export const employmentOptions: {
  type: EmploymentType;
  label: string;
  incomeLabel: string;
  description: string;
  icon: string;
}[] = [
  { type: 'salaried', label: 'Salaried', incomeLabel: 'Monthly Salary', description: 'Regular income from employment.', icon: 'briefcase-outline' },
  { type: 'business', label: 'Business', incomeLabel: 'Monthly Minimum Income', description: 'A monthly estimate from your business.', icon: 'storefront-outline' },
  { type: 'student', label: 'Student', incomeLabel: 'Monthly Pocket Money', description: 'Your monthly allowance or income.', icon: 'school-outline' },
  { type: 'retired', label: 'Retired', incomeLabel: 'Monthly Pension', description: 'Your monthly pension income.', icon: 'sunny-outline' },
  { type: 'homemaker', label: 'Homemaker', incomeLabel: 'Monthly Household Budget', description: 'Your monthly household spending amount.', icon: 'home-outline' },
];

export interface EmploymentRecord {
  type: EmploymentType;
  updatedAt: number;
}

function isEmploymentType(value: unknown): value is EmploymentType {
  return employmentOptions.some((option) => option.type === value);
}

function employmentKey(ownerId?: string | null): string {
  return ownerId
    ? `${STORAGE_KEYS.employmentAccountPrefix}${encodeURIComponent(ownerId.trim().toLowerCase())}`
    : STORAGE_KEYS.employment;
}

export async function getEmployment(ownerId?: string | null): Promise<EmploymentRecord | null> {
  const key = employmentKey(ownerId);
  let value: unknown;
  try {
    value = await readJson<unknown>(key);
  } catch (error) {
    if (!(error instanceof CorruptStoredDataError)) throw error;
    await removeValue(key);
    return null;
  }
  if (
    typeof value !== 'object'
    || value === null
    || !('type' in value)
    || !isEmploymentType(value.type)
    || !('updatedAt' in value)
    || typeof value.updatedAt !== 'number'
    || !Number.isFinite(value.updatedAt)
  ) return null;
  return { type: value.type, updatedAt: value.updatedAt };
}

export async function saveEmployment(type: EmploymentType, ownerId?: string | null): Promise<EmploymentRecord> {
  if (!isEmploymentType(type)) throw new Error('Choose a supported employment type.');
  const record = { type, updatedAt: Date.now() };
  await replaceEmployment(record, ownerId);
  return record;
}

export async function replaceEmployment(record: EmploymentRecord | null, ownerId?: string | null): Promise<void> {
  const key = employmentKey(ownerId);
  if (record === null) {
    await removeValue(key);
    return;
  }
  if (!isEmploymentType(record.type) || !Number.isFinite(record.updatedAt)) {
    throw new Error('Employment details are invalid.');
  }
  await writeJson(key, record);
}

export const employmentService = { getEmployment, saveEmployment, replaceEmployment };

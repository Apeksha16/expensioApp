import { CorruptStoredDataError, readJson, removeValue, STORAGE_KEYS, writeJson } from '../core/storage/localPersistence';

export interface OnboardingDraftRecord {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employmentType: string;
  incomeRupees: string;
  cashRupees: string;
  savingsRupees: string;
}

export const EMPTY_ONBOARDING_DRAFT: OnboardingDraftRecord = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  employmentType: 'salaried',
  incomeRupees: '',
  cashRupees: '',
  savingsRupees: '',
};

function draftKey(ownerId?: string | null): string {
  return ownerId
    ? `${STORAGE_KEYS.onboardingDraftAccountPrefix}${ownerId.trim().toLowerCase().replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
    : STORAGE_KEYS.onboardingDraft;
}

export const onboardingDraftService = {
  async getDraft(ownerId?: string | null): Promise<OnboardingDraftRecord> {
    const key = draftKey(ownerId);
    let stored: unknown;
    try {
      stored = await readJson<unknown>(key);
    } catch (error) {
      if (!(error instanceof CorruptStoredDataError)) throw error;
      await removeValue(key);
      return EMPTY_ONBOARDING_DRAFT;
    }
    if (!stored || typeof stored !== 'object') {
      if (ownerId) {
        try {
          const globalStored = await readJson<unknown>(STORAGE_KEYS.onboardingDraft);
          if (globalStored && typeof globalStored === 'object') {
            return { ...EMPTY_ONBOARDING_DRAFT, ...(globalStored as Record<string, unknown>) };
          }
        } catch {
          // ignore fallback error
        }
      }
      return EMPTY_ONBOARDING_DRAFT;
    }
    return { ...EMPTY_ONBOARDING_DRAFT, ...(stored as Record<string, unknown>) };
  },

  async saveDraft(draft: OnboardingDraftRecord, ownerId?: string | null): Promise<OnboardingDraftRecord> {
    const key = draftKey(ownerId);
    await writeJson(key, draft);
    if (ownerId) {
      await writeJson(STORAGE_KEYS.onboardingDraft, draft).catch(() => {});
    }
    return draft;
  },

  async updateDraft(changes: Partial<OnboardingDraftRecord>, ownerId?: string | null): Promise<OnboardingDraftRecord> {
    const current = await this.getDraft(ownerId);
    const updated = { ...current, ...changes };
    return this.saveDraft(updated, ownerId);
  },

  async clearDraft(ownerId?: string | null): Promise<void> {
    await removeValue(draftKey(ownerId));
    if (ownerId) {
      await removeValue(STORAGE_KEYS.onboardingDraft).catch(() => {});
    }
  },
};

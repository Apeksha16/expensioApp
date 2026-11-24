import { apiClient } from './apiClient';
import { readSession, writeSession } from '../../core/storage/session';
import type {
  ApiResponse,
  OnboardingCompletionResponse,
  OnboardingConfigResponse,
  OnboardingStatusResponse,
  UpdateEmploymentRequest,
  UpdateFinancialProfileRequest,
  UpdateProfileRequest,
  UserDto,
  UserEmployment,
  UserFinancialProfile,
} from '../../types/api';

/**
 * Handles all Multi-Step Onboarding APIs (/v1/onboarding/*)
 */
let cachedConfig: ApiResponse<OnboardingConfigResponse> | null = null;
let inFlightConfigPromise: Promise<ApiResponse<OnboardingConfigResponse>> | null = null;
let inFlightStatusPromise: Promise<ApiResponse<OnboardingStatusResponse>> | null = null;

export const onboardingApi = {
  /**
   * Reset in-memory cache on logout or session reset
   */
  clearCache() {
    cachedConfig = null;
    inFlightConfigPromise = null;
    inFlightStatusPromise = null;
  },

  /**
   * Get supported employment types, currencies, and validation limits (cached in-memory)
   */
  getConfig(): Promise<ApiResponse<OnboardingConfigResponse>> {
    if (cachedConfig) {
      return Promise.resolve(cachedConfig);
    }
    if (inFlightConfigPromise) {
      return inFlightConfigPromise;
    }
    inFlightConfigPromise = apiClient.get<OnboardingConfigResponse>('/v1/onboarding/config', { requiresAuth: false })
      .then((res) => {
        cachedConfig = res;
        return res;
      })
      .finally(() => {
        inFlightConfigPromise = null;
      });
    return inFlightConfigPromise;
  },

  /**
   * Get user's current onboarding status and progress (deduplicated for concurrent callers)
   */
  getStatus(): Promise<ApiResponse<OnboardingStatusResponse>> {
    if (inFlightStatusPromise) {
      return inFlightStatusPromise;
    }
    inFlightStatusPromise = apiClient.get<OnboardingStatusResponse>('/v1/onboarding/status', { requiresAuth: true })
      .finally(() => {
        inFlightStatusPromise = null;
      });
    return inFlightStatusPromise;
  },

  /**
   * Step 1: Update personal profile information
   */
  updateProfile(payload: UpdateProfileRequest): Promise<ApiResponse<UserDto>> {
    return apiClient.put<UserDto>('/v1/onboarding/profile', payload, { requiresAuth: true });
  },

  /**
   * Step 2: Update employment details and income
   */
  updateEmployment(payload: UpdateEmploymentRequest): Promise<ApiResponse<UserEmployment>> {
    return apiClient.put<UserEmployment>(
      '/v1/onboarding/employment',
      { currency: 'INR', ...payload },
      { requiresAuth: true },
    );
  },

  /**
   * Step 3: Update initial financial profile (cash and savings in minor units)
   */
  updateFinancialProfile(payload: UpdateFinancialProfileRequest): Promise<ApiResponse<UserFinancialProfile>> {
    return apiClient.put<UserFinancialProfile>(
      '/v1/onboarding/financial-profile',
      { currency: 'INR', ...payload },
      { requiresAuth: true },
    );
  },

  /**
   * Step 4: Finalize onboarding, activate account, and elevate token to APPLICATION role
   */
  async completeOnboarding(): Promise<ApiResponse<OnboardingCompletionResponse>> {
    const res = await apiClient.post<OnboardingCompletionResponse>(
      '/v1/onboarding/complete',
      undefined,
      { requiresAuth: true },
    );

    // Promote local session with full application token and generated username
    if (res.data?.accessToken) {
      const existing = await readSession();
      await writeSession({
        ...existing,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken || existing?.refreshToken,
        isProfileComplete: true,
        user: {
          ...existing?.user,
          ...res.data.user,
          username: res.data.username,
        },
      });
    }

    return res;
  },
};

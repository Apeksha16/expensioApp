import { apiClient } from './apiClient';
import type {
  ApiResponse,
  UpdateProfileRequest,
  UpdateUsernameRequest,
  UserProfileDetailResponse,
} from '../../types/api';

/**
 * Handles User and Profile Management APIs (/v1/users/*)
 */
export const userApi = {
  /**
   * Get full profile of the authenticated user
   */
  getMe(): Promise<ApiResponse<UserProfileDetailResponse>> {
    return apiClient.get<UserProfileDetailResponse>('/v1/users/me', { requiresAuth: true });
  },

  /**
   * Update first and last name
   */
  updateMe(payload: UpdateProfileRequest): Promise<ApiResponse<UserProfileDetailResponse>> {
    return apiClient.put<UserProfileDetailResponse>('/v1/users/me', payload, { requiresAuth: true });
  },

  /**
   * Update custom username (validates against reserved words and history)
   */
  updateUsername(payload: UpdateUsernameRequest): Promise<ApiResponse<UserProfileDetailResponse>> {
    return apiClient.put<UserProfileDetailResponse>('/v1/users/me/username', payload, { requiresAuth: true });
  },
};

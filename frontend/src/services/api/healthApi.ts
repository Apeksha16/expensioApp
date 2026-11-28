import { apiClient } from './apiClient';
import type { ApiHealthResponse, ApiResponse } from '../../types/api';

/**
 * Handles Health and Connectivity APIs (/api/v1/health)
 */
export const healthApi = {
  /**
   * Health ping to verify backend service connectivity
   */
  async checkHealth(): Promise<ApiHealthResponse> {
    const res = await apiClient.get<ApiHealthResponse>('/api/v1/health', { requiresAuth: false });
    return res.data;
  },

  /**
   * Raw health response check
   */
  getHealthEnvelope(): Promise<ApiResponse<ApiHealthResponse>> {
    return apiClient.get<ApiHealthResponse>('/api/v1/health', { requiresAuth: false });
  },
};

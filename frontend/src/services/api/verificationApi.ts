import { apiClient } from './apiClient';
import type {
  ApiResponse,
  EmailVerificationStartRequest,
  EmailVerificationVerifyRequest,
  MobileVerificationStartRequest,
  MobileVerificationVerifyRequest,
  OtpResponse,
} from '../../types/api';

/**
 * Handles standalone Email and Mobile Verification APIs (/v1/verification/*)
 */
export const verificationApi = {
  /**
   * Dispatches verification OTP code to target email
   */
  startEmailVerification(payload: EmailVerificationStartRequest): Promise<ApiResponse<OtpResponse>> {
    return apiClient.post<OtpResponse>('/v1/verification/email/start', payload, { requiresAuth: false });
  },

  /**
   * Validates OTP code sent to email
   */
  verifyEmail(payload: EmailVerificationVerifyRequest): Promise<ApiResponse<boolean>> {
    return apiClient.post<boolean>('/v1/verification/email/verify', payload, { requiresAuth: false });
  },

  /**
   * Dispatches verification OTP code to mobile phone
   */
  startMobileVerification(payload: MobileVerificationStartRequest): Promise<ApiResponse<OtpResponse>> {
    return apiClient.post<OtpResponse>('/v1/verification/mobile/start', payload, { requiresAuth: false });
  },

  /**
   * Validates OTP code sent to mobile
   */
  verifyMobile(payload: MobileVerificationVerifyRequest): Promise<ApiResponse<boolean>> {
    return apiClient.post<boolean>('/v1/verification/mobile/verify', payload, { requiresAuth: false });
  },
};

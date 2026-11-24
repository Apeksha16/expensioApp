import { apiClient } from './apiClient';
import { clearSession } from '../../core/storage/session';
import type {
  ApiResponse,
  AuthResponse,
  EmailLoginRequest,
  EmailSignupRequest,
  ForgotPasswordRequest,
  GoogleAuthRequest,
  LogoutRequest,
  MobileOtpStartRequest,
  MobileOtpVerifyRequest,
  OtpResponse,
  RefreshTokenRequest,
  ResetPasswordRequest,
} from '../../types/api';

/**
 * Handles all Authentication and Session APIs (/v1/auth/*)
 */
export const authApi = {
  /**
   * Google OAuth token sign-in
   */
  googleAuth(payload: GoogleAuthRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/v1/auth/google', payload, { requiresAuth: false });
  },

  /**
   * Register with email and password (triggers email OTP)
   */
  emailSignup(payload: EmailSignupRequest): Promise<ApiResponse<OtpResponse>> {
    return apiClient.post<OtpResponse>('/v1/auth/email/signup', payload, { requiresAuth: false });
  },

  /**
   * Log in with email and password
   */
  emailLogin(payload: EmailLoginRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/v1/auth/email/login', payload, { requiresAuth: false });
  },

  /**
   * Request OTP code for mobile registration / sign-in
   */
  mobileOtpStart(payload: MobileOtpStartRequest): Promise<ApiResponse<OtpResponse>> {
    return apiClient.post<OtpResponse>('/v1/auth/mobile/otp/start', payload, { requiresAuth: false });
  },

  /**
   * Verify mobile OTP code and retrieve session tokens
   */
  mobileOtpVerify(payload: MobileOtpVerifyRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/v1/auth/mobile/otp/verify', payload, { requiresAuth: false });
  },

  /**
   * Request OTP code for existing mobile login
   */
  mobileLoginStart(payload: MobileOtpStartRequest): Promise<ApiResponse<OtpResponse>> {
    return apiClient.post<OtpResponse>('/v1/auth/mobile/login/start', payload, { requiresAuth: false });
  },

  /**
   * Verify OTP and complete mobile login
   */
  mobileLoginVerify(payload: MobileOtpVerifyRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/v1/auth/mobile/login/verify', payload, { requiresAuth: false });
  },

  /**
   * Request password reset instructions via email
   */
  forgotPassword(payload: ForgotPasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/v1/auth/password/forgot', payload, { requiresAuth: false });
  },

  /**
   * Reset password with reset token
   */
  resetPassword(payload: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/v1/auth/password/reset', payload, { requiresAuth: false });
  },

  /**
   * Refresh session using a refresh token
   */
  refreshToken(payload: RefreshTokenRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/v1/auth/refresh', payload, { requiresAuth: false });
  },

  /**
   * Log out of current device session
   */
  async logout(payload?: LogoutRequest): Promise<ApiResponse<void>> {
    const res = await apiClient.post<void>('/v1/auth/logout', payload || {}, { requiresAuth: true });
    await clearSession();
    return res;
  },

  /**
   * Log out of all active user devices and sessions
   */
  async logoutAll(): Promise<ApiResponse<void>> {
    const res = await apiClient.post<void>('/v1/auth/logout-all', undefined, { requiresAuth: true });
    await clearSession();
    return res;
  },
};

// =============================================================================
// Expensio API - Common Data Transfer Objects & Interfaces
// Strictly aligned with backend Spring Boot 4.1.1 DTO contracts
// =============================================================================

/**
 * Standard backend response envelope matching Spring Boot ApiResponse<T>
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  requestId?: string;
  error?: string;
}

/**
 * Health check response from /api/v1/health or /api/health
 */
export interface ApiHealthResponse {
  status: string;
  app: string;
  version: string;
  timestamp: string;
}

/**
 * Basic user identity DTO returned by backend auth and onboarding endpoints
 */
export interface UserDto {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  status?: string;
}

// Alias for backwards compatibility
export type BackendUserDto = UserDto;

/**
 * JWT Access and Refresh Tokens with session metadata matching AuthResponse.java
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string; // "APPLICATION" or "ONBOARDING"
  expiresInMs?: number;
  user?: UserDto;
  onboardingStatus?: string;
  isProfileComplete?: boolean;
  message?: string;
}

// Alias for backwards compatibility
export type AuthTokens = AuthResponse;

/**
 * Response for OTP generation / dispatch requests matching OtpResponse.java
 */
export interface OtpResponse {
  challengeId: string;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
  message: string;
}

// -----------------------------------------------------------------------------
// Authentication Requests
// -----------------------------------------------------------------------------

export interface GoogleAuthRequest {
  idToken: string;
}

export interface EmailSignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface EmailLoginRequest {
  email: string;
  password: string;
}

export interface MobileOtpStartRequest {
  phone: string;
  countryCode?: string;
}

export interface MobileOtpVerifyRequest {
  phone: string;
  challengeId?: string;
  otp: string;
  countryCode?: string;
  name?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token?: string;
  email?: string;
  otp?: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken?: string;
}

// -----------------------------------------------------------------------------
// Standalone Verification Requests
// -----------------------------------------------------------------------------

export interface EmailVerificationStartRequest {
  email: string;
}

export interface EmailVerificationVerifyRequest {
  email: string;
  otp: string;
  challengeId?: string;
}

export interface MobileVerificationStartRequest {
  phone: string;
}

export interface MobileVerificationVerifyRequest {
  phone: string;
  otp: string;
  countryCode?: string;
  challengeId?: string;
}

// -----------------------------------------------------------------------------
// Onboarding Requests & Responses
// -----------------------------------------------------------------------------

export interface EmploymentTypeConfig {
  type: string;
  fieldLabel: string;
  fieldName: string;
  required: boolean;
}

export interface OnboardingConfigResponse {
  employmentTypes: EmploymentTypeConfig[];
  savingsEligible: boolean;
  supportedCurrencies: string[];
  defaultCurrency: string;
  minAmountMinor: number;
  maxAmountMinor: number;
}

export interface OnboardingStatusResponse {
  currentStep: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isProfileComplete: boolean;
  isEmploymentComplete: boolean;
  isFinancialProfileComplete: boolean;
  profile?: UserDto;
  employment?: UserEmployment;
  financialProfile?: UserFinancialProfile;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
}

export interface UpdateEmploymentRequest {
  employmentType: 'SALARIED' | 'BUSINESS' | 'STUDENT' | 'RETIRED' | 'HOMEMAKER' | string;
  monthlyIncomeMinor: number;
  currency?: string;
}

export interface UpdateFinancialProfileRequest {
  cashBalanceMinor: number;
  savingsBalanceMinor: number;
  currency?: string;
}

export interface UserEmployment {
  userId?: string;
  employmentType: string;
  monthlyIncomeMinor: number;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserFinancialProfile {
  userId?: string;
  cashBalanceMinor: number;
  savingsBalanceMinor: number;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OnboardingCompletionResponse {
  username: string;
  user: UserDto;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  message: string;
}

// -----------------------------------------------------------------------------
// User Profile Requests & Responses
// -----------------------------------------------------------------------------

export interface UserProfileDetailResponse {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  isProfileComplete: boolean;
  employment?: UserEmployment;
  financialProfile?: UserFinancialProfile;
  createdAt?: string;
}

export interface UpdateUsernameRequest {
  username: string;
}

// -----------------------------------------------------------------------------
// Error Payload Interface
// -----------------------------------------------------------------------------

export interface ApiErrorOptions {
  message: string;
  status: number;
  code?: string;
  requestId?: string;
  data?: unknown;
  isNetworkError?: boolean;
  retryAfterSeconds?: number;
}

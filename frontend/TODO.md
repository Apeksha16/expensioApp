# Frontend Authentication & API TODO

### Identified Differences & Applied Fixes
* **Password Policy**: Fixed frontend password validation in `EmailAuthScreen.tsx` and `validation.ts` to strictly match backend `PasswordPolicyService` (8-128 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character, weak password blocklist).
* **Missing Name Field**: Added "Full Name" input to `EmailAuthScreen.tsx` sign-up form with `@Size(min = 2)` validation matching `EmailSignupRequest.java`.
* **Duplicate OTP Dispatch**: Removed redundant `sendEmailOtp()` call in `EmailAuthScreen.tsx` since `authApi.emailSignup` already dispatches the OTP challenge.
* **Email Verification Contract**: Added missing required `email` parameter to `EmailVerificationVerifyRequest` in `types/api.ts`, `services/authApi.ts`, and `services/emailChangeService.ts`.
* **Mobile Verification Contract**: Added missing `phone` and `countryCode` parameters to `MobileVerificationVerifyRequest` in `types/api.ts`.
* **Session Token Retrieval on Email Verification**: Added automatic login in `verifyEmailOtp` using cached signup credentials so `applyAuthSession` receives real JWT `accessToken` and `refreshToken` without throwing missing token error.
* **OTP Resend Cooldown Timer**: Updated `OTP_RESEND_SECONDS` from 30s to 60s in `data/config.ts` and `OtpScreen.tsx` to match backend `RESEND_COOLDOWN_SECONDS`.
* **International Phone Normalization**: Updated `MobileLoginScreen.tsx` and `OtpScreen.tsx` to pass ISO 2-letter country code (`IN`, `US`, `GB`, etc.) to `sendOtp` and `verifyOtp` for proper backend `libphonenumber` parsing.
* **Dynamic Onboarding Journey**: Replaced hardcoded employment types, static INR currency labels, and static step progression in `ProfileSetupScreen.tsx`. Connected live calls to `onboardingApi.getConfig()`, `onboardingApi.getStatus()`, `onboardingApi.updateProfile()`, `onboardingApi.updateEmployment()`, `onboardingApi.updateFinancialProfile()`, and `onboardingApi.completeOnboarding()`. Added dynamic currency and max amount limits validation.

### New Development Tasks
* [ ] **Forgot & Reset Password Screens**: Build UI flow for password recovery (`ForgotPasswordScreen.tsx` and `ResetPasswordScreen.tsx`) calling `POST /v1/auth/password/forgot` and `POST /v1/auth/password/reset`.
* [ ] **Native Google Sign-In SDK**: Integrate `@react-native-google-signin/google-signin` for native iOS/Android credential picker to replace web/mock tokens.
* [ ] **Biometric Authentication**: Integrate `expo-local-authentication` for FaceID / Fingerprint unlock on returning app sessions.

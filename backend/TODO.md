# Backend Authentication & API TODO

### Identified Differences & Status
* **Email Verification Token Issuance**: Backend `POST /v1/verification/email/verify` returns `ApiResponse<Boolean>` (`true`), requiring a separate `POST /v1/auth/email/login` call to obtain JWT tokens. *(Fix made in frontend: auto-login after email verification using cached credentials)*.
* **OTP Resend Cooldown**: Backend enforces 60s cooldown (`RESEND_COOLDOWN_SECONDS = 60`), while frontend previously used 30s. *(Fix made in frontend: synced to 60s)*.
* **Phone E.164 Normalization**: Backend expects raw phone + ISO 2-letter country code (`IN`, `US`, etc.) for `libphonenumber`. *(Fix made in frontend: passing ISO country code)*.
* **Password Policy Enforcement**: Backend strictly enforces min 8, max 128 chars, uppercase, lowercase, digit, special character, and weak password blocklist. *(Fix made in frontend: matched validation)*.
* **Name Field Requirement**: Backend `EmailSignupRequest` requires `@NotBlank` and `@Size(min = 2, max = 100)`. *(Fix made in frontend: added name input)*.

### New Development Tasks
* [ ] **Email OTP Token Return**: Add optional JWT `AuthResponse` return to `POST /v1/verification/email/verify` or add `POST /v1/auth/email/otp/verify` (similar to mobile OTP) to eliminate client-side post-verification auto-login round-trip.
* [ ] **Magic Link Support**: Add tokenized magic link email verification endpoint in addition to 6-digit numeric OTP.
* [ ] **Biometric Session Refresh**: Add device-bound public key registration endpoint for biometric JWT session elevation.
* [ ] **Account Lockout Alerting**: Add notification / email trigger when an account is locked out after 5 consecutive failed password attempts.

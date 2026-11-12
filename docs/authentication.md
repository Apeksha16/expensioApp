# Authentication & Onboarding Module — Backend + Frontend

---

# Phase 1 — Authentication

## 1.1 Authentication Entry

**Frontend**
- Create the initial authentication screen with three options: Google, Email and Mobile Number.
- Google option must initiate native Google authentication.
- Email option must navigate to email/password login with an option to register.
- Mobile option must navigate to mobile number authentication.
- Display appropriate loading states while authentication is processing.
- Prevent multiple authentication requests from repeated taps.
- Handle cancelled authentication, network failures and backend errors.
- After successful authentication, navigate according to backend account and onboarding status.

## 1.2 Google Authentication

**Backend**
- Implement Google OAuth authentication using Google ID token verification.
- Validate token signature, issuer, audience, expiry and nonce.
- Retrieve verified Google identity information, including first name, last name, email and unique Google subject ID.
- Use Google subject ID as the permanent provider identity, not email alone.
- Check whether the Google identity is already linked to an existing user.
- If an active user exists, authenticate and return the application session.
- If onboarding is incomplete, return the existing onboarding progress.
- If the identity is new, initiate a restricted onboarding session.
- Prevent duplicate accounts when an email already belongs to another authentication method.
- Support secure account linking instead of silently merging accounts.

**Frontend**
- Integrate native Google Sign-In.
- Retrieve the Google ID token and submit it to the backend.
- Never trust user profile data received directly from the client without backend verification.
- For existing users, navigate directly to Dashboard if onboarding is complete.
- For incomplete accounts, navigate to the exact pending onboarding step.
- For new users, initiate onboarding with Google-provided first name, last name and email.
- Prepopulate first name and last name.
- Keep Google-verified email non-editable.
- Require mobile number submission and mobile OTP verification.
- Handle account-linking conflicts and existing Google identities.

## 1.3 Email Registration

**Backend**
- Accept email, password and registration requests.
- Normalize and validate email addresses.
- Validate password strength and reject compromised or commonly used passwords.
- Hash passwords using Argon2id if password management is handled by the backend.
- Check for existing account conflicts without revealing sensitive account information.
- Create a pending registration or onboarding session.
- Generate and send an email verification OTP.
- Do not activate or grant full application access to an unverified account.
- Return the appropriate verification and onboarding state.

**Frontend**
- Provide email, password and confirm-password fields.
- Validate email format and required fields.
- Validate password strength and minimum length.
- Ensure confirm password matches the original password.
- Submit registration details to the backend.
- Initiate email verification after successful registration initiation.
- Navigate to email OTP verification.
- Do not create an active account before required verification and onboarding completion.
- Handle already-registered email, invalid input, weak passwords and network errors without exposing sensitive account information.

## 1.4 Email Login

**Backend**
- Authenticate using registered email and password.
- Verify credentials securely.
- Apply login attempt limits and suspicious activity protection.
- Return generic authentication errors to prevent account enumeration.
- Check account status and verification requirements.
- Return a full authenticated session for active users.
- Return a restricted onboarding session for incomplete users.
- Reject disabled, locked or deleted accounts appropriately.

**Frontend**
- Provide email and password inputs.
- Validate required fields and email format.
- Submit credentials to the backend.
- Handle invalid credentials, locked accounts and incomplete onboarding.
- Navigate active users to Dashboard.
- Resume onboarding for users whose registration is incomplete.
- Provide a Forgot Password navigation option.

## 1.5 Mobile Registration and Login

**Backend**
- Accept mobile numbers with country codes.
- Normalize and validate numbers using E.164 format.
- Determine whether the mobile number belongs to an existing account.
- Generate and send OTP through the configured SMS provider.
- Support new-user registration and existing-user login.
- Verify OTP before granting authentication or onboarding access.
- Return existing account information and onboarding status after successful verification.
- Prevent duplicate user accounts for the same verified mobile number.

**Frontend**
- Provide mobile number input with country code selection.
- Normalize the number before submitting it to the backend.
- Support separate registration and login behavior based on backend account status.
- Request OTP from the backend.
- Navigate to OTP verification after a successful request.
- Existing verified users should enter the application after successful OTP authentication.
- New users should continue to profile setup after mobile verification.
- Handle existing numbers, invalid numbers, rate limits and SMS delivery failures.

## 1.6 Email OTP Verification

**Backend**
- Generate cryptographically secure random OTPs.
- Store only securely hashed or HMAC-protected OTP values.
- Associate each OTP with its destination, purpose and challenge ID.
- Set OTP expiration, preferably 5–10 minutes.
- Implement resend cooldown and maximum verification attempts.
- Invalidate previous OTPs when a new OTP is issued.
- Consume OTPs after successful verification.
- Prevent reuse, brute-force attempts and verification across different purposes.
- Update email verification status only after successful backend verification.

## 1.7 Mobile OTP Verification

**Backend**
- Generate and send mobile OTP through an SMS provider.
- Store OTP challenges securely.
- Enforce expiry, resend cooldown and maximum attempts.
- Apply rate limits by mobile number, IP and device.
- Prevent OTP replay and concurrent verification abuse.
- Update mobile verification status only after successful verification.
- Handle SMS provider failures and delivery errors.
- Add abuse protection against SMS pumping and automated OTP requests.

## 1.8 OTP Verification Screen

**Frontend**
- Build a reusable OTP verification screen for email and mobile authentication.
- Provide six-digit OTP input with automatic focus movement.
- Support paste, backspace and automatic submission when all digits are entered.
- Display the masked destination email or mobile number.
- Show OTP expiry countdown.
- Enable resend only after the backend-defined cooldown.
- Invalidate the current input when a new OTP is requested.
- Handle invalid, expired, already-used and maximum-attempt OTP errors.
- Provide edit-destination navigation where the flow permits it.
- Navigate only after backend verification succeeds.

## 1.9 Password Recovery

**Backend**
- Accept password recovery requests using email.
- Return generic responses regardless of account existence.
- Generate secure, single-use reset tokens.
- Send password reset instructions through email.
- Validate reset token expiry and usage status.
- Validate the new password against password policy.
- Hash and update the password securely.
- Revoke existing sessions after a successful password reset.
- Notify the user about the password change.

**Frontend**
- Provide a Forgot Password screen.
- Accept the registered email address.
- Initiate backend password recovery.
- Display a generic confirmation that avoids account enumeration.
- Support password reset using a secure, single-use reset link or token.
- Validate the new password and confirmation.
- Submit the reset request and handle expired or invalid reset tokens.
- Return the user to login after successful password reset.

---

# Phase 2 — User Onboarding

## 2.1 Onboarding Session Management and Flow Management

**Backend**
- Create a restricted onboarding session after successful initial authentication.
- Associate the session with the pending user or verified identity.
- Track the user's current onboarding state.
- Support onboarding continuation after application restart or temporary interruption.
- Validate every onboarding API against the onboarding session.
- Prevent onboarding sessions from accessing normal application APIs.
- Expire abandoned onboarding sessions according to configurable policies.
- Return the current onboarding status to the frontend after authentication.

**Frontend**
- Create a sequential onboarding flow with independent screens for profile, employment and financial details.
- Maintain form data while navigating between screens.
- Support back navigation without losing previously entered information.
- Fetch onboarding status from the backend after authentication or application restart.
- Navigate users to their actual pending step rather than restarting onboarding.
- Prevent users from skipping mandatory verification or profile steps.
- Handle expired onboarding sessions and allow secure continuation.

## 2.2 Profile Management

**Backend**
- Accept first name, last name, email and mobile number.
- Validate name formats and field lengths.
- Normalize email and mobile values.
- Verify contact ownership through completed OTP challenges.
- Prevent modification of already verified contact details through ordinary profile APIs.
- Prevent duplicate verified email and mobile assignments.
- Save profile information against the correct pending user.
- Support secure contact-change workflows separately.

**Frontend**
- Collect first name and last name.
- Collect email and mobile number when not already provided.
- Prefill available information from verified authentication providers.
- Display verified email and mobile fields as non-editable.
- Allow users to correct unverified information before verification.
- Validate names for required values, length and supported characters.
- Submit profile details to the backend.
- Preserve profile information when navigating between onboarding screens.

## 2.3 Employment Management

**Backend**
- Support the following employment types:
  - SALARIED
  - BUSINESS
  - STUDENT
  - RETIRED
  - HOMEMAKER
- Accept the employment type and corresponding financial input.
- Validate that the required field matches the selected employment type.
- Salaried: Monthly Salary.
- Business: Monthly Minimum Income.
- Student: Monthly Pocket Money.
- Retired: Monthly Pension.
- Housemaker: Monthly Household Budget.
- Reject unsupported employment types and missing financial values.
- Store the employment information against the authenticated onboarding user.
- Allow updates during onboarding without creating duplicate records.
- Return employment configuration and validation requirements to the frontend.

**Frontend**
- Display five employment options:
  - Salaried
  - Business
  - Student
  - Retired
  - Housemaker
- Use selectable cards with clear descriptions and visual selection states.
- Allow only one employment type at a time.
- Dynamically display the corresponding financial input based on selection.
- Salaried: Monthly Salary.
- Business: Monthly Minimum Income.
- Student: Monthly Pocket Money.
- Retired: Monthly Pension.
- Housemaker: Monthly Household Budget.
- Validate the selected employment type and required amount.
- Preserve entered values when changing between employment types, without accidentally submitting stale values.
- Fetch any configurable employment rules from the backend.
- Submit the selected employment information.

## 2.4 Initial Financial Profile

**Backend**
- Accept initial cash balance for all users.
- Accept savings amount according to backend eligibility rules.
- Support currency configuration, defaulting to INR where applicable.
- Validate non-negative monetary values and configured limits.
- Store monetary values using integer minor units rather than floating-point numbers.
- Save initial financial information separately from transaction records.
- Ensure that onboarding balances are not automatically converted into expense or income transactions.
- Support updating financial details before account activation.
- Prevent users from modifying another user's financial profile.

**Frontend**
- Collect initial cash balance for every user.
- Display savings amount according to backend eligibility/configuration.
- Support zero balances and valid decimal monetary input.
- Display currency consistently, defaulting to the backend-configured currency.
- Reject negative amounts, invalid characters and out-of-range values.
- Format amounts for display without changing their actual numeric value.
- Preserve financial data when navigating backward.
- Submit the initial financial profile to the backend.
- Clearly distinguish initial user-declared balances from actual transaction records.

## 2.5 Onboarding Configuration

**Backend**
- Provide backend-controlled onboarding configuration.
- Return supported employment types.
- Return financial field requirements.
- Return savings eligibility.
- Return supported currencies and default currency.
- Return configurable validation limits.
- Avoid hardcoding business rules exclusively in the frontend.

## 2.6 Onboarding Completion and Review

**Backend**
- Accept the final onboarding completion request.
- Validate the onboarding session and all required verification records.
- Confirm profile, employment and financial details are complete.
- Generate a unique username.
- Create or activate the user account.
- Persist all onboarding information.
- Mark onboarding status as COMPLETED.
- Issue the authenticated application session.
- Return the generated username and account details.
- Handle duplicate requests idempotently.
- Ensure partial account creation never leaves inconsistent data.

**Frontend**
- Display a final review of personal, employment and financial information.
- Allow users to navigate to the relevant screen to edit information.
- Clearly display verified contact details.
- Validate that all mandatory onboarding steps are complete.
- Submit the final completion request to the backend.
- Disable repeated submissions while account creation is processing.
- Handle username conflicts, validation errors and transaction failures.
- Display the username generated by the backend after successful account creation.
- Navigate to Dashboard only after backend confirmation of account activation.

---

# Phase 3 — Username Generation System

## 3.1 Automatic Username Generation

**Backend**
- Generate usernames using the user's first and last names.
- Normalize names into lowercase username-compatible values.
- Remove unsupported characters and whitespace.
- Generate candidates in the following priority:
1. alan
2. alandoe
3. doealan
4. alan1 to alan9
5. alandoe1 to alandoe9
6. doealan1 to doealan9
7. alan0, alandoe0, doealan0
- Skip duplicate candidates generated through normalization.
- Check availability using the database's unique username constraint.
- Reserve the selected username atomically during account creation.
- Retry when concurrent registration causes a username collision.
- Return the generated username to the frontend.
- If all candidates are unavailable, return USERNAME_POOL_EXHAUSTED and support a configurable fallback such as user-selected usernames.

## 3.2 Username Management

**Backend**
- Maintain unique normalized usernames.
- Reject reserved, offensive and unsupported usernames.
- Prevent duplicate username assignments.
- Support future username-change functionality through a separate secure API.
- Maintain username change history if username changes are supported.

---

# Phase 4 — User, Account and Session Management

## 4.1 User Account Management

**Backend**
- Maintain a single user identity across supported authentication providers.
- Associate Google, email and mobile identities with the correct user.
- Prevent duplicate account creation.
- Maintain account status and onboarding status.
- Provide authenticated user profile retrieval.
- Support profile updates with ownership validation.
- Ensure every user can access only their own data.

## 4.2 Access and Refresh Token Management

**Backend**
- Generate short-lived access tokens.
- Generate cryptographically secure refresh tokens.
- Store refresh token hashes rather than plaintext tokens.
- Implement refresh-token rotation.
- Detect refresh-token reuse and revoke the affected token family.
- Validate user and session status on protected requests.
- Support session expiry and revocation.
- Separate restricted onboarding sessions from full application sessions.

**Frontend**
- Store refresh tokens using secure Keychain/Keystore-backed storage.
- Keep access tokens in memory wherever practical.
- Attach access tokens to protected API requests.
- Refresh expired access tokens through the backend.
- Handle simultaneous API requests during token refresh without generating multiple refresh requests.
- Retry eligible failed requests after successful refresh.
- If refresh fails, revoke local session state and require authentication.
- Never store passwords, OTPs or sensitive authentication data in ordinary local storage.

## 4.3 Session Management and Session Restoration

**Backend**
- Create sessions after successful authentication.
- Track device information, creation time and expiry.
- Support current-device logout.
- Support logout from all devices.
- Revoke sessions after password reset or relevant security events.
- Reject requests using revoked or expired sessions.
- Maintain session records for security auditing.

**Frontend**
- On application startup, check for a securely stored refresh token.
- Request a valid session from the backend.
- Restore the authenticated user state when the session is valid.
- Retrieve account and onboarding status.
- Navigate to Dashboard or the appropriate onboarding screen.
- If the refresh token is expired or revoked, clear the session and navigate to authentication.
- Prevent unauthorized access while session restoration is in progress.

## 4.4 Account Status Management

**Backend**
- Support account states:
  - PENDING_VERIFICATION
  - PENDING_ONBOARDING
  - ACTIVE
  - LOCKED
  - DISABLED
  - DELETION_PENDING
- Prevent inactive accounts from accessing protected application resources.
- Return account and onboarding status during authentication.
- Handle administrative account restrictions through authorized backend operations.

## 4.5 Logout and Account State

**Frontend**
- Implement logout from the application.
- Revoke the current session through the backend.
- Clear authentication tokens and sensitive in-memory data.
- Prevent access to previously authenticated screens.
- Handle account locked, disabled and deleted states.
- Support logout from all devices through the appropriate backend endpoint.

---

# Phase 5 — Database and Data Integrity

## 5.1 Database Entities

**Backend**

Implement the following core entities:
- users — User identity, username and account status.
- auth_identities — Google and other authentication provider identities.
- credentials — Password hashes.
- user_profiles — Personal profile information.
- user_employment — Employment type and income information.
- user_financial_profiles — Initial cash balance and savings.
- otp_challenges — OTP challenges and verification status.
- onboarding_sessions — Onboarding progress and expiry.
- auth_sessions — Active and revoked sessions.
- audit_logs — Security and account activity.
- outbox_events — Reliable asynchronous event processing.

## 5.2 Data Integrity

**Backend**
- Use UUID primary keys.
- Implement proper foreign-key relationships.
- Enforce unique constraints on normalized usernames and verified contact identities.
- Use database transactions for account completion.
- Prevent duplicate profile and financial records.
- Validate ownership on every user-specific operation.
- Use database migrations for schema changes.
- Ensure failed transactions roll back completely.

## 5.3 Financial Data Integrity

**Backend**
- Store monetary amounts as integer minor units.
- Associate each amount with an ISO currency code.
- Never use floating-point database columns for money.
- Distinguish income, budget, savings and cash balance.
- Preserve the original declared values.
- Never treat onboarding values as bank-verified data.

---

# Phase 6 — API and Business Logic Integration

## 6.1 Authentication APIs

**Backend**

| Method | Endpoint | Functionality |
|--------|----------|---------------|
| POST | /v1/auth/google | Google authentication |
| POST | /v1/auth/email/signup | Email registration |
| POST | /v1/auth/email/login | Email login |
| POST | /v1/auth/mobile/otp/start | Mobile registration OTP |
| POST | /v1/auth/mobile/otp/verify | Mobile verification |
| POST | /v1/auth/mobile/login/start | Mobile login OTP |
| POST | /v1/auth/mobile/login/verify | Mobile login verification |
| POST | /v1/auth/password/forgot | Password recovery |
| POST | /v1/auth/password/reset | Password reset |
| POST | /v1/auth/refresh | Refresh access token |
| POST | /v1/auth/logout | Logout current session |
| POST | /v1/auth/logout-all | Logout all sessions |

## 6.2 Verification APIs

**Backend**

| Method | Endpoint | Functionality |
|--------|----------|---------------|
| POST | /v1/verification/email/start | Send email OTP |
| POST | /v1/verification/email/verify | Verify email OTP |
| POST | /v1/verification/mobile/start | Send mobile OTP |
| POST | /v1/verification/mobile/verify | Verify mobile OTP |

## 6.3 Onboarding APIs

**Backend**

| Method | Endpoint | Functionality |
|--------|----------|---------------|
| GET | /v1/onboarding/status | Retrieve onboarding progress |
| GET | /v1/onboarding/config | Retrieve onboarding configuration |
| PUT | /v1/onboarding/profile | Save personal details |
| PUT | /v1/onboarding/employment | Save employment details |
| PUT | /v1/onboarding/financial-profile | Save initial financial details |
| POST | /v1/onboarding/complete | Finalize account creation |
| GET | /v1/users/me | Retrieve authenticated profile |

## 6.4 API Response Handling

**Backend**
- Use consistent response structures across all APIs.
- Return meaningful HTTP status codes.
- Include machine-readable error codes.
- Return field-level validation errors.
- Include request IDs for debugging.
- Never expose internal exceptions, SQL errors or sensitive information.
- Implement pagination for future list-based endpoints.
- Support idempotency for operations that create or finalize resources.

## 6.5 API Communication

**Frontend**
- Connect all authentication screens to their respective backend APIs.
- Connect profile, employment and financial onboarding screens.
- Use typed request and response structures.
- Display backend validation errors against the relevant fields.
- Handle loading, success, empty and error responses.
- Handle offline state, timeouts and retryable failures.
- Prevent duplicate form submissions.
- Never assume an operation succeeded before receiving backend confirmation.

## 6.6 Navigation and Flow Protection

**Frontend**
- Separate authentication, onboarding and authenticated application navigation.
- Restrict authenticated application screens to active users.
- Restrict onboarding APIs and screens to valid onboarding sessions.
- Prevent navigation directly to Dashboard before account activation.
- Handle deep links from Google authentication and password recovery.
- Handle application backgrounding and reopening during OTP verification or onboarding.
- Ensure navigation history does not expose protected screens after logout.

## 6.7 Form and Input Behavior

**Frontend**
- Implement consistent validation for all authentication and onboarding fields.
- Use appropriate keyboard types for email, phone and monetary inputs.
- Handle keyboard visibility and screen scrolling.
- Preserve form data during navigation and recoverable API failures.
- Prevent invalid or duplicate submissions.
- Display clear, actionable error messages.
- Ensure monetary values are transmitted in the backend's expected format.

---

# Phase 7 — Security and Abuse Prevention

## 7.1 Authentication Security

**Backend**
- Enforce HTTPS.
- Use Argon2id for locally managed passwords.
- Verify OAuth tokens server-side.
- Use short-lived access tokens and rotating refresh tokens.
- Never store plaintext passwords, OTPs or refresh tokens.
- Protect authentication endpoints against brute-force attempts.

## 7.2 OTP Security

**Backend**
- Implement per-IP, per-device and per-destination rate limits.
- Enforce OTP expiry and maximum attempts.
- Prevent OTP reuse.
- Bind OTP challenges to their intended purpose.
- Never log OTP values.
- Protect SMS and email sending endpoints against automated abuse.

## 7.3 API Security

**Backend**
- Validate every request using strict schemas.
- Apply authentication and authorization guards.
- Use parameterized queries.
- Prevent unauthorized data access and IDOR vulnerabilities.
- Configure CORS allowlists for supported clients.
- Keep secrets in environment-specific secret management.
- Encrypt sensitive data at rest and in backups.
- Maintain audit logs for sensitive operations.

## 7.4 Privacy and Data Protection

**Backend**
- Avoid storing unnecessary personal information.
- Mask sensitive information in logs.
- Restrict database access by service role.
- Support secure account deletion and data-retention policies.
- Ensure backups and exports are protected.
- Never return passwords, OTP hashes or refresh token hashes through APIs.

---

# Phase 8 — Reliability and Production Verification

## 8.1 Error and Failure Handling

**Backend**
- Handle email/SMS provider outages.
- Handle database connection failures.
- Handle expired authentication and onboarding sessions.
- Handle duplicate registration requests.
- Handle username collision during concurrent account creation.
- Handle network interruptions without inconsistent account state.
- Retry eligible asynchronous operations safely.
- Ensure notification failures do not roll back an already committed account.

## 8.2 Background Processing

**Backend**
- Send OTP and notification messages through provider integrations.
- Process welcome notifications asynchronously.
- Use a transactional outbox for reliable post-registration events.
- Implement retry policies and failed-event handling.
- Prevent duplicate notification processing where possible.

## 8.3 Testing Requirements

**Backend**
- Test all Google, email and mobile authentication flows.
- Test OTP expiry, replay and brute-force protection.
- Test duplicate account prevention.
- Test concurrent username generation.
- Test incomplete onboarding recovery.
- Test account completion rollback.
- Test token rotation and revocation.
- Test cross-user data access restrictions.
- Test provider failures and rate limits.
- Test password reset and session invalidation.

## 8.4 Production Readiness

**Backend**
- Maintain separate development, staging and production environments.
- Use secure environment variables and secret management.
- Configure database migrations and automated backups.
- Implement health checks and structured logging.
- Monitor authentication failures and suspicious OTP activity.
- Test backup restoration.
- Scan dependencies for known vulnerabilities.
- Implement alerts for critical API and database failures.

---

# Phase 9 — Final Functional Verification

## 9.1 Complete Authentication Scenarios

**Frontend**
- Verify new registration through Google.
- Verify existing Google account login.
- Verify email registration and email verification.
- Verify email/password login.
- Verify mobile registration and OTP verification.
- Verify existing mobile user login.
- Verify password recovery and reset.

## 9.2 Complete Onboarding Scenarios

**Frontend**
- Verify every employment type.
- Verify conditional income fields.
- Verify cash balance and savings eligibility.
- Verify incomplete onboarding continuation.
- Verify final account creation and backend-generated username.
- Verify duplicate submissions and failed account creation.

## 9.3 Session and Failure Scenarios

**Frontend**
- Verify application restart with a valid session.
- Verify expired access and refresh tokens.
- Verify logout and revoked sessions.
- Verify network interruption during authentication.
- Verify OTP expiry and resend behavior.
- Verify users cannot bypass required onboarding steps.
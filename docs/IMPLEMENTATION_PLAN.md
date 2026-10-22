# Expensio Spring Boot Backend — Implementation Plan

This roadmap outlines the systematic multi-phase implementation of the new Spring Boot backend for the Expensio mobile application.

---

## 📌 Phase Overview & Status

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Phase 1** | **Project Setup, Frontend Audit & Infrastructure** | **Completed** |
| **Phase 2** | **Database Schema, Flyway Migrations & JPA Entities** | **Completed** |
| **Phase 3** | **JWT Authentication Infrastructure & Token Filter** | **Completed (Part A)** |
| **Phase 3 (Cont.)** | **OTP Verification & Google OAuth Sign-In Flows** | *Pending Next Step* |
| **Phase 4** | **User Profile, Onboarding & MPIN Security** | *Planned* |
| **Phase 5** | **Core Financial Domains (Expenses, Splits, Subscriptions)** | *Planned* |
| **Phase 6** | **End-to-End Testing & Mobile App Verification** | *Planned* |

---

## 📋 Phase-by-Phase Roadmap

### Phase 1: Project Setup & Audit (Completed)
- [x] Inspect existing React Native + Expo frontend screens and auth hooks.
- [x] Audit request/response contracts for OTP, Google Auth, MPIN, and Profile Onboarding.
- [x] Create separate Git branch: `feature/springboot-backend`.
- [x] Generate clean Spring Boot 4.1.1 + Java 21 LTS project using Maven wrapper (`mvnw`).
- [x] Add required initial dependencies (Web, Validation, Security, Data JPA, PostgreSQL, Flyway, Actuator, Test, Security Test).
- [x] Implement centralized exception-handling (`GlobalExceptionHandler`, `ErrorResponse`, `AppException`).
- [x] Configure stateless Spring Security with active protection and public health endpoints (`/api/v1/health`, `/actuator/health`).
- [x] Create configuration profiles (`application.yml`, `application-dev.yml`, `.env.example`).
- [x] Complete automated test suite (`HealthControllerTest`, `SecurityConfigTest`, `ExpensioBackendApplicationTests`) with all tests passing.
- [x] Document audit (`docs/FRONTEND_AUTH_AUDIT.md`) and implementation roadmap (`docs/IMPLEMENTATION_PLAN.md`).

---

### Phase 2: Database Modeling & Flyway Migrations (Completed)
- [x] Design normalized, production-grade PostgreSQL schema adhering to auth and onboarding specifications.
- [x] Create Flyway migration script `V1__create_auth_and_user_schema.sql` under `src/main/resources/db/migration/`.
  - [x] `users`: Core identity table with UUID PK, check constraint, normalized unique phone & lowercase email indexes.
  - [x] `user_profiles`: 1:1 user profile table with unique lowercase handle (`@handle`), avatar ID, and monthly budget limits.
  - [x] `auth_identities`: Provider identity table (`PHONE`, `GOOGLE`, `APPLE`, `EMAIL`) with `(provider, provider_subject)` unique constraint. Ephemeral OAuth tokens excluded.
  - [x] `user_mpin_credentials`: 1:1 security credentials table with `mpin_hash` (BCrypt), failed attempts counter, and lockout timestamp.
  - [x] `otp_verifications`: Phone & email OTP verification state with `otp_hash`, attempt counter, and consumed timestamp.
  - [x] `temporary_auth_tokens`: Registration and recovery capability tokens with unique `token_hash` and expiry.
  - [x] `refresh_tokens`: Session lifecycle table with `token_hash`, device info, IP, revocation status, and token rotation links.
- [x] Implement JPA Entities and Spring Data Repositories:
  - [x] `User`, `UserRepository` (`com.expensio.backend.user`)
  - [x] `UserProfile`, `UserProfileRepository` (`com.expensio.backend.profile`)
  - [x] `AuthIdentity`, `AuthIdentityRepository` (`com.expensio.backend.auth`)
  - [x] `UserMpin`, `UserMpinRepository` (`com.expensio.backend.auth`)
  - [x] `OtpVerification`, `OtpVerificationRepository` (`com.expensio.backend.auth`)
  - [x] `TemporaryAuthToken`, `TemporaryAuthTokenRepository` (`com.expensio.backend.auth`)
  - [x] `RefreshToken`, `RefreshTokenRepository` (`com.expensio.backend.auth`)
- [x] Write automated tests for entity mappings, lifecycle triggers, and Flyway migration SQL script validation (`UserEntityTest`, `AuthEntityMappingTest`, `FlywayMigrationScriptTest`).
- [x] Document complete schema architecture, constraints, normalization rules, and secret protection in `docs/DATABASE_DESIGN.md`.

---

### Phase 3: Core Authentication Engine & JWT Security
- **Objective:** Implement complete phone OTP, Google OAuth token verification, and JWT generation/validation.
- **Components:**
  1. **Phone OTP Service:**
     - Rate-limited OTP generation (6 digits, 5-minute expiry).
     - Pluggable SMS gateway interface (Twilio / AWS SNS / Dev mock).
     - Database-backed OTP session verification using `OtpVerificationRepository`.
  2. **Google OAuth Verification:**
     - Verify Google ID tokens via Google API Client (`GoogleIdTokenVerifier`) using `GOOGLE_CLIENT_ID`.
     - Provision or link existing `User` entity on social sign-in.
  3. **JWT Token Provider & Filter:**
     - HMAC-SHA256 / RSA JWT token issuance.
     - Access token (24-hour expiration) & Refresh token (30-day expiration).
     - `JwtAuthenticationFilter` integrated into `SecurityFilterChain` to parse `Bearer <token>` headers and populate `SecurityContextHolder`.

---

### Phase 4: User Profile, Onboarding & MPIN Security
- **Objective:** Support profile setup, avatar selection, and 4-digit security PIN lifecycle.
- **Components:**
  1. **Profile Controller & Service:**
     - `GET /api/user/profile`: Retrieve user profile, avatar, budget limit, and completeness status.
     - `POST /api/user/profile`: Update handle, avatar ID, and monthly salary budget. Mark `isProfileComplete = true`.
     - Validation: unique handle reservation (case-insensitive `@handle`).
  2. **MPIN Security Controller & Service:**
     - `POST /api/auth/mpin/set`: Hash 4-digit PIN using BCrypt with salt and store securely.
     - `POST /api/auth/mpin/verify`: Validate input PIN against stored hash with brute-force rate-limiting and temporary lockout protection.

---

### Phase 5: Financial Operations & Aggregations
- **Objective:** Replace remaining Express/Node mock backend endpoints with Spring Boot services.
- **Components:**
  1. **Expenses API (`/api/expenses`):**
     - Paginated transaction retrieval with category and date filtering.
     - Expense recording with automatic deduction from linked account (`salary`, `cash`, `savings`).
  2. **Accounts & Balances (`/api/expenses/accounts`):**
     - Real-time gauge metrics (total spent vs salary limit, remaining budget).
  3. **Split Expenses (`/api/splits`):**
     - Group creation, participant split calculation, settlement endpoint (`/api/splits/{id}/settle`).
  4. **Subscriptions API (`/api/subscriptions`):**
     - Active recurring subscriptions, upcoming due dates, overdue alert calculation.

---

### Phase 6: Mobile Client Integration & Verification
- **Objective:** Seamless switchover from Node.js backend to Spring Boot backend without modifying frontend UI.
- **Components:**
  1. Execute E2E verification test script (`scripts/verify-e2e-auth.cjs`) pointing to port `5001`.
  2. Validate full mobile app lifecycle on Android Emulator and Web/iOS Simulator:
     - Splash screen -> Phone OTP login -> Profile onboarding -> MPIN setup -> Dashboard -> Expenses & Splits.
  3. Performance benchmarking and production containerization (Dockerfile + Docker Compose for PostgreSQL).

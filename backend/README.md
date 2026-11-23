# Expensio Backend — Spring Boot Application

Modern, resilient, and secure Spring Boot backend for the Expensio financial tracking application. Built with **Java 21 LTS** and **Spring Boot 4.1.1**.

---

## 🛠️ Technology Stack

- **Java Version:** OpenJDK 21 (LTS)
- **Framework:** Spring Boot 4.1.1
- **Build Tool:** Apache Maven (Wrapper included: `mvnw` / `mvnw.cmd`)
- **Web Layer:** Spring Web (Embedded Tomcat)
- **Security:** Spring Security (stateless REST API architecture, CORS configured for mobile Expo and Web)
- **Validation:** Spring Boot Starter Validation (Hibernate Validator 9)
- **Persistence:** Spring Data JPA + PostgreSQL JDBC Driver
- **Database Migrations:** Flyway Migration Support (`flyway-database-postgresql`)
- **Observability:** Spring Boot Actuator (`/actuator/health`, `/actuator/info`, `/actuator/metrics`)
- **Testing:** Spring Boot Test + Spring Security Test (JUnit 5, MockMvc)

---

## 📁 Package Architecture

The application is structured under the base package `com.expensio.backend`:

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/expensio/backend/
│   │   │   ├── ExpensioBackendApplication.java  # Main application entry point
│   │   │   ├── audit/                           # Audit trail & security event logging
│   │   │   │   ├── AuditLog.java
│   │   │   │   └── AuditLogRepository.java
│   │   │   ├── auth/                            # Enterprise authentication & session management
│   │   │   │   ├── controller/AuthController.java
│   │   │   │   ├── dto/                         # Signup, Login, OTP, OAuth & Token DTOs
│   │   │   │   ├── service/                     # AuthService, OtpService, RefreshTokenService, GoogleTokenVerifier
│   │   │   │   └── *Repository.java / *.java    # AuthIdentity, Credential, OnboardingSession, RefreshToken, UserMpin
│   │   │   ├── common/                          # Standardized ApiResponse, HealthResponse & phone utils
│   │   │   │   ├── controller/HealthController.java
│   │   │   │   └── service/PhoneNormalizationService.java
│   │   │   ├── communication/                   # Notification dispatchers (Twilio SMS & SMTP Email)
│   │   │   │   ├── DevCommunicationService.java
│   │   │   │   ├── SmtpEmailService.java
│   │   │   │   └── TwilioSmsService.java
│   │   │   ├── config/                          # Application-level beans & CORS configuration
│   │   │   │   ├── AppConfig.java
│   │   │   │   └── CorsConfig.java
│   │   │   ├── exception/                       # Centralized global exception handling & standardized error codes
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   └── ErrorResponse.java
│   │   │   ├── onboarding/                      # Multi-step profile, employment & financial onboarding
│   │   │   │   ├── controller/OnboardingController.java
│   │   │   │   ├── dto/                         # Onboarding status, config, profile & financial DTOs
│   │   │   │   ├── service/OnboardingService.java
│   │   │   │   └── UserEmployment.java / UserFinancialProfile.java
│   │   │   ├── outbox/                          # Transactional outbox event publisher & background relay
│   │   │   │   ├── OutboxEvent.java
│   │   │   │   └── OutboxRelayScheduler.java
│   │   │   ├── profile/                         # User profile persistence
│   │   │   │   ├── UserProfile.java
│   │   │   │   └── UserProfileRepository.java
│   │   │   ├── security/                        # Security filter chain, Argon2id, JWT & request tracking
│   │   │   │   ├── JwtAuthenticationEntryPoint.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   ├── JwtService.java
│   │   │   │   ├── PasswordPolicyService.java
│   │   │   │   ├── RequestIdFilter.java
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   └── TokenHashService.java
│   │   │   ├── user/                            # User profile and account status operations
│   │   │   │   ├── controller/UserController.java
│   │   │   │   ├── service/UserService.java
│   │   │   │   └── User.java / AccountStatus.java
│   │   │   ├── username/                        # 7-tier algorithmic username generator
│   │   │   │   └── UsernameGeneratorService.java
│   │   │   └── verification/                    # Standalone email and mobile OTP verification
│   │   │       ├── controller/VerificationController.java
│   │   │       └── service/VerificationService.java
│   │   └── resources/
│   │       ├── application.yml                  # Base configuration with environment variable interpolation
│   │       ├── application-dev.yml              # Local development overrides & SQL logging
│   │       ├── application-prod.yml             # Production overrides
│   │       └── db/migration/                    # Flyway database migration scripts (V1-V4)
│   └── test/
│       ├── java/com/expensio/backend/           # 72 automated unit, integration and security tests
│       └── resources/                           # Test profile configuration
├── Dockerfile                                   # Multi-stage production container build
├── docker-compose.yml                           # Production Docker service definition
├── Expensio_API_Collection.json                 # Postman API Collection
├── expensio-api-tests.http                      # VS Code REST client automated test suite
├── pom.xml                                      # Maven project descriptor
└── .env.example                                 # Environment variable reference template
```

---

## ⚙️ Environment Configuration

Configuration is externalized through environment variables with sensible local defaults in `src/main/resources/application.yml`.

Copy `.env.example` to `.env` or set the environment variables in your deployment environment:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `SERVER_PORT` | HTTP port the server listens on | `5001` |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `dev` |
| `DB_URL` | PostgreSQL JDBC connection URL | `jdbc:postgresql://localhost:5432/expensio` |
| `DB_USERNAME` | PostgreSQL database username | `postgres` |
| `DB_PASSWORD` | PostgreSQL database password | `postgres` |
| `FLYWAY_ENABLED` | Enable automated database migrations | `false` |
| `JWT_SECRET` | 256-bit+ HMAC secret key for JWT signing | *(Required in prod; dev default in `application-dev.yml`)* |
| `JWT_ACCESS_EXPIRATION_MS` | Access token lifespan in milliseconds | `86400000` (24h) |
| `JWT_REFRESH_EXPIRATION_MS` | Refresh token lifespan in milliseconds | `2592000000` (30d) |
| `JWT_ISSUER` | JWT token issuer claim (`iss`) | `expensio-api` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID for mobile auth | `expensio-google-client-id` |
| `MAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP server port | `587` |
| `MAIL_USERNAME` | SMTP account username | *(empty)* |
| `MAIL_PASSWORD` | SMTP account password / app password | *(empty)* |

---

## 🚀 Running the Project

### Prerequisites
- **Java 21 LTS** (`java -version`)
- Maven wrapper is included (`mvnw` on Unix / `mvnw.cmd` on Windows)

### 1. Compile the Project
```bash
./mvnw clean compile
# Windows:
mvnw.cmd clean compile
```

### 2. Run the Test Suite
```bash
./mvnw test
# Windows:
mvnw.cmd test
```

### 3. Start the Server Locally
```bash
./mvnw spring-boot:run
# Windows:
mvnw.cmd spring-boot:run
```

The application starts on port `5001`:
```
http://localhost:5001
```

---

## 🏥 Verification Endpoints

- **Application Health Check:**
  `GET http://localhost:5001/api/v1/health`
  ```json
  {
    "status": "UP",
    "app": "Expensio API",
    "version": "1.0.0",
    "timestamp": "2026-10-20T13:50:12.302Z"
  }
  ```

- **Legacy Health Endpoint:**
  `GET http://localhost:5001/api/health`

- **Actuator Health:**
  `GET http://localhost:5001/actuator/health`

- **Protected Endpoint Test (Returns 401 Unauthorized):**
  `GET http://localhost:5001/api/v1/protected`

---

## 🔐 JWT Authentication Infrastructure (Phase 3)

The backend implements a stateless, cryptographically verified JWT access-token security architecture.

### 1. How JWT Authentication Works
1. Incoming HTTP requests pass through the Spring Security filter chain.
2. `JwtAuthenticationFilter` intercepts the request and inspects the `Authorization` header:
   - If the header is absent or does not start with `Bearer `, the filter proceeds down the chain for Spring Security to enforce public vs protected endpoint authorization.
   - If a `Bearer ` token is provided, `JwtService` cryptographically validates:
     - Algorithm: strictly `HS256` signed with the server's SecretKey.
     - Signature integrity: rejecting tampered or differently signed tokens.
     - Expiration (`exp`) and active time (`nbf`, `iat`) relative to UTC clock.
     - Issuer (`iss`): matches configured `app.jwt.issuer`.
     - Subject (`sub`): must be a valid, non-null user `UUID`.
3. Upon successful validation, a `UserPrincipal` containing the verified user UUID is created and placed in a `UsernamePasswordAuthenticationToken` inside the request's isolated `SecurityContextHolder`.
4. If an invalid or expired token is provided, the request is immediately halted and returns a standardized `401 Unauthorized` JSON response via `JwtAuthenticationEntryPoint` without leaking internal cryptographic or parsing details.

### 2. Generating a Secure Secret Key
For production and staging deployments, generate a high-entropy 256-bit+ random secret using OpenSSL or Java:

```bash
# Using OpenSSL (recommended):
openssl rand -base64 32

# Or generate hex:
openssl rand -hex 32
```
Set the generated key in your deployment environment as `JWT_SECRET`.

### 3. Fail-Fast Configuration & Production Guards
- **Production (`prod` profile):**
  `app.jwt.secret` has no default fallback. If `JWT_SECRET` is omitted or contains fewer than 32 bytes (256 bits) of entropy, `JwtProperties.validate()` throws an `IllegalStateException` preventing server startup.
- **Development (`dev` profile):**
  `application-dev.yml` provides a local fallback key to allow immediate developer execution without manual configuration.
- **Non-Dev Profiles:**
  Any known insecure development or placeholder secret is explicitly rejected at startup.

### 4. Access Tokens vs. Refresh Tokens
| Attribute | Access Token | Refresh Token (Planned Phase 3.2 / 4) |
| :--- | :--- | :--- |
| **Storage** | Client memory / SecureStore | Client SecureStore & database (`refresh_tokens` table) |
| **Format** | Signed JWT (stateless) | Cryptographically secure random opaque token |
| **Subject** | User UUID in `sub` claim | Linked to user ID via hashed record in DB |
| **Lifespan** | 24 hours (`86400000ms`) | 30 days (`2592000000ms`) |
| **Validation** | Cryptographic signature verification | Database lookup + revocation status check |
| **Revocation** | Cannot be revoked until expiry | Can be revoked immediately via DB update |

### 5. Obtaining a Test Token in the Test Suite
Within integration and unit tests, obtain signed tokens directly using `JwtService`:

```java
@Autowired
private JwtService jwtService;

// Generate token for a user UUID
UUID testUserId = UUID.randomUUID();
String validToken = jwtService.generateAccessToken(testUserId);

// Perform authenticated request in MockMvc
mockMvc.perform(get("/api/v1/protected")
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + validToken))
        .andExpect(status().isOk());
```

### 6. Implemented Capabilities & Roadmap
- **Authentication & Security (Phases 1–8 Implemented):** Google OAuth token verification, Argon2id password hashing, Twilio SMS and SMTP Email OTP verification, MPIN credentials, refresh token rotation with reuse detection, and session revocation (`/v1/auth/*`, `/v1/verification/*`).
- **Onboarding & User Profiles (Implemented):** 5 employment types, minor units financial profile, multi-step onboarding session management, and 7-tier algorithmic username generator (`/v1/onboarding/*`, `/v1/users/*`).
- **Database Migrations & Event Outbox (Implemented):** Flyway PostgreSQL migrations V1–V4, `audit_logs` tracking, and `OutboxRelayScheduler` background processing.
- **Planned Financial Modules:** Dedicated domain REST endpoints for Expenses, Budgets, Splits, Subscriptions, EMIs, Goals, Ledger, and Reports (documented in the root `docs/` specifications).


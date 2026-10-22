# Expensio Frontend Authentication Audit & API Contract Specification

This document details the architectural audit of the React Native / Expo mobile application (`frontend/`) and defines the exact authentication flows, screen behaviors, and API request/response contracts required by the mobile client.

---

## 1. Authentication State Machine & Screen Flows

The frontend auth flow is managed by the custom hook [`src/hooks/useAuth.ts`](file:///c:/Users/ASUS/OneDrive/Desktop/ExpensioApp/expensioApp/frontend/src/hooks/useAuth.ts) and navigated via [`src/screens/AuthScreen.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/ExpensioApp/expensioApp/frontend/src/screens/AuthScreen.tsx) and [`src/navigation/RootNavigator.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/ExpensioApp/expensioApp/frontend/src/navigation/RootNavigator.tsx).

The flow consists of six discrete states (`AuthFlowState`):

```
       [ App Launch ]
              │
              ▼
        ┌───────────┐
        │  splash   │ (SplashScreen.tsx - 1.9s branded animation)
        └─────┬─────┘
              │ Token Check (SecureStore)
       ┌──────┴──────────────────────────┐
       ▼ [Token Exists]                  ▼ [No Token]
 ┌───────────┐                     ┌───────────────┐
 │mpin_guard │ (FaceID / PIN)      │ login_screen  │ (AuthScreen.tsx)
 └─────┬─────┘                     └───────┬───────┘
       │                                   │
       │ Unlock Success                    │ Request OTP
       │                                   ▼
       │                            ┌───────────────┐
       │                            │  otp_verify   │
       │                            └───────┬───────┘
       │                                    │ Verify OTP / Social Login
       │                                    ▼
       └───────────────┬────────────────────┘
                       │ Check Profile Completeness
       ┌───────────────┴───────────────┐
       ▼ [Incomplete]                  ▼ [Complete]
 ┌───────────┐                   ┌───────────────┐
 │onboarding │                   │ authenticated │ ──► DashboardScreen
 └─────┬─────┘                   └───────────────┘
       │ Complete Profile
       └───────────────►
```

### Screens Audited

1. **`SplashScreen` ([`src/screens/SplashScreen.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/ExpensioApp/expensioApp/frontend/src/screens/SplashScreen.tsx)):**
   - Displays animated wallet icon and progress bar.
   - Triggers `useAuth.finishSplash()` after ~1.9s or on "Continue" tap.
   - Inspects hardware SecureStore for stored JWT token.
   - If token exists: prompts Biometrics (FaceID/Fingerprint) if enrolled; otherwise transitions to `mpin_guard`.
   - If token does not exist: transitions to `login_screen`.

2. **`AuthScreen` ([`src/screens/AuthScreen.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/ExpensioApp/expensioApp/frontend/src/screens/AuthScreen.tsx)):**
   - Branded heading: *"Track today for a brighter tomorrow"*.
   - Country code selector modal (10 default countries: IN +91, US +1, GB +44, CA +1, AU +61, etc.).
   - Mobile number input (10 digits) with "Continue with OTP" button.
   - Switches to 6-digit OTP entry field (`otp_verify`) with auto-focus and "Verify & Proceed" action.

3. **`MpinScreen` ([`src/screens/MpinScreen.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/ExpensioApp/expensioApp/frontend/src/screens/MpinScreen.tsx)):**
   - 4-dot security PIN pad with numeric keypad (0–9), delete key, and biometric icon button.
   - Auto-triggers FaceID / Biometrics when available.
   - Validates against backend `/api/auth/mpin/verify`.
   - "Sign in with another account" option resets stored tokens and returns to login.

4. **`OnboardingProfileScreen` ([`src/screens/OnboardingProfileScreen.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/ExpensioApp/expensioApp/frontend/src/screens/OnboardingProfileScreen.tsx)):**
   - Displayed when a user authenticated via OTP or Google is missing required profile fields (`isProfileComplete: false`).
   - Profile requirements:
     - Avatar selection from 6 presets: Apex (`⚡`), Cyber (`🤖`), Nova (`💎`), Titan (`🛡️`), Quantum (`🚀`), Zen (`✨`).
     - Unique handle/username (`@...`).
     - Monthly salary / budget limit (`₹`) with quick presets (₹30k, ₹50k, ₹75k, ₹100k, ₹150k).
   - Submits to `POST /api/user/profile`.

5. **Social Authentication (Google & Apple):**
   - Defined in [`src/services/supabaseAuth.ts`](file:///c:/Users/ASUS/OneDrive/Desktop/ExpensioApp/expensioApp/frontend/src/services/supabaseAuth.ts) and invoked in `useAuth`.
   - Native or web OAuth session retrieves identity token and posts payload to `/api/auth/social`.

---

## 2. API Base URL Selection Mechanism

In [`frontend/src/services/api.ts`](file:///c:/Users/ASUS/OneDrive/Desktop/ExpensioApp/expensioApp/frontend/src/services/api.ts):

```typescript
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5001/api';
  }
  return 'http://localhost:5001/api';
};

export const API_BASE_URL = getBaseUrl();
```

- **Android Emulator:** Uses `http://10.0.2.2:5001/api` (Android's loopback alias for host machine).
- **iOS Simulator & Web:** Uses `http://localhost:5001/api`.
- **Target Server Port:** Standardized on `5001`.

---

## 3. Token & Storage Architecture

The mobile app implements hardware-backed secure storage via `expo-secure-store`:
- [`src/services/secureStore.ts`](file:///c:/Users/ASUS/OneDrive/Desktop/ExpensioApp/expensioApp/frontend/src/services/secureStore.ts):
  - `AUTH_TOKEN`: JWT bearer token, saved in iOS Keychain / Android Keystore.
  - `USER_MPIN`: 4-digit security PIN.
  - `USER_PROFILE`: Serialized cached profile.
- Authorization header format: `Authorization: Bearer <token>`.

---

## 4. API Request & Response Contracts

### Contract 1: Send Phone OTP
- **Endpoint:** `POST /api/auth/send-otp`
- **Authentication:** Public
- **Request Body:**
  ```json
  {
    "phone": "9876543210"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "OTP sent successfully to 9876543210",
    "devOtp": "123456",
    "expiresIn": 300
  }
  ```
- **Error Response (400 Bad Request):**
  ```json
  {
    "status": 400,
    "error": "Bad Request",
    "message": "Please provide a valid 10-digit phone number",
    "path": "/api/auth/send-otp"
  }
  ```

---

### Contract 2: Verify Phone OTP
- **Endpoint:** `POST /api/auth/verify-otp`
- **Authentication:** Public
- **Request Body:**
  ```json
  {
    "phone": "9876543210",
    "otp": "123456"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Authentication successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_uuid",
      "phone": "9876543210",
      "name": "Apeksha",
      "username": "@apeksha",
      "salary": 31627,
      "avatarId": "avatar_1"
    },
    "isProfileComplete": true
  }
  ```
- **Error Response (401 Unauthorized):**
  ```json
  {
    "status": 401,
    "error": "Unauthorized",
    "message": "Invalid or expired OTP",
    "path": "/api/auth/verify-otp"
  }
  ```

---

### Contract 3: Social Authentication (Google / Apple)
- **Endpoint:** `POST /api/auth/social`
- **Authentication:** Public
- **Request Body:**
  ```json
  {
    "provider": "google",
    "token": "mock_or_real_google_id_token",
    "email": "apeksha.verma@example.com",
    "name": "Apeksha Verma"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "GOOGLE authentication successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_uuid",
      "name": "Apeksha Verma",
      "email": "apeksha.verma@example.com",
      "authProvider": "google",
      "username": null,
      "salary": null,
      "avatarId": null
    },
    "isProfileComplete": false
  }
  ```

---

### Contract 4: Get User Profile
- **Endpoint:** `GET /api/user/profile` (and legacy alias `GET /api/auth/profile`)
- **Authentication:** Protected (`Authorization: Bearer <token>`)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "usr_uuid",
      "name": "Apeksha Verma",
      "username": "@apeksha",
      "email": "apeksha.verma@example.com",
      "phone": "9876543210",
      "salary": 50000,
      "avatarId": "avatar_1",
      "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=avatar_1"
    },
    "isProfileComplete": true
  }
  ```

---

### Contract 5: Update User Profile & Onboarding
- **Endpoint:** `POST /api/user/profile` (also accepts `PUT`)
- **Authentication:** Protected (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "username": "@apeksha",
    "salary": 50000,
    "avatarId": "avatar_1",
    "name": "Apeksha Verma"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "user": {
      "id": "usr_uuid",
      "name": "Apeksha Verma",
      "username": "@apeksha",
      "salary": 50000,
      "avatarId": "avatar_1"
    },
    "isProfileComplete": true
  }
  ```

---

### Contract 6: Set Security MPIN
- **Endpoint:** `POST /api/auth/mpin/set`
- **Authentication:** Protected
- **Request Body:**
  ```json
  {
    "mpin": "1234"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "MPIN set successfully"
  }
  ```

---

### Contract 7: Verify Security MPIN
- **Endpoint:** `POST /api/auth/mpin/verify`
- **Authentication:** Public or Protected
- **Request Body:**
  ```json
  {
    "mpin": "1234"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "MPIN verified successfully"
  }
  ```
- **Response on Incorrect PIN (401 Unauthorized):**
  ```json
  {
    "success": false,
    "error": "Incorrect 4-digit PIN"
  }
  ```

# Expensio Frontend Architecture & Guidelines

This is an Expo/React Native mobile application built with **Expo SDK 58**, **React Native 0.88.1**, and **React 19.3.0**.

---

## Architecture Overview

```text
frontend/
├── index.ts                      # App registration entry point
├── App.tsx                       # Root component (AppContext, fonts, ThemeProvider)
├── app.json                      # Expo application manifest
├── package.json                  # Dependencies (React Navigation 7, Expo 58)
└── src/
    ├── components/               # Reusable UI components (buttons, inputs, cards, toasts)
    ├── context/                  # Central application state (AppContext.tsx)
    ├── core/storage/             # Local persistence, secure sessions, preferences
    ├── data/                     # Seed datasets, avatar catalogs, module metadata
    ├── navigation/               # React Navigation navigators
    │   ├── RootNavigator.tsx     # Auth flow gating and main tab presentation
    │   ├── MainTabs.tsx          # Bottom tab navigator (Home, Activity, Add, Split, Profile)
    │   └── SplitStack.tsx        # Splits stack navigator (CreateSplit, Detail, Friends)
    ├── screens/                  # Feature screen implementations
    │   ├── auth/                 # AuthEntry, MobileLogin, EmailAuth, OtpScreen
    │   ├── home/                 # DashboardScreen, ActivityScreen, AddTransaction, Profile
    │   ├── onboarding/           # OnboardingScreen carousel
    │   ├── setup/                # ProfileSetupScreen (employment, financial inputs)
    │   └── split/                # SplitHomeScreen, CreateSplitScreen, FriendsScreen
    ├── services/                 # Domain services (authApi, moneyService, profileService)
    ├── theme/                    # Colors, typography, spacing, radius, shadows
    ├── types/                    # TypeScript interfaces and contracts
    └── utils/                    # Formatters, split calculations, validation
```

---

## Navigation & Routing

The application uses **React Navigation 7** (NOT Expo Router):
- Container: `NavigationContainer` configured in `src/navigation/RootNavigator.tsx`.
- Gated Flow: Authenticated vs unauthenticated state managed dynamically via `useApp().authPhase`.
  - Phases: `entry` → `mobile` / `email` → `otp` → `onboarding` → `profile_setup` → `authenticated`.
- Tab Navigation: `createBottomTabNavigator` in `src/navigation/MainTabs.tsx` paired with the custom `BottomNavigation` component.
- Nested Stacks: Stack navigators like `SplitStack` handle multi-screen deep workflows.

---

## State Management & Storage

- **Application Context:** `src/context/AppContext.tsx` provides centralized reactive state for transactions, user profile, budget allocations, split expenses, and active modules.
- **Local Persistence:** `src/core/storage/localPersistence.ts` handles offline-first local storage (`AsyncStorage` on native, `localStorage` on web preview).
- **Session Security:** `src/core/storage/session.ts` and `expo-secure-store` manage authenticated token storage and session restoration.
- **Domain Services:** All business logic lives in `src/services/` (e.g. `authApi.ts`, `moneyService.ts`, `balanceConfirmationService.ts`).

---

## Development Commands

```bash
# Start Expo development server
npm start

# Run on target platforms
npm run android
npm run ios
npm run web

# TypeScript type checking
npx tsc --noEmit
```

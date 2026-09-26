# Expensio Full-Stack Mobile Workspace ⚡

Expensio is a modern personal finance, expense tracking, and bill-splitting mobile application built for iOS and Android with React Native and an Express.js backend.

## Workspace Architecture

```text
expensio/
├── frontend/                     # React Native mobile client (Expo SDK 57 + TypeScript)
│   ├── App.tsx                  # Core app with Auth, Gestures, Notifications & Screens
│   ├── src/
│   │   ├── config/
│   │   │   └── firebase.ts      # Firebase client configuration (FCM & Phone Auth)
│   │   └── services/
│   │       ├── api.ts           # API client connecting to backend on port 5000
│   │       └── notifications.ts # In-app and push notification handling
│   ├── package.json             # Mobile dependencies
│   └── tsconfig.json
│
└── backend/                      # Node.js + Express API server (Port 5000)
    ├── src/
    │   ├── server.js            # Main server entry with CORS, JSON parser & logger
    │   ├── config/
    │   │   └── firebase.js      # Firebase Admin SDK initialization
    │   ├── controllers/
    │   │   ├── authController.js         # Phone & OTP verification with JWT
    │   │   ├── expenseController.js      # Accounts & UPI transactions
    │   │   ├── splitController.js        # Splits & Settle Up
    │   │   ├── subscriptionController.js # Subscriptions tracker
    │   │   └── notificationController.js # Device push token registry
    │   ├── routes/              # Express API route modules
    │   ├── middleware/          # JWT authorization middleware
    │   └── data/
    │       └── mockDatabase.js  # In-memory store with seeded data
    ├── package.json
    └── .env                     # Server environment variables
```

---

## Features Implemented

1. **Splash Screen First**:
   - Launches with the official Expensio logo and wallet glyph.
   - Automatically transitions to the login screen after 1.8 seconds (or tap "Get Started →").

2. **Mobile + OTP Authentication**:
   - Phone number input with `+91 🇮🇳` country code.
   - 6-digit OTP verification screen with auto-resend timer.
   - Connected to backend `/api/auth/send-otp` and `/api/auth/verify-otp` (dev test OTP: `123456`).

3. **Swipe Gestures**:
   - **Edge Swipe for Drawer**: Swiping inward from the left edge of the screen opens the sidebar drawer.
   - **Horizontal Card Swiping**: Swiping left/right on the Account Card navigates between **Salary**, **Cash**, and **Savings** accounts.

4. **Notifications System**:
   - In-app interactive notification banner for bill reminders, overdue alerts, and welcome toasts.
   - Device push token registration endpoint (`/api/notifications/register-token`).

5. **Firebase Setup**:
   - Frontend client configuration in [src/config/firebase.ts](file:///c:/CODING/expensio/frontend/src/config/firebase.ts).
   - Backend Firebase Admin SDK integration in [src/config/firebase.js](file:///c:/CODING/expensio/backend/src/config/firebase.js).

6. **All Core Screens**:
   - **Dashboard**: Semicircular progress arc gauge, upcoming payments carousel, split summary card.
   - **Expenses**: Total spend (`₹458`), salary & cash progress bars, transaction list (Zepto, Milk, Dahi, Dishwash Soap), purple FAB.
   - **Splits**: Dual tabs (**Expenses** with `SETTLE UP` / `Settle` buttons, and **Groups** with Room GGN), orange FAB.
   - **Subscriptions**: `₹180` total, `UPCOMING` / `PAID` toggle, `THIS MONTH` and `NEXT MONTH` categories, magenta FAB.
   - **Sidebar Drawer**: Custom user profile for **Apeksha** (`@apeksha`), complete categories list, version `v1.0.27`, and quick action buttons.

---

## Running Locally

### Backend Server (Port 5000):
```bash
cd backend
npm run dev
```

### Frontend Mobile App (Port 8081):
```bash
cd frontend
npm start
```
- Press **`w`** for Web preview at `http://localhost:8081`.
- Press **`a`** for Android Emulator.
- Press **`i`** for iOS Simulator.
- Scan QR code with the **Expo Go** app on your physical phone.

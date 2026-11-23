# Dashboard Module — Frontend & Architecture Specification

## 1. Overview & Purpose
The Dashboard screen (`DashboardScreen.tsx`) serves as Expensio's central command hub. It provides an immediate, transparent snapshot of the user's financial posture, quick shortcuts to their preferred money tools, and high-frequency actions (adding expenses and income).

---

## 2. Key UI Sections & Behaviors

### 2.1 Top Bar & Identity
- **Dynamic Time Greeting:** Displays a personalized greeting (`getGreeting()`) based on local time (e.g., "Good morning", "Good afternoon", "Good evening").
- **User Name Display:** Shows the user's first name (`profileState.firstName` or parsed display name) alongside a friendly wave gesture (`👋`).
- **Cartoon Avatar Badge:** Features the active cartoon avatar emoji selected in Profile (`getProfileAvatar(profileState.avatarId)`), with an active presence indicator dot and direct navigation to the `Profile` tab.

### 2.2 Hero Card — "Your Money Space"
- **Total Balance Display:**
  - Evaluates the consolidated total balance from local profile and transaction records:
    $$\text{Total Balance} = \text{cashInHand} + \text{savings} + \sum (\text{income transactions} - \text{expense transactions})$$
  - Formatted using standard Indian Rupee notation (`formatINR`).
  - Displays an actionable prompt ("Add your starting balance") if profile initialization is pending.
- **Date Pill:** Shows today's date formatted (e.g., `Mon, 23 Nov`) with a live pulse indicator.
- **Monthly Summary Cards:**
  - **Income this month:** Sum of all income transactions recorded in the current calendar month.
  - **Expenses:** Sum of all expense transactions recorded in the current calendar month.
- **Primary Hero Actions:**
  - `Add expense`: Opens `AddTransactionScreen` configured for expense logging (`{ type: 'expense' }`).
  - `Add income`: Quick action opening `AddTransactionScreen` configured for income logging (`{ type: 'income' }`).

### 2.3 "Your Space" — Preferred Modules Grid
- Dynamically queries available modules via `moduleRegistryService.getModuleById(id)`.
- Respects the user's customized `preferredModuleIds` stored in preferences.
- **Featured First Tile:** The primary preferred module is highlighted with high-contrast accent styling.
- **Module Navigation:** Tapping any tile navigates directly to the designated tab or landing screen (Budgets, Reports, Goals, Split, Upcoming Payments, Analytics).
- **"All modules" Link:** Header button navigating to `AdditionalModules`.

### 2.4 Recent Activity Section
- **Transaction List:**
  - Renders up to 3 most recent transactions using the `TransactionItem` component.
  - Displays category icon, title, payment method, formatted date, and color-coded amount (`+` for income, `-` for expense).
  - Clean dividers between transaction items.
- **"See all" Action:** Navigates directly to the dedicated `ActivityScreen` when transactions exist.
- **Empty State ("A clean slate"):**
  - Renders a receipt illustration when no transactions are recorded yet.
  - Provides a direct CTA button ("Add your first transaction").

---

## 3. Data Integration & State Flow

- **State Source:** Consumes `useApp()` from `AppContext.tsx`:
  - `profileState`: First name, last name, avatar ID, preferred module IDs.
  - `profile`: User-declared starting cash in hand, savings, and salary.
  - `transactions`: Central transaction ledger.
- **Responsive Layout:**
  - Safe-area top padding computed dynamically via `useSafeAreaInsets()`.
  - Non-dismissive vertical scrolling (`keyboardShouldPersistTaps="always"`).
  - Consistent tokens applied from `src/theme/` (colors, radius, spacing, typography).

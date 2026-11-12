# Profile Module — Frontend + Backend

# Phase 1 — Profile Screen and Identity

## 1.1 Profile Overview

**Frontend**
- Create a dedicated Profile screen following the existing Expensio design system.
- Organize into clearly separated sections: Identity, Employment, Account Balances, Preferred Modules, Report Frequency.
- Display cartoon avatar, full name, mobile number and email.
- Keep first name, last name and mobile number read-only.
- Mask contact details where appropriate.
- Show a loading state until local data is initialized, to avoid flashing default values.
- Show empty states when information is unavailable. Never display fabricated balances or statistics.

**Backend (future)**
- Provide authenticated profile retrieval and update APIs with ownership validation.
- Never allow modification of verified contact details through the ordinary profile API.

## 1.2 Cartoon Avatar

**Frontend**
- Provide a predefined set of cartoon avatars in a selection grid, each with a unique ID.
- No gallery upload or camera capture.
- Show clear selected state and preview; show a default avatar when none is selected.
- Save the selected avatar ID locally and reload it whenever Profile opens.
- Show a success toast after the avatar is updated.

## 1.3 Email Change (Simulated Verification)

**Frontend**
- Provide an Edit Email action opening a dedicated screen or modal.
- Validate email format and block submitting the current email.
- Generate a temporary OTP in a separate verification service.
- Show the OTP only through a clearly labeled development-only test panel, never as real email delivery.
- Support OTP entry, invalid OTP, expiry, resend cooldown, resend and cancel.
- Update the stored email (and the report destination) only after successful verification.
- Preserve the existing email if verification fails, expires or is cancelled.

**Backend (future)**
- Replace the simulated service with real email OTP verification, bound to purpose and challenge ID, with expiry, cooldown, attempt limits and rate limits.
- Update email only after backend verification; prevent duplicate verified emails.

---

# Phase 2 — Employment Display

## 2.1 Employment Card

**Frontend**
- Display the employment type in a dedicated card with a type-specific icon, label and short description.
- Show the matching income label and amount beneath it:
  - SALARIED: Monthly Salary
  - BUSINESS: Monthly Minimum Income
  - STUDENT: Monthly Pocket Money
  - RETIRED: Monthly Pension
  - HOMEMAKER: Monthly Household Budget
- Mask the amount by default with an eye toggle to reveal it.
- Provide an Edit action to update the amount, and to change the employment type where the rules allow.
- When the type changes, show only the input for the new type and do not carry over the stale value.
- Validate required amount, non-negative values and configured limits.

**Backend (future)**
- Validate that the amount field matches the employment type.
- Store a single current employment record per user; keep history of changes.
- Reject unsupported types and missing values.

---

# Phase 3 — Account Balances

## 3.1 Balances Section

**Frontend**
- Display the values entered during account creation: Cash Balance and Savings Amount (savings per eligibility rules).
- Show each balance as its own row or card with label, currency and amount.
- Mask all amounts by default; provide an eye toggle per section to show or hide values.
- Always re-mask when the screen is reopened.
- Clearly label values as user-declared, not bank-verified.
- Display "Last updated" date for each value.

## 3.2 Updating Balances

**Frontend**
- Provide an Edit action for each balance and for the employment income amount.
- Support zero and valid decimal input; reject negatives, invalid characters and out-of-range values.
- Convert to integer minor units before saving; use the configured currency (default INR).
- Prevent duplicate submissions while saving.
- Preserve the previous value if saving fails; show success or error toast.
- Updates must not create income or expense transactions.

**Backend (future)**
- Store amounts as integer minor units with an ISO currency code; never floating point.
- Keep the original onboarding declared values untouched; save updates as new versioned records with timestamps.
- Validate ownership and configured limits on every update.

---

# Phase 4 — Monthly Balance Confirmation Popup

## 4.1 Trigger Rules

**Frontend**
- On app initialization, show the popup on the 1st day of each month using the device's local timezone.
- Keep showing it on every app init until the user confirms or updates amounts.
- Track status per month key (YYYY-MM): PENDING, CONFIRMED, SNOOZED.
- Once confirmed or updated for a month, never show the popup again in that month.
- A new month starts a fresh PENDING cycle.
- If the app is not opened on the 1st, show the popup on the first app init after it while the month is still PENDING.

## 4.2 Popup Content and Actions

**Frontend**
- List Cash Balance, Savings Amount and the monthly income/budget amount for the user's employment type.
- Mask all amounts by default with an eye toggle to reveal them.
- Provide three actions:
  - **Confirm Same Amounts** — marks the month CONFIRMED and closes the popup.
  - **Update** — allows inline editing of any value; saving marks the month CONFIRMED and closes the popup.
  - **Remind Me Later** — snoozes the popup.
- Disable actions while an operation is in progress.
- Block accidental dismissal (back button or outside tap) from counting as confirmation; treat it as unresolved.

## 4.3 Snooze

**Frontend**
- On snooze, store the snooze time and show the popup again after 5 days, on the next app init.
- Repeated snoozing is allowed; each snooze restarts the 5-day window.
- A snooze never carries into a new month: the new month starts a fresh PENDING cycle.

## 4.4 Persistence

**Frontend**
- Store confirmation state locally under a dedicated key (e.g. expensio_balance_confirmation) with month key, status, confirmed-at and snoozed-until.
- Handle missing or corrupted data by defaulting to PENDING.
- Keep the scheduling logic in a separate service, independent of storage.

**Backend (future)**
- Store monthly confirmation records per user so the state syncs across devices.
- Record confirmed amounts as versioned snapshots for audit.

---

# Phase 5 — Immediate Recalculation

## 5.1 Reactive Updates

**Frontend**
- When the user updates monthly income, savings, budget or cash balance, update centralized state immediately.
- Recalculate every dependent value throughout the app (Dashboard, Budgets, Goals, Reports, Analytics, Upcoming Payments) from the central state; no screen keeps its own copy.
- Refresh visible UI without requiring restart or manual reload.
- Recalculate only from actual user-entered data; never generate placeholder values.
- If a recalculation fails, retain the previous values and show an error.

**Backend (future)**
- Recompute derived values server-side from the latest versioned financial profile.
- Ensure derived values never overwrite the original declared values.

---

# Phase 6 — Preferred Modules

## 6.1 Module Registry

**Frontend**
- Maintain one centralized registry as the single source of module configuration: ID, name, icon, route, display order, availability and navigation visibility.
- Initially support: Dashboard, Expenses, Splits, Ledger, Budgets, Reports, Goals, Upcoming Payments, Analytics, Additional Modules.
- Keep the registry independent of the UI so backend data can replace it later.

## 6.2 Selection and Saving

**Frontend**
- Show all modules in Profile; allow selecting exactly five with a 3/5 style counter.
- Prevent duplicates; disable unavailable modules.
- Allow reordering (drag-and-drop or equivalent) and show the priority order.
- Count Dashboard within the five if selected.
- Initialize a default five for first-time users and save it locally.
- Validate IDs against the registry before saving; prevent duplicate saves.
- Update bottom navigation and Dashboard shortcuts immediately after saving.
- Preserve previous preferences if validation or saving fails.
- On startup, replace any saved module that is no longer available with a default module.
- Keep every module reachable from All Modules regardless of preferences, with an option to add it to preferred modules.

## 6.3 Service Contract

**Frontend**
- Expose getPreferredModules(), savePreferredModules(), validatePreferredModules(), getAvailableModules() and resetPreferredModules().
- Keep storage logic out of UI components.

---

# Phase 7 — Report Frequency

## 7.1 Settings

**Frontend**
- Provide Enable/Disable automatic reports with a clear status indicator.
- Provide frequency options: Weekly, Twice a Month, Monthly.
- Display the saved frequency and the email receiving reports (updates automatically when the email changes).
- Show scheduled dates in the device's local timezone.
- Treat these as preferences only; do not generate or send reports.

## 7.2 Scheduling Rules

**Frontend**
- Weekly: select a delivery day; show the next expected date.
- Twice a Month: fixed dates (1st and 15th); show the next two expected dates.
- Monthly: select a delivery date; if it does not exist in a month, use the last calendar day.
- Save without creating duplicate configurations; show a success toast.
- Preserve previous settings if an update fails.

**Backend (future)**
- Store the schedule per user and run report delivery as background jobs with retry and failed-event handling.

---

# Phase 8 — State, Persistence and Architecture

## 8.1 Centralized State

**Frontend**
- Maintain one profile state containing: names, mobile, email, avatar ID, employment, balances, balance-confirmation status, preferred modules and report preferences.
- Initialize it from local storage and keep it synchronized across Profile, Dashboard and navigation.
- Update only the relevant slice after a successful action.

## 8.2 Local Storage

**Frontend**
- Use the project's existing persistent storage solution, with centralized keys:
  - expensio_profile
  - expensio_avatar
  - expensio_employment
  - expensio_financial_profile
  - expensio_balance_confirmation
  - expensio_module_preferences
  - expensio_report_preferences
  - expensio_email_verification (only while verification is active)
- Serialize safely; handle missing or corrupted data with defaults.
- Avoid unnecessary writes.

## 8.3 Service Separation

**Frontend**
- Create separate services for profile, avatar, employment, financial profile, balance confirmation, module registry, preferred modules, email verification, report preferences and local persistence.
- UI components call services only; validation and business rules stay outside the UI.
- Define service contracts so local implementations can later be replaced by API-backed ones without UI changes.
- Do not create fake endpoints, mock HTTP responses or backend sync logic.

---

# Phase 9 — Error Handling and Feedback

**Frontend**
- Handle storage read/write failures and corrupted data.
- Handle invalid module selections, avatar errors, email/OTP errors, invalid amounts and invalid schedules.
- Preserve previous values whenever an update fails.
- Prevent repeated submissions; offer retry where appropriate.
- Follow existing Expensio toast conventions for: avatar updated, email verified and updated, balances updated or confirmed, modules saved, report frequency updated, reports enabled or disabled, and any failure.

---

# Phase 10 — Functional Verification

## 10.1 Profile and Employment
- Verify profile data loads from local storage and survives restart.
- Verify avatar selection and persistence; verify no gallery or camera option exists.
- Verify email changes require OTP and stay unchanged until verified; verify invalid and expired OTP handling.
- Verify every employment type shows the correct label, icon and income field, and masks the amount.

## 10.2 Balances and Popup
- Verify balances display masked and the eye toggle works on both Profile and popup.
- Verify updates save in minor units and reflect immediately.
- Verify the popup appears on the 1st and on later app inits until resolved.
- Verify Confirm and Update stop the popup for the rest of that month.
- Verify Snooze reappears after 5 days and a new month resets the cycle.
- Verify dismissing without action does not count as confirmation.

## 10.3 Recalculation
- Verify updating income, savings, budget or cash updates Dashboard and dependent modules immediately.
- Verify no fabricated values appear anywhere.

## 10.4 Modules and Reports
- Verify exactly five modules, no duplicates, reordering, restart persistence and replacement of invalid IDs.
- Verify weekly, twice-monthly and monthly schedules, month-end fallback, disabled state and report email sync.

## 10.5 Persistence
- Verify data survives app restart.
- Verify corrupted storage does not crash the app and defaults are restored.
- Verify state stays consistent across Dashboard, Profile and navigation.
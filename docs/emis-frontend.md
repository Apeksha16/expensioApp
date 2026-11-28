EMI Module
Frontend Development Requirements
1. Module Overview
The EMI module allows signed-in users to manage installment commitments, see upcoming dues, record payments actually made, and review progress and history in the Expensio native mobile application (Android and iOS).

The module must support:
- Creating, viewing, editing, archiving and deleting eligible EMI plans.
- Running and Completed EMI lists, monthly commitment totals and due-soon indicators.
- Scheduled installment tracking, including installments already paid before onboarding.
- Recording an actual payment amount that may differ from the scheduled amount.
- Viewing payment history, missed/overdue installments and outstanding scheduled obligations.
- Safe corrections and reversals of incorrectly recorded payments.
- Reliable behavior across app restarts, multiple devices and intermittent connectivity.
Scope: This is a manual payment tracker, not a loan-servicing or bank-payment system. Recording an EMI does not transfer funds, calculate loan interest or penalties, or automatically create an Expense/Account transaction. Any future financial integration must be explicitly enabled and avoid double counting.
2. EMI Home Screen
2.1 Monthly Summary
Display:

Total Monthly EMIs
- Sum of the base installment amounts of Running EMIs, consistent with the existing product definition.
- Label the value as a scheduled monthly commitment, not money already spent.
- Do not include Completed or Archived EMIs.
Due This Month
- Total scheduled amount of unpaid installments due in the selected current calendar month.
- Show overdue amounts separately so users do not confuse them with future commitments.
Paid This Month
- Total of confirmed payment records attributed to the current month; do not count imported prior-paid progress without payment records.
2.2 Tabs
Running
- Show active EMI plans with installments remaining.
- Sort by the next unpaid due date, earliest first; allow a secondary title sort.
- Distinguish upcoming, due today, overdue, and paid-for-current-month states.
Completed
- Show plans with all scheduled installments fulfilled.
- Sort by completion/update date, newest first.
- Keep history accessible without showing a payment action.
Archived
- Provide a separate archived view for plans intentionally hidden without destroying records.
- Allow restoration where permitted.
2.3 EMI Cards
Each card must display:
- Title, category, optional icon, and expected monthly amount.
- Due day and next relevant installment date.
- Paid installment count, total installments, and visual progress.
- Current state (upcoming, due today, overdue, paid this month, completed).
- A due-soon highlight when the next unpaid due date is within five calendar days, including across month/year boundaries.
- A clear action to open details; avoid treating a tap on the card as a payment confirmation.
2.4 Add EMI Entry Point
- Provide a visible add action on the EMI screen, compatible with the app's global add navigation.
- Open a native-friendly full-screen form or bottom sheet with keyboard avoidance and safe-area padding.
- Preserve unsaved form values when temporarily backgrounded; confirm before discarding changes.
3. Create and Edit EMI
3.1 EMI Information
The form must contain:
- EMI title: required, trimmed, maximum 50 characters.
- Monthly/base installment amount: required, minimum ₹1, supporting two decimal places.
- Category: default General; allow selection from supported categories.
- Optional icon.
- Due day: integer 1–31; default to the current local day.
- Total installment months: integer at least 1.
- Already-paid installment count: integer 0 through total months, used only for initial historical setup.
- Start date: required.
- End date: required, derived from the schedule and shown for confirmation.
- Optional notes or lender label only if supported by the API contract; do not imply a bank connection.
3.2 Date Suggestions and Schedule
- Suggest the next upcoming due date for a new plan with zero previously paid installments.
- For plans with previously paid installments, suggest a starting installment month consistent with the selected paid count; clearly identify this as an estimate.
- Generate the final installment month from start installment month plus total months minus one.
- Use the last valid calendar day for due days that do not exist in a month (e.g., February 28/29 for due day 31).
- Use the user's selected IANA timezone for calendar-month and due-date displays; default to the device timezone until the user sets one.
- Show a preview of the first, next and final installment dates before saving.
- Allow deliberate date changes, but reject a start/end combination inconsistent with the installment schedule; do not silently override a manually selected date.
3.3 Input Validation
- Prevent blank titles, invalid dates, non-finite/negative values, unsupported precision, invalid due days, and paid count greater than total months.
- Use numeric keyboard and localized currency display while retaining exact paise values.
- Show inline errors next to the affected field; also display server-side validation errors.
- Disable repeat submissions while a save is pending.
3.4 Editing Rules
- Allow editing nonfinancial metadata (title, icon, category, notes) without modifying payment history.
- For changes to base amount, due day, start date or duration, preview the impact on unpaid future installments.
- Do not silently rewrite already-recorded payment amounts or installment months.
- Do not allow direct editing of months_paid once actual payment records exist; use the correction workflow.
- Handle stale versions from another device with a refresh/conflict message.
4. EMI Details Screen
4.1 EMI Information
Display:
- Title, category, icon, base amount, due day, start/end dates.
- Total installments, completed installments, remaining installments and progress.
- Expected total = base amount × total installments (a scheduled estimate, not loan principal or interest).
- Actual recorded paid total = sum of active confirmed payment records.
- Next unpaid installment date and overdue count.
- Status and payment history, including imported progress where applicable.
4.2 Installment Timeline
- Show one scheduled installment per month, from the first through the last scheduled month.
- Each installment must display its month, clamped due date, expected amount and status: Upcoming, Due, Overdue, Paid or Historical Paid (imported).
- Allow tapping an eligible unpaid installment to record its payment.
- Never mark a scheduled installment paid solely because its due date has passed.
- Show historical paid installments separately from recorded payments if no amount/timestamp was imported.
4.3 Payment History
For each confirmed payment display:
- Payment amount, installment month, actual payment date/time, and recorded date/time.
- Optional note and linked installment reference.
- Correction/reversal indicator and reason, when applicable.
- Clear distinction between a user-recorded payment and a bank-verified payment; the app does not verify transfers.
5. Record an EMI Payment
5.1 Select Installment
- Default to the earliest unpaid due installment, rather than assuming the current month is always the correct target.
- Allow recording a past due installment; allow future installments only through an explicitly labeled advance-payment action.
- Show the installment month and due date in the confirmation UI.
- Prevent selecting an installment that is already paid, reversed only if re-recording is allowed, or outside the plan.
5.2 Payment Amount
- Prefill with the base amount.
- Allow a different positive actual amount, with two-decimal precision.
- Explain that one confirmed installment payment counts as one installment regardless of amount; partial monetary payments are not supported in this version.
- If the user enters a smaller amount, explicitly confirm that it will still mark the installment as paid; do not claim the remaining difference was paid.
5.3 Payment Confirmation
- Display title, target installment month, due date, amount and payment date before confirmation.
- Send an idempotency key with the payment request and prevent repeated taps.
- Show a pending state until the server confirms success; do not mark the installment paid on an unconfirmed timeout.
- After success, refresh summary, timeline, history and Running/Completed tabs.
- If the final installment is confirmed, move the EMI to Completed.
- For duplicate, stale or conflicting requests, show the authoritative server result and refresh the screen.
5.4 Payment Corrections
- Provide a correction/reversal action for an incorrectly entered payment, with confirmation and reason.
- Do not erase the original financial history silently.
- Recompute progress and totals from active payment records after correction.
- Clearly communicate if a correction is restricted because of later changes or linked financial transactions.
6. EMI Management
6.1 Archive and Restore
- Archive hides an EMI from the Running/Completed default views without deleting its history.
- Archived EMIs must remain accessible and restorable.
- Archiving must not change payment status or create a payment.
6.2 Delete EMI
- Require an explicit destructive confirmation.
- Explain that deletion may remove the plan from active views while historical payment/audit records are retained according to backend retention rules.
- Prefer soft deletion for plans with payment history; do not promise irreversible physical deletion where retention applies.
- Block delete if it would orphan a linked transaction; show a reason and available alternative.
7. Mobile Navigation and User Experience
- Support Android system back and iOS swipe/back behavior without losing confirmed data.
- Use safe areas, large touch targets, screen-reader labels, dynamic text sizes, accessible contrast and non-color-only status indicators.
- Use native date pickers or accessible equivalents; ensure keyboard does not cover inputs or actions.
- Support pull-to-refresh and refresh when returning to the foreground.
- Present local currency consistently (INR initially) and dates in the user's locale/timezone.
- Keep the current tab, scroll position and detail selection when returning from forms where practical.
- Avoid opening duplicate sheets/screens from rapid taps.
8. Offline, Synchronization and Error States
Provide states for:
- No EMIs, no Running EMIs, no Completed EMIs and no archived plans.
- Loading, refreshing, and paginated history.
- No internet, request timeout, expired session, validation error and server failure.
- Duplicate payment, version conflict, permission denial and missing/deleted EMI.
Requirements:
- Cache last successfully fetched EMI lists for read-only offline viewing, clearly marked as potentially outdated.
- Do not queue payment confirmation, correction or deletion offline without a separately designed durable sync protocol; require an online server acknowledgement.
- Refresh on app foreground, manual pull-to-refresh, successful mutation and relevant server push/realtime invalidation where available.
- On logout or account switch, clear user-scoped cached data and pending form state.
- Never display a failed payment recording as successful.
9. Reminders and Notifications
- Allow users to opt in to due-date reminders, with permission requested contextually.
- Provide configurable lead time (for example, five days before and on due date) and a way to disable reminders.
- Use the authoritative installment schedule and timezone; update/cancel scheduled reminders when a plan changes, is paid, archived or deleted.
- Avoid duplicate reminders across local scheduling and server push.
- A notification tap must deep-link to the correct EMI or a safe fallback when the record no longer exists.
- Do not expose sensitive loan amounts on lock-screen notifications unless the user opts in.
- Reminders are advisory and must not imply that an actual payment was made.
10. Frontend Data and Integration Boundaries
- The mobile app must call the authenticated Spring Boot API, not write EMI tables directly from the device.
- Treat API responses as authoritative for progress, status, amounts and next due dates.
- Keep money in integer paise or decimal-safe strings in transport and state; never use floating-point arithmetic for financial totals.
- Do not create ExpenseService, budget, report or account-balance mutations from an EMI payment unless a separately specified linked-transaction feature is enabled.
- If linked expense recording is introduced, provide a visible opt-in and a clear duplicate-transaction warning.
11. User Feedback
Provide clear success/error feedback for:
- EMI creation, edits, archive/restore and deletion.
- Payment recording, correction and rejection.
- Due soon, overdue, completed and already paid statuses.
- Failed synchronization, offline read-only mode and stale data.
- Invalid dates, amount formats and forbidden changes.
12. Frontend Acceptance Criteria
The module is complete when:
1. Users see only their own EMI records after authentication.
2. A valid ₹10,000, 12-month EMI can be created and displayed with a correct schedule.
3. Invalid title, amount, due day, paid count or dates cannot be submitted.
4. The monthly commitment excludes completed and archived plans.
5. A due day of 31 correctly becomes February's last day without rolling into March.
6. Running and Completed views and progress match server-confirmed installment states.
7. A ₹10,250 payment is recorded against the selected installment exactly once and shown in history.
8. A second attempt to pay that installment is rejected or safely resolved without duplicate progress.
9. Past-due installments can be recorded without falsely marking the current installment paid.
10. A final payment moves the plan to Completed.
11. Editing metadata does not rewrite payment history; schedule changes preserve paid records.
12. Payment corrections preserve audit history and recalculate totals.
13. App restart, background/foreground, and multi-device refresh display the persisted server state.
14. Offline data is clearly read-only and failed requests do not appear successful.
15. Notifications respect permission, timezone and plan status.
16. Screen-reader, keyboard, safe-area and Android/iOS navigation behavior are usable.
17. EMI payments do not silently change expenses, budgets or account balances.
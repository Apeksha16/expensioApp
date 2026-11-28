Subscriptions Module (Frontend)
1. Purpose and scope
Specify the React Native / Expo mobile experience for managing recurring subscription plans and recording manually confirmed payments. This module does not charge merchants or detect bank payments automatically. The existing Angular/Supabase behaviors below are source requirements to migrate, not evidence of implemented native screens.
2. Core concepts and presentation
Term	Meaning
Plan	Title, expected monthly amount, category/icon, billing day 1–31, and payment state.
Upcoming	No recorded payment for the selected current billing month.
Paid	A successful linked expense/payment exists for that month.
This Month	Current-month due list.
Next Month	Preview of the same recurring plans; not a separate payment ledger.


3. Mobile screens and user journeys
3.1 Overview screen
1. Show Total Monthly Subscriptions as the sum of all active plan amounts, including paid plans (preserves source behavior).
2. Provide Upcoming and Paid segmented tabs with accessible counts where useful.
3. Upcoming: show This Month sorted by effective billing date; also show Next Month preview sorted by effective billing date. Do not misleadingly mark next month's items paid merely because this month was paid.
4. Paid: show current-month paid plans, newest-created first to preserve source order; consider payment-date order as a future product decision, not an implicit change.
5. Each card displays title, amount (₹ formatted), icon/category, due-date message, and explicit paid status.
6. Tap card to edit; tap Mark paid to review and confirm a linked expense. Avoid nested touch targets conflicting with card navigation.
7. Show empty, loading, refresh, offline, and retry states. Provide pull-to-refresh and stable list keys; use FlatList/SectionList for long lists.
8. A contextual add button opens a create bottom sheet; support safe-area insets, keyboard avoidance, Android back gesture, and screen-reader labels.
3.2 Create / edit / delete sheet
1. Inputs: required trimmed title, required amount >= ₹1, billing day 1–31, optional category and icon.
2. Defaults: billing day 1, category Others; suggest an icon from title when none is chosen. Preserve the source's mapping of icon generic name to category for styling and payment classification, but allow explicit override.
3. Validate decimal currency with a locale-aware display and integer-paise submission; never use binary floating point for money.
4. Save via authenticated API; disable duplicate taps, show field errors, and retain unsaved values on recoverable failures.
5. Edit only mutable fields. Never send created_at from the edit form; the server maintains updated_at.
6. Delete requires confirmation explaining that historical payment expenses remain in financial history (recommended policy; see backend). Do not delete linked expenses automatically.
7. Warn about unsaved changes before sheet dismissal or navigation.
3.3 Due-date policy
For month M, effectiveDueDate = min(billingDay, daysInMonth(M)). Show Due in N days, Due today, or N days overdue based on calendar dates, not elapsed 24-hour intervals. Use the same effective date in Subscriptions and Dashboard. Recalculate on app foreground, local midnight, timezone change, and month rollover. Timezone must match the backend's selected user billing timezone.
3.4 Mark paid
1. Open confirmation showing plan, amount, billing month, transaction date, category, and payment account/method when account tracking is enabled.
2. Submit one request to the backend's atomic mark-paid endpoint with a stable idempotency key; do not first create an expense locally and then update a plan.
3. Backend success returns linked expense/payment and updated plan state; move item to Paid and reconcile from server.
4. On timeout or unknown result, query status before retrying with the same idempotency key. Do not optimistically create a second expense.
5. If already paid, show the existing recorded payment instead of duplicating it. On a failed payment write, leave Upcoming unchanged.
6. Allow manual recording only; do not describe this as bank or merchant payment execution.
4. Frontend architecture
Suggested component/service	Responsibility
SubscriptionsScreen	Totals, tabs, current/next-month lists, refresh and error states.
SubscriptionCard	Due state, plan information, edit and mark-paid actions.
SubscriptionFormSheet	Create/edit/delete validation and icon/category selection.
ConfirmSubscriptionPaymentSheet	Payment month, account, confirmation, submission state.
subscriptionApi	Authenticated CRUD, list and mark-paid requests to Spring Boot.
useSubscriptions / query cache	Fetch, cache, invalidation, foreground refresh, reconciliation.
expenseApi / Expenses feature	Read linked expenses and display transaction history; payment creation is owned by the backend transaction.
Shared category/icon helpers	Theme and icon suggestions consistent with Expenses/Budgets.


Use existing Expensio mobile navigation, authentication and networking conventions rather than importing Angular signals or direct Supabase table writes. Reset sensitive caches on logout or account switch. Scope cache keys to authenticated user and month.
5. API expectations
Action	Endpoint	Client behavior
List	GET /api/subscriptions	Fetch owned plans and current-month payment status.
Create	POST /api/subscriptions	Validate and send plan fields.
Edit	PATCH /api/subscriptions/{id}	Send mutable fields only.
Delete	DELETE /api/subscriptions/{id}	Confirm; retain payment history.
Mark paid	POST /api/subscriptions/{id}/payments	Include billingMonth, account/method where applicable, and Idempotency-Key.
Payment history	GET /api/subscriptions/{id}/payments	Display recorded linked expense history if product enables detail view.


These endpoints are proposed Spring Boot contracts, not existing endpoints verified from source.
6. Offline, lifecycle and notifications
- Cached plans may be displayed offline with a stale-data indicator; create/edit/delete may be queued only with explicit conflict resolution and reliable persistence. Do not queue mark-paid automatically; require connectivity and server confirmation.
- Refresh on app resume, month rollover, successful mutations, and relevant expense changes. Web/Supabase realtime is an existing implementation detail, not a mandatory native dependency; polling/invalidation or authenticated push events may replace it.
- Optional local due reminders require permission, timezone-aware scheduling, rescheduling after plan edits, and cancellation on delete/logout. Notifications are recommended additions, not present in the uploaded source.
- Handle slow networks, session expiration, duplicate taps, and cross-device updates; do not leak plan data in notifications on shared devices without consent.
7. Cross-module dependencies
Module	Dependency
Expenses	Every recorded subscription payment is an expense with subscription_id.
Budgets	Category styling and budget impact of linked expense.
Reports	Identify subscription spend by non-null subscription_id, not category text.
Dashboard	Shared effective due date and mark-paid action.
Accounts Tracker	Explicit account/method and associated expense balance effects.
Navigation / quick actions	Entry point and add-sheet action.
Goals, EMIs, Friends, Splits, Ledger	No direct functional dependency in uploaded requirements.


8. Acceptance criteria
1. A ₹499 plan due on day 15 appears in Upcoming before payment; total includes it even when paid.
2. Empty title, amount below ₹1, and billing day outside 1–31 are rejected in UI and backend.
3. February day-31 plan shows due February 28 or 29, consistent with Dashboard.
4. Confirming payment creates exactly one linked expense and updates Paid state after server success.
5. Two taps, two devices, and network retries never create duplicate monthly payments.
6. On month rollover, last month's paid plan becomes upcoming for the new month without requiring sign-out.
7. Historical expenses remain visible after plan deletion, under the documented policy.
8. App foreground, offline recovery, logout, and Android back/sheet dismissal behave safely.
9. Screen readers announce plan name, amount, due state and actionable controls.
9. Source gaps and migration decisions
- Original Angular implementation depended on a missing SQL trigger trg_sync_subscription_status; mobile must rely on a verified Spring Boot transaction instead.
- Original edit form updated created_at; correct to immutable creation timestamp.
- Original current-month signal could remain stale; recompute on foreground/rollover.
- Original due calculation did not clamp billing days in short months; align with Dashboard.
- Original payment method default was implicit; require deliberate account/method selection or a documented fallback.
- Original historical expense deletion behavior was undefined; recommend retaining immutable payment history.
10. Implementation status
This is a target specification derived from the supplied Subscriptions requirements plus explicitly labeled native-app recommendations. It does not certify any screens, APIs, triggers or migrations as implemented.
Notifications Module
Frontend Development Requirements
Purpose: Implement a centralized, cross-module notification capability for Expensio native Android/iOS clients and the Spring Boot/PostgreSQL backend. This is a required implementation specification, not a claim that the existing application already supports every feature.
1. Module Overview
The Notifications module is a shared, cross-module capability for Expensio's native Android and iOS applications and Spring Boot backend. It informs users about important financial events, upcoming obligations, actions requiring attention, and the outcomes of relevant workflows. It must not become an independent source of financial truth.

The module must support:
- An in-app notification inbox and unread count.
- Remote push notifications when the app is backgrounded or closed, subject to device and OS delivery behavior.
- Contextual in-app alerts for events occurring while the app is open.
- Scheduled reminders for upcoming and overdue obligations.
- Action-required notifications with secure navigation to the relevant module.
- Per-category preferences, quiet hours, device registration, and notification permission management.
- Cross-device read state, deduplication, cancellation, and reliable backend event processing.
- Clear distinction between informational, reminder, action-required, and security notifications.
Notifications must not silently create, settle, or modify financial records. The originating module's backend remains authoritative for all financial actions.
2. Actors, Channels, and Terminology
Term	Meaning
Recipient	Authenticated user who is authorized to receive a notification.
Domain event	A confirmed business event emitted by an originating module after its database transaction commits.
In-app notification	Persisted notification shown in the Expensio notification inbox.
Push notification	Best-effort remote alert delivered through the mobile operating system.
Local notification	Device-scheduled alert; optional and limited to safe, non-authoritative reminders.
Action-required notification	Alert linking to a workflow where the user can review and perform an authorized action.
Delivery attempt	A recorded attempt to send a notification through a channel.
Reminder occurrence	A specific scheduled reminder tied to a source record and trigger time.


The initial delivery channels are in-app and mobile push. Email and SMS are out of scope unless explicitly added later. Transactional security alerts may follow separate mandatory-delivery rules where legally and operationally appropriate.
3. Cross-Module Notification Matrix
The following are product requirements, not claims that these events already exist in the current implementation. Every event must have an explicit source, recipient, trigger, cancellation condition, and navigation target before release.
Module	Trigger / notification	Recipient	Timing and cancellation rules
EMIs	Upcoming installment due	EMI owner	Configurable advance reminders; cancel or reschedule after due-date edits, completion, deletion, or payment.
EMIs	Installment due today or overdue	EMI owner	Do not alert as unpaid after payment is recorded; overdue requires a defined grace-day policy.
EMIs	Payment recorded, corrected, or reversed	EMI owner	Confirm persisted outcome; suppress duplicate alerts from retries.
Goals	Upcoming scheduled savings contribution	Goal owner	Based on goal installment due date and status; skip paid/skipped/completed installments.
Goals	Contribution added, adjusted, or removed	Goal owner	Show updated state only after committed funding change.
Goals	Target reached / target date approaching	Goal owner	Emit completion once per transition; avoid repeat notifications on recalculation.
Ledger	Optional repayment reminder	Ledger owner	Reminder applies to an explicitly stored due date or user-created reminder; never infer one from entry date.
Ledger	Ledger entry settled or reopened	Ledger owner	Inform after balance changes; no automatic notification to free-text counterparties.
Splits	Added to a shared expense / group	Authorized participant	Notify only registered, eligible participants with access to the record.
Splits	Settlement confirmation requested	Creditor	Action-required; withdraw or update after confirmation, dispute, or cancellation.
Splits	Settlement confirmed, disputed, or cancelled	Relevant debtor and creditor	Notify impacted registered users, not guest contacts without explicit consent.
Splits	Group invitation / membership change	Relevant registered user	Only if invitation/membership functionality exists; do not invent acceptance states.
Expenses	Optional recurring expense reminder or unusual expense alert	Expense owner	Requires explicit recurrence/threshold rules; avoid alerting for every routine expense by default.
Budgets	Budget threshold reached / exceeded	Budget owner	Configurable thresholds; notify once per threshold crossing per budget period, with re-arm rules.
Accounts	Low-balance threshold or account reconciliation issue	Account owner	Only where balances are tracked and reliable; user-configured threshold.
Dashboard	Consolidated upcoming obligations	Owner	Derived summary only; must not independently generate duplicate underlying alerts.
Authentication / Security	New device sign-in, credential change, suspicious session, account security event	Affected user	High-priority and privacy-safe; governed by security policies and verified event sources.
System	Important maintenance or required account action	Affected users	Only targeted, relevant notices; no promotional messages without separate opt-in.


Cross-module exclusions: Goal installments are savings schedules and must not be treated as loan EMIs. Ledger IOUs must not be treated as actual account transfers. Split settlement requests must not be marked settled merely because a notification was opened. Notification events must not create duplicate expense, account, or funding entries.
4. Notification Center — Native Mobile Frontend
4.1 Entry Points and Overview
- Provide a notification bell in the appropriate app navigation/header with a visible unread badge.
- Open a dedicated Notifications screen using native navigation; support opening it from push taps.
- Display newest notifications first with pagination and pull-to-refresh.
- Distinguish unread/read, action-required, informational, and expired notifications through accessible visual treatment.
- Each item displays concise title, body, module/category icon, relative or localized timestamp, and action state where applicable.
- Provide All and Unread filters; an Action Required filter may be added if enough such events exist.
- Provide mark-as-read, mark-all-as-read, and dismiss/delete actions with confirmation where appropriate.
- Show empty, loading, offline, permission-denied, retry, and error states.
- Persist in-app notification history independently of whether push delivery succeeded.
4.2 Notification Details and Actions
- Tapping a notification opens its authorized destination (e.g., EMI detail, goal detail, ledger entry, split settlement).
- If a record was deleted, archived, settled, or access was revoked, show a safe fallback explanation rather than a broken screen.
- Opening a notification may mark it read but must never automatically execute a financial action.
- For confirmation/dispute/payment actions, navigate to the module's review screen and require its normal authorization and confirmation flow.
- Show the current server state, not stale values embedded in the notification text.
- Preserve correct navigation after cold start, login, token refresh, or app restoration.
- Reject external or arbitrary URLs from notification payloads; use allowlisted internal route identifiers and typed parameters.
4.3 Permission and Device UX
- Explain the benefit of push notifications before requesting OS permission at a contextually appropriate moment.
- Respect Android notification channels and Android 13+ runtime permission behavior; support iOS authorization states.
- If permission is denied, preserve the in-app inbox and provide a link to OS app settings where supported.
- Provide a Settings > Notifications screen with category controls, reminder lead times, quiet hours, and push enablement state.
- Keep user preferences synchronized across devices; store device-specific permission/token status separately.
- Ensure notification taps, banners, foreground presentation, badge counts, and background transitions behave consistently across supported app states.
4.4 Accessibility and Localization
- Support screen readers, dynamic text sizing, accessible touch targets, and non-color-only unread indicators.
- Format currency and dates for the user's locale; use the user's configured timezone for calendar reminders.
- Avoid sensitive financial amounts or names on lock screens when privacy mode is enabled; use generic push copy while retaining full authorized in-app details.
- Avoid exposing confidential details in notification previews, logs, analytics, or crash reports.
5. Notification Preferences and Reminder Policies
- Preferences must be maintained per authenticated user and category, with separate push and in-app controls where product policy permits.
- Default to essential in-app operational notifications; request permission before push delivery. Promotional push must be opt-in.
- Support configurable advance reminder windows (e.g., 1, 3, or 5 days) and due-day reminders for applicable modules.
- Support quiet hours in a named IANA timezone. Define how daylight saving changes and timezone travel are handled.
- Quiet hours defer non-urgent push; they do not suppress persisted in-app notifications. Security-critical delivery follows a documented exception policy.
- Users must be able to mute a category or a specific reminder without disabling unrelated security alerts.
- Reminder schedules must be updated after create/edit/delete, completion, payment, skip, settlement, and rescheduling events.
- Due dates on the 29th–31st must follow the originating module's agreed month-end clamping policy.
- Do not send an overdue reminder without an explicit due date and a backend-verified outstanding status.
- A reminder may be skipped if a payment is recorded before send time, even when the reminder was previously queued.
- Provide reasonable frequency caps and aggregation to prevent excessive alerts.
6. Push Payloads and Navigation Contract
Use a minimal payload containing a notification ID, allowlisted route key, source reference, and non-sensitive presentation text. Fetch fresh, authorized details from the API when opened. Do not put access tokens, full financial records, phone numbers, or sensitive personal data in push payloads.

Allowlisted route keys may include emi_detail, goal_detail, ledger_detail, split_expense_detail, split_settlement_detail, budget_detail, account_detail, and notification_inbox. Routes must be updated alongside module navigation changes. Unsupported or inaccessible targets fall back to the inbox with an explanation.

A push tap while logged out must first complete authentication and then resume the pending navigation only after access checks. A notification from one account must never open another account's data after account switching.
7. Native App Lifecycle, Offline, and Synchronization
- Handle foreground, background, terminated, cold-start, and resumed app states without double navigation.
- On foreground/resume, reconcile unread count and recent notifications with the backend.
- Show cached inbox content offline if securely available; clearly indicate stale state.
- Queue only safe, idempotent read/dismiss actions for later synchronization; do not queue financial confirmation actions through Notifications.
- Clear account-scoped caches, badges, and pending deep links on logout or account switch.
- Synchronize read/dismiss state across devices through backend persistence; use push/data messages or foreground refresh as hints, not sole truth.
- Respect OS background restrictions, battery optimization, and disabled notification permissions; do not promise exact push arrival times.
- Prevent duplicated banners when a foreground push and in-app event represent the same notification ID.
- Reconcile scheduled local notifications with server state if local scheduling is used; prefer backend-driven remote reminders for multi-device consistency.
8. Security, Privacy, and Abuse Prevention
- Require JWT authentication and enforce recipient ownership for every inbox, preference, device, and reminder operation.
- Verify authorization for referenced source records at notification creation and again when navigating to the source.
- Prevent one user's device token from being used to send another user's private alerts.
- Secure provider credentials server-side, rotate them, and protect push tokens in storage and logs.
- Apply rate limits, payload size limits, input validation, and server-side template escaping.
- Do not expose private information to guest contacts or arbitrary free-text Ledger counterparties.
- Provide user control over previews, categories, and device revocation.
- Define retention periods for inbox, outbox, delivery logs, and device records, plus account-deletion behavior.
- Security notifications must be generated from trusted authentication events and must not leak suspicious-activity details in lock-screen text.
- Enforce notification audience and consent rules before any future email/SMS or marketing channels are introduced.
9. Notification Lifecycle and Data Flows
14.1 Business Event
Module transaction commits → transactional outbox → notification consumer → recipient and preference evaluation → persisted inbox row → optional push delivery → mobile inbox/deep link
14.2 Scheduled Reminder
Module creates/changes due date → reminder schedule upsert → scheduler claims due occurrence → verifies current obligation and user preferences → creates deduplicated notification → sends eligible push → marks outcome
14.3 Read and Action
User opens inbox/push → authenticated notification fetch → mark read → resolve allowlisted destination → re-fetch current module state → user reviews and confirms action in originating module
14.4 Cancellation
Payment/skip/settlement/edit/delete commits → domain event → cancel or reschedule pending reminder occurrences → stale push action falls back to current source state
10. Required Tests and Acceptance Criteria
The Notifications module is complete when:
1. An authenticated user can view only their notifications, preferences, devices, and schedules.
2. Unread counts, mark-read, and mark-all-read remain correct across app restarts and multiple devices.
3. An EMI reminder is scheduled for a valid due date and cancelled after payment, completion, or deletion.
4. Goal installment reminders stop when an installment is paid or skipped and reschedule after Extend/Adjust changes.
5. A Split settlement request notifies only the authorized creditor; confirmation/dispute/cancellation removes stale action-required state.
6. Ledger reminders require an explicit due date or configured reminder; free-text counterparties never receive automatic alerts.
7. Budget threshold alerts do not repeat on every refresh while the same threshold remains crossed.
8. Replayed events and retried API calls do not duplicate inbox notifications or scheduled occurrences.
9. Two backend workers cannot claim the same reminder occurrence for independent delivery simultaneously.
10. Push failure does not roll back the underlying financial operation, and the in-app record remains accessible.
11. Permission denial does not disable the in-app inbox.
12. Push taps work from foreground, background, and terminated app states, with authentication and authorization checks.
13. Deleted, settled, archived, or inaccessible destinations fail safely and do not perform stale actions.
14. Logout/account switching revokes or rebinds device registrations and clears account-specific local state.
15. Quiet hours, timezone changes, month-end due dates, and daylight-saving transitions are tested.
16. Financial amounts and sensitive details are hidden in lock-screen previews when privacy mode is enabled.
17. Reminder rescheduling and cancellation remain correct after concurrent updates and retries.
18. High-volume delivery uses pagination, batching, backoff, rate limits, and operational monitoring.
19. All database constraints, migrations, ownership checks, and idempotency guarantees have automated tests.
20. No notification event changes financial balances, creates an expense, or completes a settlement on its own.
11. Product Decisions and Implementation Boundaries
Before implementation, confirm: the default reminder lead times; whether overdue reminders are enabled; quiet-hours defaults; exact budget thresholds; whether Ledger gains optional due dates; whether local notifications are needed; the push provider and mobile framework integration; notification retention; security-alert override policy; and which non-critical categories are enabled by default.

The recommended initial release includes the in-app inbox, push registration, user preferences, EMI/Goal due reminders, Split action-required events, secure deep linking, idempotent event processing, and reliable cancellation. Ledger due reminders and advanced budget/account alerts should launch only when their source modules provide the required authoritative data and trigger rules.

Implementation boundary: This document defines the desired cross-module production behavior. It does not assert that the current web application or Spring Boot backend already implements these features. Each module integration requires explicit event contracts and integration tests.
Frontend-Specific Implementation Checklist
- Use native navigation and lifecycle-safe push handling; do not copy Angular signal or Supabase client patterns into the mobile app.
- The mobile client calls authenticated Spring Boot notification APIs. It never schedules authoritative server reminders or decides recipient eligibility.
- Register, rotate, and unregister push tokens safely across login, logout, token refresh, reinstall, and account switching.
- Treat push payloads as navigation hints only. Fetch fresh notification and destination data from the backend before displaying sensitive details or actions.
- Use secure device storage for authentication material; cache inbox data per account and wipe it on logout.
- Show pending/retry UI for read-state mutations; reconcile after reconnect and handle duplicate delivery without duplicate visible items.
- Test foreground, background, killed-app, permission-denied, timezone changes, OS settings, and inaccessible destinations on Android and iOS.
Frontend Acceptance Criteria
1. Inbox, unread badge, preferences, and read state are consistent after reload and across devices.
2. Push is optional and permission denial does not block in-app notifications.
3. Every deep link is authenticated, allowlisted, and safe when its source record has changed.
4. Financial actions always require the originating module's review and confirmation flow.
5. Account switching never leaks another account's cached notification content.
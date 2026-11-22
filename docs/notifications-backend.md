Notifications Module
Backend Development Requirements
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
4. Notification Preferences and Reminder Policies
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
5. Backend Architecture and Responsibilities
The Spring Boot backend is the authoritative producer and scheduler of notification events. PostgreSQL stores notification records, preferences, device registrations, scheduled occurrences, and delivery state. A push gateway integrates with Firebase Cloud Messaging (FCM) and, for iOS, the appropriate Apple push delivery path through the selected provider. Provider choice and credentials are deployment configuration, not mobile-client secrets.

Recommended backend components:
Component	Responsibility
NotificationController	Authenticated inbox, read/dismiss, preference, and device-token endpoints.
NotificationService	Recipient validation, template rendering, persistence, and deduplication.
NotificationEventConsumer	Processes committed domain events from the outbox/queue.
ReminderScheduler	Creates, updates, cancels, and claims due reminder occurrences.
PushDeliveryService	Provider integration, retries, invalid-token cleanup, and safe payload construction.
NotificationPreferenceService	Effective channel/category/quiet-hour decisions.
NotificationRepository	Ownership-scoped persistence and paginated queries.
Module event publishers	Emit durable, typed events from EMIs, Goals, Ledger, Splits, Budgets, etc.


No module should directly call FCM or duplicate scheduling logic. Modules emit business events; Notifications determines recipients, preferences, persistence, and delivery.
6. PostgreSQL Data Requirements
7.1 notifications
Maintain: id UUID; recipient_user_id UUID; event_type; category; title; body; source_module; source_entity_type; source_entity_id (nullable for system events); route_key; typed route_params; priority; action_required; read_at; dismissed_at; created_at; expires_at (nullable); dedupe_key (unique within recipient); and optional event_id.

Store only the minimum content required. A notification may remain in history after its source record is deleted, but its action must become unavailable. Retention and user deletion policies must be explicit.
7.2 notification_preferences
Maintain: user_id, category, in_app_enabled, push_enabled, reminder_lead_times, quiet_hours_start, quiet_hours_end, timezone, lock_screen_privacy, and updated_at. Use unique (user_id, category) and defined defaults for missing rows. Security-notification overrides must be documented.
7.3 notification_devices
Maintain: id, user_id, installation_id, platform, push_token (encrypted or otherwise protected at rest), provider, permission_status, last_seen_at, revoked_at, created_at, and updated_at. One user can have multiple devices; an installation must not remain associated with a prior user after logout/account switching. Token rotation and invalidation must be supported.
7.4 notification_schedules
Maintain: id, recipient_user_id, source_module, source_entity_id, reminder_type, scheduled_for UTC, source_due_date, timezone, status (scheduled, claimed, sent, cancelled, skipped, failed), occurrence_key, attempt_count, created_at, and updated_at. Enforce a unique occurrence key and indexed due-time/status queries.
7.5 notification_deliveries and event_outbox
Delivery attempts track notification_id, device_id, channel, provider_message_id (nullable), status, attempt_count, next_retry_at, last_error_code (sanitized), and timestamps. A transactional outbox stores durable domain event IDs, event types, source references, timestamps, and processing status. Do not log provider credentials, tokens, or sensitive payload contents.

Use proper foreign keys and indexes on recipient, unread status, creation time, schedule due time, and delivery retry state. Use version-controlled migrations, not implicit schema creation.
7. Domain Events, Consistency, and Idempotency
- Emit events only after the originating financial change is committed, using a transactional outbox or equivalent durable pattern.
- Every event has a stable event ID, source ID, event type, occurred-at timestamp, and relevant recipient context.
- Event handlers must be idempotent; retries cannot create duplicate inbox rows or duplicate reminders.
- Revalidate source status and recipient authorization before generating action-required or time-sensitive reminders.
- Use database locking/claiming or an equivalent distributed coordination strategy so multiple backend instances cannot send the same occurrence concurrently.
- Notification creation and push delivery are distinct states. A push accepted by FCM/APNs is not proof the device displayed it.
- Use bounded retries with exponential backoff for transient failures, dead-letter/inspection for persistent failures, and invalid-token deactivation.
- Avoid exactly-once delivery claims; guarantee idempotent processing and best-effort external push delivery.
- On edits, cancellations, settlement, or deletion, invalidate future reminders and stale action state.
- Use server time and UTC timestamps for scheduling; calculate user-local dates using explicit timezone rules.
8. Required Backend API Operations
Suggested authenticated REST interface (exact routes may be aligned to the existing API conventions):
Method	Route	Purpose
GET	/api/notifications	Cursor-paginated inbox with optional category/read filters.
GET	/api/notifications/unread-count	Current unread count.
PATCH	/api/notifications/{id}/read	Mark owned notification read, idempotently.
POST	/api/notifications/read-all	Mark all eligible owned notifications read.
DELETE	/api/notifications/{id}	Dismiss/remove from inbox per retention policy.
GET	/api/notifications/preferences	Retrieve effective user preferences.
PUT	/api/notifications/preferences	Validate and update preferences.
POST	/api/notifications/devices	Register or rotate current installation push token.
DELETE	/api/notifications/devices/{id}	Revoke owned installation registration.
GET	/api/notifications/reminders	Retrieve configured/scheduled reminders where exposed in UX.
PATCH	/api/notifications/reminders/{id}	Mute or adjust eligible reminder preferences, if supported.


All endpoints derive the authenticated user from JWT/Spring Security; never trust a client-supplied user_id. Use consistent pagination, validation, response codes, and structured errors. Internal event ingestion and scheduler operations must not be publicly accessible.
9. Push Payloads and Navigation Contract
Use a minimal payload containing a notification ID, allowlisted route key, source reference, and non-sensitive presentation text. Fetch fresh, authorized details from the API when opened. Do not put access tokens, full financial records, phone numbers, or sensitive personal data in push payloads.

Allowlisted route keys may include emi_detail, goal_detail, ledger_detail, split_expense_detail, split_settlement_detail, budget_detail, account_detail, and notification_inbox. Routes must be updated alongside module navigation changes. Unsupported or inaccessible targets fall back to the inbox with an explanation.

A push tap while logged out must first complete authentication and then resume the pending navigation only after access checks. A notification from one account must never open another account's data after account switching.
10. Security, Privacy, and Abuse Prevention
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
11. Error Handling, Observability, and Operational Controls
- Show useful errors for permission denial, token registration failure, unavailable destination, network timeout, and failed inbox operations.
- Record event-processing latency, queue backlog, push acceptance/error rates, invalid-token rate, scheduler lag, and notification dedupe counts.
- Use correlation IDs across source transaction, outbox event, notification row, and delivery attempt.
- Support administrative replay of failed events without duplicate side effects.
- Ensure provider outages do not block EMI payments, goal funding, split settlements, or any core financial transaction.
- Use environment-specific provider credentials and sandbox/test device tokens.
- Document alerting thresholds, cleanup jobs, retention jobs, and recovery procedures.
12. Notification Lifecycle and Data Flows
14.1 Business Event
Module transaction commits → transactional outbox → notification consumer → recipient and preference evaluation → persisted inbox row → optional push delivery → mobile inbox/deep link
14.2 Scheduled Reminder
Module creates/changes due date → reminder schedule upsert → scheduler claims due occurrence → verifies current obligation and user preferences → creates deduplicated notification → sends eligible push → marks outcome
14.3 Read and Action
User opens inbox/push → authenticated notification fetch → mark read → resolve allowlisted destination → re-fetch current module state → user reviews and confirms action in originating module
14.4 Cancellation
Payment/skip/settlement/edit/delete commits → domain event → cancel or reschedule pending reminder occurrences → stale push action falls back to current source state
13. Required Tests and Acceptance Criteria
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
14. Product Decisions and Implementation Boundaries
Before implementation, confirm: the default reminder lead times; whether overdue reminders are enabled; quiet-hours defaults; exact budget thresholds; whether Ledger gains optional due dates; whether local notifications are needed; the push provider and mobile framework integration; notification retention; security-alert override policy; and which non-critical categories are enabled by default.

The recommended initial release includes the in-app inbox, push registration, user preferences, EMI/Goal due reminders, Split action-required events, secure deep linking, idempotent event processing, and reliable cancellation. Ledger due reminders and advanced budget/account alerts should launch only when their source modules provide the required authoritative data and trigger rules.

Implementation boundary: This document defines the desired cross-module production behavior. It does not assert that the current web application or Spring Boot backend already implements these features. Each module integration requires explicit event contracts and integration tests.
Backend-Specific Implementation Checklist
- Implement notification endpoints and services in Spring Boot; use PostgreSQL migrations and indexes for notification, preference, device, event, delivery, and reminder records.
- Domain modules publish events only after successful business commits, preferably through a transactional outbox.
- Enforce recipient authorization at event generation and notification retrieval; never trust user IDs or navigation targets supplied by clients.
- Use stable event IDs, idempotency keys, unique constraints, and transaction-safe worker claims to prevent duplicates.
- Reschedule or cancel reminders atomically when the source obligation changes, settles, is skipped, or is deleted.
- Separate persistent inbox creation from best-effort push delivery; use retry with backoff and dead-letter handling for permanent failures.
- Never let push-provider failures roll back financial writes. Protect push tokens and minimize sensitive payloads and logs.
- Keep goal savings installments distinct from loan EMIs; never treat Ledger IOUs as account transfers or notification opens as settlement confirmation.
Backend Acceptance Criteria
1. Every API and scheduled job enforces ownership, privacy, and correct recipient selection.
2. Replayed domain events, duplicate callbacks, and parallel workers have exactly-once observable inbox effects through idempotency.
3. Reminder edits, cancellations, and timezone changes yield no stale active reminder.
4. Push failures are observable and retryable without duplicating financial effects.
5. Cross-module integration tests cover EMI, Goals, Ledger, Splits, Budgets, Accounts, Expenses, and security events where source support exists.
6. All database migrations, constraints, worker concurrency behavior, and retention policies are tested.
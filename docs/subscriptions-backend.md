Subscriptions Module (Backend)
1. Purpose and scope
Define the Spring Boot / PostgreSQL implementation for recurring subscription plans and user-confirmed monthly payments. Recording a payment creates a linked expense; no actual merchant charge, card debit, or automatic collection occurs. This document migrates the uploaded Angular/Supabase contract to Expensio's Java backend and distinguishes recommended improvements from source behavior.
2. Domain and business rules
Concept	Rule
Plan	User-owned title, expected amount, category, optional icon, billing day 1–31.
Paid month	A month with one successful recorded subscription-linked expense/payment.
Upcoming month	No successful recorded payment for that plan/month.
Billing date	min(billing_day, length_of_month) in the user's configured billing timezone.
Monthly total	Sum of active plan amounts, regardless of payment status.
Payment record	User-confirmed expense, not proof of merchant settlement.


Preserve the source's This Month and Next Month preview semantics. Use a payment ledger as authority for historical status; a last_paid_month field, if retained, is only a synchronized denormalized cache and cannot represent arbitrary historical corrections.
3. Proposed PostgreSQL data model
3.1 subscriptions
Field	Type / constraint
id	UUID PK
user_id	UUID NOT NULL FK to application users, indexed
title	VARCHAR(160) NOT NULL; trimmed, nonblank
amount_minor	BIGINT NOT NULL CHECK >= 100 (INR paise, ₹1 minimum)
currency	CHAR(3) NOT NULL DEFAULT 'INR'
category	VARCHAR(100) NOT NULL DEFAULT 'Others'
icon	VARCHAR(100) NULL
billing_day	SMALLINT NOT NULL CHECK between 1 and 31
billing_timezone	VARCHAR(64) NOT NULL; valid IANA timezone
last_paid_month	CHAR(7) NULL, optional cache of YYYY-MM
created_at	TIMESTAMPTZ NOT NULL, immutable
updated_at	TIMESTAMPTZ NOT NULL, server-maintained
deleted_at	TIMESTAMPTZ NULL, recommended soft deletion for history


The original schema used amount and lacked a reliable updated_at. amount_minor, timezone and soft deletion are recommended schema changes, requiring migration and mapping to existing Expenses conventions.
3.2 Payments and linked expenses
Keep Expenses as the financial source of truth, as in the supplied requirements. Recommended fields on expenses: subscription_id nullable FK, subscription_billing_month CHAR(7) nullable, user_id, title, amount, category, timestamp, and selected account/method. Prefer ON DELETE RESTRICT with soft-deleted plans so history retains the plan identity. Add a unique partial index on (subscription_id, subscription_billing_month) where subscription_id is not null if each plan may have exactly one recorded payment per month. Ensure non-subscription expenses have null billing month and that user ownership matches the plan.

If the existing Expenses schema cannot support an explicit month or reversible payments, introduce a subscription_payments table with subscription_id, billing_month, expense_id UNIQUE, status, and unique (subscription_id, billing_month) for active payments; document cancellation semantics before implementation. Do not implement both designs as competing payment authorities.
4. Proposed REST contract
All routes require the authenticated user; derive ownership from JWT principal, never from a trusted request-body userId.
Method	Endpoint	Behavior
GET	/api/subscriptions	Return owned active plans with current-month status and effective due dates.
POST	/api/subscriptions	Create plan; 201.
GET	/api/subscriptions/{id}	Owned plan detail; 404 for nonexistent/foreign.
PATCH	/api/subscriptions/{id}	Edit mutable fields; never created_at or payment status.
DELETE	/api/subscriptions/{id}	Soft-delete plan; retain linked expenses.
POST	/api/subscriptions/{id}/payments	Atomically record payment for explicit billing month; return linked expense and plan status.
GET	/api/subscriptions/{id}/payments	Paginated historical payments.


Sample mark-paid request: {"billingMonth":"2026-11","accountId":"<uuid-or-null>","paymentMethod":"UPI"} with Idempotency-Key: <client-generated-uuid>; adapt account fields to the real Accounts/Expenses model. Return 409 ALREADY_PAID with existing payment reference, or 200 for replay of the same idempotent request; document and consistently implement one convention. Use 400/422 for invalid inputs and 401 for missing/invalid authentication.
5. Atomic mark-paid transaction
1. Authenticate caller and validate billingMonth (ISO YYYY-MM) and account/method policy.
2. Begin transaction; lock owned subscription row (SELECT ... FOR UPDATE) or use equivalent concurrency control.
3. Reject soft-deleted plans; check requested month policy (default: current month only unless historical recording is explicitly enabled).
4. Check unique idempotency key scoped to user + operation, returning stored response for retries.
5. Verify no successful payment already exists for (subscription_id, billing_month); enforce with DB uniqueness even if application checks race.
6. Create linked expense with plan title, amount, category plus  (Subscription) for compatibility, timestamp and subscription_id; use the standard Expenses service/domain logic inside the same transaction for account/budget side effects.
7. Persist payment-month association and update last_paid_month cache only if using one; commit all changes together.
8. Publish an outbox event after commit for cache invalidation/push. Never treat a message delivery as part of the financial commit.
If any write fails, roll back expense, payment marker, and account effects. No client-side two-request workflow and no reliance on an untracked Supabase trigger. Idempotency records must store request hash and result, reject same-key/different-payload reuse, and have a documented retention period.
6. Update, delete, and correction policy
- Editing a plan affects future payments only. Already-recorded expenses retain their historical title, amount, category and payment date snapshots.
- Deleting a plan soft-deletes it, hides it from active monthly totals and future reminders, but preserves payment expenses and reports. This is a recommended policy resolving a gap in the source.
- Correcting/deleting a linked expense must reconcile the payment-month state in one transaction. Recommended: provide a dedicated void/correct payment operation with audit trail; prevent generic Expenses deletion from silently leaving Paid state stale.
- Historical backfill and partial refunds are out of source scope; explicitly define before adding them. Do not treat a refund as a second monthly payment.
- A last-paid-month cache must be recomputed from non-voided records after any correction; historical month state is derived from the ledger.
7. Validation and security
- Validate trimmed title, amount >= ₹1, day 1–31, supported category/icon and currency; reject NaN/overflow and unexpected mutable audit fields.
- Enforce plan and expense ownership at repository/query and service levels. A user's account ID must also belong to that user.
- Use parameterized queries/JPA, transaction boundaries, optimistic versioning or row locks, and consistent error responses.
- JWT authorization is provided by the existing Spring Security infrastructure; Supabase RLS from the original implementation does not substitute for Spring Boot authorization.
- Use migration-managed constraints, indexes and foreign keys. Keep all SQL in version-controlled Flyway migrations.
- Rate-limit sensitive mutation endpoints; audit payment creation, correction, and deletion without logging secrets or financial payloads unnecessarily.
8. Services and responsibilities
Component	Responsibility
SubscriptionController	Request validation and HTTP contract.
SubscriptionService	Owned CRUD, monthly totals, due-date calculations.
SubscriptionPaymentService	Transactional mark-paid, idempotency and correction.
SubscriptionRepository	Owned plan queries and locking.
ExpenseService	Persist linked expense and standard financial side effects within transaction.
AccountService	Verify account ownership and adjust tracked balances when applicable.
SubscriptionMapper	API DTOs, category/icon mapping, minor-unit money.
Clock / timezone helper	Testable month and due-date resolution.


Use existing Expensio package conventions rather than treating these class names as preexisting code.
9. Cross-module dependencies
Module	Contract
Expenses	Required: subscription payment is linked expense; atomic write.
Budgets	Linked expense participates in category spend according to normal budget rules.
Reports	Classify by subscription_id IS NOT NULL, regardless of category rename.
Dashboard	Share effective due date and call same mark-paid endpoint.
Accounts Tracker	Explicit payment account/method and same-transaction balance effects.
Navigation	Mobile UI owns routing and add action.
Goals, EMIs, Friends, Splits, Ledger	No direct dependency specified by source.


10. Test plan and acceptance criteria
1. Owner can CRUD their plans; another user cannot read, mutate or pay them.
2. Valid ₹499/day-15 plan creates Upcoming; invalid amounts/days/titles are rejected.
3. Monthly total includes paid and upcoming active plans.
4. Day-31 billing clamps in February, including leap years, with same results on Dashboard.
5. First confirmed payment creates exactly one expense and Paid state for that month.
6. Concurrent requests from two devices yield one payment; database uniqueness is tested under race.
7. Same idempotency key replay does not create another expense; different payload with same key is rejected.
8. Expense insert or account update failure rolls back all related state.
9. Month rollover changes current-month state without changing historical payments.
10. Plan edit leaves historical expense snapshots unchanged; deletion retains historical reporting.
11. Correction/void reconciles paid state and last-paid cache, if present.
12. Timezone changes, leap years, DST boundaries and stale client clocks are tested.
11. Migration from source implementation
- Source Supabase subscriptions row: id, user_id, title, amount, category, icon, billing_day, last_paid_month, created_at; updated_at absent from base schema.
- Source expense linkage: subscription_id on Expenses, with category text suffixed (Subscription).
- Source UI depended on missing tracked trigger trg_sync_subscription_status; replace with a version-controlled Spring Boot transactional workflow and DB constraints.
- Source RLS and realtime: replace with JWT ownership checks, server-side transaction, query invalidation and optional authenticated event delivery.
- During migration, reconcile existing linked expenses against last_paid_month; detect duplicate historical payments and orphan references before adding uniqueness/FKs. Do not infer paid history solely from one last-paid marker.
12. Open decisions and implementation status
Decisions to confirm: billing timezone default (e.g. user profile timezone), whether backdated payments are allowed, expense correction policy, account selection requirements, soft deletion and archival retention, and whether payment-month uniqueness lives directly on Expenses or in a dedicated payment ledger.

This document is a proposed implementation specification, not confirmation that Spring Boot controllers, PostgreSQL migrations, triggers, or tests currently exist.
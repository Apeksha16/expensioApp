Goals Module
Backend Development Requirements
1. Module Overview
The Spring Boot/PostgreSQL backend must manage savings goals, recurring contribution schedules (goal_emis in the legacy model), funding allocations, goal balances, corrections, and audit history. Goal installments are not the loan EMI module. This is a target implementation specification: the source describes Supabase client-side operations and an assumed database trigger, not verified existing Spring Boot endpoints.

The backend must be the sole authority for ownership, schedule calculations, financial limits, and transactional state changes.
2. Goal Management
2.1 Goal Record
Maintain: UUID ID, owner user ID, name, icon, target amount, saved amount (derived or materialized), target date, frequency (monthly, alternate/every two months, quarterly), installment day, calculated suggested installment, status (active, completed, archived), schedule timezone, version, and created/updated timestamps.
- Use NUMERIC(18,2) or integer paise for money; never binary floating point.
- Store date-only values as SQL DATE and event timestamps as timezone-aware instants.
- Enforce positive target, valid frequency, day 1–31, and owner-scoped access.
- Treat saved amount as a derived balance from confirmed funding, not a freely editable client field.
2.2 Create and Edit
- Create the goal and any opening funding record atomically; reject opening funding outside 0..target.
- Generate the initial eligible installment schedule in the same transaction.
- On target, date, frequency, or day change, recalculate only eligible future unpaid installments while preserving historical paid/skipped installments.
- Reject target reductions below net confirmed funding unless accompanied by a valid withdrawal/reversal workflow.
- Use optimistic versioning or row locks for conflicting edits.
- Goal renames must not alter transaction identity; use goal_id foreign keys.
3. Installment Schedule
3.1 Installment Record
Maintain: UUID ID, goal ID, expected amount, due date, status (pending, partially_paid, paid, skipped), paid amount (derived/materialized), schedule revision, created/updated timestamps, and optional skip metadata.
- Constrain expected amount to nonnegative paise and unique schedule position within a revision.
- A skipped installment remains in history but is excluded from actionable dues.
- Status must be recomputed from valid funding allocations and explicit skip state, not trusted from client input.
3.2 Calculation Rules
- Remaining target = max(0, target − net confirmed funding).
- Generate due dates at the configured cadence, on or before the target date; clamp 29th–31st to month-end.
- Use a documented timezone and explicit overdue handling.
- Divide remaining paise among remaining eligible due dates; allocate rounding remainder deterministically to the final installment.
- If no eligible due date remains while funds are outstanding, return a rescheduling-required state rather than a fabricated installment.
- Preserve the legacy formula as a migration/reference behavior only: max(1, floor(months_remaining / frequency_divisor)); new mobile planning must use actual scheduled due dates.
3.3 Skip Operations
- Extend: mark eligible unpaid installment skipped, extend target by one cadence interval, regenerate remaining unpaid installments.
- Adjust: mark installment skipped, retain target date, redistribute remaining unpaid amount over remaining eligible installments.
- Reject skipping already paid installments and reject Adjust when no valid future installment can cover the balance.
- Perform status change, target adjustment, and schedule regeneration in one database transaction.
4. Funding and Ledger Model
4.1 Funding Record
Use a normalized immutable/auditable goal funding ledger with: ID, goal ID, optional goal installment ID, owner ID, amount, funding date/time, type (opening, contribution, reversal, withdrawal where enabled), optional expense/account transaction reference, idempotency key, created-by, and created timestamp.
- Preserve legacy expenses.category = virtual-invest, goal_id, and optional goal_emi_id through an explicit migration or adapter.
- Do not infer ownership or association from expense titles (Goal: name); migrate historical title-matched rows to real IDs only after verification.
- Do not double-count a goal funding record and its linked expense/account movement.
- Funding represents an allocation; it does not automatically initiate a UPI/bank payment.
4.2 Funding Validation
- Positive contributions only; amount must not exceed goal remaining target.
- Installment-scoped contributions must not exceed that installment's unpaid expected amount.
- Require goal and installment to belong to the authenticated user and to each other.
- Determine how unallocated custom funding affects future installments; recalculate future unpaid schedule without rewriting historical payments.
- Require unique idempotency keys per owner/action and reject duplicate processing safely.
4.3 Atomic Funding Operations
- In one transaction: lock goal and relevant installment, validate balances, write funding/ledger linkage, recalculate net saved and installment paid amounts, update schedule/status, commit.
- Concurrent funding from two devices must never overfund the goal or installment.
- Editing a historical contribution must be a versioned correction or reversal/replacement, with audit metadata and recomputation.
- Deleting an expense linked to goal funding must use a controlled reversal flow; never leave saved amount out of sync.
5. Balance and Status Consistency
- Net saved amount = opening contributions + valid contributions − confirmed reversals/withdrawals, according to the defined ledger policy.
- Goal completed iff net saved >= target; no negative saved amounts or unintended overfunding.
- Installment paid amount = sum of confirmed allocations to that installment, net of corrections.
- pending = zero paid; partially_paid = between zero and expected; paid = fully covered; skipped = explicit skip with no payment.
- Recompute all affected aggregates on insert, correction, reversal, and migration.
- Use transactional service logic or database triggers as one clear authority, not competing mechanisms that each apply the same effect.
6. Account, Expense, Dashboard, and Reports Integration
- Choose and document one canonical ledger design: a goal allocation may be linked to an expense-like virtual-invest record or an account transfer, but it must not be posted twice.
- If an account is selected, create the linked account movement atomically or through a reliable outbox workflow with idempotent consumers.
- If no account is selected, record a tracking-only allocation and do not claim an actual cash movement.
- Define reporting classification so goal allocations are not counted as consumption expenses by default.
- Dashboard upcoming payments must query eligible installments and exclude skipped/paid ones; overdue entries remain distinguishable.
- The general EMI module must not read or mutate goal installment rows.
7. Goal Archive and Deletion
- Support archive/restore without deleting funding history.
- For funded goals, prefer archive over hard deletion; retain records as required by the application's financial retention policy.
- Permit hard deletion only where policy allows and no linked financial record would be lost or orphaned.
- Never cascade-delete confirmed expense/account movements unexpectedly.
- Reopening a completed goal must follow an explicit target edit or funding correction.
8. Authentication and Authorization
- Require the existing Spring Security/JWT authentication on every endpoint.
- Derive user identity from the validated principal, never from a client-supplied user_id.
- Enforce owner authorization on goals, installments, funding, and linked account/expense records.
- Prevent IDOR through guessed UUIDs; unauthorized resources must not disclose another user's financial data.
- Validate all DTOs server-side; apply safe pagination and rate limits to mutation endpoints.
- Log operation IDs and error codes without tokens or sensitive payment details.
9. Required Backend Operations
Suggested REST contract (final paths must follow Expensio API conventions):
Method	Operation
GET /api/goals	List active/completed/archived goals and summary
POST /api/goals	Create goal with optional opening funds
GET /api/goals/{id}	Retrieve goal detail and progress
PATCH /api/goals/{id}	Edit eligible configuration and recalculate schedule
POST /api/goals/{id}/archive	Archive goal
POST /api/goals/{id}/restore	Restore goal
DELETE /api/goals/{id}	Policy-controlled deletion
GET /api/goals/{id}/installments	List schedule and statuses
POST /api/goals/{id}/installments/{installmentId}/skip	Skip using Extend or Adjust
POST /api/goals/{id}/funding	Record opening/custom/installment contribution
GET /api/goals/{id}/funding	Paginated funding history
POST /api/goals/{id}/funding/{fundingId}/reverse	Audited correction/reversal


- All mutation endpoints must support deterministic retry semantics; financial POSTs require idempotency keys.
- Return consistent validation/conflict/error codes (400/401/403/404/409/422 as applicable) and updated resource versions.
- Provide cursor pagination and stable ordering for large histories.
10. Database and Migration Requirements
- Version-control DDL for goals, goal installments, funding ledger, account/expense links, foreign keys, indexes, and constraints using the project's migration tool.
- Index goals by owner/status and installments by goal/due date/status; index funding by goal/date and unique idempotency scope.
- Migrate existing goals, goal_emis, and virtual-invest expense links without duplicating funding.
- Backfill opening balances only when supported by verifiable records; flag ambiguous legacy values for review.
- Replace title-based matching with foreign keys and retire it after migration verification.
- If the old trg_sync_goal_progress trigger remains, document its ownership and avoid double application with Spring Boot services.
- Provide rollback strategy, reconciliation reports, and checks for orphaned or overfunded records.
11. Reliability, Mobile Sync, and Observability
- Support safe retries, optimistic concurrency, and reconciliation after network timeouts.
- Return authoritative state after writes; allow refresh by updated timestamp/version or an event cursor.
- Optional push/realtime notifications signal clients to refetch; they are not the source of truth.
- Track failed schedule regeneration, balance mismatches, duplicate idempotency attempts, and transaction rollbacks.
- Protect private goal data in logs, backups, and device-facing notifications.
12. Backend Acceptance Criteria
1. Users can access only their own goals, installments, and funding records.
2. Creating a goal with opening savings persists that value exactly once and creates valid future installments.
3. All money and installment rounding is paise-accurate.
4. Monthly, every-two-months, and quarterly schedules handle short months, leap years, and past targets consistently.
5. Target/frequency/date edits preserve historical paid and skipped records.
6. Full and partial contributions update net saved and installment statuses atomically.
7. Concurrent or retried requests cannot duplicate funding or exceed goal/instalment limits.
8. Extend and Adjust skip operations preserve history and generate correct remaining schedules.
9. Corrections and reversals leave an audit trail and recompute balances exactly once.
10. Legacy virtual-invest rows remain linked by ID and are not double-counted.
11. Account, expense, dashboard, and reports integrations follow one documented classification and posting policy.
12. Archive and deletion honor financial retention and never orphan confirmed records.
13. Cross-device refresh returns consistent authoritative balances and installment statuses.
14. Migration and reconciliation tests detect missing links, duplicate contributions, and inconsistent aggregates.
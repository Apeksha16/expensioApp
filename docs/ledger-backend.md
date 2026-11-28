Ledger Module
Backend Development Requirements
1. Module Overview
The Spring Boot backend with PostgreSQL must own Ledger validation, authorization, balance calculation, repayments, adjustments, audit history, and atomic operations. Ledger is a personal IOU register and must not automatically post Expenses, Splits, or account balance changes.
2. Ledger Entry Management
2.1 Entry Information
Store UUID id, authenticated user_id, required person_name, positive amount, type (in or out), optional purpose, required business date, optional friend_id if supported, created_at, updated_at, and a version for concurrency control. Never accept an arbitrary owner from a client request.
2.2 Signed Balance Rules
Use integer paise (or NUMERIC with exact decimal arithmetic), never binary floating point. Parent out contributes +amount; parent in contributes -amount. Child out contributes +amount; child in contributes -amount. The outstanding balance is the signed parent amount plus all active signed child adjustments. Positive means You'll Get, negative means You Owe, zero means Settled.
2.3 Validation and Updates
Require a nonblank person name, positive amount, valid direction and business date; purpose is optional. Enforce length limits and database CHECK constraints. Editing original amount/direction after repayments must be transaction-safe, audited, and rejected if the new balance violates the overpayment policy. Update updated_at without modifying created_at.
3. Sub-Transaction Management
3.1 Data Model
Store UUID id, ledger_id FK, positive amount, type, optional purpose, business date, created_at, updated_at, optional reversal_of_id, status (active/`reversed`) or equivalent immutable correction model, idempotency key, and audit metadata. Ensure child ownership is established through the parent; optional denormalized owner fields must be checked for consistency.
3.2 Repayments
Allow partial and full repayments. On positive balance, repayment direction is in; on negative balance it is out. Under the default policy, a repayment must not exceed the absolute outstanding amount or cross zero. If the product later supports cross-zero adjustments, require an explicit adjustment type and separate rules rather than silently reversing an obligation.
3.3 Transaction Corrections
Support authorized corrections/reversals with immutable audit events or versioned change history. Recalculate the outstanding balance transactionally and reject corrections that invalidate subsequent repayments under the configured policy. Never silently erase financial history.
4. Balance and Summary Management
Calculate balances on the server with one consistent definition for list, detail, and summaries. You'll Get equals the sum of positive outstanding balances; You Owe equals the absolute sum of negative outstanding balances. Settled entries contribute zero. Support paginated lists and filtering by date, status, direction and search. Ensure queries avoid N+1 loads and include only authorized rows.
5. Atomicity, Concurrency, and Idempotency
Each repayment, reversal, original-amount edit, and deletion must execute in a single database transaction. Lock the parent (SELECT ... FOR UPDATE) or use an equivalent concurrency strategy before validating the current balance and inserting a child. Require client-supplied idempotency keys for payment-like operations, uniquely scoped to the user and operation; repeat requests must return the original result, not create a second repayment. Ensure summary reads never use a stale client-computed balance as authority.
6. Deletion and Retention
A parent deletion must be a single authorized operation. For a hard-delete policy, rely on ON DELETE CASCADE within the database transaction; never delete children first in a separate client request. For stronger financial auditability, prefer soft deletion with retained history and controlled retention rules. Choose one policy explicitly and disclose its effect to users. Keep audit events as required by the chosen retention policy.
7. Database Schema and Indexing
Use version-controlled Flyway/Liquibase migrations for ledger_entries, ledger_sub_transactions, constraints, foreign keys, audit structures and indexes. Add indexes on (user_id, date DESC) for entries and (ledger_id, date, id) for children, plus appropriate idempotency uniqueness constraints. Enforce amount > 0, type IN ('in','out'), nonblank names, and valid FK relationships. All timestamps should be timezone-aware instants; business dates should remain dates with an explicit user timezone policy.
8. Authentication and Authorization
Require the Expensio JWT authentication flow on all endpoints. Derive the user ID from the authenticated principal. Verify ownership on every parent read/write and every child operation by joining to its parent. Return non-revealing 404 responses for unauthorized record IDs where appropriate. Prevent mass assignment, cross-user friend references, and direct client changes to server-owned audit fields. Apply database roles and least privilege; if Supabase remains in the architecture, maintain equivalent RLS policies as defense in depth rather than relying on client filtering.
9. Required Backend Operations
Provide authenticated operations equivalent to:
Method	Endpoint	Purpose
GET	/api/ledger	Paginated entry list with balances and filters
POST	/api/ledger	Create obligation
GET	/api/ledger/summary	You'll Get / You Owe totals
GET	/api/ledger/{id}	Entry detail and server balance
PATCH	/api/ledger/{id}	Eligible entry update
DELETE	/api/ledger/{id}	Authorized atomic delete/archive
GET	/api/ledger/{id}/transactions	Paginated repayment/adjustment history
POST	/api/ledger/{id}/transactions	Record repayment/adjustment idempotently
POST	/api/ledger/{id}/settle	Settle exact remaining amount atomically
POST	/api/ledger/{id}/transactions/{transactionId}/reverse	Audited reversal


Use version preconditions where appropriate and return standard error codes: 400 for malformed requests, 401 for missing authentication, 404 for inaccessible/missing resources, 409 for conflicts, and 422 for business-rule violations. Keep API request/response money representations exact (integer paise or decimal strings).
10. Synchronization and Cross-Module Dependencies
Publish authorized ledger change notifications or provide efficient delta refresh/ETags; never expose other users' event payloads. Realtime delivery is an enhancement, not the sole correctness mechanism. On reconnect, mobile clients must be able to refresh from the authoritative API.

Ledger is independent of Expenses, Accounts, Budgets, Reports, Friends, and Splits unless explicitly linked. If a linked account transaction feature is added, create and reverse both sides atomically with stable reference IDs, authorization, and duplicate-prevention rules. Never treat an IOU balance as cash or silently include it in spend reports.
11. Data Consistency, Security, and Observability
Enforce exact paise arithmetic and transactional balance invariants. Log operation IDs and error categories, not personal names, purposes, or sensitive amounts. Audit changes to parent obligations and child adjustments. Rate-limit write endpoints, validate request size, use structured error responses, and test authorization boundaries. Backup and restore procedures must preserve parent-child integrity.
12. Backend Acceptance Criteria
1. Only an owner can read or modify their entries and child transactions.
2. A ₹1,000 out parent produces +₹1,000; a ₹400 in child produces +₹600.
3. A ₹1,000 in parent produces -₹1,000; a ₹400 out child produces -₹600.
4. Summary totals match the signed balances returned by details.
5. Full settlement reaches exactly zero without rounding error.
6. Concurrent repayments cannot overpay or lose an update.
7. Repeating an idempotent request does not duplicate a transaction.
8. Invalid amounts, directions, names and ownership references are rejected at API and database boundaries.
9. Original-value edits and reversals preserve history and enforce balance rules.
10. Parent deletion/archive follows one atomic, documented policy and leaves no unauthorized or orphaned children.
11. Realtime or refresh mechanisms never disclose another user's data.
12. Ledger writes do not silently change Expenses, Splits, or account balances.
13. Migrations recreate the required schema, indexes, and constraints in a clean environment.
14. Integration tests cover timeouts, retries, concurrent updates, and account switching.
13. Corrections and Implementation Decisions
- Corrected: Remove the unsafe client sequence of deleting children before parents; use a single server transaction and database cascade or soft deletion.
- Corrected: Add database checks for positive amounts and exact money handling.
- Clarified: purpose is optional per the source data contract; if the product wants it mandatory, update both layers together.
- Changed from permissive behavior: Default repayment rules prohibit crossing zero; deliberate adjustments need a distinct, audited workflow.
- Added: Server-authoritative balances, idempotency, concurrency locks, audit history, versioned migrations, and authenticated REST APIs.
- Requires decision: Hard versus soft deletion, legacy Supabase realtime migration, explicit account linking, and whether free-form cross-zero adjustments should ever be enabled.
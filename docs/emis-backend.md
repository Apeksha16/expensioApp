EMI Module
Backend Development Requirements
1. Module Overview
The Spring Boot backend must support the Expensio native mobile EMI tracker using authenticated REST APIs and PostgreSQL. It must maintain correct installment schedules, user ownership, payment history, completion state and cross-device consistency.

The backend must support:
- EMI plan CRUD, archive/restore and schedule generation.
- Running/Completed lists, monthly commitment summaries and installment timelines.
- Exactly-once effects for retried payment-recording requests.
- Past-due installment recording and explicit advance payment recording.
- Auditable corrections/reversals.
- Secure access, transactional integrity, mobile-friendly pagination and sync.
Boundary: Recording a payment is a user declaration, not a bank transaction. The backend does not transfer funds, calculate amortization/interest or late fees, or automatically update expenses/accounts/budgets. Optional future integration requires its own transaction contract.
2. EMI Plan Management
2.1 EMI Information
Every EMI plan must maintain:
- UUID ID and authenticated owner user ID.
- Title (required, max 50), category (default General), optional icon and optional notes/lender label.
- Base monthly amount (positive, at least ₹1, paise precision).
- Due day (1–31), total installment months (at least 1).
- First installment month/date and derived last installment month/date.
- Timezone (valid IANA identifier) for calendar interpretation.
- Status: ACTIVE, COMPLETED, ARCHIVED or DELETED (soft-deleted where retention applies).
- Imported historical paid count, where applicable, explicitly distinguished from recorded payment history.
- Creation/update timestamps, version number, archive/delete timestamps where applicable.
2.2 EMI Validation
- Require authenticated ownership for every operation; derive user ID from the verified JWT, never trust an arbitrary client owner ID.
- Validate title, amount, precision, due day, duration, timezone and schedule consistency.
- Reject negative paid counts or imported paid count greater than total installments.
- Do not allow a change to the plan to invalidate recorded payments or create duplicate installment months.
- Use BigDecimal with fixed scale or integer paise for financial operations; avoid binary floating-point money.
2.3 EMI Updates
- Permit safe metadata edits without altering payment history.
- For amount/date/duration changes, validate the proposed schedule against paid installments and return a preview or conflict response when needed.
- Disallow direct arbitrary writes to paid count, last-paid month, calculated totals or completion status.
- Use optimistic version checks or row locking to prevent lost updates from concurrent clients.
- Preserve history of material schedule changes.
2.4 Archive, Restore and Delete
- Archive and restore must preserve installments, payments and audit records.
- Completed status must remain derivable from fulfilled installments; archiving is a separate visibility flag, not a substitute for payment completion.
- Prefer soft deletion when payment history exists; document retention and account-erasure behavior.
- Prevent deletion that would orphan an optional linked expense/account record.
3. Installment Schedule Management
3.1 Installment Information
Each installment must maintain:
- UUID ID, EMI ID, installment sequence number and installment month (YYYY-MM).
- Computed due date, expected amount and effective status.
- Optional confirmed payment reference and creation/update timestamps.
3.2 Schedule Rules
- Generate exactly total_months installment rows, one for each consecutive calendar month starting from the first installment month.
- Due date = minimum(configured due day, number of days in that calendar month).
- Compute dates with LocalDate / YearMonth and a specified IANA timezone, not JavaScript date rollover or UTC midnight assumptions.
- Do not create extra installments for short months, leap years or timezone transitions.
- The last installment's date must match the plan's derived end date.
- Use a unique database constraint on (emi_id, installment_month) and (emi_id, sequence_number).
3.3 Installment Status
- PAID: a valid active confirmed payment record exists for the installment.
- HISTORICAL_PAID: explicitly imported as previously paid, without an invented payment amount/timestamp.
- OVERDUE: unpaid and due date precedes the user's current local date.
- DUE: unpaid and due date is today.
- UPCOMING: unpaid and due date is in the future.
- Completion occurs only when all installments are PAID or HISTORICAL_PAID; no counter may exceed total installments.
- months_paid and last_paid_month may be exposed as derived compatibility fields, not writable sources of truth.
4. Payment Recording
4.1 Payment Information
Every payment record must maintain:
- UUID payment ID, EMI ID, installment ID, owner user ID.
- Actual positive amount in exact paise precision.
- Target installment month, user-supplied actual payment date, server-recorded timestamp.
- Optional note, recorded-by identity and source MANUAL.
- State ACTIVE or REVERSED, reversal reason/time/actor where applicable.
- Idempotency key or operation reference.
4.2 Record Payment
- Require an explicit target installment ID/month and amount.
- Permit recording an unpaid past installment; future installment payments require explicit advance-payment intent.
- Reject duplicate active payments for the same installment.
- A payment of a different amount than the base amount still fulfills exactly one installment under the current tracker rules.
- Partial monetary fulfillment and multiple payments per installment are out of scope; do not present a smaller recorded amount as a partially settled balance.
- Validate that the plan is accessible and not archived/deleted; completed plans have no unpaid installments.
- Return the authoritative updated plan, installment and payment state.
4.3 Atomicity and Idempotency
- Process payment creation and installment fulfillment in one database transaction.
- Lock the installment/plan or use a constraint-backed concurrency strategy.
- Enforce at most one ACTIVE payment per installment using a partial unique index or equivalent.
- Store an idempotency key scoped to user and operation; identical retries return the original result, conflicting payload reuse returns a conflict.
- Do not implement client read-modify-write JSON history or separate unguarded count increments.
- Ensure simultaneous requests from multiple devices cannot double-increment progress or lose history.
4.4 Payment Corrections
- Corrections must be authorized and auditable; reversal changes the active financial effect but retains the original record.
- Recompute installment and plan status after a reversal.
- Permit re-recording the installment only after the reversal transaction commits.
- Record reason, actor, timestamp and previous/new values for corrections.
- Prevent unauthorized deletion or direct mutation of immutable payment facts.
5. Monthly Summary and Progress
5.1 Monthly Commitment
- Sum base amounts of ACTIVE, not-yet-completed plans for the current product-defined monthly commitment.
- Exclude archived and deleted plans; exclude completed plans.
- Keep this distinct from scheduled unpaid amount and actual paid amount.
5.2 Expected and Actual Totals
- Expected total = base amount × total months, unless future per-installment amount overrides are explicitly introduced.
- Actual recorded paid total = sum of ACTIVE payment records only.
- Imported historical paid count must not fabricate monetary totals.
- Remaining installments = total minus fulfilled (recorded + historical) installments.
- Due-this-month and overdue totals must use unpaid installment rows and their expected amounts.
5.3 Reporting Consistency
- All summaries, details and list views must derive from the same authoritative schedule/payment state.
- Do not treat the base amount as actual money spent.
- Never automatically insert regular expense records, change account balances or change budget consumption from a manual EMI record.
6. PostgreSQL Data Requirements
6.1 Recommended Normalized Tables
emis
- id UUID PK, user_id UUID NOT NULL FK users, title VARCHAR(50) NOT NULL, amount NUMERIC(18,2) NOT NULL, category, icon, notes, due_day SMALLINT NOT NULL, total_months INT NOT NULL, first_installment_month DATE NOT NULL, timezone VARCHAR(64) NOT NULL, status, archived_at, deleted_at, version BIGINT, created_at, updated_at.
- Constraints: amount ≥ 1, due_day between 1 and 31, total_months ≥ 1, valid month-start convention and required fields.
emi_installments
- id UUID PK, emi_id UUID NOT NULL FK, sequence_number INT NOT NULL, installment_month DATE NOT NULL, due_date DATE NOT NULL, expected_amount NUMERIC(18,2) NOT NULL, historical_paid BOOLEAN NOT NULL DEFAULT FALSE, timestamps.
- Unique (emi_id, sequence_number) and (emi_id, installment_month).
emi_payments
- id UUID PK, emi_id UUID NOT NULL FK, installment_id UUID NOT NULL FK, user_id UUID NOT NULL FK, amount NUMERIC(18,2) NOT NULL, paid_on DATE NOT NULL, recorded_at TIMESTAMPTZ NOT NULL, note, status, reversed_at, reversal_reason, reversed_by, idempotency_key, timestamps.
- Partial unique index on installment_id where status = ACTIVE; check amount > 0.
- Validate that payment's EMI ID and owner match the installment and plan, using service-level authorization plus database integrity constraints.
emi_audit_events
- id UUID PK, emi_id, actor_user_id, event_type, before_snapshot, after_snapshot, reason, created_at.
emi_idempotency_keys (or shared operation table)
- User ID, operation, key, request hash, response/result reference, creation/expiry timestamps; unique (user_id, operation, key).
6.2 Migration and Legacy Data
- Use version-controlled Flyway migrations to create tables, constraints, indexes and timestamp behavior; do not assume the existing Supabase emis table definition exists.
- Migrate legacy transactions JSONB entries to normalized payment rows with stable IDs and preserved timestamps.
- Deduplicate or quarantine repeated payment months rather than silently counting both.
- Convert legacy months_paid values without matching transactions into explicitly labeled historical-paid installments.
- Validate date schedules and resolve invalid due-day rollover and inconsistent start/end dates before cutover.
- Preserve historical data and provide a reversible/tested migration strategy; do not expose both direct-Supabase and Spring Boot write paths simultaneously.
6.3 Indexes and Isolation
- Index emis(user_id, status), emi_installments(emi_id, due_date) and emi_payments(emi_id, recorded_at).
- Enforce foreign keys, unique constraints and non-null ownership.
- Apply Spring Security owner checks on all API reads and writes; if Supabase PostgreSQL is retained, configure RLS appropriately for any direct database roles and do not expose privileged credentials to the mobile client.
7. Security and Authorization
- Authenticate every EMI API using the existing JWT infrastructure.
- Resolve ownership from the authenticated principal and scope all repository queries by owner.
- Return a non-disclosing 404 or equivalent for another user's record.
- Reject forged EMI IDs, payment IDs, installment IDs and user IDs.
- Validate DTOs on the server; never trust client-computed totals, progress or dates.
- Limit payload sizes and apply rate limits to mutation endpoints.
- Use TLS, parameterized queries and protected logs; do not log JWTs or sensitive notes.
- Define retention, export and account-deletion behavior for personal financial records.
8. Required REST API Operations
Use /api/v1/emis as the proposed base path; align final routes with the project's API naming conventions.
8.1 EMI Plans
- POST /api/v1/emis — create plan and generate schedule.
- GET /api/v1/emis?status=ACTIVE|COMPLETED|ARCHIVED&page=&size= — paginated list.
- GET /api/v1/emis/{id} — plan details and summary.
- PATCH /api/v1/emis/{id} — validated edits with version control.
- POST /api/v1/emis/{id}/archive — archive.
- POST /api/v1/emis/{id}/restore — restore.
- DELETE /api/v1/emis/{id} — policy-compliant soft deletion / rejection.
8.2 Installments and Payments
- GET /api/v1/emis/{id}/installments — installment timeline.
- POST /api/v1/emis/{id}/installments/{installmentId}/payments — record payment atomically; require Idempotency-Key header.
- GET /api/v1/emis/{id}/payments?page=&size= — paginated payment history.
- POST /api/v1/emis/{id}/payments/{paymentId}/reverse — authorized reversal with reason.
8.3 Summary
- GET /api/v1/emis/summary?month=YYYY-MM — monthly commitment, due, paid, overdue and plan counts.
- GET /api/v1/emis/due?from=YYYY-MM-DD&to=YYYY-MM-DD — upcoming unpaid installments.
8.4 API Response and Error Contract
- Use consistent JSON DTOs with UUID IDs, ISO-8601 dates, timestamps with offsets, and money as decimal strings or integer paise.
- Return stable error codes for validation, unauthorized, forbidden/not-found, already-paid, conflict, stale-version and rate-limit cases.
- Support pagination and stable sorting; bound page size.
- Include a server timestamp and updated version/ETag for mobile refresh and conflict handling.
- Do not promise payment success until the transaction is committed.
9. Native Mobile Reliability and Synchronization
- Support repeated mobile requests caused by timeouts or reconnects through idempotency keys.
- Keep writes online and server-authoritative; do not assume offline payment queues are safe.
- Support conditional reads or version-based freshness checks to reduce unnecessary mobile traffic.
- Refresh stale data after app foreground and successful writes; optional WebSocket/push invalidation can improve multi-device freshness but must not be the sole consistency mechanism.
- Ensure device clock skew cannot change authoritative paid/overdue state; use server time and the plan timezone.
- Provide safe notification scheduling inputs for an optional reminder service; push delivery is best effort and cannot update payment status.
10. Audit and Observability
- Audit create, material edit, archive, restore, deletion, payment, reversal and migration events.
- Include correlation/request IDs for troubleshooting without exposing sensitive values.
- Track duplicate idempotency requests, conflicts, failed authorization and transaction failures.
- Use structured logs and monitoring for payment-recording errors and schedule inconsistencies.
11. Data Consistency Requirements
The backend must ensure:
- Exactly one installment per scheduled month and exactly total_months installments per plan.
- No duplicate active payment for one installment.
- Fulfilled installment count never exceeds total installments.
- Payment reversals recalculate fulfillment without erasing history.
- Historical paid progress is never misrepresented as a monetary payment.
- Completed status follows installment fulfillment, not a client-supplied counter.
- Overdue status uses unpaid installment due dates, not only last_paid_month.
- Due-day clamping is identical across APIs and clients.
- All mutation effects are atomic and owner-authorized.
- EMI payment records remain separate from expense/account ledger records unless an explicit integration is enabled.
12. Backend Acceptance Criteria
The module is complete when:
1. A valid EMI creates the correct number of installment rows and returns a stable schedule.
2. Invalid input and cross-user access are rejected server-side.
3. Due day 31 correctly clamps in February and other short months, including leap years.
4. A ₹10,250 payment is stored precisely and fulfills only its targeted installment.
5. Two simultaneous payment requests cannot create two active payments or double progress.
6. A timed-out request retried with the same idempotency key has exactly one effect.
7. The same key with a different request body is rejected as a conflict.
8. Past-due and explicitly authorized advance installments can be recorded correctly.
9. A payment reversal retains audit history and restores the installment's unpaid state.
10. Imported historical progress is distinguished from actual recorded payment totals.
11. Plan edits cannot invalidate confirmed historical installments.
12. Running/Completed/Archived lists and summaries agree with installment state.
13. A final installment makes the plan Completed, and reversal reopens it when appropriate.
14. Legacy Supabase records and JSON history can be migrated without silently losing or duplicating data.
15. Mobile reconnect, app restart and multi-device reads return consistent authoritative data.
16. Archive/delete operations obey retention and linked-record rules.
17. EMI recording does not create unrequested expense or account transactions.
18. Automated unit, integration, concurrency, security and migration tests cover these requirements.
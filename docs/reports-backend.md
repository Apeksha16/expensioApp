Reports Module — Backend Functional Requirements and Dependencies
Target: Java 21 (LTS), Spring Boot 4.1.1, PostgreSQL
Status: Proposed API and implementation contract based on supplied web requirements; not evidence of existing deployed code.
1. Purpose and scope
Provide authenticated, read-only reporting of the user's financial activity across Expenses, Subscriptions, Goals, and Splits. Serve consistent Overview, Analytics, and PDF-ready data for the React Native client. Reports must never mutate transactions, balances, subscriptions, goals, or settlements.
2. Reporting definitions and decisions
Term	Backend rule
Date presets	THIS_MONTH, LAST_MONTH, LAST_3_MONTHS, THIS_YEAR, ALL_TIME.
Range	[startInclusive, endExclusive) in a documented reporting timezone; convert to UTC for timestamp filtering.
Sources	EXPENSES, SUBSCRIPTIONS, GOALS, SPLITS; source classification is mutually exclusive.
Spending event	User-attributable event with stable ID, timestamp, amount, source, category, and optional payment method.
Daily average	Total / defined number of calendar days in range; for an ongoing range count days elapsed through today.
Largest spend	Max eligible individual event, with deterministic tie break.
Top category/payment	Largest aggregated amount, with explicit Unknown handling and deterministic ties.
Money	PostgreSQL NUMERIC/Java BigDecimal (or consistently defined minor units); never binary float.


Requires explicit product sign-off: The source document uses a user's split owed share as spend. Define whether reports represent allocated consumption or cash outflow. The proposed default is allocated consumption, excluding split settlement transfers. Define whether goal funding is spend or an internal asset transfer; the legacy report treats it as a dedicated source.
3. API contract
3.1 Retrieve report
GET /api/v1/reports?period=THIS_MONTH&sources=EXPENSES,SUBSCRIPTIONS,GOALS,SPLITS
- Authentication: existing JWT security chain; derive user UUID from verified principal, never a client-supplied user ID.
- Validate enums, source list, date preset, and permitted timezone policy; return 400 for invalid inputs, 401 for missing auth.
- Response: period, sources, startInclusive, endExclusive, timezone, currency, generatedAt, dataAsOf, isComplete, warnings, totalSpent, dailyAverage, largestSpend, topCategory, topPayment, trend, categories, paymentMethods, sourceTotals.
- Use decimal strings or minor units for monetary JSON. Include zero buckets where relevant.
- Apply one database-consistent snapshot for cards and charts; no mixed queries from different logical states.
3.2 Export
Preferred: client generates a PDF from the same report snapshot using native print/share APIs. Optional POST /api/v1/reports/export can generate a server PDF if required by product policy, but must use a validated snapshot/query and never accept arbitrary user-scoped data as trusted. Export is read-only and subject to rate limits and privacy controls.
4. Data stores and source mapping
Store	Read fields / rule
expenses	id, user_id, title, amount, category, date, paid_via, goal_id, subscription_id; confirm actual migration field names.
split_expenses	id, group_id, date, category, paid_via, participant allocations; only current user's owed amount.
monthly_summaries	user/month totals and source/category/payment breakdowns; must be access-scoped, correct, and freshness-controlled.
subscriptions	Plan metadata only for display/classification; a scheduled amount is not a payment.
goals	Metadata only; linked funding expenses are the event source, subject to transfer policy.


Classification precedence proposal: If an expense has subscription_id, classify SUBSCRIPTIONS; else if goal_id, classify GOALS; else EXPENSES. Reject ambiguous dual links at write time or explicitly define precedence. SPLITS events are sourced separately and must not duplicate any linked expense. Persist or derive a stable unique report-event key (source_type, source_id, user_id) to prevent double-counting.

For split rows, unnest participant allocations only through an ownership-verified query. A participant's share is not the full group total. Define handling for split edits, cancellations, guests, and repayments; repayments must not become additional spending events.
5. Aggregation strategy
1. Resolve requested range and filters using one timezone policy; do not compare YYYY-MM strings to timestamps without conversion.
2. Build a canonical, user-scoped reporting-event dataset or SQL view that classifies each event exactly once.
3. Apply source filters before aggregation.
4. Compute totals, top spend, categories, payment methods, and trends from that identical filtered dataset.
5. For long windows, use correctly maintained materialized/summary tables where available; fall back to scoped raw aggregation when freshness or dimensions are unsupported.
6. Never combine monthly_summaries with raw split/expense rows without excluding overlapping contributions.
7. Monthly summaries must contain sufficient dimensions for every supported source toggle; otherwise derive exact values from raw data. A monthly total alone cannot reconstruct the largest transaction or arbitrary day-level metrics.
8. Define late-arriving transaction, backdated edit, deletion, and timezone-change invalidation/rebuild logic.
6. Security and privacy
- Require JWT authentication for every report endpoint and derive identity server-side.
- Enforce ownership on each base table and each join, including split participant membership. Never rely on frontend filtering.
- With Spring Boot service credentials, PostgreSQL RLS is optional defense-in-depth only if actually configured and enforced; unlike direct Supabase access, RLS alone is not the complete API authorization model.
- If using PostgreSQL RLS, bind the authenticated user securely per transaction; guard connection pooling/session leakage and view security behavior.
- Avoid cross-user leaks through monthly_summaries, SECURITY DEFINER functions, shared caches, logs, export files, and error messages.
- Cache by user + normalized period + sources + timezone + data version; invalidate on writes or use bounded TTL with dataAsOf.
- Apply pagination/limits, query timeouts, appropriate indexes, and rate limits; never return raw participant records for unrelated users.
7. Suggested Spring Boot structure
Component	Responsibility
ReportController	Authenticated endpoint, validation and response codes.
ReportService	Range resolution, source selection, consistency and orchestration.
ReportRepository	Parameterized SQL/JPQL aggregation queries and summary reads.
ReportClassificationService	Canonical mutually exclusive source assignment.
ReportDateRangeResolver	Inclusive/exclusive bounds and timezone policy.
ReportResponse DTOs	BigDecimal-safe totals, trends, metadata, freshness and warnings.
ReportSummaryRefresh	Summary maintenance/invalidation after source edits.


Use the existing Expensio package naming and security principal conventions; names above are suggested, not verified repository classes.
8. Cross-module dependencies
Module	Backend dependency
Expenses	Source-of-truth monetary rows, date/category/payment method.
Subscriptions	Paid events are linked expenses; never sum subscription plan amounts as actual spend.
Goals	Linked funding events; apply approved spending/transfer treatment.
Splits	User-specific owed allocations and stable historical participant attribution.
Dashboard	Reuse range and classification rules to prevent conflicting totals.
Accounts / Budgets	Read-only; exclude pure transfers from expense totals unless explicitly modeled.
Authentication	Verified JWT user ID, scoped queries and cache isolation.


9. Data flows
Short period: authenticated request → range resolution → scoped canonical events → filters → one consistent aggregation → DTO.

Long period: authenticated request → freshness check of month summaries → exact supported aggregate path or raw fallback → same response contract.

Source mutation elsewhere: expense/split insert, update, or delete → invalidate/recompute affected summary buckets → new report snapshots reflect changes.

Export: snapshot is obtained via the same authorized report API; no write to financial tables.
10. Failure and edge-case behavior
- Return an empty, valid zero-valued report for no data, not a 500 error.
- Treat unavailable/stale summaries explicitly; do not return partial totals without isComplete=false and warnings.
- Prevent integer/decimal overflow and invalid negative amounts under the chosen financial model.
- Handle leap years, billing-day edge cases only insofar as they affect actual expense dates, daylight saving, UTC conversion, and year boundaries.
- Define currency behavior; if multi-currency is supported, aggregate only after a documented FX conversion or separate totals by currency.
- Preserve category and participant display semantics for historical records even after friends/plans are removed.
11. Acceptance criteria and tests
1. User A cannot obtain User B's report, including through joins, summaries, exports, or cache keys.
2. All preset boundaries match documented timezone and half-open interval semantics.
3. Every enabled source toggle is applied before all metrics and charts are computed.
4. A subscription payment is counted once; its recurring plan amount is not counted separately.
5. Goal-linked expenses are counted according to the approved transfer/spending rule, once only.
6. A split adds only the user's allocation; no whole-group amount or repayment duplicate.
7. Sum of source totals and category totals reconciles to Total Spent, with documented Unknown handling.
8. Largest Spend remains an exact transaction maximum for This Year/All Time.
9. Backdated inserts, edits, and deletions refresh affected monthly summaries.
10. Concurrent changes do not produce contradictory cards/charts in a single response.
11. Zero-data reports, missing payment method, leap year, and cross-month timezone boundaries are covered.
12. Service performance is tested on large histories; explain plans/indexes and cache invalidation are verified.
12. Gaps and implementation priorities
P0 — correctness/security: verified user scoping; canonical event classification; split attribution; linked-expense deduplication; consistent snapshot; money precision; date boundaries.

P1 — reliable analytics: accurate long-range aggregates; summary freshness/invalidation; exact top-spend; consistent filters and payment method handling; index/performance tests.

P2 — production operations: export privacy/rate limits; observable query performance without sensitive logging; cache controls; explicit currency and goal-transfer policy.

Migration note: The original document assumes direct Supabase reads and RLS. In Spring Boot, replace these with authenticated REST APIs and repository/service authorization; retain database RLS only as a consciously configured defense-in-depth measure. The supplied text is a requirements source, not proof that monthly_summaries or any SQL view already exists in the new backend.
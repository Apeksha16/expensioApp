Backend Engineering Quality Gate
Reusable post-module review standard | Java + Spring Boot + PostgreSQL | Production startup engineering
1. Scope and architecture
Apply after every endpoint, schema migration, financial workflow, background job, integration, dependency change and release. The checklist does not assert current implementation. Record JDK/Spring Boot/PostgreSQL versions, deployment topology, expected throughput, dataset, tenant model, failure budget and SLOs.
2. Domain correctness and API contracts
- [ ] Trace each requirement to controller, DTO, service, domain rule, repository, migration and automated test.
- [ ] Validate all inputs with Bean Validation and business invariants; explicit error schema, codes, pagination, sorting and API version compatibility.
- [ ] Currency uses BigDecimal and documented scale/rounding; never floating point for financial amounts; define supported currencies and conversion policy.
- [ ] Time uses UTC instants for events and explicit user/merchant timezone for billing dates; month boundaries and short-month billing rules tested.
- [ ] Transaction semantics, ownership and invariants clear; no partial writes for expense + subscription/EMI/goal/split state.
- [ ] Idempotency keys, unique constraints and transaction isolation prevent duplicate records under retries, double clicks and concurrent clients.
- [ ] Explicit distinction between expenses, transfers, reimbursements, installments, liabilities and balances; reconciliation and double-entry accounting considered when warranted.
- [ ] CRUD, soft delete, archival, audit and retention policies; historical references remain meaningful when linked records are deleted.
- [ ] Stable API contract documented (OpenAPI), contract tests against frontend, backward compatibility and deprecation windows.
3. Security and abuse prevention
- [ ] Spring Security deny-by-default, authenticated principals derived from verified JWT, algorithm/issuer/audience/expiry checks, key rotation and revocation/session policy.
- [ ] Authorization at service/data boundary on every object, not only route; test IDOR, cross-user reads/writes and bulk endpoints.
- [ ] No secrets in source, responses, logs, traces or exception messages; secret manager/env injection, least privilege and rotation.
- [ ] Parameterized SQL/ORM queries, strict validation, safe file handling, SSRF protections for URL fetches, request size limits, secure CORS and CSRF strategy suited to auth mechanism.
- [ ] OTP/MPIN brute-force throttling, rate limits, lockouts, replay protection and enumeration resistance where relevant; safe hashing and credential lifecycle.
- [ ] Audit events for sensitive mutations without exposing PII; privacy minimization, export/delete retention policy and access logging.
- [ ] SAST, dependency/CVE/license checks, SBOM, container image scan, supply-chain provenance and permission reviews.
- [ ] Threat model new trust boundaries, guest accounts, sharing, external integrations and public exports; verify abuse cases in tests.
4. Database design and migrations
- [ ] Normalization, ownership FKs, NOT NULL, CHECK, UNIQUE, partial indexes, referential actions and bidirectional relationship constraints.
- [ ] Schema migrations version-controlled (Flyway/Liquibase), ordered, repeatable in staging, tested on existing data, safe rollback/forward fix.
- [ ] Prefer expand–migrate–contract for zero-downtime changes; avoid long table locks; validate backfill and dual-write windows.
- [ ] Examine EXPLAIN (ANALYZE, BUFFERS) for hot queries; indexes match predicates/order, avoid N+1 ORM queries, excessive joins and full-table scans.
- [ ] Correct transaction isolation, row locking/optimistic versioning and deadlock retry for financial updates; test race conditions.
- [ ] Connection pool sizing, statement timeout, slow query monitoring, transaction duration and pool exhaustion alerts.
- [ ] Backup, restore drill, PITR where required, data retention, encryption at rest and access policy; test restore, not just backup creation.
- [ ] Aggregate/report consistency: materialized view refresh/invalidation, reconciliation and backfills; no unscoped access to other users' data.
5. System design, scalability and resilience
- [ ] Clear layers (controller → service/domain → repository), module boundaries, dependency direction, DTO/entity separation and no circular dependencies.
- [ ] Synchronous vs async work justified; queues/outbox for reliable side effects where needed; exactly-once claims avoided unless provable.
- [ ] Timeouts, bounded retries with jitter, circuit breakers/bulkheads where useful; no retry storms or unbounded queues.
- [ ] Stateless horizontal scaling where possible; shared sessions/locks/caches with explicit consistency and TTL policy.
- [ ] Cache only where measured benefit exists; user-scoped keys, invalidation on mutation, stampede protection, stale-data limits and privacy controls.
- [ ] Pagination/keyset for large histories; bounded response sizes; batch writes/reads and query projections.
- [ ] Capacity planning with measured p50/p95/p99 latency, throughput, CPU, heap/GC, DB utilization, queue lag and error rate.
- [ ] Load, stress, soak and failure-injection tests for real traffic patterns and month-end peaks; document saturation point and graceful degradation.
- [ ] Multi-instance concurrency and clock skew tested; distributed locks used only when simpler DB constraints/transactions cannot solve issue.
6. Java/Spring code quality
- [ ] Java style/formatting, Checkstyle/SpotBugs/PMD or equivalent, meaningful naming, small cohesive methods, no unused dependencies.
- [ ] Constructor injection, immutable DTOs where suitable, configuration validation, profiles and secrets isolated; avoid business logic in controllers.
- [ ] No Optional.get() without guard, swallowed exceptions, catch-all 200 responses, leaked stack traces, unchecked nulls or accidental lazy-loading during serialization.
- [ ] Explicit transaction boundaries and propagation; no remote calls inside DB transactions unless justified.
- [ ] Mapping and validation tested; domain events clearly scoped; no premature microservices or abstraction layers.
- [ ] Architecture decision records document tradeoffs, simpler alternatives and cost/operability impact.
7. Observability, operations and cost
- [ ] Structured logs with request/trace IDs, redaction and bounded cardinality; metrics for HTTP, DB, queue, JVM and business failures.
- [ ] Distributed tracing across important workflows; health probes reflect readiness vs liveness; alert on user-impacting SLO breaches.
- [ ] Safe deploy with config validation, migration sequencing, canary/blue-green strategy where justified, rollback and incident runbook.
- [ ] Separate dev/staging/prod, principle of least privilege, production-safe feature flags, sanitized test data and disaster recovery objectives.
- [ ] Cloud costs tracked by API/DB/storage/egress/logging; evaluate managed vs self-hosted alternatives on evidence, not fashion.
- [ ] Test service degradation (DB unavailable, Redis down, third-party SMS timeout, queue backlog) and confirm no financial corruption.
8. Testing matrix
- [ ] Unit: domain math, limits, validation, status transitions, date/currency logic.
- [ ] Integration: PostgreSQL-backed repositories, migrations, transactions, FK/unique violations, auth rules, test containers where feasible.
- [ ] API/contract: HTTP codes, validation errors, pagination, versioning, JWT cases and client compatibility.
- [ ] Security: IDOR, privilege escalation, JWT tampering, replay, rate limits, injection and data leakage.
- [ ] Concurrency: duplicate requests, simultaneous accept/remove, multi-device payments, deadlocks and idempotent retries.
- [ ] Reliability: timeouts, retries, partial failures, rollbacks, backups/restores, outbox replay and cache invalidation.
- [ ] Performance: representative volume, query plans, load tests and regression budgets; measure before optimization.
9. Suggested command/evidence inventory
Use actual repository commands: ./mvnw -B verify or mvn -B verify, test reports, JaCoCo, SpotBugs/Checkstyle, dependency vulnerability scan, migration validation, Testcontainers integration tests, EXPLAIN ANALYZE, k6/Gatling/JMeter load profiles, container scan, image-size diff, JVM/DB metrics and SBOM. Collect evidence per commit/environment.
10. Backend release checklist
- [ ] Database migration staged and backward-compatible; rollback/forward-fix and reconciliation documented.
- [ ] JWT secrets and DB credentials managed; CORS, request limits, TLS, authZ, audit and logging validated.
- [ ] Health probes, alerts, dashboards, capacity limits, backups and restore test verified.
- [ ] Frontend version compatibility and multi-module financial consistency signed off.
Review protocol — run after EVERY module / major change
Review inputs: module requirements and acceptance criteria; architecture/ADR; changed-file diff; dependency and lockfile changes; API contract; screenshots or screen recordings where UI changes; tests and coverage; build logs; bundle or binary size comparison; profiling evidence; security scan; migration plan; monitoring impact. If evidence is unavailable, mark NOT VERIFIED, never PASS.

Severity: P0 = exploit/data loss/outage/privacy breach; P1 = broken core journey, serious performance or reliability regression; P2 = material maintainability/accessibility/UX issue; P3 = polish. Release gate: P0/P1 must be fixed or formally accepted by authorized engineering/product owner with compensating controls and expiry; no silent waivers. Any security/privacy-critical P0 cannot be waived for production. Each issue has owner, reproduction, impact, remediation, test, due date.

Required workflow: (1) map requirement → implementation → test; (2) inspect changed code and affected integrations; (3) run static checks/tests/scans; (4) benchmark against baseline on representative devices/loads; (5) review abuse/failure/offline/concurrency cases; (6) compare at least one simpler or safer alternative and explain tradeoffs; (7) record findings and gate decision; (8) follow up after release via telemetry.

Definition of done: every applicable checklist item has PASS, FAIL, NOT VERIFIED, or N/A with reason and evidence link. No fabricated performance claims or unmeasured budgets. Define baseline and targets with team-owned SLOs; sample targets below are starting points, not universal guarantees.
Cross-module integrity contract
- [ ] Preserve transaction ownership, currency precision, timezone and date semantics across Expenses, Splits, Friends, EMIs, Subscriptions, Goals, Budgets, Reports, Dashboard and Accounts.
- [ ] No duplicate financial records from retries, double taps, concurrent requests, reconnects, or multi-device sessions; idempotency and uniqueness enforced where needed.
- [ ] Historical financial records survive deletion/renaming of referenced plans, friends, categories, accounts; explicit retention and snapshot policy.
- [ ] Define cash flow vs allocated expense vs liability vs transfer; avoid double-counting splits, goal contributions, subscriptions and EMI principal/interest in reports.
- [ ] Updates to source transactions reconcile aggregates, balances, payment statuses and reports; consider backfill and cache invalidation.
- [ ] Verify authorization on every read/write and attachment/export; sensitive data never leaks through logs, crash reports, caches or notifications.
- [ ] Test onboarding, authentication, logout/account switching, expired sessions, feature flags, migration compatibility, and cross-module navigation.
Architecture and technology health check
- [ ] Document current runtime, framework, SDK/JDK, dependencies, minimum supported platform, supported database versions, and EOL/security status; use official release notes and vulnerability advisories at review time.
- [ ] Keep an explicit ADR for major library/framework choices and rejected alternatives; review upgrade path, ecosystem health, licenses, maintenance, CVEs and total ownership cost.
- [ ] Prevent unnecessary dependencies and duplicate libraries; pin reproducible versions, maintain lockfiles/SBOM, automate dependency updates and test upgrades.
- [ ] Validate boundaries, modularity, dependency direction, single responsibility, typed contracts, naming, error semantics, observability and rollback.
- [ ] Record alternative proposals with: current choice, candidate, benefit, risks, migration effort, evidence, recommendation and revisit trigger. Do not replace technologies merely because they are newer.
Universal review report template (copy for every module)
Module / change: ___  PR / commit: ___  Reviewer / date: ___  Environment: ___
Scope / affected modules: ___  Requirements covered: ___  Evidence links: ___
Build / test / scan results: ___  Baseline → after metrics: ___
Findings table: ID | Severity | Area | Evidence/repro | Impact | Fix/alternative | Owner | Due | Status
Unverified checks / explicit exclusions: ___
Alternatives reviewed and decision rationale: ___
Rollout, rollback, migration and monitoring plan: ___
Decision: PASS / CONDITIONAL PASS / FAIL  Approver: ___  Follow-up date: ___
Suggested CI release gates
1. Format + lint + type/static analysis; changed-code tests and integration tests.
2. Dependency/secret/license scan and SBOM; prohibit committed credentials.
3. Build reproducibly; collect size, test, security and performance artifacts.
4. Verify contract tests and cross-module regression suites.
5. Require review approval and documented waivers; release staged with monitoring and rollback.
Continuous improvement cadence
Every PR: relevant checklist, changed-code tests, scan, reviewer. Every module completion: end-to-end flows, device/load profiles, integration audit, alternatives review. Every release: security review, regression, size/performance trend, staged rollout. Monthly/quarterly: dependency/EOL review, threat modeling, accessibility audit, incident lessons, cost/capacity review, architecture debt prioritization.
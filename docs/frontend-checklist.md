Frontend Engineering Quality Gate
Reusable post-module review standard | React Native + Expo | Native mobile startup production readiness
1. Scope and philosophy
Apply after every feature, refactor, dependency upgrade, design-system change and release. Audit Android and iOS independently where supported. This is a review checklist, not proof of existing implementation. Product requirements and measured baselines override example thresholds. Capture OS, device tier, app build, network condition and test dataset for reproducibility.
2. Functional correctness and UX
- [ ] Requirement-to-screen/API/test traceability; happy path, empty, loading, error, retry, permission denied, first-use, and large-data states.
- [ ] Form validation both inline and server-side; decimal/currency locale, rounding, date picker, recurring dates, long names, Unicode, keyboard avoidance and safe-area handling.
- [ ] Navigation/back/gesture/deep links, interrupted flows, unsaved-change warning, app kill/restart, background/resume and multi-account isolation.
- [ ] Explicit destructive confirmation and undo where appropriate; accessible error messages, actionable recovery, no silent failure.
- [ ] No accidental double submission; pending actions disabled, idempotency keys used for financial mutations; optimistic UI has rollback and conflict handling.
- [ ] Consistent empty states and skeleton loaders; no infinite spinners, flicker, layout jumps, or misleading success before server acknowledgment.
- [ ] Offline behavior defined per action: read cached data with freshness label, queue only safe mutations, reject unsafe writes with explanation, reconcile conflicts after reconnect.
- [ ] Test on low-memory phones, small/large screens, font scaling, landscape where supported, slow 3G/packet loss and airplane mode.
3. UI system, animation and visual assets
- [ ] Shared design tokens for typography, color, spacing, elevation, radii, iconography and light/dark/high-contrast modes.
- [ ] Consistent component patterns: cards, charts, bottom sheets, dialogs, toasts, skeletons, pull-to-refresh, pagination, badges and tab bars.
- [ ] Animation has purpose, avoids blocking input and respects OS Reduce Motion; prefer transform/opacity on UI thread, cancel on unmount, avoid excessive simultaneous effects.
- [ ] GIFs, Lottie, mascots, animated characters, stickers and illustrations: justified by UX, licensed, optimized, cached, limited in loops/CPU/battery and accessible with text alternatives. Prefer static or vector assets when possible.
- [ ] Optimize images (dimensions, formats, compression, responsive sizing); no unbounded base64 or huge source files; verify loading placeholders and cache eviction.
- [ ] Charts remain readable with large values, zero/negative values, many categories, labels, screen readers and reduced motion; provide textual summaries.
- [ ] Touch targets, contrast, semantic labels, screen reader focus/order, dynamic text, RTL where required, and haptic/sound preferences.
4. State management and data flow
- [ ] Separate server state, ephemeral UI state and durable preferences; avoid global state for local form concerns.
- [ ] Choose state tools based on complexity (e.g., TanStack Query for remote cache; Zustand/Redux only where justified); no redundant sources of truth.
- [ ] Stable cache keys include user ID, date range, filters, currency and relevant parameters; invalidate dependent screens after mutations.
- [ ] Prevent stale requests overwriting new results; cancellation, debouncing, pagination, deduplication, stale-time and retry policy documented.
- [ ] Persist only necessary state; use encrypted secure storage for tokens, not plain AsyncStorage; clear on logout and user switch.
- [ ] Handle app lifecycle, timezone/month rollover, clock drift and server reconciliation; do not trust device clock for authoritative finance state.
- [ ] Ensure subscriptions, listeners, timers, animations and background jobs are cleaned up; no duplicate handlers or memory leaks.
5. Performance and build size
- [ ] Profile startup cold/warm, navigation transitions, list scrolling, charts, memory, CPU, battery and network on representative low-end Android and iPhone.
- [ ] Set team budgets for startup, interaction latency, frame drops, memory, screen payload and app binary size; compare before vs after in CI or release review.
- [ ] Virtualize long lists (FlatList/FlashList as appropriate), use stable keys, memoize only when profiling warrants, avoid heavy render work and N+1 network calls.
- [ ] Lazy-load routes/assets, reduce JS bundle weight, tree-shake where supported, inspect Hermes and source maps, avoid duplicated polyfills and large animation libraries.
- [ ] Compress assets, remove unused fonts/locale packs/icons, audit native modules, compare Android AAB and iOS IPA size; review OTA update payload size.
- [ ] Prevent request waterfalls; batch/paginate, cache safely, use background refresh and adaptive retries; no unbounded polling.
- [ ] Monitor startup, ANRs, crash-free sessions, JS errors, navigation latency, render stalls and size trend after rollout.
6. Security, privacy and platform
- [ ] Auth/session lifecycle, refresh-token handling, secure keychain/keystore, biometric gating where relevant, and no secrets bundled in app.
- [ ] Treat client checks as UX only: backend authorizes every user-scoped financial operation and verifies ownership.
- [ ] TLS everywhere; verify certificate/transport settings; no sensitive tokens in URLs, logs, analytics, deep links, screenshots or clipboard.
- [ ] Minimize permissions (notifications, files, camera, contacts); explain purpose, handle denial, and audit SDK data collection/privacy disclosures.
- [ ] Prevent sensitive screen exposure where appropriate (app switcher previews/screenshots), protect PDF exports and temporary files, remove after sharing when feasible.
- [ ] Validate incoming deep links and external content; escape rendered text; avoid unsafe WebView bridges and untrusted HTML.
- [ ] Check Expo config, native permissions, Android/iOS privacy manifests, signing, app-store requirements, OTA update compatibility and rollback.
7. Testing and maintainability
- [ ] TypeScript strictness, ESLint/Prettier, component boundaries, no dead code, no any without justification, meaningful error types.
- [ ] Unit tests for currency/date/formatting/state reducers; component tests for forms and accessibility; E2E for login, expenses, splits, payments, reports and exports.
- [ ] Mock server faults, timeouts, 401/403/409/429/500, empty/partial responses, offline transitions, duplicated responses and race conditions.
- [ ] Snapshot tests used sparingly; favor behavior assertions; test native module behavior on real builds, not Expo Go alone.
- [ ] Error boundaries and crash recovery; structured sanitized logging and correlation IDs; feature flags and rollback plan.
- [ ] Document screen ownership, API contracts, dependency map, design decisions, user-facing copy and localization.
8. Suggested command/evidence inventory
Record actual scripts from repository rather than assuming they exist: npm ci, npx tsc --noEmit, npm run lint, npm test, npx expo-doctor, npx expo export, eas build (preview/production), dependency audit, E2E runner, Android/iOS native profiler, bundle analyzer, accessibility audit. Track results by commit and device.
9. Frontend release checklist
- [ ] App icons/splash, error/loading/empty states, reduced-motion behavior, offline fallback, notifications and deep links verified.
- [ ] Android/iOS signing, environment separation, feature flags, crash reporting, privacy disclosures and store review compliance verified.
- [ ] Staged rollout with kill switch or rollback for risky features; compatibility with currently deployed backend versions.
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
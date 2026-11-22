Reports Module — Frontend Functional Requirements and Dependencies
Target: React Native / Expo native mobile application
Status: Implementation specification; distinguishes migrated behavior from recommended corrections.
1. Purpose and scope
Reports is a read-only, authenticated spending analysis experience. It presents Overview and Analytics views, preset time ranges, independent source filters, and a shareable PDF. It must not create expenses, settle splits, or change account balances. The web /reports route becomes a native navigation screen.
2. Concepts and reporting rules
Concept	Requirement
Presets	This Month, Last Month, Last 3 Months, This Year, All Time.
Sources	Expenses, Subscriptions, Goals, Splits; filters operate on mutually exclusive reporting classifications.
Total Spent	Sum of included user-attributable spending events; no duplicate expense/split counting.
Daily Average	Total divided by documented calendar-day denominator, including zero-spend days; current-period denominator ends today.
Largest Spend	Largest eligible individual event, not largest monthly aggregate.
Top Category / Payment	Largest amount by category / method; deterministic tie behavior.
PDF	Immutable export snapshot with selected period, sources, currency, timezone, generation timestamp, and chart summaries.


Product decision required: Split spending can mean a user's allocated share, their cash outflow, or settlement transfers. The supplied source describes user owed participation. Use allocated share consistently and exclude any duplicate underlying expense; do not equate it with cash-flow reporting. A split settlement is not new spending.
3. User-facing requirements
3.1 Overview
1. Show Overview and Analytics tabs, with accessible native tab navigation.
2. Show Total Spent, Daily Average, Largest Spend, Top Category, and Top Payment; distinguish zero from unavailable.
3. Provide the five date presets and four source toggles; show current selection persistently.
4. Refresh the report on filter change without navigation reload. Cancel or ignore stale responses when a newer selection supersedes them.
5. Show skeleton/loading, empty, partial-data, retry, and offline-stale states. Do not silently display incomplete totals as complete.
6. Show currency-formatted amounts and a readable range label; never assume all transactions are INR unless the product enforces INR-only storage.
3.2 Analytics
1. Display Spending Trend, Category Distribution, and Payment Methods charts, with accessible text summaries and legends.
2. Respect the same period, source filters, classification, and rounding rules as Overview.
3. Trend buckets must be consistent with the chosen range and the backend timezone policy; include zero-value buckets where meaningful.
4. Category and payment totals must reconcile to the applicable source subtotal. Unspecified split payment methods should be shown as Unknown/Unattributed, not guessed.
5. Support long category labels, small screens, landscape, large font sizes, dark mode, and reduced-motion settings.
3.3 Export and share
1. Header export opens a native export workflow; show progress and failure/retry state.
2. Generate PDF from a frozen report snapshot, not asynchronously changing screen pixels. Include tabular chart data so off-screen content is represented.
3. Use an Expo-compatible print/PDF facility (e.g. expo-print) and native sharing (expo-sharing) where supported; test platform capabilities and permissions.
4. PDF export must not require broad storage permissions. Use app cache and the OS share sheet; clean up temporary files.
5. Disable export while report data is incomplete unless the PDF explicitly labels the partial state.
6. Include active date range, source toggles, generated-at timestamp, totals, chart labels, and data coverage. Avoid exposing sensitive data in filenames or logs.
4. Frontend architecture
Layer	Responsibility
ReportsScreen	Tabs, filters, summaries, charts, export entry point.
ReportQuery / ReportService	Typed API calls, request cancellation/versioning, caching, data freshness and state reconciliation.
ReportFilterState	Preset, toggles, effective date range and reporting timezone.
ReportChartComponents	Native-compatible charting, accessibility fallback, no DOM dependencies.
ReportExportService	Snapshot freeze, PDF layout, OS share sheet, temp-file cleanup.
Auth/session layer	Authenticated API access and immediate cache clearing on logout/account switch.


Use the existing Expensio mobile navigation/state conventions. Do not port Angular signals, Supabase browser queries, Chart.js, html2canvas, or jsPDF directly as native implementations.
5. Data/API contract consumed by mobile
GET /api/v1/reports?period=THIS_MONTH&sources=EXPENSES,SUBSCRIPTIONS,GOALS,SPLITS (illustrative contract; align with actual backend routing). Response should contain: effective startInclusive, endExclusive, timezone, currency, generatedAt, dataAsOf, filters, isComplete, totals, dailyAverage, largestSpend, topCategory, topPayment, trend[], categories[], paymentMethods[], and optional warnings[].
- The backend, not the phone, authoritatively computes classifications, user attribution, and aggregated totals.
- IDs and monetary values must use safe serialization; amounts should be decimal strings or minor-unit integers, never JS floating-point arithmetic for money.
- The client may locally cache last-successful snapshots with explicit freshness labels; no cached report may survive logout or account switch.
- For All Time, support backend pagination/aggregation without downloading the entire transaction history.
6. Native lifecycle and offline behavior
- Revalidate on screen focus, app resume, date/month rollover, and explicit pull-to-refresh.
- Recompute relative preset boundaries when the timezone or local calendar day changes; the backend is authoritative about effective boundaries.
- Offline: display a clearly marked cached snapshot when safe; do not imply it is current. Export cached data only if labeled with its dataAsOf timestamp.
- Use screen-reader labels, large touch targets, readable contrast, and meaningful empty-state copy.
- Debounce filter changes where useful, but preserve the latest chosen state and prevent mixed-filter charts.
7. Cross-module dependencies
Module	Frontend integration
Expenses	Standard transactions and category/payment labels.
Subscriptions	Expense-linked payments classified by subscription_id; do not count plan face value as spend.
Goals	Goal-linked funding expenses classified separately under a defined spending-vs-transfer policy.
Splits	User-attributable share events; never use full group total or settlement twice.
Dashboard	Shared date range and aggregation definitions; same totals should reconcile.
Accounts/Budgets	No writes; reporting category rules may be shared, but account transfers must not be mistaken for expenses.
Authentication	Scope report requests and caches to the signed-in account.


8. Data flows
Load: user selects period/sources → typed authenticated report request → server returns one consistent snapshot → cards and charts render from the same response.

Export: user taps export → freeze current successful snapshot → build PDF with all charts and underlying summary tables → open native share sheet → clear temporary file.

Logout: clear filter-dependent report data, pending requests, cached snapshots, and export artifacts.
9. Acceptance criteria
1. Only the signed-in user's report appears; account switch clears previous account data immediately.
2. All five presets and four source filters update both tabs consistently.
3. Totals reconcile with category/source subtotals and do not double-count linked subscription/goal/split expenses.
4. A user's split allocation is included only once and never uses the entire group's amount.
5. Daily Average and Largest Spend remain accurate for long-range presets, not estimated from monthly totals.
6. No-data, slow network, partial data, and offline states are distinguishable.
7. A late response from an older filter selection cannot replace the newer report.
8. Charts are readable and accessible on small screens and with large text.
9. Export includes all report information, including content not currently visible on screen, and uses native sharing.
10. Calendar rollover and resume refresh preset boundaries and data.
10. Known gaps, corrections, and implementation checklist
- Correct: web-only chart/PDF packages and DOM capture are unsuitable for native mobile.
- Correct: monthly aggregate rows alone cannot yield exact largest transaction, daily average under arbitrary periods, or all filter combinations unless the backend explicitly supports those aggregates.
- Correct: the same linked expense must belong to one mutually exclusive source class, with documented precedence.
- Correct: split owed allocation is a business definition, not automatically equivalent to cash spent.
- Add: report snapshot versioning/freshness, offline labels, stale-request suppression, accessibility, and native share handling.
- Add: server-provided timezone and data coverage, and reconciliation tests across dashboard/report views.
- Open decision: define whether goal contributions count as spending or internal transfers and how split repayments are displayed.
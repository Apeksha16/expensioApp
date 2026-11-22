Ledger Module
Frontend Development Requirements
1. Module Overview
The Ledger module is a personal IOU register for money lent to or borrowed from another person. It must support creating obligations, recording repayments and adjustments, reviewing outstanding balances, and settling obligations. It must not silently create Expenses, Splits, or account transactions.

The mobile application must use native navigation, accessible screens and bottom sheets, device-appropriate date and amount inputs, and reliable state restoration.
2. Ledger Home Screen
2.1 Balance Summary
Display You'll Get (sum of positive outstanding balances) and You Owe (absolute sum of negative outstanding balances). If retaining legacy Money Out and Money In labels, explain that they represent money lent and borrowed still outstanding, not cash-flow totals. Never net the two totals into a single ambiguous value.
2.2 Entry List
Show counterparty name, purpose, original direction and amount, original date, current signed balance expressed as You'll Get / You Owe / Settled, and latest activity where available. Sort by entry date descending by default; allow filtering by outstanding, settled, direction and date, plus text search. Include empty and no-results states. Selecting an entry opens its details.
2.3 Create Action
The context-sensitive add action opens the create-ledger-entry form. Keep form state when interrupted by navigation or app backgrounding without persisting sensitive data in plaintext.
3. Create and Edit Ledger Entry
Require person name, original amount of at least ₹1, direction (I lent money / I borrowed money), and date. Purpose is optional, consistent with the data contract; do not incorrectly require it. Limit text lengths and trim whitespace. Amounts must support rupees and paise, be positive, and use decimal-safe validation. Default date to today in the user's configured timezone.

Provide an optional linked friend/contact reference, but allow a free-text counterparty; do not require contact permissions. Contact selection requires explicit user permission and must degrade gracefully if denied.

Editing the original amount or direction after repayments exist must show the resulting balance and require confirmation. Do not permit edits that violate the configured overpayment policy; offer a reversal/correction flow. Preserve prior values in audit history. Deletion requires explicit confirmation describing the loss of repayment history and must be blocked while the operation is pending.
4. Ledger Entry Details
Show counterparty, original amount and direction, date, purpose, total received, total paid, outstanding amount, and chronological transaction history. Use explicit labels instead of displaying negative currency values without context.

Show Settled only when the server-computed balance is exactly zero in paise. Allow a settled entry to remain visible and accessible in history. Provide edit, delete and repayment/adjustment actions subject to authorization and business rules.
5. Repayments and Adjustments
5.1 Record Transaction
Allow entry of positive amount, direction, date, and optional purpose. Use Received money for in and Gave money for out. Preview the balance before confirmation. A repayment must be distinguishable from a non-cash correction, if adjustments are supported.
5.2 Settle in Full
For a positive balance, prefill a received (in) transaction for the remaining amount. For a negative balance, prefill a given (out) transaction for its absolute amount. Disable the shortcut when already settled. Confirm amount, direction, and new balance before submission.
5.3 Partial Repayment and Overpayment
Allow partial repayment. By default, prevent repayment from crossing zero or reversing who owes whom; explain the limit and offer a separate new obligation or explicit adjustment workflow. Do not silently convert an overpayment into a reverse debt. The server must enforce the same rule.
5.4 Corrections and History
Allow eligible transactions to be corrected or reversed with a confirmation and reason, preserving audit history. If edits/deletes are exposed, the UI must display the recalculated result and respect server restrictions. Clearly distinguish recorded, corrected, and reversed events.
6. Mobile Navigation and Lifecycle
Use the app's standard stack navigation and modal/bottom-sheet conventions. Deep links to /ledger/:id equivalents must verify authorization and handle missing/deleted entries. Handle Android back gestures, iOS swipe dismissal, keyboard overlap, safe areas, and screen-reader labels. Refresh stale data on foreground/resume and on reconnect; avoid duplicate requests and lost form input.
7. Offline, Sync, and Error States
Cache authorized ledger data securely for optional offline read-only viewing; clear it on logout/account switch. Do not claim a repayment is confirmed until the server acknowledges it. For failed or timed-out writes, preserve the form and safely retry with the same idempotency key; never create duplicate payments. Handle conflicts with a refresh-and-review prompt. Reconcile server updates across devices via supported realtime or foreground refresh/polling fallback.

Show loading, refreshing, empty, offline, unauthorized, validation, conflict, and server-error states. Provide accessible success/error feedback without leaking sensitive details in notifications.
8. Privacy and Security
Only display the authenticated user's authorized records. Never trust a client-side owner filter as authorization. Do not log names, purposes, or financial data in analytics/crash reports. Avoid showing private amounts in lock-screen notifications by default. Clear sensitive in-memory state on logout.
9. Cross-Module Behavior
Ledger records must remain independent of Expenses, Splits, Accounts, Budgets, and Reports by default. If account linking is added, it must be an explicit opt-in operation with a visible linked transaction and duplicate-prevention rules; do not double count the same transfer. A friend link is optional and must not change Ledger ownership or access rights.
10. User Feedback and Confirmations
Confirm entry deletion, original-value changes affecting repayments, settlement, and reversals. Show server-confirmed balances after writes. Prevent repeated taps during pending operations and display actionable error messages.
11. Frontend Acceptance Criteria
1. Users can create and view lent and borrowed obligations with accurate labels.
2. A ₹1,000 lent entry shows ₹1,000 in You'll Get; ₹400 received leaves ₹600.
3. A ₹1,000 borrowed entry shows ₹1,000 in You Owe; ₹400 given leaves ₹600 owed.
4. Settle-in-full proposes the correct direction and exact remaining amount.
5. Partial repayments update details and overview from server-confirmed balances.
6. An overpayment is rejected under the default policy, including after concurrent updates.
7. Editing/reversing transactions updates balance and retains auditability.
8. Deleting an entry requires confirmation and does not leave visible orphan history.
9. App restarts, network interruptions, and retries cannot silently duplicate repayments.
10. Cross-device changes refresh the screen without exposing another user's records.
11. Invalid amounts, names, directions and dates are rejected with clear feedback.
12. Ledger does not automatically modify Expenses, Splits or account balances.
12. Corrections and Implementation Decisions
- Corrected: Purpose is optional in the provided database contract, despite being listed as required in the existing form requirements.
- Clarified: Money In/Out summaries describe outstanding IOUs, not cash flow.
- Changed from current permissive behavior: Default repayment policy blocks crossing zero; any intentional adjustment must be explicitly identified and audited.
- Added: Native lifecycle, secure offline read-only cache, safe retries, conflict handling, and accessibility.
- Requires product decision: Whether to permit reversal of a settled obligation, whether to support explicit cross-zero adjustments, and whether account transfers can be linked.
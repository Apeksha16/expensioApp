Goals Module
Frontend Development Requirements
1. Module Overview
The Goals module enables an authenticated user to plan savings targets, contribute funds, follow a recurring contribution schedule, and review progress and funding history. This document specifies the target native Android/iOS experience, not a description of the existing Angular implementation. Goal installments are savings schedules and are distinct from loan EMIs.

The module must support creating and editing goals, optional opening balances, monthly/every-two-months/quarterly schedules, calculated contribution suggestions, full and partial funding, skip/reschedule actions, completed goals, and auditable history. Funding must not be presented as a bank transfer unless a real payment integration exists.
2. Goals Home Screen
2.1 Summary
- Display total saved across active and completed goals, with a clearly labeled scope.
- Show active goals separately from completed goals; never make completed goals inaccessible.
- Display each goal's name, icon, target date, frequency, saved and target amounts, remaining amount, suggested contribution, and progress.
- Cap the visual progress bar at 100%; do not hide invalid overfunding silently.
- Provide an add-goal action and pull-to-refresh.
2.2 Lists and Filtering
- Provide Active and Completed tabs, ordered by next contribution date or most recent activity as appropriate.
- Support accessible empty states and a consistent currency display with paise precision.
- Opening a goal navigates to its detail screen; back navigation preserves list position and filter.
3. Create and Edit Goal
3.1 Fields
- Name (required, trimmed, length-limited), target amount (at least ₹1), optional icon, target date, contribution frequency, and installment day (1–31).
- Opening saved amount defaults to ₹0 and must be explicitly represented as an opening funding record if greater than zero; it cannot be ignored or independently set without an auditable record.
- Default target date is one year ahead, frequency monthly, installment day 1.
- Frequency labels must be unambiguous: Monthly, Every 2 Months (legacy alternate), and Quarterly.
- Use native date pickers and numeric keyboard with locale-aware input; send canonical decimal amounts and ISO dates to the API.
3.2 Validation and Editing
- Reject empty names, invalid dates, negative funding, opening balance greater than target, and nonpositive target amounts.
- Show the suggested contribution before saving, with the number and dates of remaining installments and any final rounding adjustment.
- Do not silently overwrite user-selected target dates or contribution days when other fields change.
- Editing target/frequency/day must preview schedule changes; previously paid or skipped installments and funding history must remain intact.
- Rename a goal by ID, not by changing funding transaction titles. Legacy title matching is migration-only.
- Warn before reducing the target below already funded value; reject unless a defined refund/withdrawal flow resolves the difference.
4. Contribution Schedule and Calculation
4.1 Suggested Amount
- Remaining amount = max(0, target − confirmed saved).
- The backend owns the authoritative schedule and suggested contribution; the app may show a preview using identical rules.
- Schedule installments on actual eligible due dates through the target date, rather than only dividing the calendar-month difference.
- Use a consistent timezone for the user's schedule; for days 29–31, clamp to the last day of shorter months.
- Allocate amounts in paise and distribute rounding to the final installment so scheduled amounts sum exactly to the remaining target.
- When the target date has passed, show Overdue / Needs rescheduling rather than pretending a future installment exists.
- Explain that suggested amounts are planning guidance, not bank debits or interest-bearing EMIs.
4.2 Schedule Display
- Show upcoming, due, overdue, partially paid, paid, and skipped installments with amounts and dates.
- The current actionable installment is the earliest eligible unpaid installment; skipping one must advance to the next eligible installment.
- Display the effect of Extend (move target date by one frequency interval and regenerate future unpaid schedule) versus Adjust (retain target date and redistribute unpaid target across remaining eligible installments).
- If Adjust leaves no eligible installments, require a new target date or another explicit resolution before confirming.
5. Goal Detail and Funding
5.1 Detail Screen
- Show target, saved, remaining, progress, target date, schedule, suggested installment, funding history, and status.
- Show funding records with date/time, amount, source/account if linked, installment association, and correction/reversal status.
- Show opening funds distinctly from later contributions.
5.2 Add Funds
- Provide Pay Scheduled Installment and Custom Contribution actions. These record a savings allocation, not a real-world payment initiation.
- Prefill the unpaid installment remainder in scheduled mode; permit positive partial amounts up to the remaining installment and goal balances.
- In custom mode, let the user choose whether to associate the contribution with an eligible installment; clearly show how unallocated funds affect goal progress and future schedule.
- Display amount, target goal, selected installment, and optional source account before confirmation.
- Prevent double submission while saving and use a client-generated idempotency key for retries.
- After success, refresh goal, installment, account/expense-linked views, and history from server-confirmed data.
5.3 Corrections and Withdrawals
- Allow authorized edits or reversals of funding with a reason; preserve an audit trail rather than silently rewriting financial history.
- A correction must recalculate saved balance, installment status, and remaining schedule.
- A withdrawal is a distinct action, if enabled, with clear account implications; it must not be implemented as a negative contribution disguised as an ordinary funding record.
6. Installment Actions
- Full settlement records only the unpaid portion of the selected installment.
- Partial settlement updates the paid portion and displays the outstanding remainder.
- Skip actions require confirmation and an Extend or Adjust choice, with a before/after schedule preview.
- Paid installments cannot be skipped without first correcting/reversing their funding.
- Repeated taps, retries, or a second device must not create duplicate contributions or duplicate skip operations.
7. Completed Goals and Deletion
- Mark a goal completed when confirmed saved amount reaches its target; display its history in Completed.
- Reopen a completed goal only through an explicit edit/reversal that makes the target unmet.
- Offer Archive for preserving history. Deletion must show consequences and follow backend retention rules.
- Do not delete linked expense/account records or scheduled installments silently. If deletion is restricted by funding history, explain why and offer archive instead.
8. Integration With Other Modules
- Expenses: funding is recorded as a goal-linked virtual-invest entry only if this is the chosen ledger model; display it as savings allocation, not ordinary consumption spending.
- Accounts: do not deduct funds unless an account is explicitly selected and the operation is confirmed as a transfer/allocation. Avoid duplicate deductions.
- Reports and Budgets: apply one consistent classification so funding is not counted as both a purchase and a transfer.
- Dashboard: upcoming goal contributions must reflect skipped, paid, overdue, and rescheduled installments.
- General EMI module: no shared installment state or automatic cross-module payment creation.
9. Native Mobile Experience
- Use safe areas, native navigation, bottom sheets where appropriate, keyboard avoidance, accessible tap targets, screen-reader labels, dynamic text sizing, and dark-mode support.
- Show skeleton loading, empty, offline, retryable-error, validation, and conflict states.
- Cache last successfully loaded goals and history securely for offline viewing; clearly label stale data.
- Do not queue financial writes offline by default. If queued writes are later supported, require explicit confirmation, durable idempotency, and conflict handling.
- Refresh on app foreground, account change, and successful mutations; use realtime/push only as a hint followed by authoritative fetch.
- Schedule local reminders only with consent, reschedule after edits/skips, and avoid claiming payment occurred because a notification fired.
- Clear user-scoped cached data on logout and account switch.
10. Feedback and Security
- Provide clear success/failure feedback for create, edit, fund, correct, skip, archive, and delete actions.
- Never display optimistic saved totals as confirmed before the backend accepts the mutation.
- Avoid exposing account identifiers, auth tokens, or sensitive funding details in logs and notifications.
- Require reauthentication for sensitive financial changes only where the application's security policy requires it.
11. Frontend Acceptance Criteria
1. A user can create a goal with an opening amount, and that amount persists as an auditable funding entry.
2. Active and completed goals remain accessible with accurate totals and progress.
3. Schedule preview and backend results agree for all frequencies, leap years, and 29th–31st due days.
4. Partial funding and full settlement never exceed installment or goal remaining amounts.
5. Skipping with Extend and Adjust produces visibly different, correct future schedules.
6. Editing or reversing funding updates saved amount, installment status, and history consistently.
7. Repeated submission or network retry does not duplicate a contribution.
8. Offline viewing, reconnection, foreground refresh, and cross-device changes are handled clearly.
9. Funding does not silently change accounts, expenses, or budgets outside the defined integration rules.
10. Goal archiving/deletion preserves financial history according to the backend policy.
11. Mobile accessibility, navigation, validation, and error states work on Android and iOS.
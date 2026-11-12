# Expenses Module — Backend + Frontend

> Purpose: let users record expenses that are personal or associated with them, optionally split an expense with others while adding it, view monthly totals, and edit or delete expenses. Follow the existing Expensio design system. Expenses are the source of truth for spending in Budgets, Dashboard and Ledger; never store duplicated spending totals.

---

# Phase 1 — Expenses Screen

## 1.1 Monthly Total and Month Filter

**Backend**
- Provide a monthly summary endpoint returning the total expense amount for a given month (YYYY-MM) and currency.
- Calculate the total from the user's own amounts only: the full amount for non-split expenses, the user's share for split expenses, and the user's share of expenses created by others that include them.
- Compute the total independently of list pagination.
- Bucket expenses by their expense date, not their creation time.

**Frontend**
- Show the total expenses for the selected month prominently at the top of the screen.
- Provide a month selector to move between previous and later months, with the month and year clearly displayed.
- Default to the current month (using the device's local timezone) every time the screen opens.
- Update the total and the list when the month changes; never mix months.
- Show a loading state for the total and a retry option on failure.
- Show a zero total with an empty state when the month has no expenses; never display fabricated amounts.

## 1.2 Expense List and Infinite Scroll

**Backend**
- Return expenses for the selected month using cursor-based pagination, ordered by expense date then creation time, newest first.
- Include in each item: ID, name, amount (minor units), currency, payment mode, category ID, category name, icon ID, expense date, split indicator, user's share, creator reference and permission flags (canEdit, canDelete).
- Return only expenses the user created or is a participant in.
- Return a next-page cursor and a has-more flag.

**Frontend**
- List expenses for the selected month below the total using infinite scroll, loading the next page when the user nears the end of the list.
- Show a loading indicator while fetching the next page and an end-of-list state when no more data exists.
- Prevent duplicate page requests and duplicate list items.
- Reset the list and cursor when the month changes.
- Each row shows the category icon (the same icon as the associated budget), name, amount, payment mode and date.
- For split expenses show a split badge, the user's share, and the creator's name when someone else created it.
- Show Edit and Delete only where the backend permits them.
- Provide an Add Expense action on this screen.

---

# Phase 2 — Add Expense

## 2.1 Expense Form

**Backend**
- Accept: name, amount, payment mode, category ID, expense date and an optional split definition.
- Validate the name (trimmed, required, length-limited) and the amount (positive, within configured limits, stored as integer minor units).
- Validate that the payment mode is one of CASH, DEBIT_CARD or CREDIT_CARD.
- Reject expense dates in the future; default the date to today. Future payments belong in Upcoming Payments.
- Support idempotency keys so repeated submissions never create duplicate expenses.

**Frontend**
- Provide fields for expense name, amount, payment mode (Cash, Debit Card, Credit Card), category, date and a Split toggle.
- Default the date to today and allow changing it to a past date only.
- Use a numeric keypad for amount input; accept zero-decimal and valid decimal values; reject negative, zero and invalid characters.
- Validate all required fields inline and disable Save while the form is invalid.
- Prevent duplicate submissions while saving.
- Show a success toast and return to the list, refreshing the total and list.

## 2.2 Category Selection

**Backend**
- Serve categories from the Budgets module: the user's budget categories, each with category ID, name and icon ID, plus the system Others category.
- Reject category IDs that do not belong to the user.
- Never expose another user's categories.

**Frontend**
- Display categories dynamically from the Budgets module with their budget icons; do not hardcode category lists in this module.
- Show the selected category and icon in the form and use the same icon in the expense list, detail and edit screens.
- When the user has no budget categories, show only Others and a shortcut to create a budget category in the Budgets module.
- Preserve entered form data when navigating to create a category and returning.

## 2.3 Payment Mode and Money Source

**Backend**
- Map payment mode to a budget money source: CASH maps to the Cash source; DEBIT_CARD and CREDIT_CARD map to the Monthly Income / Salary source.
- Store the payment mode and derive the money source from it; do not store a duplicate source value that can become inconsistent.
- Make the mapping configuration-driven so it can be changed without code changes.

**Frontend**
- Show payment mode as three selectable options with clear selected state.
- Do not expose the money source as a separate field; derive it from the payment mode.

---

# Phase 3 — Split Expenses

## 3.1 Split Setup While Adding

**Backend**
- Accept an optional split definition with a split type, a participant list and each participant's share in minor units.
- Support split types EQUAL and EXACT_AMOUNT.
- Require the creator to be included in the split and at least one other participant.
- Validate that participants are known users from the Splits module (the creator's contacts/friends) and that there are no duplicates.
- Validate that the sum of all shares equals the expense amount exactly; for equal splits, distribute rounding remainders deterministically in minor units.
- The creator is recorded as the payer of the full amount.

**Frontend**
- When Split is turned on, show participant selection from the Splits module's known people and a split type selector (Equal or Exact amount).
- For Equal, show the computed per-person share live; for Exact amount, show a running total and the remaining difference.
- Block saving until all shares add up to the expense amount.
- Show the creator's own share clearly.
- Preserve split inputs when the amount changes, recalculating Equal shares and flagging mismatched Exact shares.

## 3.2 Visibility and Ownership

**Backend**
- Make a split expense visible to the creator and every participant.
- Record the creator as the only owner; only the creator can edit or delete the expense.
- Return canEdit and canDelete permission flags based on ownership.
- Create the participant share records in the same transaction as the expense.
- Publish a split-created event through the outbox so the Splits and Ledger modules and notifications can process it.

**Frontend**
- Show split expenses to participants as read-only, labeled with who created them and the participant's own share.
- Hide or disable Edit and Delete for participants, with a short explanation that only the creator can change the expense.
- Count only the participant's own share in their monthly total.

## 3.3 Participant Budget Association

**Backend**
- For a participant, place their share in Others (unallocated) by default, since they have not chosen a category or payment mode for it.
- Allow the participant to assign their share to one of their own budgets through the Budgets module's assignment action, without changing the original expense.
- Never let a participant modify the original expense's name, amount, category, date, payment mode or participants.

**Frontend**
- Show a participant's share as unallocated until they assign it in Budgets.
- Provide a clear link from the share to the Budgets assignment action.

---

# Phase 4 — Edit and Delete

## 4.1 Edit Expense

**Backend**
- Allow edits of name, amount, payment mode, category, date and split definition by the creator only; return 403 with code EXPENSE_NOT_OWNER for anyone else.
- Apply the same validation rules as creation.
- When a split expense is edited, update participant share records in the same transaction and publish an update event so participants are notified.
- Reject changes to the participant list or amounts that conflict with settled shares, if the Splits module has recorded settlements, using a clear error code.
- Recalculate dependent budget totals and the monthly summary through the expense source of truth; do not store derived totals.
- Use optimistic concurrency (version or updated-at check) to avoid overwriting concurrent edits.

**Frontend**
- Open the same form prefilled with the saved values; reuse the Add Expense screen.
- Preserve the original values if validation or saving fails.
- If the date moves to another month, remove the expense from the current month's list and update both months' totals.
- Show a success toast and update the list and total immediately.
- Handle conflict errors by refreshing the expense and asking the user to review.

## 4.2 Delete Expense

**Backend**
- Allow deletion by the creator only; use soft deletion so audit history and ledger consistency are preserved.
- On deleting a split expense, remove it from every participant's list and total in the same transaction and publish a delete event.
- Reject deletion if the Splits module has settled shares, with a clear error code.
- Support idempotent deletion: repeating a delete returns the same successful result.

**Frontend**
- Show a confirmation dialog before deleting; for split expenses, state that it will also be removed for all participants.
- Prevent accidental deletion through a single unconfirmed tap.
- Update the list and monthly total immediately after backend confirmation.
- Show a success toast, or an error with retry on failure.

---

# Phase 5 — Budget and Module Integration

## 5.1 Budget Association

**Backend**
- Associate each expense with the user's budget matching its category, month and derived money source.
- If no matching budget exists, treat the expense as unallocated under Others, as defined in the Budgets module.
- Reassign associations automatically when the category, amount, date or payment mode changes, or when the expense is deleted.
- Count every expense in exactly one budget or in Others, never both.
- Expose expense data to Budgets, Dashboard and Ledger through the same queries; do not duplicate expense records.

## 5.2 Immediate Updates

**Frontend**
- After any add, edit or delete, refresh the Expenses list and total, and invalidate cached Budgets, Dashboard and Ledger data so they recalculate immediately.
- Never show fabricated totals while data is loading or unavailable.

---

# Phase 6 — Database and Data Integrity

## 6.1 Entities

**Backend**

Implement:
- expenses — ID, creator user ID, name, amount (minor units), currency, payment mode, category ID, expense date, is split, version, created at, updated at, deleted at.
- expense_participants — ID, expense ID, user ID, share amount (minor units), role (CREATOR or PARTICIPANT), settlement status.
- expense_idempotency_keys — key, user ID, request hash, result reference, expiry.
- audit_logs — create, update and delete activity.
- outbox_events — reliable asynchronous events for splits, ledger and notifications.

## 6.2 Integrity Rules

**Backend**
- Use UUID primary keys and proper foreign keys.
- Store money as integer minor units with an ISO currency code; never floating point.
- Enforce that participant shares sum to the expense amount at write time and verify within the transaction.
- Enforce one participant record per user per expense.
- Index by creator and expense date, and by participant user and expense date, to support month queries and pagination.
- Use database transactions for create, edit and delete of split expenses; roll back completely on failure.
- Use migrations for all schema changes.

---

# Phase 7 — APIs

## 7.1 Expense APIs

**Backend**

| Method | Endpoint | Functionality |
|--------|----------|---------------|
| GET | /v1/expenses | List expenses for a month with cursor pagination |
| GET | /v1/expenses/summary | Monthly total for a given month |
| POST | /v1/expenses | Create an expense, optionally with split |
| GET | /v1/expenses/{id} | Retrieve a single expense |
| PUT | /v1/expenses/{id} | Edit an expense (creator only) |
| DELETE | /v1/expenses/{id} | Delete an expense (creator only) |
| GET | /v1/expenses/categories | Categories and icons from Budgets, including Others |
| GET | /v1/expenses/config | Payment modes, limits and split types |

## 7.2 Response Handling

**Backend**
- Use consistent response structures with meaningful HTTP status codes.
- Return machine-readable error codes (for example EXPENSE_NOT_OWNER, SPLIT_TOTAL_MISMATCH, INVALID_CATEGORY, FUTURE_DATE_NOT_ALLOWED, EXPENSE_HAS_SETTLEMENTS, VERSION_CONFLICT) and field-level validation errors.
- Include request IDs; never expose internal exceptions or SQL errors.
- Support idempotency keys on create.

## 7.3 API Communication

**Frontend**
- Use typed request and response structures and connect the list, summary, add, edit and delete screens to these APIs.
- Display backend validation errors against the relevant fields.
- Handle loading, empty, error, offline and timeout states with retry where appropriate.
- Never assume an operation succeeded before receiving backend confirmation.
- Send monetary values in the backend's expected minor-unit format.

---

# Phase 8 — Frontend Architecture

**Frontend**
- Keep UI components, business logic, state management and API communication in separate layers.
- Create an expense service exposing getExpenses(), getMonthlySummary(), createExpense(), updateExpense(), deleteExpense() and getCategories().
- Keep one centralized state for the selected month, the list, the cursor and the monthly total, shared with Budgets and Dashboard.
- Cache pages per month and invalidate on any mutation.
- Handle app backgrounding and reopening without losing unsaved form data.
- Avoid duplicated expense data across screens.

---

# Phase 9 — Security and Abuse Prevention

**Backend**
- Validate every request with strict schemas and apply authentication and authorization guards.
- Verify ownership on every operation to prevent IDOR; participants may only read.
- Verify that categories and participants belong to or are known by the requesting user.
- Use parameterized queries and apply rate limits to create, edit and delete.
- Mask sensitive data in logs and write audit logs for create, edit and delete.
- Restrict expense access to creators and participants only.

---

# Phase 10 — Reliability

**Backend**
- Ensure notification or event failures never roll back an already committed expense.
- Process outbox events with retry policies and failed-event handling, avoiding duplicate processing.
- Handle concurrent edits and duplicate create requests safely.
- Handle database failures without leaving partial expense or participant records.

**Frontend**
- Show clear, actionable error messages and preserve form data on recoverable failures.
- Prevent duplicate submissions and repeated page requests.
- Handle expired sessions by following the standard token-refresh flow.

---

# Phase 11 — Testing and Verification

## 11.1 Backend Testing
- Test creating personal and split expenses, including rounding in equal splits and share-sum validation.
- Test creator-only edit and delete, and participant read-only access.
- Test cross-user access restrictions and invalid category rejection.
- Test cursor pagination, month bucketing and monthly totals, including split shares.
- Test idempotent create and delete, and optimistic concurrency conflicts.
- Test transaction rollback and outbox retries.

## 11.2 Frontend Verification
- Verify the current month is the default and month changes reload the total and list.
- Verify infinite scroll loads further pages without duplicates and shows an end state.
- Verify adding an expense with each payment mode and category, with the budget icon shown in the list.
- Verify the Split flow for Equal and Exact amount, and that Save is blocked until shares match.
- Verify participants see read-only split expenses and the creator sees Edit and Delete.
- Verify editing and deleting update the list, total and dependent Budgets and Dashboard immediately.
- Verify moving an expense to another month updates both months.
- Verify empty, error, offline and retry states.
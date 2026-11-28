# Budgets Module — Frontend + Backend

# Phase 1 — Budgets Listing Screen

## 1.1 Screen Layout

**Frontend**
- Create a dedicated Budgets screen with a monthly overview at the top and an Add Budget action.
- Show every user-created budget as an individual card with icon, name, allocated, spent and remaining amounts, spending percentage and a progress bar.
- Show the system-managed Others card separately from user-created budgets.
- Use distinct visual states for Within Budget, Near Limit, Budget Exhausted and Overspent.
- Show an empty state with an Add Budget action when the selected month has no budgets.

## 1.2 Month Filter

**Frontend**
- Provide a month selector to move between previous and upcoming months, with the month and year clearly displayed.
- Load only the budgets and expenses belonging to the selected month; never mix months.
- Viewing another month must not change any existing configuration.
- Show an unavailable-data state if the selected month's income or cash is not available.

## 1.3 Source Summaries

**Frontend**
- Show two independent summaries: Monthly Income / Salary and Cash.
- Each summary displays: total available, allocated to budgets, spent against assigned budgets, unallocated expenses (in Others) and remaining unallocated amount.
- Show a combined overview, while keeping the Salary and Cash breakdowns visible.
- Clearly distinguish: money not yet allocated, money allocated, money spent on assigned budgets and expenses not yet assigned to a budget.
- One source must never consume the available amount of the other.
- Update all values immediately when a budget or expense is added, edited, deleted or reassigned.

**Calculations (per source, per month)**
- Unallocated Expenses = Sum of expenses with no matching user-created budget.
- Unallocated Amount = Source Available Amount − User-Created Budget Allocations − Unallocated Expenses.

**Backend (future)**
- Provide monthly budget summaries computed from the latest income, cash and expense data.

---

# Phase 2 — Add and Edit Budget

## 2.1 Form

**Frontend**
- Provide a dedicated screen or bottom sheet with: Budget Name/Category, Icon, Amount, Money Source (Income / Cash), Carry Forward toggle (off by default) and the selected month.
- Offer common categories and allow a custom name; trim spaces and reject empty names.
- Reserve Others; users cannot create a budget with that category.
- Prevent a duplicate active budget for the same category, source and month.
- Provide a predefined icon set (Food, Groceries, Shopping, Travel, Transport, Entertainment, Healthcare, Education, Bills, Rent, Personal Care, Others) with a default icon; store the icon ID, not the UI component.

## 2.2 Amount Validation

**Frontend**
- Accept only positive monetary amounts; reject zero, negative and invalid input.
- Show the currently available amount for the selected source and update it live while typing.
- Show an inline error when the amount exceeds what is available; disable Save while invalid.
- Revalidate immediately before saving; prevent duplicate submissions.

**Calculations**
- Available for New Budget = Source Available Amount − Existing Budget Allocations − Unallocated Expenses in Others.
- Available for Edited Budget = Source Available Amount − Other Budget Allocations − Unallocated Expenses.
- Apply independently to Income and Cash; recalculate if the source changes during edit.

**Required scenario**
- Available ₹50,000, allocations ₹16,000, unallocated expenses ₹0 → ₹34,000 available.
- Add an unassigned ₹32,000 expense → ₹2,000 available.
- A new ₹3,000 budget must be blocked with a message that only ₹2,000 is available.
- The user may reduce the amount, adjust existing allocations or assign the expense to a budget.
- Assigning only changes the budget association; it never deletes or reverses the expense, and an expense is never deducted twice.

## 2.3 Save

**Frontend**
- Save locally with: budget ID, name, category ID, icon ID, amount, source, month, year, carry forward flag, original budget ID (if carried), type, created and updated dates.
- Refresh the list, summaries and Others card immediately; show a success toast and return to the list.
- If the category or source changes on edit, recalculate expense associations.
- Preserve the previous configuration if validation or saving fails.

**Backend (future)**
- Validate allocation limits server-side, enforce uniqueness per user, category, source and month, and support idempotent creation.

---

# Phase 3 — Spending Tracking

## 3.1 Progress and Status

**Frontend**
- Progress = (Total Spent ÷ Allocated) × 100; cap the visual fill at 100% while showing the actual percentage and the overspent amount.
- Update progress and status whenever an expense is added, edited, deleted or reassigned.
- Show Edit and Delete on user-created cards only; Others has neither.

## 3.2 Expense Association

**Frontend**
- Integrate with the existing Expenses module; do not duplicate expense records.
- Match each expense to a budget by category, month and money source; if none exists, it belongs to Others as an unallocated expense.
- Every expense must carry its real money source (Cash or Income); use the existing payment/source field, or add a compatible field without breaking current expense behavior.
- Derive spending from expense records; never store a duplicate spent total.
- Recalculate the old and new budgets when an expense's category, amount or source changes or when it is deleted.
- An expense is counted in exactly one budget or in the Others queue, never both.

---

# Phase 4 — Others (Unallocated)

## 4.1 Behavior

**Frontend**
- Create Others automatically for every month and money source; it is system-managed, non-editable, non-deletable and has no manual amount input.
- Show two separate values with clear labels: Unallocated Amount (money still free to allocate) and Unallocated Expenses (money already spent but not assigned to a budget).
- Show the list of unallocated expenses with an Assign to Budget action.

## 4.2 Assignment

**Frontend**
- Allow assigning an unallocated expense only to a user-created budget with the same month and money source.
- After assignment: remove it from the Others queue, add it to the budget's spending, update progress and status, and refresh Others and the source summary.
- If a budget is deleted, move its expenses back to Others for the same month and source.
- Never assign expenses automatically.

## 4.3 Shortfall Handling

**Frontend**
- If Unallocated Amount would be negative (allocations plus unallocated expenses exceed available money), show ₹0 and a clear allocation discrepancy message.
- Block new allocations until the discrepancy is resolved.
- Never silently reduce or modify existing budgets.

---

# Phase 5 — Delete Budget

**Frontend**
- Show a confirmation dialog stating that associated expenses will not be deleted.
- On confirmation: delete the budget, reassign its expenses to Others, and recalculate spending, Others and available amounts.
- Refresh the list and show a success toast.
- Never allow deletion of Others or deletion through a single unconfirmed tap.

---

# Phase 6 — Monthly Independence

**Frontend**
- Store month and year with every budget; keep each month's configuration independent.
- Allow different amounts and different income/cash per month.
- Use the monthly income and cash values from existing application data (including updates made in Profile); recalculate budgets immediately when those values change.
- Keep previous months' data unaffected by current month edits, and do not recompute history with current values.

---

# Phase 7 — Carry Forward

## 7.1 Option

**Frontend**
- Provide a Carry Forward toggle in Add and Edit, with a short explanation that the same budget is created for the following month.
- Show an indicator on cards where it is enabled.

## 7.2 Generation Rules

**Frontend**
- Create the next month's budget with the same category, name, icon, amount, source and carry forward setting, without modifying the previous month.
- Validate against the next month's available Income or Cash; if insufficient, do not exceed it, show a warning and let the user resolve it.
- Never create duplicates if the next month already has a matching budget.
- Support recurring generation while the setting stays enabled; disabling stops future generation but keeps already-created budgets.
- Editing or deleting a previous month's budget must not overwrite an independently configured future month.
- Keep generation logic in a separate service.

**Backend (future)**
- Store original budget ID, generated budget ID, source month, target month and status.
- Run recurring generation as a scheduled job with duplicate prevention.

---

# Phase 8 — Local Data and Architecture

## 8.1 Storage

**Frontend**
- Use the existing persistent storage with centralized keys:
  - expensio_budgets
  - expensio_budget_categories
  - expensio_budget_preferences
  - expensio_budget_carry_forward
- Use the existing Expenses data as the source of truth; handle corrupted data safely.

## 8.2 Services

**Frontend**
- Create separate services for budget management, calculation, categories and icons, expense association, unallocated expenses, carry forward and persistence.
- Expose methods such as: getBudgetsByMonth(), addBudget(), updateBudget(), deleteBudget(), getBudgetSummary(), calculateAvailableForNewBudget(), calculateUnallocatedExpenses(), calculateUnallocatedAmount(), getOthersBudget(), getUnallocatedExpenses(), assignExpenseToBudget(), recalculateBudgetSpending(), validateBudgetAllocation() and processCarryForward().
- Keep calculations and business rules out of UI components, and structure services so they can later be backed by APIs.
- Do not create backend APIs, schemas or mock HTTP responses.

---

# Phase 9 — Errors and Feedback

**Frontend**
- Handle invalid names or amounts, insufficient Income or Cash, duplicate budgets, unavailable categories or icons, invalid months, carry forward conflicts, storage failures and recalculation errors.
- When blocked by unallocated expenses, show the actual available amount, explain that those expenses already reduced it, and offer: reduce the amount, adjust existing budgets or assign Others expenses.
- Never modify or delete expenses to make a budget fit.
- Preserve the last saved state on failure and prevent repeated submissions.
- Show toasts for: budget created, updated, deleted; amount exceeds Income or Cash; only ₹X available; expense assigned; expenses moved to Others; carry forward enabled, disabled, created or failed; allocation needs adjustment.
- Follow existing toast and dialog conventions.

---

# Phase 10 — Functional Verification

## 10.1 Budgets
- Verify Income and Cash budgets work independently and persist after restart.
- Verify category and icon selection, unique IDs and amount limits.
- Verify edit and delete behavior, including expense reassignment to Others.

## 10.2 Unallocated Scenario
- Run the ₹50,000 / ₹16,000 / ₹32,000 scenario: available becomes ₹2,000, a ₹3,000 budget is blocked with the correct message, and assigning the expense restores the calculation with no double counting.

## 10.3 Tracking and Others
- Verify expense add, edit, delete and category or source changes update the right budget or Others.
- Verify Cash and Income stay separate and months stay isolated.
- Verify Others is automatic, non-editable, non-deletable and shows both values separately.
- Verify progress bars and statuses.

## 10.4 Months and Carry Forward
- Verify month navigation and independence of previous months.
- Verify carry forward creates the same budget next month without duplicates, handles insufficient funds safely, leaves the previous month unchanged and stops when disabled.
- Verify a change to income or cash in Profile recalculates budgets immediately.
import type { CategoryBudget, ExpenseSource, Transaction } from '../types';
import { getBudgetMonthKey, getTransactionMonthKey } from './budgetService';

export interface BudgetSourceSummary {
  source: ExpenseSource;
  available: number | null;
  allocated: number;
  spentAssigned: number;
  unallocatedExpenses: number;
  unallocatedAmount: number | null;
  discrepancy: number;
  expenses: Transaction[];
}

export function calculateBudgetSourceSummary(
  source: ExpenseSource,
  month: string,
  budgets: CategoryBudget[],
  transactions: Transaction[],
  available: number | null,
): BudgetSourceSummary {
  const monthBudgets = budgets.filter((budget) =>
    (budget.month ?? getBudgetMonthKey(new Date(budget.createdAt))) === month
    && (budget.source ?? 'salary') === source);
  const budgetIds = new Set(monthBudgets.map((budget) => budget.id));
  const expenses = transactions.filter((transaction) =>
    transaction.type === 'expense'
    && transaction.source === source
    && getTransactionMonthKey(transaction) === month);
  const assigned = expenses.filter((transaction) =>
    transaction.budgetId !== undefined && budgetIds.has(transaction.budgetId));
  const unallocated = expenses.filter((transaction) =>
    !transaction.budgetId || !budgetIds.has(transaction.budgetId));
  const allocated = monthBudgets.reduce((sum, budget) => sum + budget.limit, 0);
  const unallocatedExpenses = unallocated.reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    source,
    available,
    allocated,
    spentAssigned: assigned.reduce((sum, transaction) => sum + transaction.amount, 0),
    unallocatedExpenses,
    unallocatedAmount: available === null ? null : Math.max(0, available - allocated - unallocatedExpenses),
    discrepancy: available === null ? 0 : Math.max(0, allocated + unallocatedExpenses - available),
    expenses: unallocated,
  };
}

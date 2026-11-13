import type { CategoryBudget, Transaction } from '../types';
import { getBudgetMonthKey, getTransactionMonthKey } from './budgetService';

export function getUnallocatedExpenses(
  transactions: Transaction[],
  budgets: CategoryBudget[],
  month: string,
): Transaction[] {
  const budgetById = new Map(budgets
    .filter((budget) => (budget.month ?? getBudgetMonthKey(new Date(budget.createdAt))) === month)
    .map((budget) => [budget.id, budget]));
  return transactions.filter((transaction) =>
    transaction.type === 'expense'
    && getTransactionMonthKey(transaction) === month
    && (!transaction.budgetId
      || (budgetById.get(transaction.budgetId)?.source ?? 'salary') !== transaction.source));
}

import type { CategoryBudget, Transaction } from '../types';
import { getBudgetMonthKey, getTransactionMonthKey } from './budgetService';

export function validateExpenseBudgetAssociation(transaction: Transaction, budget: CategoryBudget): void {
  if (transaction.type !== 'expense') throw new Error('This expense is no longer available.');
  if (!transaction.source) throw new Error('Edit this expense first and choose its real funding source.');
  if (
    getTransactionMonthKey(transaction) !== (budget.month ?? getBudgetMonthKey(new Date(budget.createdAt)))
    || transaction.source !== (budget.source ?? 'salary')
  ) {
    throw new Error('Choose a user-created budget with the same month and funding source.');
  }
}

import type { CategoryBudget, ExpenseSource, Transaction } from '../types';
import { getBudgetMonthKey, getTransactionMonthKey } from './budgetService';

interface BudgetAllocationInput {
  budgets: CategoryBudget[];
  transactions: Transaction[];
  month: string;
  source: ExpenseSource;
  category: string;
  amount: number;
  available: number | null;
  editingBudgetId?: string | null;
}

export interface BudgetAllocationValidation {
  availableForBudget: number | null;
  discrepancy: number;
  allocatedElsewhere: number;
  unallocatedExpenses: number;
  duplicate: boolean;
  isExplicitReduction: boolean;
  error: string;
}

export function calculateBudgetAllocation(input: BudgetAllocationInput): BudgetAllocationValidation {
  const { budgets, transactions, month, source, category, amount, available, editingBudgetId } = input;
  const candidateCategory = category.trim().toLowerCase();
  const monthBudgets = budgets.filter((budget) =>
    (budget.month ?? getBudgetMonthKey(new Date(budget.createdAt))) === month
    && (budget.source ?? 'salary') === source);
  const sourceBudgets = monthBudgets.filter((budget) =>
    budget.id !== editingBudgetId && (budget.source ?? 'salary') === source);
  const allocatedElsewhere = sourceBudgets.reduce((sum, budget) => sum + budget.limit, 0);
  const budgetIds = new Set(monthBudgets.map((budget) => budget.id));
  const editedBudget = budgets.find((budget) => budget.id === editingBudgetId);
  const unallocatedExpenses = transactions
    .filter((transaction) => transaction.type === 'expense'
      && transaction.source === source
      && getTransactionMonthKey(transaction) === month)
    .filter((transaction) => {
      if (!transaction.budgetId || !budgetIds.has(transaction.budgetId)) return true;
      if (transaction.budgetId !== editingBudgetId || !editedBudget) return false;
      return candidateCategory !== editedBudget.category.toLowerCase()
        && transaction.category.toLowerCase() !== candidateCategory;
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const availableForBudget = available === null
    ? null
    : Math.max(0, available - allocatedElsewhere - unallocatedExpenses);
  const discrepancy = available === null
    ? 0
    : Math.max(0, allocatedElsewhere + unallocatedExpenses - available);
  const duplicate = Boolean(candidateCategory) && monthBudgets.some((budget) =>
    budget.id !== editingBudgetId
    && budget.category.toLowerCase() === candidateCategory
    && (budget.source ?? 'salary') === source);
  const isExplicitReduction = Boolean(editedBudget
    && (editedBudget.month ?? getBudgetMonthKey(new Date(editedBudget.createdAt))) === month
    && (editedBudget.source ?? 'salary') === source
    && candidateCategory === editedBudget.category.toLowerCase()
    && amount < editedBudget.limit);

  const error = !candidateCategory
    ? 'Enter a budget category.'
    : candidateCategory === 'others'
      ? 'Others is reserved for unbudgeted expenses.'
      : amount <= 0
        ? 'Enter an amount greater than zero.'
        : availableForBudget === null
          ? 'Set this month’s Salary and Cash amounts before creating or editing a budget.'
          : duplicate
            ? 'A budget already exists for this category, source, and month.'
            : discrepancy > 0 && !editingBudgetId
              ? `Resolve the ${formatINR(discrepancy)} allocation discrepancy before adding another budget. Reduce existing allocations or assign Others expenses.`
              : amount > availableForBudget && !isExplicitReduction
                ? unallocatedExpenses > 0
                  ? `Only ${formatINR(availableForBudget)} is available. ${formatINR(unallocatedExpenses)} in Others expenses already reduces it. Reduce this amount, adjust existing budgets, or assign Others expenses.`
                  : `Only ${formatINR(availableForBudget)} is available for this source.`
                : '';

  return {
    availableForBudget,
    discrepancy,
    allocatedElsewhere,
    unallocatedExpenses,
    duplicate,
    isExplicitReduction,
    error,
  };
}

function formatINR(amount: number): string {
  return `₹${Math.trunc(amount).toLocaleString('en-IN')}`;
}

import type { CategoryBudget, MonthlyBudgetAvailability, Transaction } from '../types';
import { getBudgetMonthKey, getTransactionMonthKey } from './budgetService';

export function processCarryForward(
  budgets: CategoryBudget[],
  transactions: Transaction[],
  targetMonth: string,
  availability: MonthlyBudgetAvailability | undefined,
): { budgets: CategoryBudget[]; created: CategoryBudget[]; warnings: string[] } {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) {
    return { budgets, created: [], warnings: ['Carry forward could not run because the target month is invalid.'] };
  }
  const [year, month] = targetMonth.split('-').map(Number);
  const previousMonth = getBudgetMonthKey(new Date(year, month - 2, 1));
  const candidates = budgets.filter((budget) =>
    (budget.month ?? getBudgetMonthKey(new Date(budget.createdAt))) === previousMonth
    && budget.carryForward === true);
  if (!candidates.length) return { budgets, created: [], warnings: [] };

  const created: CategoryBudget[] = [];
  const warnings: string[] = [];
  const nextBudgets = [...budgets];
  for (const previous of candidates) {
    const source = previous.source ?? 'salary';
    const duplicate = nextBudgets.some((budget) =>
      (budget.month ?? getBudgetMonthKey(new Date(budget.createdAt))) === targetMonth
      && (budget.source ?? 'salary') === source
      && budget.category.toLowerCase() === previous.category.toLowerCase());
    if (duplicate) continue;

    if (!availability) {
      warnings.push(`${previous.name || previous.category} was not carried forward: ${targetMonth} income and cash are not available yet.`);
      continue;
    }

    const monthBudgets = nextBudgets.filter((budget) =>
      (budget.month ?? getBudgetMonthKey(new Date(budget.createdAt))) === targetMonth
      && (budget.source ?? 'salary') === source);
    const monthBudgetIds = new Set(monthBudgets.map((budget) => budget.id));
    const unallocatedSpend = transactions
      .filter((transaction) => transaction.type === 'expense'
        && transaction.source === source
        && getTransactionMonthKey(transaction) === targetMonth
        && (!transaction.budgetId || !monthBudgetIds.has(transaction.budgetId)))
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const allocated = monthBudgets.reduce((sum, budget) => sum + budget.limit, 0);
    const available = source === 'salary' ? availability.salary : availability.cash;
    const remaining = Math.max(0, available - allocated - unallocatedSpend);
    if (previous.limit > remaining) {
      warnings.push(`${previous.name || previous.category} was not carried forward: only ₹${remaining.toLocaleString('en-IN')} is available.`);
      continue;
    }

    const now = Date.now();
    const budget: CategoryBudget = {
      ...previous,
      id: `budget-${now}-${Math.random().toString(36).slice(2, 8)}`,
      month: targetMonth,
      year,
      createdAt: now,
      updatedAt: now,
      originalBudgetId: previous.id,
      budgetType: 'category',
    };
    nextBudgets.unshift(budget);
    created.push(budget);
  }
  return { budgets: nextBudgets, created, warnings };
}

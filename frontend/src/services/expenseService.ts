import type { CategoryBudget, Transaction } from '../types';
import { getBudgetMonthKey, getTransactionMonthKey } from './budgetService';

export interface ExpensePageRequest {
  transactions: Transaction[];
  month: string;
  cursor?: string | null;
  pageSize?: number;
  query?: string;
  type?: Transaction['type'] | 'all';
}

export interface ExpensePage {
  items: Transaction[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ExpenseMutationRepository<TCreate, TUpdate> {
  create(input: TCreate): Promise<void>;
  update(id: string, changes: TUpdate): Promise<void>;
  delete(id: string): Promise<void>;
}

export function createExpenseService<TCreate, TUpdate>(repository: ExpenseMutationRepository<TCreate, TUpdate>) {
  return {
    getExpenses,
    getMonthlySummary,
    getCategories,
    createExpense: (input: TCreate) => repository.create(input),
    updateExpense: (id: string, changes: TUpdate) => repository.update(id, changes),
    deleteExpense: (id: string) => repository.delete(id),
  };
}

export function getExpenses({
  transactions,
  month,
  cursor,
  pageSize = 20,
  query = '',
  type = 'expense',
}: ExpensePageRequest): ExpensePage {
  const offset = cursor && /^\d+$/.test(cursor) ? Number(cursor) : 0;
  const normalizedQuery = query.trim().toLowerCase();
  const uniqueTransactions = [...new Map(transactions.map((transaction) => [transaction.id, transaction])).values()];
  const monthItems = uniqueTransactions
    .filter((transaction) =>
      getTransactionMonthKey(transaction) === month
      && (type === 'all' || transaction.type === type)
      && (!normalizedQuery || `${transaction.merchant} ${transaction.category}`.toLowerCase().includes(normalizedQuery)))
    .slice()
    .sort((left, right) => (right.occurredAt ?? 0) - (left.occurredAt ?? 0));
  const items = monthItems.slice(offset, offset + pageSize);
  const nextOffset = offset + items.length;
  return {
    items,
    nextCursor: nextOffset < monthItems.length ? String(nextOffset) : null,
    hasMore: nextOffset < monthItems.length,
  };
}

export function getMonthlySummary(transactions: Transaction[], month: string): number {
  return transactions
    .filter((transaction) => transaction.type === 'expense' && getTransactionMonthKey(transaction) === month)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function getCategories(budgets: CategoryBudget[]): { id: string; name: string; category: string; iconId: string }[] {
  const categories = new Map<string, { id: string; name: string; category: string; iconId: string }>();
  for (const budget of budgets) {
    const key = budget.category.trim().toLowerCase();
    if (!key || key === 'others' || categories.has(key)) continue;
    categories.set(key, {
      id: budget.categoryId ?? key.replace(/[^a-z0-9]+/g, '-'),
      name: budget.name || budget.category,
      category: budget.category,
      iconId: budget.iconId || 'pricetag-outline',
    });
  }
  return [...categories.values()];
}

export function getCurrentLocalMonth(now = new Date()): string {
  return getBudgetMonthKey(now);
}

export function getPaymentModeLabel(mode: Transaction['paymentMode']): string {
  switch (mode) {
    case 'cash': return 'Cash';
    case 'credit_card': return 'Credit Card';
    case 'debit_card': return 'Debit Card';
    default: return 'Payment mode not set';
  }
}

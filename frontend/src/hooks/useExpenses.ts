import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ExpenseItem, ExpenseCategory, AccountType } from '../types';
import { api } from '../services/api';
import { notifications } from '../services/notifications';
import { haptics } from '../services/haptics';
import { formatters } from '../utils/formatters';

export interface NewExpensePayload {
  title: string;
  amount: number | string;
  category: ExpenseCategory;
  account?: AccountType;
  method?: string;
  type?: 'expense' | 'income';
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getExpenses();
      if (res && res.transactions) {
        setExpenses(res.transactions);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await haptics.light();
    await fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(
    async (payload: NewExpensePayload): Promise<boolean> => {
      const trimmedTitle = payload.title.trim();
      const numAmount =
        typeof payload.amount === 'string'
          ? parseFloat(payload.amount)
          : payload.amount;

      if (!trimmedTitle || isNaN(numAmount) || numAmount <= 0) {
        await haptics.error();
        setError('Please enter a valid title and positive amount');
        return false;
      }

      try {
        const res = await api.addExpense({
          title: trimmedTitle,
          amount: numAmount,
          category: payload.category,
          account: payload.account || 'salary',
          method: payload.method || 'UPI',
          type: payload.type || 'expense',
        });

        if (res && res.transaction) {
          setExpenses((prev) => [res.transaction, ...prev]);
        }

        await haptics.success();
        await notifications.sendInstantNotification(
          'Expense Recorded 💸',
          `${formatters.currency(numAmount)} recorded for "${trimmedTitle}"`
        );
        return true;
      } catch (e: any) {
        await haptics.error();
        setError(e.message || 'Failed to record expense');
        return false;
      }
    },
    []
  );

  const deleteExpense = useCallback(async (id: string) => {
    await haptics.heavy();
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const totalSpend = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (curr.type === 'income' ? 0 : curr.amount), 0);
  }, [expenses]);

  return {
    expenses,
    loading,
    refreshing,
    error,
    totalSpend,
    expenseCount: expenses.length,
    addExpense,
    deleteExpense,
    refresh,
  };
}

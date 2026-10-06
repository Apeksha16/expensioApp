import { useState, useCallback, useMemo } from 'react';
import type { ExpenseItem, ExpenseCategory, AccountType } from '../types';
import { notifications } from '../services/notifications';
import { haptics } from '../services/haptics';
import { formatters } from '../utils/formatters';
import { useFinance } from './FinanceContext';

export interface NewExpensePayload {
  title: string;
  amount: number | string;
  category: ExpenseCategory;
  account?: AccountType;
  method?: string;
  type?: 'expense' | 'income';
}

export function useExpenses() {
  const [error, setError] = useState<string | null>(null);
  const { state, refresh: financeRefresh, loading, addTransaction, deleteTransaction } = useFinance();

  const refresh = useCallback(async () => {
    await haptics.light();
    await financeRefresh();
  }, [financeRefresh]);

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
        const localItem: ExpenseItem = {
          id: `tx_${Date.now()}`,
          title: trimmedTitle,
          amount: numAmount,
          category: payload.category || 'general',
          date: new Date().toISOString(),
          method: (payload.method as any) || 'UPI',
          account: payload.account || 'salary',
          type: payload.type || 'expense',
        };

        addTransaction(localItem);

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
    [addTransaction]
  );

  const deleteExpense = useCallback(async (id: string) => {
    await haptics.heavy();
    deleteTransaction(id);
  }, [deleteTransaction]);

  const totalSpend = useMemo(() => {
    return state.transactions.reduce((acc, curr) => acc + (curr.type === 'income' ? 0 : curr.amount), 0);
  }, [state.transactions]);

  return {
    expenses: state.transactions,
    loading,
    refreshing: loading,
    error,
    totalSpend,
    expenseCount: state.transactions.length,
    addExpense,
    deleteExpense,
    refresh,
  };
}

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import type { ExpenseItem, SplitItem, AccountType, PaymentItem } from '../types';
import { api } from '../services/api';
import { calculateDashboardSummary, toRupees, toPaise, FinanceState } from '../utils/financeCalculations';
import { storage, STORAGE_KEYS } from '../services/storage';

interface FinanceContextValue {
  state: FinanceState;
  summary: ReturnType<typeof calculateDashboardSummary>;
  addTransaction: (tx: ExpenseItem) => void;
  deleteTransaction: (id: string) => void;
  addSplit: (split: SplitItem) => void;
  deleteSplit: (id: string) => void;
  addPayment: (payment: PaymentItem) => void;
  editPayment: (payment: PaymentItem) => void;
  deletePayment: (id: string) => void;
  markPaymentPaid: (id: string) => void;
  refresh: () => Promise<void>;
  loading: boolean;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

type Action =
  | { type: 'SET_DATA'; payload: { transactions: ExpenseItem[]; splits: SplitItem[]; payments: PaymentItem[] } }
  | { type: 'ADD_TX'; payload: ExpenseItem }
  | { type: 'DELETE_TX'; payload: string }
  | { type: 'ADD_SPLIT'; payload: SplitItem }
  | { type: 'DELETE_SPLIT'; payload: string }
  | { type: 'ADD_PAYMENT'; payload: PaymentItem }
  | { type: 'EDIT_PAYMENT'; payload: PaymentItem }
  | { type: 'DELETE_PAYMENT'; payload: string };

function financeReducer(state: FinanceState, action: Action): FinanceState {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, transactions: action.payload.transactions, splits: action.payload.splits, payments: action.payload.payments };
    case 'ADD_TX': {
      const newTx = [action.payload, ...state.transactions];
      storage.set(STORAGE_KEYS.EXPENSES, newTx);
      return { ...state, transactions: newTx };
    }
    case 'DELETE_TX': {
      const newTx = state.transactions.filter(tx => tx.id !== action.payload);
      storage.set(STORAGE_KEYS.EXPENSES, newTx);
      return { ...state, transactions: newTx };
    }
    case 'ADD_SPLIT': {
      const newSplits = [action.payload, ...state.splits];
      storage.get(STORAGE_KEYS.SPLITS, {}).then((existing: any) => {
        storage.set(STORAGE_KEYS.SPLITS, { ...existing, expenses: newSplits });
      });
      return { ...state, splits: newSplits };
    }
    case 'DELETE_SPLIT': {
      const newSplits = state.splits.filter(s => s.id !== action.payload);
      storage.get(STORAGE_KEYS.SPLITS, {}).then((existing: any) => {
        storage.set(STORAGE_KEYS.SPLITS, { ...existing, expenses: newSplits });
      });
      return { ...state, splits: newSplits };
    }
    case 'ADD_PAYMENT': {
      const newPayments = [...state.payments, action.payload];
      storage.set(STORAGE_KEYS.PAYMENTS, newPayments);
      return { ...state, payments: newPayments };
    }
    case 'EDIT_PAYMENT': {
      const newPayments = state.payments.map(p => p.id === action.payload.id ? action.payload : p);
      storage.set(STORAGE_KEYS.PAYMENTS, newPayments);
      return { ...state, payments: newPayments };
    }
    case 'DELETE_PAYMENT': {
      const newPayments = state.payments.filter(p => p.id !== action.payload);
      storage.set(STORAGE_KEYS.PAYMENTS, newPayments);
      return { ...state, payments: newPayments };
    }
    default:
      return state;
  }
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(financeReducer, {
    transactions: [],
    splits: [],
    payments: [],
    salaryLimit: toPaise(50000), // Default config
  });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      await storage.initDb();
      const [expRes, splitRes, payments] = await Promise.all([
        api.getExpenses(),
        api.getSplits(),
        storage.get<PaymentItem[]>(STORAGE_KEYS.PAYMENTS, []),
      ]);
      dispatch({
        type: 'SET_DATA',
        payload: {
          transactions: expRes.transactions || [],
          splits: splitRes.splits?.expenses || [],
          payments: payments || [],
        },
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const addTransaction = (tx: ExpenseItem) => dispatch({ type: 'ADD_TX', payload: tx });
  const deleteTransaction = (id: string) => dispatch({ type: 'DELETE_TX', payload: id });
  const addSplit = (split: SplitItem) => dispatch({ type: 'ADD_SPLIT', payload: split });
  const deleteSplit = (id: string) => dispatch({ type: 'DELETE_SPLIT', payload: id });
  const addPayment = (payment: PaymentItem) => dispatch({ type: 'ADD_PAYMENT', payload: payment });
  const editPayment = (payment: PaymentItem) => dispatch({ type: 'EDIT_PAYMENT', payload: payment });
  const deletePayment = (id: string) => dispatch({ type: 'DELETE_PAYMENT', payload: id });

  const markPaymentPaid = (id: string) => {
    const payment = state.payments.find(p => p.id === id);
    if (!payment) return;

    // Create a transaction
    const tx: ExpenseItem = {
      id: `tx_${Date.now()}`,
      title: payment.title,
      amount: payment.amount,
      category: payment.category,
      date: new Date().toISOString(),
      method: payment.method || 'UPI',
      account: payment.account,
      type: 'expense',
    };
    addTransaction(tx);

    // Update payment
    if (payment.recurring && payment.recurrenceType) {
      const nextDate = new Date(payment.dueDate);
      if (payment.recurrenceType === 'daily') nextDate.setDate(nextDate.getDate() + 1);
      if (payment.recurrenceType === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      if (payment.recurrenceType === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      if (payment.recurrenceType === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

      editPayment({ ...payment, dueDate: nextDate.toISOString() });
    } else {
      editPayment({ ...payment, status: 'paid' });
    }
  };

  const summary = calculateDashboardSummary(state);

  return (
    <FinanceContext.Provider value={{ 
      state, 
      summary, 
      addTransaction, 
      deleteTransaction, 
      addSplit, 
      deleteSplit, 
      addPayment,
      editPayment,
      deletePayment,
      markPaymentPaid,
      refresh, 
      loading 
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}

import { useState, useCallback } from 'react';
import type { SplitItem, SplitSummaryData } from '../types';
import { api } from '../services/api';
import { splitEngine } from '../utils/splitEngine';
import { notifications } from '../services/notifications';
import { haptics } from '../services/haptics';
import { formatters } from '../utils/formatters';
import { useFinance } from './FinanceContext';

export interface NewSplitPayload {
  title: string;
  amount: number | string;
  peopleCount: number | string;
}

export function useSplits() {
  const [subTab, setSubTab] = useState<'expenses' | 'groups'>('expenses');
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { state, summary: financeSummary, addSplit, refresh: financeRefresh, loading } = useFinance();

  const changeSubTab = useCallback(async (tab: 'expenses' | 'groups') => {
    await haptics.selection();
    setSubTab(tab);
  }, []);

  const settleSplit = useCallback(
    async (id: string): Promise<boolean> => {
      setSettlingId(id);
      const targetItem = state.splits.find((i) => i.id === id);

      try {
        await api.settleSplit(id); // Doesn't do much anymore but we can keep it
        
        // Find existing, mutate and delete/add it or use editSplit. We don't have editSplit.
        // Let's just delete and re-add.
        if (targetItem) {
           const settled = splitEngine.settleItem(targetItem);
           // To cleanly update state without editSplit, we could add editSplit to FinanceContext...
           // Let's just do a hacky refresh for now, or since it's local storage we can manually update storage.
           // Actually, api.settleSplit updates the storage directly! So calling financeRefresh() will sync it!
           await financeRefresh();
        }

        await haptics.success();
        await notifications.sendInstantNotification(
          'Split Settled 🎉',
          `Split expense "${targetItem?.title || 'Expense'}" has been marked settled.`
        );
        return true;
      } catch (e: any) {
        await haptics.error();
        setError(e.message || 'Failed to settle split');
        return false;
      } finally {
        setSettlingId(null);
      }
    },
    [state.splits, financeRefresh]
  );

  const createSplit = useCallback(
    async (payload: NewSplitPayload): Promise<boolean> => {
      const trimmedTitle = payload.title.trim();
      const numTotal = typeof payload.amount === 'string' ? parseFloat(payload.amount) : payload.amount;
      const numPeople = typeof payload.peopleCount === 'string' ? parseInt(payload.peopleCount, 10) : payload.peopleCount;

      if (!trimmedTitle || isNaN(numTotal) || numTotal <= 0 || isNaN(numPeople) || numPeople < 2) {
        await haptics.error();
        setError('Please enter a valid title, positive amount, and at least 2 participants');
        return false;
      }

      const sharePerPerson = splitEngine.calculateEqualShare(numTotal, numPeople);
      const youGetAmount = Math.round((numTotal - sharePerPerson) * 100) / 100;

      const newSplit: SplitItem = {
        id: `split_${Date.now()}`,
        title: trimmedTitle,
        amount: numTotal,
        date: 'Today',
        paidBy: 'YOU',
        status: 'PENDING',
        youGet: youGetAmount,
      };

      addSplit(newSplit);

      await haptics.success();
      await notifications.sendInstantNotification(
        'Split Created 👥',
        `Split for "${trimmedTitle}" (${formatters.currency(numTotal)}) divided among ${numPeople} people.`
      );
      return true;
    },
    [addSplit]
  );

  return {
    splits: state.splits,
    groups: [], // FinanceContext doesn't handle groups right now, but it's fine for our use case
    subTab,
    loading,
    refreshing: loading,
    settlingId,
    error,
    summary: financeSummary.splits,
    changeSubTab,
    settleSplit,
    createSplit,
    refresh: financeRefresh,
  };
}

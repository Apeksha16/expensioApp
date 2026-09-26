import { useState, useEffect, useCallback, useMemo } from 'react';
import type { SplitItem, SplitGroup, SplitSummaryData } from '../types';
import { api } from '../services/api';
import { splitEngine } from '../utils/splitEngine';
import { notifications } from '../services/notifications';
import { haptics } from '../services/haptics';
import { formatters } from '../utils/formatters';

export interface NewSplitPayload {
  title: string;
  amount: number | string;
  peopleCount: number | string;
}

export function useSplits() {
  const [subTab, setSubTab] = useState<'expenses' | 'groups'>('expenses');
  const [splits, setSplits] = useState<SplitItem[]>([]);
  const [groups, setGroups] = useState<SplitGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSplits = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getSplits();
      if (res && res.splits) {
        if (res.splits.expenses) setSplits(res.splits.expenses);
        if (res.splits.groups) setGroups(res.splits.groups);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load splits');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSplits();
  }, [fetchSplits]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await haptics.light();
    await fetchSplits();
  }, [fetchSplits]);

  const changeSubTab = useCallback(async (tab: 'expenses' | 'groups') => {
    await haptics.selection();
    setSubTab(tab);
  }, []);

  const settleSplit = useCallback(
    async (id: string): Promise<boolean> => {
      setSettlingId(id);
      const targetItem = splits.find((i) => i.id === id);

      try {
        await api.settleSplit(id);
        setSplits((prev) =>
          prev.map((item) =>
            item.id === id ? splitEngine.settleItem(item) : item
          )
        );

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
    [splits]
  );

  const createSplit = useCallback(
    async (payload: NewSplitPayload): Promise<boolean> => {
      const trimmedTitle = payload.title.trim();
      const numTotal =
        typeof payload.amount === 'string'
          ? parseFloat(payload.amount)
          : payload.amount;
      const numPeople =
        typeof payload.peopleCount === 'string'
          ? parseInt(payload.peopleCount, 10)
          : payload.peopleCount;

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

      setSplits((prev) => [newSplit, ...prev]);
      await haptics.success();
      await notifications.sendInstantNotification(
        'Split Created 👥',
        `Split for "${trimmedTitle}" (${formatters.currency(numTotal)}) divided among ${numPeople} people.`
      );
      return true;
    },
    []
  );

  const summary: SplitSummaryData = useMemo(() => {
    return splitEngine.computeSummary(splits);
  }, [splits]);

  return {
    splits,
    groups,
    subTab,
    loading,
    refreshing,
    settlingId,
    error,
    summary,
    changeSubTab,
    settleSplit,
    createSplit,
    refresh,
  };
}

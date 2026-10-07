import { useState, useEffect, useCallback, useMemo } from 'react';
import type { SubscriptionItem } from '../types';
import { api } from '../services/api';
import { haptics } from '../services/haptics';

export function useSubscriptions() {
  const [subTab, setSubTab] = useState<'upcoming' | 'paid'>('upcoming');
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await api.getSubscriptions();
      if (res && res.subscriptions) {
        const mapped = res.subscriptions.map((s: any) => ({
          id: s.id,
          name: s.title || s.name, // handle both backend and offline fallback formats
          amount: s.amount,
          dueDate: s.dueStatus || s.dueDate,
          status: s.isPaid ? 'PAID' : (s.isOverdue ? 'OVERDUE' : (s.status || 'UPCOMING')),
          daysLeft: s.daysLeft,
          monthGroup: s.monthGroup || 'this',
        }));
        setSubscriptions(mapped);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const changeSubTab = useCallback(async (tab: 'upcoming' | 'paid') => {
    await haptics.selection();
    setSubTab(tab);
  }, []);

  const markPaid = useCallback(async (id: string) => {
    await haptics.success();
    const subToUpdate = subscriptions.find(s => s.id === id);
    if (subToUpdate) {
      await api.updateSubscription(id, { status: 'PAID' });
      await fetchSubscriptions();
    }
  }, [subscriptions, fetchSubscriptions]);

  const addSubscription = useCallback(async (data: any) => {
    await haptics.success();
    const res = await api.addSubscription(data);
    if (res.success) {
      await fetchSubscriptions();
      return true;
    }
    return false;
  }, [fetchSubscriptions]);

  const updateSubscription = useCallback(async (id: string, data: any) => {
    await haptics.success();
    const res = await api.updateSubscription(id, data);
    if (res.success) {
      await fetchSubscriptions();
      return true;
    }
    return false;
  }, [fetchSubscriptions]);

  const deleteSubscription = useCallback(async (id: string) => {
    await haptics.success();
    const res = await api.deleteSubscription(id);
    if (res.success) {
      await fetchSubscriptions();
      return true;
    }
    return false;
  }, [fetchSubscriptions]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) =>
      subTab === 'upcoming' ? sub.status !== 'PAID' : sub.status === 'PAID'
    );
  }, [subscriptions, subTab]);

  const totalMonthly = useMemo(() => {
    return subscriptions.reduce((acc, curr) => acc + curr.amount, 0);
  }, [subscriptions]);

  return {
    subscriptions: filteredSubscriptions,
    allSubscriptions: subscriptions,
    subTab,
    loading,
    totalMonthly,
    changeSubTab,
    markPaid,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    refresh: fetchSubscriptions,
  };
}

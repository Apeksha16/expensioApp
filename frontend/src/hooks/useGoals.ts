import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GoalItem } from '../types';
import { api } from '../services/api';
import { haptics } from '../services/haptics';

export function useGoals() {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await api.getGoals();
      if (res && res.goals) {
        setGoals(res.goals);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = useCallback(async (data: Omit<GoalItem, 'id' | 'savedAmount'>) => {
    await haptics.success();
    const res = await api.addGoal(data);
    if (res.success) {
      await fetchGoals();
      return true;
    }
    return false;
  }, [fetchGoals]);

  const updateGoal = useCallback(async (id: string, data: Partial<GoalItem>) => {
    await haptics.success();
    const res = await api.updateGoal(id, data);
    if (res.success) {
      await fetchGoals();
      return true;
    }
    return false;
  }, [fetchGoals]);

  const deleteGoal = useCallback(async (id: string) => {
    await haptics.success();
    const res = await api.deleteGoal(id);
    if (res.success) {
      await fetchGoals();
      return true;
    }
    return false;
  }, [fetchGoals]);

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    refresh: fetchGoals,
  };
}

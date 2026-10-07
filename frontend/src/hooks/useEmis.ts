import { useState, useEffect, useCallback, useMemo } from 'react';
import type { EmiItem } from '../types';
import { api } from '../services/api';
import { haptics } from '../services/haptics';

export function useEmis() {
  const [emis, setEmis] = useState<EmiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMonthly, setTotalMonthly] = useState(0);

  const fetchEmis = useCallback(async () => {
    try {
      const res = await api.getEmis();
      if (res && res.emis) {
        setEmis(res.emis);
        setTotalMonthly(res.totalMonthly || 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmis();
  }, [fetchEmis]);

  const addEmi = useCallback(async (data: Omit<EmiItem, 'id' | 'status'>) => {
    await haptics.success();
    const res = await api.addEmi(data);
    if (res.success) {
      await fetchEmis();
      return true;
    }
    return false;
  }, [fetchEmis]);

  const updateEmi = useCallback(async (id: string, data: Partial<EmiItem>) => {
    await haptics.success();
    const res = await api.updateEmi(id, data);
    if (res.success) {
      await fetchEmis();
      return true;
    }
    return false;
  }, [fetchEmis]);

  const deleteEmi = useCallback(async (id: string) => {
    await haptics.success();
    const res = await api.deleteEmi(id);
    if (res.success) {
      await fetchEmis();
      return true;
    }
    return false;
  }, [fetchEmis]);

  const markPaid = useCallback(async (id: string) => {
    await haptics.success();
    const emiToUpdate = emis.find(e => e.id === id);
    if (emiToUpdate) {
       await api.updateEmi(id, { status: 'PAID', monthsPaid: (emiToUpdate.monthsPaid || 0) + 1 });
       await fetchEmis();
    }
  }, [emis, fetchEmis]);

  return {
    emis,
    loading,
    totalMonthly,
    addEmi,
    updateEmi,
    deleteEmi,
    markPaid,
    refresh: fetchEmis,
  };
}

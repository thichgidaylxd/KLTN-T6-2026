import { useState, useEffect, useCallback } from 'react';
import { axiosInstance } from '../../config/axios';

interface TaskStats {
  completed: number;
  pending: number;
  total: number;
}

interface FetchState {
  stats: TaskStats;
  loading: boolean;
  error: string | null;
}

/**
 * Hook để fetch toàn bộ task stats của một farm.
 * Quy trình: Lấy danh sách Plans -> Lấy Stages của từng Plan -> Lấy Tasks của từng Stage
 * Tính toán số lượng completed và pending từ toàn bộ tasks.
 */
export function useFarmTaskStats(farmId?: string): FetchState {
  const [state, setState] = useState<FetchState>({
    stats: { completed: 0, pending: 0, total: 0 },
    loading: false,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    if (!farmId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Bước 1: Lấy danh sách tất cả kế hoạch mùa vụ của farm
      const plansRes = await axiosInstance.get('/api/v1/plans');
      const plans: any[] = plansRes.data?.data ?? [];

      if (plans.length === 0) {
        setState({ stats: { completed: 0, pending: 0, total: 0 }, loading: false, error: null });
        return;
      }

      console.log(`[FarmTaskStats] Found ${plans.length} plans for farm`);

      // Bước 2: Lấy tất cả stages của từng plan (song song)
      const stagesResults = await Promise.allSettled(
        plans.map(async (plan) => {
          const res = await axiosInstance.get(`/api/v1/plans/${plan.id}/stages`);
          const stages: any[] = res.data?.data ?? [];
          return { planId: plan.id, stages };
        })
      );

      // Bước 3: Thu thập tất cả cặp (planId, stageId) hợp lệ
      const stagePairs: { planId: string; stageId: string }[] = [];
      stagesResults.forEach(result => {
        if (result.status === 'fulfilled') {
          result.value.stages.forEach((stage: any) => {
            stagePairs.push({ planId: result.value.planId, stageId: stage.id });
          });
        }
      });

      console.log(`[FarmTaskStats] Found ${stagePairs.length} stages total`);

      if (stagePairs.length === 0) {
        setState({ stats: { completed: 0, pending: 0, total: 0 }, loading: false, error: null });
        return;
      }

      // Bước 4: Lấy tất cả tasks của từng stage (song song)
      const tasksResults = await Promise.allSettled(
        stagePairs.map(async ({ planId, stageId }) => {
          const res = await axiosInstance.get(`/api/v1/plans/${planId}/stages/${stageId}/tasks`);
          return res.data?.data ?? [];
        })
      );

      // Bước 5: Đếm số lượng completed và pending
      let completed = 0;
      let pending = 0;

      tasksResults.forEach(result => {
        if (result.status === 'fulfilled') {
          const tasks: any[] = result.value;
          tasks.forEach(task => {
            const code = (task.status?.code || '').toUpperCase();
            const isTerminal = task.status?.isTerminal === true;
            const isDone = isTerminal || ['COMPLETED', 'DONE', 'FINISHED'].includes(code);
            if (isDone) {
              completed++;
            } else {
              pending++;
            }
          });
        }
      });

      const total = completed + pending;
      console.log(`[FarmTaskStats] Result: ${completed} completed, ${pending} pending, ${total} total`);

      setState({
        stats: { completed, pending, total },
        loading: false,
        error: null,
      });
    } catch (err: any) {
      console.error('[FarmTaskStats] Error fetching task stats:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err?.message || 'Lỗi tải dữ liệu task',
      }));
    }
  }, [farmId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return state;
}

import { useState, useCallback, useEffect } from 'react';
import { seasonPlanTaskService } from '../../services/seasonplan/seasonPlanTaskService';
import { Task, PagedData, PageableParams } from '../../types/seasonPlan';

export const useAssignedTasks = (userId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagedData, setPagedData] = useState<PagedData<Task> | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignedTasks = useCallback(async (params?: PageableParams) => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await seasonPlanTaskService.getAssignedTasks(userId, params);
      setPagedData(data);
      setTasks(data.content);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchTodayTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await seasonPlanTaskService.getTodayTasks(userId);
      setTodayTasks(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải công việc hôm nay');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchTasksByDate = useCallback(async (date: string, params?: PageableParams) => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await seasonPlanTaskService.getTasksByDate(userId, date, params);
      setPagedData(data);
      setTasks(data.content);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải công việc theo ngày');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      // Automatic fetching removed to let components control it via refresh() and URL params
    }
  }, [userId]);

  return {
    tasks,
    pagedData,
    todayTasks,
    loading,
    error,
    refresh: fetchAssignedTasks,
    refreshToday: fetchTodayTasks,
    fetchByDate: fetchTasksByDate
  };
};

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { workLogService } from '../../services/workLog/workLogService';

const WORKLOG_KEYS = {
  all: ['worklogs'] as const,
  byTask: (taskId: string) => ['worklogs', 'task', taskId] as const,
  byPlan: (planId: string, from?: string, to?: string) => ['worklogs', 'plan', planId, { from, to }] as const,
  byFarm: (from?: string, to?: string) => ['worklogs', 'farm', { from, to }] as const,
  byEmployee: (employeeId: string, from?: string, to?: string) => ['worklogs', 'employee', employeeId, { from, to }] as const,
  summary: (from: string, to: string) => ['worklogs', 'summary', { from, to }] as const,
  detail: (workLogId: string) => ['worklogs', 'detail', workLogId] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

export const useWorkLogs = (planId?: string, stageId?: string, taskId?: string, enabled = true) => {
  const queryClient = useQueryClient();

  const taskWorkLogsQuery = useQuery({
    queryKey: taskId ? WORKLOG_KEYS.byTask(taskId) : ['worklogs', 'inactive'],
    queryFn: () => workLogService.getTaskWorkLogs(planId!, stageId!, taskId!),
    enabled: enabled && !!taskId && !!planId && !!stageId,
  });

  return {
    workLogs: taskWorkLogsQuery.data ?? [],
    loading: taskWorkLogsQuery.isLoading, // Chỉ hiển thị loading ở lần tải đầu tiên
    isFetching: taskWorkLogsQuery.isFetching,
    error: taskWorkLogsQuery.error,

    fetchTaskWorkLogs: useCallback((pId: string, sId: string, tId: string) =>
      withUnwrap(queryClient.fetchQuery({
        queryKey: WORKLOG_KEYS.byTask(tId),
        queryFn: () => workLogService.getTaskWorkLogs(pId, sId, tId),
      })), [queryClient]),

    getWorkLogDetail: useCallback((workLogId: string) =>
      withUnwrap(queryClient.fetchQuery({
        queryKey: WORKLOG_KEYS.detail(workLogId),
        queryFn: () => workLogService.getWorkLogDetail(workLogId),
      })), [queryClient]),

    getFarmWorkLogs: useCallback((from?: string, to?: string) =>
      withUnwrap(queryClient.fetchQuery({
        queryKey: WORKLOG_KEYS.byFarm(from, to),
        queryFn: () => workLogService.getFarmWorkLogs(from, to),
      })), [queryClient]),

    getWorkLogSummary: useCallback((from: string, to: string) =>
      withUnwrap(queryClient.fetchQuery({
        queryKey: WORKLOG_KEYS.summary(from, to),
        queryFn: () => workLogService.getWorkLogSummary(from, to),
      })), [queryClient]),

    getEmployeeWorkLogs: useCallback((employeeId: string, from?: string, to?: string) =>
      withUnwrap(queryClient.fetchQuery({
        queryKey: WORKLOG_KEYS.byEmployee(employeeId, from, to),
        queryFn: () => workLogService.getEmployeeWorkLogs(employeeId, from, to),
      })), [queryClient]),

    lockWorkLog: useCallback(async (workLogId: string) => {
      const result = await workLogService.lockWorkLog(workLogId);
      void queryClient.invalidateQueries({ queryKey: WORKLOG_KEYS.all });
      return result;
    }, [queryClient]),

    unlockWorkLog: useCallback(async (workLogId: string) => {
      const result = await workLogService.unlockWorkLog(workLogId);
      void queryClient.invalidateQueries({ queryKey: WORKLOG_KEYS.all });
      return result;
    }, [queryClient]),
  };
};

export const useFarmWorkLogs = (farmId: string, from?: string, to?: string, enabled = true) => {
  return useQuery({
    queryKey: [...WORKLOG_KEYS.byFarm(from, to), farmId],
    queryFn: () => workLogService.getFarmWorkLogs(from, to),
    enabled: enabled && !!farmId,
    staleTime: 5000,
    retry: false,
    refetchOnMount: true,
    refetchInterval: 30000, // Tự động cập nhật mỗi 30 giây để dòng thời gian hoạt động luôn mới
  });
};

export const usePlanWorkLogs = (planId: string, from?: string, to?: string, enabled = true) => {
  return useQuery({
    queryKey: WORKLOG_KEYS.byPlan(planId, from, to),
    queryFn: () => workLogService.getPlanWorkLogs(planId, from, to),
    enabled: enabled && !!planId,
    staleTime: 5000,
    retry: false,
    refetchOnMount: true,
  });
};

export const useWorkLogDetail = (workLogId: string) => {
  return useQuery({
    queryKey: WORKLOG_KEYS.detail(workLogId),
    queryFn: () => workLogService.getWorkLogDetail(workLogId),
    enabled: !!workLogId,
    retry: false,
  });
};

export const useWorkLogSummary = (from: string, to: string, enabled = true) => {
  return useQuery({
    queryKey: WORKLOG_KEYS.summary(from, to),
    queryFn: () => workLogService.getWorkLogSummary(from, to),
    enabled: enabled && !!from && !!to,
    staleTime: 5000,
    retry: false,
    refetchOnMount: true,
  });
};

export const useEmployeeWorkLogs = (employeeId: string, from?: string, to?: string) => {
  return useQuery({
    queryKey: WORKLOG_KEYS.byEmployee(employeeId, from, to),
    queryFn: () => workLogService.getEmployeeWorkLogs(employeeId, from, to),
    enabled: !!employeeId,
  });
};


import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workLogService } from '../../services/workLog/workLogService';

const WORKLOG_KEYS = {
  all: ['worklogs'] as const,
  byTask: (taskId: string) => ['worklogs', 'task', taskId] as const,
  byFarm: (from?: string, to?: string) => ['worklogs', 'farm', { from, to }] as const,
  byEmployee: (employeeId: string, from?: string, to?: string) => ['worklogs', 'employee', employeeId, { from, to }] as const,
  summary: (from: string, to: string) => ['worklogs', 'summary', { from, to }] as const,
  detail: (taskId: string, workLogId: string) => ['worklogs', 'detail', taskId, workLogId] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

export const useWorkLogs = (taskId?: string) => {
  const queryClient = useQueryClient();

  const taskWorkLogsQuery = useQuery({
    queryKey: taskId ? WORKLOG_KEYS.byTask(taskId) : ['worklogs', 'inactive'],
    queryFn: () => workLogService.getTaskWorkLogs(taskId!),
    enabled: !!taskId,
  });


  const deleteWorkLogMutation = useMutation({
    mutationFn: ({ taskId: tId, workLogId }: { taskId: string; workLogId: string }) => 
      workLogService.deleteWorkLog(tId, workLogId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: WORKLOG_KEYS.byTask(variables.taskId) });
      void queryClient.invalidateQueries({ queryKey: WORKLOG_KEYS.all });
    },
  });

  return {
    workLogs: taskWorkLogsQuery.data ?? [],
    loading: taskWorkLogsQuery.isLoading || taskWorkLogsQuery.isFetching,
    submitting: deleteWorkLogMutation.isPending,
    error: taskWorkLogsQuery.error || deleteWorkLogMutation.error,
    
    fetchTaskWorkLogs: useCallback((tId: string) => 
      withUnwrap(queryClient.fetchQuery({
        queryKey: WORKLOG_KEYS.byTask(tId),
        queryFn: () => workLogService.getTaskWorkLogs(tId),
      })), [queryClient]),


    deleteWorkLog: useCallback((tId: string, workLogId: string) => 
      withUnwrap(deleteWorkLogMutation.mutateAsync({ taskId: tId, workLogId })), [deleteWorkLogMutation]),

    getWorkLogDetail: useCallback((tId: string, workLogId: string) => 
      withUnwrap(queryClient.fetchQuery({
        queryKey: WORKLOG_KEYS.detail(tId, workLogId),
        queryFn: () => workLogService.getWorkLogDetail(tId, workLogId),
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
  };
};

export const useFarmWorkLogs = (farmId: string, from?: string, to?: string) => {
  return useQuery({
    queryKey: WORKLOG_KEYS.byFarm(from, to),
    queryFn: () => workLogService.getFarmWorkLogs(from, to),
    enabled: !!farmId,
  });
};

export const useWorkLogDetail = (taskId: string, workLogId: string) => {
  return useQuery({
    queryKey: WORKLOG_KEYS.detail(taskId, workLogId),
    queryFn: () => workLogService.getWorkLogDetail(taskId, workLogId),
    enabled: !!taskId && !!workLogId,
  });
};

export const useWorkLogSummary = (from: string, to: string) => {
  return useQuery({
    queryKey: WORKLOG_KEYS.summary(from, to),
    queryFn: () => workLogService.getWorkLogSummary(from, to),
    enabled: !!from && !!to,
  });
};

export const useEmployeeWorkLogs = (employeeId: string, from?: string, to?: string) => {
  return useQuery({
    queryKey: WORKLOG_KEYS.byEmployee(employeeId, from, to),
    queryFn: () => workLogService.getEmployeeWorkLogs(employeeId, from, to),
    enabled: !!employeeId,
  });
};


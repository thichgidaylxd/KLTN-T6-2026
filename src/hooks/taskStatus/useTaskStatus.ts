import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { TaskStatusHistory, TaskStatusTransition, TaskStatusObject } from '../../types/seasonPlan/seasonPlan';
import { taskStatusService } from '../../services/taskStatus/taskStatusService';
import { extractErrorMessage } from '../../utils/errorUtils';

const TASK_STATUS_KEYS = {
  list: ['taskStatuses'] as const,
  transitions: ['taskStatusTransitions'] as const,
  histories: (planId: string, stageId: string, taskId: string) =>
    ['taskStatusHistories', planId, stageId, taskId] as const,
  available: (planId: string, stageId: string, taskId: string) =>
    ['availableTaskStatuses', planId, stageId, taskId] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

// ── Hook: Task Status management ──
export function useTaskStatus() {
  const queryClient = useQueryClient();

  // All task statuses (global)
  const taskStatusesQuery = useQuery<TaskStatusObject[]>({
    queryKey: TASK_STATUS_KEYS.list,
    queryFn: async () => {
      const response = await taskStatusService.getTaskStatuses();
      return response ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Task status transitions (farm-level)
  const transitionsQuery = useQuery<TaskStatusTransition[]>({
    queryKey: TASK_STATUS_KEYS.transitions,
    queryFn: async () => {
      const response = await taskStatusService.getTaskStatusTransitions();
      return response ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({
      planId,
      stageId,
      taskId,
      taskStatusId,
    }: {
      planId: string;
      stageId: string;
      taskId: string;
      taskStatusId: string;
    }) => {
      const response = await taskStatusService.updateTaskStatus(planId, stageId, taskId, taskStatusId);
      return response.data;
    },
    onSuccess: (_, { planId, stageId, taskId }) => {
      void queryClient.invalidateQueries({
        queryKey: TASK_STATUS_KEYS.histories(planId, stageId, taskId),
      });
      void queryClient.invalidateQueries({
        queryKey: TASK_STATUS_KEYS.available(planId, stageId, taskId),
      });
      toast.success('Cập nhật trạng thái thành công');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err));
    },
  });

  return {
    taskStatuses: taskStatusesQuery.data ?? [],
    taskStatusesLoading: taskStatusesQuery.isLoading || taskStatusesQuery.isFetching,
    transitions: transitionsQuery.data ?? [],
    transitionsLoading: transitionsQuery.isLoading || transitionsQuery.isFetching,
    updateTaskStatus: useCallback(
      (planId: string, stageId: string, taskId: string, taskStatusId: string) =>
        withUnwrap(updateTaskStatusMutation.mutateAsync({ planId, stageId, taskId, taskStatusId })),
      [updateTaskStatusMutation],
    ),
    refreshTaskStatuses: useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: TASK_STATUS_KEYS.list });
      void queryClient.invalidateQueries({ queryKey: TASK_STATUS_KEYS.transitions });
    }, [queryClient]),
  };
}

// ── Hook: Task status histories & available statuses ──
export function useTaskStatusDetails(
  planId: string | undefined,
  stageId: string | undefined,
  taskId: string | undefined,
) {
  const enabled = !!planId && !!stageId && !!taskId;

  const historiesQuery = useQuery<TaskStatusHistory[]>({
    queryKey: enabled
      ? TASK_STATUS_KEYS.histories(planId!, stageId!, taskId!)
      : ['taskStatusHistories', 'none'],
    queryFn: async () => {
      if (!planId || !stageId || !taskId) throw new Error('Missing IDs');
      const response = await taskStatusService.getTaskStatusHistories(planId, stageId, taskId);
      return response ?? [];
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  const availableQuery = useQuery<TaskStatusObject[]>({
    queryKey: enabled
      ? TASK_STATUS_KEYS.available(planId!, stageId!, taskId!)
      : ['availableTaskStatuses', 'none'],
    queryFn: async () => {
      if (!planId || !stageId || !taskId) throw new Error('Missing IDs');
      const response = await taskStatusService.getAvailableTaskStatuses(planId, stageId, taskId);
      return response ?? [];
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  return {
    statusHistories: historiesQuery.data ?? [],
    availableStatuses: availableQuery.data ?? [],
    loading: historiesQuery.isLoading || availableQuery.isLoading,
    error: historiesQuery.error || availableQuery.error,
    refetch: () => {
      if (planId && stageId && taskId) {
        void queryClient.invalidateQueries({
          queryKey: TASK_STATUS_KEYS.histories(planId, stageId, taskId),
        });
        void queryClient.invalidateQueries({
          queryKey: TASK_STATUS_KEYS.available(planId, stageId, taskId),
        });
      }
    },
  };
}

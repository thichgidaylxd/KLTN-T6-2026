import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskAssigneeService } from '../../services/taskAssignee/taskAssigneeService';
import { AddTaskAssigneeRequest } from '../../types/taskAssignee';

const ASSIGNEE_KEYS = {
  all: ['task-assignees'] as const,
  task: (planId: string, stageId: string, taskId: string) =>
    [...ASSIGNEE_KEYS.all, planId, stageId, taskId] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

export const useTaskAssignees = (planId?: string, stageId?: string, taskId?: string, enabled: boolean = true) => {
  const queryClient = useQueryClient();

  const assigneesQuery = useQuery({
    queryKey: planId && stageId && taskId ? ASSIGNEE_KEYS.task(planId, stageId, taskId) : ['task-assignees', 'empty'],
    queryFn: () => {
      if (!planId || !stageId || !taskId) return Promise.resolve([]);
      return taskAssigneeService.getTaskAssignees(planId, stageId, taskId);
    },
    enabled: enabled && !!planId && !!stageId && !!taskId,
    staleTime: 1000 * 60 * 5,
  });

  const addAssigneeMutation = useMutation({
    mutationFn: (data: AddTaskAssigneeRequest) => {
      if (!planId || !stageId || !taskId) throw new Error('Missing IDs');
      return taskAssigneeService.addTaskAssignee(planId, stageId, taskId, data);
    },
    onSuccess: () => {
      if (planId && stageId && taskId) {
        queryClient.invalidateQueries({ queryKey: ASSIGNEE_KEYS.task(planId, stageId, taskId) });
      }
    },
  });

  const error = useMemo(
    () => assigneesQuery.error ?? addAssigneeMutation.error ?? null,
    [assigneesQuery.error, addAssigneeMutation.error]
  );

  return {
    assignees: assigneesQuery.data ?? [],
    loading: assigneesQuery.isLoading || assigneesQuery.isFetching,
    adding: addAssigneeMutation.isPending,
    error,

    fetchAssignees: useCallback(() => {
      if (!planId || !stageId || !taskId) return Promise.resolve([]);
      return withUnwrap(
        queryClient.fetchQuery({
          queryKey: ASSIGNEE_KEYS.task(planId, stageId, taskId),
          queryFn: () => taskAssigneeService.getTaskAssignees(planId, stageId, taskId),
        })
      );
    }, [planId, stageId, taskId, queryClient]),

    addAssignee: useCallback((data: AddTaskAssigneeRequest) => {
      return withUnwrap(addAssigneeMutation.mutateAsync(data));
    }, [addAssigneeMutation]),

    deleteAssignee: useCallback((assigneeId: string) => {
      if (!planId || !stageId || !taskId) return Promise.reject(new Error('Missing IDs'));
      return withUnwrap(taskAssigneeService.deleteTaskAssignee(planId, stageId, taskId, assigneeId).then(() => {
        queryClient.invalidateQueries({ queryKey: ASSIGNEE_KEYS.task(planId, stageId, taskId) });
      }));
    }, [planId, stageId, taskId, queryClient]),
  };
};

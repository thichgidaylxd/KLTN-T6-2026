import { useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { taskAssigneeService } from '../../services/taskAssignee/taskAssigneeService';
import { AddTaskAssigneeRequest } from '../../types/taskAssignee';
import { AppDispatch, RootState } from '../../store';
import { setTaskAssigneesSnapshot } from '../../store/taskAssigneeSlice';

const ASSIGNEE_KEYS = {
  all: ['task-assignees'] as const,
  task: (planId: string, stageId: string, taskId: string) =>
    [...ASSIGNEE_KEYS.all, planId, stageId, taskId] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

export const useTaskAssignees = (planId?: string, stageId?: string, taskId?: string, enabled: boolean = true) => {
  const dispatch = useDispatch<AppDispatch>();
  const taskAssigneeBridge = useSelector((state: RootState) => state.taskAssignee);
  const queryClient = useQueryClient();
  const taskKey = planId && stageId && taskId ? `${planId}:${stageId}:${taskId}` : null;

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

  useEffect(() => {
    if (taskKey && assigneesQuery.data) {
      dispatch(setTaskAssigneesSnapshot({ taskKey, assignees: assigneesQuery.data }));
    }
  }, [assigneesQuery.data, dispatch, taskKey]);

  return {
    assignees: assigneesQuery.data ?? (taskKey ? taskAssigneeBridge.assigneesByTaskSnapshot[taskKey] ?? [] : []),
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

    deleteAssignee: useCallback((assigneeId: string, removalReason?: string) => {
      if (!planId || !stageId || !taskId) return Promise.reject(new Error('Missing IDs'));
      return withUnwrap(taskAssigneeService.deleteTaskAssignee(planId, stageId, taskId, assigneeId, removalReason).then(() => {
        queryClient.invalidateQueries({ queryKey: ASSIGNEE_KEYS.task(planId, stageId, taskId) });
      }));
    }, [planId, stageId, taskId, queryClient]),
  };
};

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { TaskMaterial, AddTaskMaterialRequest } from '../../types/taskMaterial/taskMaterial';
import { taskMaterialService } from '../../services/taskMaterial/taskMaterialService';


const TASK_MATERIAL_KEYS = {
  list: (planId: string, stageId: string, taskId: string) =>
    ['taskMaterials', planId, stageId, taskId] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

// ── Hook: Danh sách vật tư của Task ──
export function useTaskMaterials(
  planId: string | undefined,
  stageId: string | undefined,
  taskId: string | undefined,
  enabledParam: boolean = true
) {
  const queryClient = useQueryClient();

  const enabled = enabledParam && !!planId && !!stageId && !!taskId;

  const taskMaterialsQuery = useQuery<TaskMaterial[]>({
    queryKey: enabled
      ? TASK_MATERIAL_KEYS.list(planId as string, stageId as string, taskId as string)
      : ['taskMaterials', 'none'],
    queryFn: async () => {
      if (!planId || !stageId || !taskId) throw new Error('Missing IDs');
      const response = await taskMaterialService.getTaskMaterials(planId, stageId, taskId);
      return response.data ?? [];
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  const addTaskMaterialMutation = useMutation({
    mutationFn: async ({ data, planId, stageId, taskId }: { data: AddTaskMaterialRequest; planId: string; stageId: string; taskId: string }) => {
      const response = await taskMaterialService.addTaskMaterial(planId, stageId, taskId, data);
      return response.data;
    },
    onSuccess: (_, { planId, stageId, taskId }) => {
      void queryClient.invalidateQueries({
        queryKey: TASK_MATERIAL_KEYS.list(planId, stageId, taskId),
      });
    },
    onError: () => {
    },
  });

  const deleteTaskMaterialMutation = useMutation({
    mutationFn: async ({ materialId, planId, stageId, taskId }: { materialId: string; planId: string; stageId: string; taskId: string }) => {
      const response = await taskMaterialService.deleteTaskMaterial(planId, stageId, taskId, materialId);
      return response.data;
    },
    onSuccess: (__, { materialId: _, planId, stageId, taskId }) => {
      void queryClient.invalidateQueries({
        queryKey: TASK_MATERIAL_KEYS.list(planId, stageId, taskId),
      });
    },
    onError: () => {
    },
  });

  return {
    taskMaterials: taskMaterialsQuery.data ?? [],
    taskMaterialsLoading: taskMaterialsQuery.isLoading || taskMaterialsQuery.isFetching,
    error: taskMaterialsQuery.error,
    addTaskMaterial: useCallback(
      (data: AddTaskMaterialRequest) => {
        if (!planId || !stageId || !taskId) {
          return Promise.reject(new Error('Missing planId, stageId, or taskId'));
        }
        return withUnwrap(
          addTaskMaterialMutation.mutateAsync({
            data,
            planId: planId as string,
            stageId: stageId as string,
            taskId: taskId as string,
          }),
        );
      },
      [addTaskMaterialMutation, planId, stageId, taskId],
    ),
    deleteTaskMaterial: useCallback(
      (materialId: string) => {
        if (!planId || !stageId || !taskId) {
          return Promise.reject(new Error('Missing planId, stageId, or taskId'));
        }
        return withUnwrap(
          deleteTaskMaterialMutation.mutateAsync({
            materialId,
            planId: planId as string,
            stageId: stageId as string,
            taskId: taskId as string,
          }),
        );
      },
      [deleteTaskMaterialMutation, planId, stageId, taskId],
    ),
    refreshTaskMaterials: useCallback(() => {
      if (planId && stageId && taskId) {
        void queryClient.invalidateQueries({
          queryKey: TASK_MATERIAL_KEYS.list(planId, stageId, taskId),
        });
      }
    }, [queryClient, planId, stageId, taskId]),
  };
}

import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskMaterialService } from '../../services/taskMaterial/taskMaterialService';
import { AddTaskMaterialRequest } from '../../types/taskMaterial';

const MATERIAL_KEYS = {
  all: ['task-materials'] as const,
  task: (planId: string, stageId: string, taskId: string) => [...MATERIAL_KEYS.all, planId, stageId, taskId] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

/**
 * Hook quản lý vật tư công việc (Task Materials)
 */
export const useTaskMaterials = (planId?: string, stageId?: string, taskId?: string, enabled: boolean = true) => {
  const queryClient = useQueryClient();

  // Query lấy danh sách vật tư
  const materialsQuery = useQuery({
    queryKey: planId && stageId && taskId ? MATERIAL_KEYS.task(planId, stageId, taskId) : ['task-materials', 'empty'],
    queryFn: () => {
      if (!planId || !stageId || !taskId) return Promise.resolve([]);
      return taskMaterialService.getTaskMaterials(planId, stageId, taskId);
    },
    enabled: enabled && !!planId && !!stageId && !!taskId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation thêm vật tư
  const addMaterialMutation = useMutation({
    mutationFn: (data: AddTaskMaterialRequest) => {
      if (!planId || !stageId || !taskId) throw new Error('Missing IDs');
      return taskMaterialService.addTaskMaterial(planId, stageId, taskId, data);
    },
    onSuccess: () => {
      if (planId && stageId && taskId) {
        queryClient.invalidateQueries({ queryKey: MATERIAL_KEYS.task(planId, stageId, taskId) });
      }
    },
  });

  const error = useMemo(
    () => materialsQuery.error ?? addMaterialMutation.error ?? null,
    [materialsQuery.error, addMaterialMutation.error]
  );

  return {
    materials: materialsQuery.data ?? [],
    loading: materialsQuery.isLoading || materialsQuery.isFetching,
    adding: addMaterialMutation.isPending,
    error,
    
    fetchMaterials: useCallback(() => {
      if (!planId || !stageId || !taskId) return Promise.resolve([]);
      return withUnwrap(queryClient.fetchQuery({
        queryKey: MATERIAL_KEYS.task(planId, stageId, taskId),
        queryFn: () => taskMaterialService.getTaskMaterials(planId, stageId, taskId),
      }));
    }, [planId, stageId, taskId, queryClient]),

    addMaterial: useCallback((data: AddTaskMaterialRequest) => {
      return withUnwrap(addMaterialMutation.mutateAsync(data));
    }, [addMaterialMutation]),

    deleteMaterial: useCallback((materialId: string) => {
      if (!planId || !stageId || !taskId) return Promise.reject(new Error('Missing IDs'));
      return withUnwrap(taskMaterialService.deleteTaskMaterial(planId, stageId, taskId, materialId).then(() => {
        queryClient.invalidateQueries({ queryKey: MATERIAL_KEYS.task(planId, stageId, taskId) });
      }));
    }, [planId, stageId, taskId, queryClient]),
  };
};

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Phase } from '../../types/seasonPlan/seasonPlan';
import { seasonPlanService } from '../../services/seasonplan/seasonPlanService';

const STAGE_KEYS = {
  list: (planId: string) => ['stages', planId] as const,
  detail: (planId: string, stageId: string) => ['stages', planId, stageId] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

// ── Hook: Danh sách stages của plan ──
export function useStages(planId: string | undefined) {
  const queryClient = useQueryClient();

  const stagesQuery = useQuery<Phase[]>({
    queryKey: planId ? STAGE_KEYS.list(planId) : ['stages', 'none'],
    queryFn: async () => {
      if (!planId) throw new Error('No planId');
      const response = await seasonPlanService.getStages(planId);
      return response ?? [];
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 2,
  });

  const createStageMutation = useMutation({
    mutationFn: async ({ planId, data }: { planId: string; data: { name: string; startDate: string; endDate: string } }) => {
      const response = await seasonPlanService.createStage(planId, data);
      return response;
    },
    onSuccess: (_, { planId }) => {
      void queryClient.invalidateQueries({ queryKey: STAGE_KEYS.list(planId) });
    },
    onError: () => {
    },
  });

  const updateStageTimeMutation = useMutation({
    mutationFn: async ({ planId, stageId, data }: { planId: string; stageId: string; data: { startDate: string; endDate: string } }) => {
      const response = await seasonPlanService.updateStageTime(planId, stageId, data);
      return response;
    },
    onSuccess: (_, { planId, stageId }) => {
      void queryClient.invalidateQueries({ queryKey: STAGE_KEYS.list(planId) });
      void queryClient.invalidateQueries({ queryKey: STAGE_KEYS.detail(planId, stageId) });
    },
    onError: () => {
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ planId, stageId, data }: { planId: string; stageId: string; data: { name?: string; startDate?: string; endDate?: string } }) => {
      const response = await seasonPlanService.updateStage(planId, stageId, data);
      return response;
    },
    onSuccess: (_, { planId, stageId }) => {
      void queryClient.invalidateQueries({ queryKey: STAGE_KEYS.list(planId) });
      void queryClient.invalidateQueries({ queryKey: STAGE_KEYS.detail(planId, stageId) });
    },
    onError: () => {
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: async ({ planId, stageId }: { planId: string; stageId: string }) => {
      await seasonPlanService.deleteStage(planId, stageId);
    },
    onSuccess: (_, { planId }) => {
      void queryClient.invalidateQueries({ queryKey: STAGE_KEYS.list(planId) });
    },
    onError: () => {
    },
  });

  return {
    stages: stagesQuery.data ?? [],
    stagesLoading: stagesQuery.isLoading || stagesQuery.isFetching,
    error: stagesQuery.error,
    createStage: useCallback(
      (planId: string, data: { name: string; startDate: string; endDate: string }) =>
        withUnwrap(createStageMutation.mutateAsync({ planId, data })),
      [createStageMutation],
    ),
    updateStageTime: useCallback(
      (planId: string, stageId: string, data: { startDate: string; endDate: string }) =>
        withUnwrap(updateStageTimeMutation.mutateAsync({ planId, stageId, data })),
      [updateStageTimeMutation],
    ),
    updateStage: useCallback(
      (planId: string, stageId: string, data: { name?: string; startDate?: string; endDate?: string }) =>
        withUnwrap(updateStageMutation.mutateAsync({ planId, stageId, data })),
      [updateStageMutation],
    ),
    deleteStage: useCallback(
      (planId: string, stageId: string) =>
        withUnwrap(deleteStageMutation.mutateAsync({ planId, stageId })),
      [deleteStageMutation],
    ),
    refreshStages: useCallback(() => {
      if (planId) {
        void queryClient.invalidateQueries({ queryKey: STAGE_KEYS.list(planId) });
      }
    }, [queryClient, planId]),
  };
}

// ── Hook: Chi tiết 1 stage ──
export function useStage(planId: string | undefined, stageId: string | undefined) {
  const query = useQuery<Phase>({
    queryKey: planId && stageId ? STAGE_KEYS.detail(planId, stageId) : ['stages', 'detail', 'none'],
    queryFn: async () => {
      if (!planId || !stageId) throw new Error('Missing planId or stageId');
      const response = await seasonPlanService.getStageById(planId, stageId);
      return response;
    },
    enabled: !!planId && !!stageId,
    staleTime: 1000 * 60 * 2,
  });

  return {
    stage: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

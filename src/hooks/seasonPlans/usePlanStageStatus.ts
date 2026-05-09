import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { seasonPlanService } from '../../services/seasonplan/seasonPlanService';

const STATUS_KEYS = {
  all: ['planStageStatus'] as const,
  available: (planId: string, stageId: string) => [...STATUS_KEYS.all, 'available', planId, stageId] as const,
  histories: (planId: string, stageId: string) => [...STATUS_KEYS.all, 'histories', planId, stageId] as const,
  allStatuses: ['planStageStatus', 'all'] as const,
  transitions: ['planStageStatus', 'transitions'] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

export const usePlanStageStatus = () => {
  const queryClient = useQueryClient();


  const getStageStatusHistories = useCallback(
    (planId: string, stageId: string) =>
      withUnwrap(seasonPlanService.getStageStatusHistories(planId, stageId)),
    []
  );

  /**
   * GET /api/v1/plan-stage-statuses
   * Tất cả trạng thái master
   */
  const allPlanStageStatusesQuery = useQuery({
    queryKey: STATUS_KEYS.allStatuses,
    queryFn: async () => {
      const data = await seasonPlanService.getAllPlanStageStatuses();
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 phút
  });

  /**
   * GET /api/v1/plan-stage-status-transitions
   * Transitions theo farm
   */
  const transitionsQuery = useQuery({
    queryKey: STATUS_KEYS.transitions,
    queryFn: async () => {
      const data = await seasonPlanService.getPlanStageStatusTransitions();
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  // --- Mutations ---

  /**
   * PUT /api/v1/plans/{planId}/stages/{stageId}/status/{statusId}
   * Cập nhật trạng thái stage
   */
  const updateStageStatusMutation = useMutation({
    mutationFn: async ({ planId, stageId, statusId }: { planId: string; stageId: string; statusId: string }) => {
      const result = await seasonPlanService.updateStageStatus(planId, stageId, statusId);
      return result;
    },
    onSuccess: (_, { planId, stageId }) => {
      // Invalidate lịch sử của stage đó
      queryClient.invalidateQueries({ queryKey: STATUS_KEYS.histories(planId, stageId) });
      // Có thể invalidate available-statuses nếu logic phụ thuộc
      queryClient.invalidateQueries({ queryKey: STATUS_KEYS.available(planId, stageId) });
    },
  });

  /**
   * Fetch available statuses (async function)
   */
  const getAvailableStatuses = useCallback(
    (planId: string, stageId: string) =>
      withUnwrap(seasonPlanService.getAvailableStatuses(planId, stageId)),
    []
  );

  /**
   * Hook for available statuses (React Query)
   */
  const useAvailableStatusesHook = (planId: string, stageId: string, enabled = true) =>
    useQuery({
      queryKey: STATUS_KEYS.available(planId, stageId),
      queryFn: () => seasonPlanService.getAvailableStatuses(planId, stageId),
      enabled: enabled && !!planId && !!stageId,
      staleTime: 1000 * 60 * 5,
    });

  return {
    // --- Queries ---
    allPlanStageStatuses: allPlanStageStatusesQuery.data ?? [],
    allPlanStageStatusesLoading: allPlanStageStatusesQuery.isLoading,
    allPlanStageStatusesError: allPlanStageStatusesQuery.error,

    planStageStatusTransitions: transitionsQuery.data ?? [],
    planStageStatusTransitionsLoading: transitionsQuery.isLoading,
    planStageStatusTransitionsError: transitionsQuery.error,

    // --- Custom fetchers ---
    getAvailableStatuses,
    getStageStatusHistories,
    useAvailableStatuses: useAvailableStatusesHook,

    // --- Mutation ---
    updateStageStatus: useCallback(
      (planId: string, stageId: string, statusId: string) =>
        withUnwrap(updateStageStatusMutation.mutateAsync({ planId, stageId, statusId })),
      [updateStageStatusMutation.mutateAsync]
    ),
    isUpdatingStageStatus: updateStageStatusMutation.isPending,
    updateStageStatusError: updateStageStatusMutation.error,

    // --- Helpers ---
    invalidateStage: useCallback((planId: string, stageId: string) => {
      queryClient.invalidateQueries({ queryKey: STATUS_KEYS.histories(planId, stageId) });
      queryClient.invalidateQueries({ queryKey: STATUS_KEYS.available(planId, stageId) });
    }, [queryClient]),

    clearData: useCallback(() => {
      queryClient.removeQueries({ queryKey: STATUS_KEYS.all });
    }, [queryClient]),
  };
};

/**
 * Hook for Phase (Stage) status histories and available statuses
 */
export const usePlanStageStatusDetails = (
  planId: string | undefined,
  stageId: string | undefined,
  enabledArg: boolean = true
) => {
  const queryClient = useQueryClient();
  const enabled = enabledArg && !!planId && !!stageId;

  const historiesQuery = useQuery({
    queryKey: enabled
      ? STATUS_KEYS.histories(planId!, stageId!)
      : ['planStageStatus', 'histories', 'none'],
    queryFn: () => {
      if (!planId || !stageId) throw new Error('Missing IDs');
      return seasonPlanService.getStageStatusHistories(planId, stageId);
    },
    enabled,
    staleTime: 0,
    gcTime: 0,
  });

  const availableQuery = useQuery({
    queryKey: enabled
      ? STATUS_KEYS.available(planId!, stageId!)
      : ['planStageStatus', 'available', 'none'],
    queryFn: () => {
      if (!planId || !stageId) throw new Error('Missing IDs');
      return seasonPlanService.getAvailableStatuses(planId, stageId);
    },
    enabled,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    histories: historiesQuery.data ?? [],
    historiesLoading: historiesQuery.isLoading || historiesQuery.isFetching,
    availableStatuses: availableQuery.data ?? [],
    loading: historiesQuery.isLoading || availableQuery.isLoading,
    error: historiesQuery.error || availableQuery.error,
    refetch: () => {
      if (planId && stageId) {
        void queryClient.invalidateQueries({ queryKey: STATUS_KEYS.histories(planId, stageId) });
        void queryClient.invalidateQueries({ queryKey: STATUS_KEYS.available(planId, stageId) });
      }
    },
  };
};

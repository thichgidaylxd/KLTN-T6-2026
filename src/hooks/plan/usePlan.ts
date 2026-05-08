import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  Plan,
  CreatePlanRequest,
  UpdatePlanTimeRequest,
  AddPlotsRequest,
  PlotInPlan,
} from '../../types/plan/plan';
import { planService } from '../../services/plan/planService';
import { extractErrorMessage } from '../../utils/errorUtils';

const PLAN_KEYS = {
  list: ['plans', 'list'] as const,
  detail: (planId: string) => ['plans', 'detail', planId] as const,
  plots: (planId: string) => ['plans', planId, 'plots'] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

// ── Hook: Danh sách plans ──
export function usePlans() {
  const queryClient = useQueryClient();

  const plansQuery = useQuery<Plan[]>({
    queryKey: PLAN_KEYS.list,
    queryFn: async () => {
      const response = await planService.getPlans();
      return response.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: CreatePlanRequest) => {
      const response = await planService.createPlan(data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Tạo kế hoạch thành công');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err));
    },
  });

  const updatePlanTimeMutation = useMutation({
    mutationFn: async ({ planId, data }: { planId: string; data: UpdatePlanTimeRequest }) => {
      const response = await planService.updatePlanTime(planId, data);
      return response.data;
    },
    onSuccess: (_, { planId }) => {
      void queryClient.invalidateQueries({ queryKey: ['plans'] });
      void queryClient.invalidateQueries({ queryKey: PLAN_KEYS.detail(planId) });
      toast.success('Cập nhật thời gian thành công');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err));
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await planService.deletePlan(planId);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Xóa kế hoạch thành công');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err));
    },
  });

  const addPlotsMutation = useMutation({
    mutationFn: async ({ planId, data }: { planId: string; data: AddPlotsRequest }) => {
      const response = await planService.addPlotsToPlan(planId, data);
      return response.data;
    },
    onSuccess: (result, { planId }) => {
      void queryClient.invalidateQueries({ queryKey: PLAN_KEYS.plots(planId) });
      toast.success(`Đã thêm ${result.addedPlots.length} plot vào kế hoạch`);
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err));
    },
  });

  return {
    plans: plansQuery.data ?? [],
    plansLoading: plansQuery.isLoading || plansQuery.isFetching,
    error: plansQuery.error,
    createPlan: useCallback((data: CreatePlanRequest) => withUnwrap(createPlanMutation.mutateAsync(data)), [
      createPlanMutation,
    ]),
    updatePlanTime: useCallback(
      (planId: string, data: UpdatePlanTimeRequest) =>
        withUnwrap(updatePlanTimeMutation.mutateAsync({ planId, data })),
      [updatePlanTimeMutation],
    ),
    deletePlan: useCallback((id: string) => withUnwrap(deletePlanMutation.mutateAsync(id)), [deletePlanMutation]),
    addPlotsToPlan: useCallback(
      (planId: string, data: AddPlotsRequest) => withUnwrap(addPlotsMutation.mutateAsync({ planId, data })),
      [addPlotsMutation],
    ),
    refreshPlans: useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['plans'] });
    }, [queryClient]),
  };
}

// ── Hook: Chi tiết 1 plan ──
export function usePlan(planId?: string | null) {
  const query = useQuery<Plan>({
    queryKey: planId ? PLAN_KEYS.detail(planId) : ['plans', 'detail', 'none'],
    queryFn: async () => {
      if (!planId) throw new Error('No planId');
      const response = await planService.getPlanById(planId);
      return response.data;
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 2,
  });

  return {
    plan: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ── Hook: Danh sách plots của plan ──
export function usePlanPlots(planId?: string | null) {
  const query = useQuery<PlotInPlan[]>({
    queryKey: planId ? PLAN_KEYS.plots(planId) : ['plots', 'none'],
    queryFn: async () => {
      if (!planId) throw new Error('No planId');
      const response = await planService.getPlanPlots(planId);
      return response.data ?? [];
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 2,
  });

  return {
    plots: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

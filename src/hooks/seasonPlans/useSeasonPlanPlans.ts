import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateSeasonPlanRequest, SeasonPlan } from '../../types/seasonPlan';
import { seasonPlanService } from '../../services/seasonplan/seasonPlanService';
import { createUpdatePlansCache, PLAN_KEYS, withUnwrap } from './seasonPlanShared';

export const useSeasonPlanPlans = () => {
  const queryClient = useQueryClient();
  const updatePlansCache = useMemo(() => createUpdatePlansCache(queryClient), [queryClient]);

  const plansQuery = useQuery({
    queryKey: PLAN_KEYS.list,
    queryFn: () => seasonPlanService.getPlans(),
    enabled: false,
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: CreateSeasonPlanRequest) => seasonPlanService.createPlan(data),
    onSuccess: (newPlan) => {
      updatePlansCache((prev) => [...prev, newPlan]);
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => seasonPlanService.deletePlan(planId).then(() => planId),
    onSuccess: (planId) => {
      updatePlansCache((prev) => prev.filter((p) => p.id !== planId));
    },
  });

  const updatePlanTimeMutation = useMutation({
    mutationFn: ({ planId, startDate, endDate, version }: { planId: string; startDate: string; endDate: string; version?: number }) =>
      seasonPlanService.updatePlanTime(planId, { startDate, endDate, version }),
    onSuccess: (updatedPlan) => {
      updatePlansCache((prev) =>
        prev.map((plan) =>
          plan.id === updatedPlan.id ? { ...updatedPlan, phases: plan.phases, plots: plan.plots } : plan,
        ),
      );
    },
  });

  const error = plansQuery.error;

  return {
    plans: plansQuery.data ?? [],
    loading: plansQuery.isLoading || plansQuery.isFetching,
    createLoading: createPlanMutation.isPending,
    error,
    createError: createPlanMutation.error,
    deleteError: deletePlanMutation.error,
    updatePlanTimeError: updatePlanTimeMutation.error,
    updatePlansCache,
    fetchPlans: useCallback(
      () => withUnwrap(queryClient.fetchQuery({ queryKey: PLAN_KEYS.list, queryFn: () => seasonPlanService.getPlans() })),
      [queryClient],
    ),
    createPlan: useCallback((data: CreateSeasonPlanRequest) => withUnwrap(createPlanMutation.mutateAsync(data)), [createPlanMutation]),
    updatePlan: useCallback(
      (planId: string, data: Partial<SeasonPlan>) => withUnwrap(seasonPlanService.updatePlan(planId, data)),
      [],
    ),
    deletePlan: useCallback((planId: string) => withUnwrap(deletePlanMutation.mutateAsync(planId)), [deletePlanMutation]),
    updatePlanTime: useCallback(
      (planId: string, startDate: string, endDate: string, version?: number) =>
        withUnwrap(updatePlanTimeMutation.mutateAsync({ planId, startDate, endDate, version })),
      [updatePlanTimeMutation],
    ),
    fetchPlanPlots: useCallback(
      (planId: string) =>
        withUnwrap(
          seasonPlanService.getPlanPlots(planId).then((plots) => {
            updatePlansCache((prev) => prev.map((p) => (p.id === planId ? { ...p, plots } : p)));
            return { planId, plots };
          }),
        ),
      [updatePlansCache],
    ),
    addPlotsToPlan: useCallback(
      (planId: string, plotIds: string[]) =>
        withUnwrap(
          seasonPlanService.addPlotsToPlan(planId, plotIds).then((result) => {
            updatePlansCache((prev) =>
              prev.map((p) => {
                if (p.id !== planId) return p;
                const current = p.plots ?? [];
                const incoming = result.addedPlots ?? [];
                const merged = [...current];
                incoming.forEach((item: { plotId: string; plotName: string }) => {
                  if (!merged.some((m) => m.plotId === item.plotId)) merged.push(item);
                });
                return { ...p, plots: merged };
              }),
            );
            return { planId, addedPlots: result.addedPlots ?? [] };
          }),
        ),
      [updatePlansCache],
    ),
    addPlanToState: useCallback(
      (plan: SeasonPlan) => {
        updatePlansCache((prev) => [...prev, plan]);
      },
      [updatePlansCache],
    ),
  };
};


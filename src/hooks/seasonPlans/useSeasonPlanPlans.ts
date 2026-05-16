import { useCallback, useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateSeasonPlanRequest, SeasonPlan } from '@/types/seasonPlan';
import { seasonPlanService } from '@/services/seasonplan/seasonPlanService';
import { createUpdatePlansCache, PLAN_KEYS, withUnwrap } from './seasonPlanShared';
import { useAuth } from '../auth/useAuth';

export const useSeasonPlanPlans = (farmId?: string) => {
  const queryClient = useQueryClient();
  const { currentFarmId } = useAuth();
  const [activeFarmId, setActiveFarmId] = useState<string | null>(farmId || currentFarmId);
  
  useEffect(() => {
    if (farmId) {
      setActiveFarmId(farmId);
    } else if (currentFarmId) {
      setActiveFarmId(currentFarmId);
    }
  }, [currentFarmId, farmId]);

  const updatePlansCache = useMemo(() => createUpdatePlansCache(queryClient, activeFarmId), [queryClient, activeFarmId]);

  const plansQuery = useQuery({
    queryKey: activeFarmId ? PLAN_KEYS.byFarm(activeFarmId) : PLAN_KEYS.list,
    queryFn: () => seasonPlanService.getPlans(),
    enabled: !!activeFarmId || !farmId,
    refetchInterval: 30000, // Tự động cập nhật mỗi 30 giây để đảm bảo hiệu suất nông trại luôn mới
    refetchOnWindowFocus: true,
    // Merge existing phases/plots from cache when refetching list
    select: (newData: SeasonPlan[]) => {
      const currentData = queryClient.getQueryData<SeasonPlan[]>(
        activeFarmId ? PLAN_KEYS.byFarm(activeFarmId) : PLAN_KEYS.list
      );
      
      return newData.map(newPlan => {
        const existing = currentData?.find(p => p.id === newPlan.id);
        return {
          ...newPlan,
          phases: (newPlan.phases && newPlan.phases.length > 0) 
            ? newPlan.phases.map(ph => {
                const existingPh = existing?.phases?.find(eph => eph.id === ph.id);
                return {
                  ...ph,
                  tasks: (ph.tasks && ph.tasks.length > 0) ? ph.tasks : (existingPh?.tasks ?? [])
                };
              })
            : (existing?.phases ?? []),
          plots: (newPlan.plots && newPlan.plots.length > 0) ? newPlan.plots : (existing?.plots ?? []),
        };
      });
    }
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
          plan.id === (updatedPlan as any).id ? { ...(updatedPlan as any), phases: plan.phases, plots: plan.plots } : plan,
        ),
      );
    },
  });

  const error = plansQuery.error;

  return {
    plans: plansQuery.data ?? [],
    loading: plansQuery.isLoading, // Chỉ hiển thị loading ở lần tải đầu tiên
    isFetching: plansQuery.isFetching,
    createLoading: createPlanMutation.isPending,
    error,
    createError: createPlanMutation.error,
    deleteError: deletePlanMutation.error,
    updatePlanTimeError: updatePlanTimeMutation.error,
    updatePlansCache,
    fetchPlans: useCallback(
      (id?: string) => {
        if (id) setActiveFarmId(id);
        const key = id ? PLAN_KEYS.byFarm(id) : (activeFarmId ? PLAN_KEYS.byFarm(activeFarmId) : PLAN_KEYS.list);
        return withUnwrap(queryClient.fetchQuery({ queryKey: key, queryFn: () => seasonPlanService.getPlans() }));
      },
      [queryClient, activeFarmId],
    ),
    fetchPlan: useCallback(
      (planId: string) =>
        withUnwrap(
          queryClient.fetchQuery({
            queryKey: PLAN_KEYS.detail(planId),
            queryFn: async () => {
              const plan = await seasonPlanService.getPlanById(planId);
              // Update list cache with this new data
              updatePlansCache((prev) =>
                prev.map((p) => (p.id === planId ? { 
                  ...p, 
                  ...plan, 
                  phases: (plan.phases && plan.phases.length > 0) ? plan.phases : p.phases,
                  plots: (plan.plots && plan.plots.length > 0) ? plan.plots : p.plots 
                } : p)),
              );
              return plan;
            },
          }),
        ),
      [queryClient, updatePlansCache],
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
    deletePlotFromPlan: useCallback(
      (planId: string, plotId: string) =>
        withUnwrap(
          seasonPlanService.removePlotFromPlan(planId, plotId).then(() => {
            updatePlansCache((prev) =>
              prev.map((p) =>
                p.id === planId ? { ...p, plots: p.plots?.filter((pt) => pt.plotId !== plotId) } : p,
              ),
            );
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


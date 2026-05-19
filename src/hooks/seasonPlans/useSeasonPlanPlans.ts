import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateSeasonPlanRequest, SeasonPlan } from '@/types/seasonPlan';
import { seasonPlanService } from '@/services/seasonplan/seasonPlanService';
import { createUpdatePlansCache, PLAN_KEYS, withUnwrap } from './seasonPlanShared';
import { useAuth } from '../auth/useAuth';

export const useSeasonPlanPlans = (farmId?: string) => {
  const queryClient = useQueryClient();
  const { currentFarmId } = useAuth();
  const [activeFarmId, setActiveFarmId] = useState<string | null>(farmId || currentFarmId);

  // Ref để luôn có activeFarmId mới nhất trong callbacks mà không cần thêm vào deps
  const activeFarmIdRef = useRef(activeFarmId);
  activeFarmIdRef.current = activeFarmId;

  useEffect(() => {
    if (farmId) {
      setActiveFarmId(farmId);
    } else if (currentFarmId) {
      setActiveFarmId(currentFarmId);
    }
  }, [currentFarmId, farmId]);

  const updatePlansCache = useMemo(
    () => createUpdatePlansCache(queryClient, activeFarmId),
    [queryClient, activeFarmId],
  );

  /**
   * Lấy existing data từ cache — thử nhiều keys để tránh miss khi activeFarmId vừa thay đổi
   */
  const getExistingFromCache = useCallback(
    (targetFarmId: string | null): SeasonPlan[] | undefined => {
      const key = targetFarmId ? PLAN_KEYS.byFarm(targetFarmId) : PLAN_KEYS.list;
      return (
        queryClient.getQueryData<SeasonPlan[]>(key) ??
        // Thử key của activeFarmId hiện tại nếu khác targetFarmId
        (activeFarmIdRef.current && activeFarmIdRef.current !== targetFarmId
          ? queryClient.getQueryData<SeasonPlan[]>(PLAN_KEYS.byFarm(activeFarmIdRef.current))
          : undefined) ??
        // Fallback về list key
        queryClient.getQueryData<SeasonPlan[]>(PLAN_KEYS.list)
      );
    },
    [queryClient],
  );

  /**
   * Merge phases an toàn: luôn ưu tiên giữ tasks/phases từ cache
   * kể cả khi list API trả về phases: []
   */
  const mergePhases = useCallback(
    (
      newPhases: SeasonPlan['phases'],
      existingPhases: SeasonPlan['phases'],
    ): SeasonPlan['phases'] => {
      // List API không trả về phases → giữ nguyên existing
      if (!newPhases || newPhases.length === 0) {
        return existingPhases ?? [];
      }

      // Merge từng phase mới với existing, giữ tasks nếu API không trả về
      const merged = newPhases.map(ph => {
        const existingPh = existingPhases?.find(eph => eph.id === ph.id);
        return {
          ...ph,
          tasks:
            ph.tasks && ph.tasks.length > 0
              ? ph.tasks
              : existingPh?.tasks ?? [],
        };
      });

      // Giữ lại phases trong existing mà list API không trả về (tránh mất dữ liệu)
      if (existingPhases && existingPhases.length > 0) {
        const newPhaseIds = new Set(newPhases.map(p => p.id));
        const orphanPhases = existingPhases.filter(p => !newPhaseIds.has(p.id));
        return [...merged, ...orphanPhases];
      }

      return merged;
    },
    [],
  );

  const fetchAndMergePlans = useCallback(
    async (targetFarmId: string | null) => {
      const newData = await seasonPlanService.getPlans();

      // FIX CHÍNH: Lấy existing từ cache (thử nhiều keys)
      const existingData = getExistingFromCache(targetFarmId);

      // Nếu không có cache → vẫn merge từ detail cache của từng plan thay vì return thẳng
      return newData.map(newPlan => {
        const existing =
          existingData?.find(p => p.id === newPlan.id) ??
          // Thử lấy từ detail cache
          queryClient.getQueryData<SeasonPlan>(PLAN_KEYS.detail(newPlan.id));

        if (!existing) return newPlan;

        return {
          ...newPlan,
          phases: mergePhases(newPlan.phases, existing.phases),
          plots:
            newPlan.plots && newPlan.plots.length > 0
              ? newPlan.plots
              : existing.plots ?? [],
        };
      });
    },
    [queryClient, getExistingFromCache, mergePhases],
  );

  const plansQuery = useQuery({
    queryKey: activeFarmId ? PLAN_KEYS.byFarm(activeFarmId) : PLAN_KEYS.list,
    queryFn: () => fetchAndMergePlans(activeFarmId),
    enabled: !!activeFarmId || !farmId,
    refetchOnWindowFocus: false,
    // Tắt refetchInterval mặc định — thay bằng setInterval thủ công bên dưới
    // để chỉ cập nhật metadata mà KHÔNG ghi đè phases/tasks
  });

  /**
   * Thay thế refetchInterval: 30000
   * Chỉ cập nhật metadata (name, status, startDate, endDate, version)
   * KHÔNG bao giờ ghi đè phases/tasks từ list API
   */
  useEffect(() => {
    if (!activeFarmId) return;

    const intervalId = setInterval(async () => {
      try {
        const freshPlans = await seasonPlanService.getPlans();
        const cacheKey = PLAN_KEYS.byFarm(activeFarmId);

        queryClient.setQueryData<SeasonPlan[]>(cacheKey, (old = []) =>
          old.map(existing => {
            const updated = freshPlans.find(p => p.id === existing.id);
            if (!updated) return existing;

            // Chỉ cập nhật metadata — KHÔNG đụng phases và plots
            return {
              ...existing,
              name: updated.name,
              status: updated.status,
              startDate: updated.startDate,
              endDate: updated.endDate,
              version: updated.version,
            };
          }),
        );
      } catch {
        // Silent fail — giữ nguyên data cũ, không làm crash UI
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [activeFarmId, queryClient]);

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
    mutationFn: ({
      planId,
      startDate,
      endDate,
      version,
    }: {
      planId: string;
      startDate: string;
      endDate: string;
      version?: number;
    }) => seasonPlanService.updatePlanTime(planId, { startDate, endDate, version }),
    onSuccess: (updatedPlan) => {
      updatePlansCache((prev) =>
        prev.map((plan) =>
          plan.id === (updatedPlan as any).id
            ? { ...(updatedPlan as any), phases: plan.phases, plots: plan.plots }
            : plan,
        ),
      );
    },
  });

  const error = plansQuery.error;

  return {
    plans: plansQuery.data ?? [],
    loading: plansQuery.isLoading,
    isFetching: plansQuery.isFetching,
    createLoading: createPlanMutation.isPending,
    error,
    createError: createPlanMutation.error,
    deleteError: deletePlanMutation.error,
    updatePlanTimeError: updatePlanTimeMutation.error,
    updatePlansCache,
    fetchPlans: useCallback(
      (id?: string) => {
        const nextFarmId = id || activeFarmId;
        if (id) setActiveFarmId(id);
        const key = nextFarmId ? PLAN_KEYS.byFarm(nextFarmId) : PLAN_KEYS.list;
        return withUnwrap(
          queryClient.fetchQuery({
            queryKey: key,
            queryFn: () => fetchAndMergePlans(nextFarmId),
          }),
        );
      },
      [queryClient, activeFarmId, fetchAndMergePlans],
    ),
    fetchPlan: useCallback(
      (planId: string) =>
        withUnwrap(
          queryClient.fetchQuery({
            queryKey: PLAN_KEYS.detail(planId),
            queryFn: async () => {
              const plan = await seasonPlanService.getPlanById(planId);
              updatePlansCache((prev) =>
                prev.map((p) =>
                  p.id === planId
                    ? {
                        ...p,
                        ...plan,
                        phases: mergePhases(plan.phases, p.phases),
                        plots:
                          plan.plots && plan.plots.length > 0 ? plan.plots : p.plots,
                      }
                    : p,
                ),
              );
              return plan;
            },
          }),
        ),
      [queryClient, updatePlansCache, mergePhases],
    ),
    createPlan: useCallback(
      (data: CreateSeasonPlanRequest) => withUnwrap(createPlanMutation.mutateAsync(data)),
      [createPlanMutation],
    ),
    updatePlan: useCallback(
      (planId: string, data: Partial<SeasonPlan>) =>
        withUnwrap(seasonPlanService.updatePlan(planId, data)),
      [],
    ),
    deletePlan: useCallback(
      (planId: string) => withUnwrap(deletePlanMutation.mutateAsync(planId)),
      [deletePlanMutation],
    ),
    updatePlanTime: useCallback(
      (planId: string, startDate: string, endDate: string, version?: number) =>
        withUnwrap(updatePlanTimeMutation.mutateAsync({ planId, startDate, endDate, version })),
      [updatePlanTimeMutation],
    ),
    fetchPlanPlots: useCallback(
      (planId: string) =>
        withUnwrap(
          seasonPlanService.getPlanPlots(planId).then((plots) => {
            updatePlansCache((prev) =>
              prev.map((p) => (p.id === planId ? { ...p, plots } : p)),
            );
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
                p.id === planId
                  ? { ...p, plots: p.plots?.filter((pt) => pt.plotId !== plotId) }
                  : p,
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
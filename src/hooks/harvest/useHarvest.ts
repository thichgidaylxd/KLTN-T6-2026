import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { harvestService } from '@/services/harvest/harvestService';
import {
  CreateHarvestRequest,
  UpdateHarvestRequest,
  HarvestFilterRequest,
} from '@/types/harvest/harvest';

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

export const HARVEST_KEYS = {
  all:                  ['harvests'] as const,
  detail:               (harvestId: string) => ['harvest', harvestId] as const,
  byPlan:               (farmId: string, planId: string) => ['harvests', 'plan', farmId, planId] as const,
  summaryByPlan:        (farmId: string, planId: string) => ['harvest-summary', 'plan', farmId, planId] as const,
  byStage:              (farmId: string, planId: string, stageId: string) => ['harvests', 'stage', farmId, planId, stageId] as const,
  summaryByStage:       (farmId: string, planId: string, stageId: string) => ['harvest-summary', 'stage', farmId, planId, stageId] as const,
  byPlot:               (farmId: string, planId: string, plotId: string) => ['harvests', 'plot', farmId, planId, plotId] as const,
  summaryByPlot:        (farmId: string, planId: string, plotId: string) => ['harvest-summary', 'plot', farmId, planId, plotId] as const,
  byFarm:               (farmId: string) => ['harvests', 'farm', farmId] as const,
  seasonSummary:        (farmId: string, planId: string) => ['season-summary', farmId, planId] as const,
  materialCost:         (farmId: string, planId: string) => ['material-cost', farmId, planId] as const,
  laborCost:            (farmId: string, planId: string) => ['labor-cost', farmId, planId] as const,
  seasonComparison:     (farmId: string) => ['season-comparison', farmId] as const,
};

// ── Get single harvest ──────────────────────────────────────────
export const useHarvestDetail = (farmId: string, planId: string, harvestId: string) => {
  return useQuery({
    queryKey: HARVEST_KEYS.detail(harvestId),
    queryFn: () => harvestService.getHarvestDetail(farmId, planId, harvestId),
    enabled: !!farmId && !!planId && !!harvestId,
    select: (data) => data.data,
  });
};

// ── Harvests by plan ────────────────────────────────────────────
export const useHarvestsByPlan = (
  farmId: string,
  planId: string,
  page: number = 0,
  size: number = 10,
  sort: string[] = ['createdAt,desc'],
  filter?: HarvestFilterRequest
) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: HARVEST_KEYS.byPlan(farmId, planId),
    queryFn: () => harvestService.getHarvestsByPlan(farmId, planId, filter, { page, size, sort }),
    enabled: !!farmId && !!planId,
    select: (data) => data.data,
  });

  const createMutation = useMutation({
    mutationFn: (request: CreateHarvestRequest) =>
      harvestService.createHarvest(farmId, planId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HARVEST_KEYS.byPlan(farmId, planId) });
      queryClient.invalidateQueries({ queryKey: HARVEST_KEYS.summaryByPlan(farmId, planId) });
      queryClient.invalidateQueries({ queryKey: HARVEST_KEYS.seasonSummary(farmId, planId) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ harvestId, request }: { harvestId: string; request: UpdateHarvestRequest }) =>
      harvestService.updateHarvest(farmId, planId, harvestId, request),
    onSuccess: (_, { harvestId }) => {
      queryClient.invalidateQueries({ queryKey: HARVEST_KEYS.byPlan(farmId, planId) });
      queryClient.invalidateQueries({ queryKey: HARVEST_KEYS.detail(harvestId) });
      queryClient.invalidateQueries({ queryKey: HARVEST_KEYS.seasonSummary(farmId, planId) });
    },
  });

  return {
    harvests: query.data?.content ?? [],
    pageData: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createHarvest: useCallback(
      (request: CreateHarvestRequest) => withUnwrap(createMutation.mutateAsync(request)),
      [createMutation]
    ),
    updateHarvest: useCallback(
      (harvestId: string, request: UpdateHarvestRequest) =>
        withUnwrap(updateMutation.mutateAsync({ harvestId, request })),
      [updateMutation]
    ),
  };
};

// ── Harvest summary by plan ─────────────────────────────────────
export const useHarvestSummaryByPlan = (farmId: string, planId: string) => {
  return useQuery({
    queryKey: HARVEST_KEYS.summaryByPlan(farmId, planId),
    queryFn: () => harvestService.getHarvestSummaryByPlan(farmId, planId),
    enabled: !!farmId && !!planId,
    select: (data) => data.data,
  });
};

// ── Harvests by stage ───────────────────────────────────────────
export const useHarvestsByStage = (
  farmId: string,
  planId: string,
  stageId: string,
  page: number = 0,
  size: number = 10
) => {
  return useQuery({
    queryKey: HARVEST_KEYS.byStage(farmId, planId, stageId),
    queryFn: () =>
      harvestService.getHarvestsByStage(farmId, planId, stageId, {
        page, size, sort: ['harvestDate,desc'],
      }),
    enabled: !!farmId && !!planId && !!stageId,
    select: (data) => data.data,
  });
};

export const useHarvestSummaryByStage = (farmId: string, planId: string, stageId: string) => {
  return useQuery({
    queryKey: HARVEST_KEYS.summaryByStage(farmId, planId, stageId),
    queryFn: () => harvestService.getHarvestSummaryByStage(farmId, planId, stageId),
    enabled: !!farmId && !!planId && !!stageId,
    select: (data) => data.data,
  });
};

// ── Harvests by plot ────────────────────────────────────────────
export const useHarvestsByPlot = (
  farmId: string,
  planId: string,
  plotId: string,
  page: number = 0,
  size: number = 10
) => {
  return useQuery({
    queryKey: HARVEST_KEYS.byPlot(farmId, planId, plotId),
    queryFn: () =>
      harvestService.getHarvestsByPlot(farmId, planId, plotId, {
        page, size, sort: ['harvestDate,desc'],
      }),
    enabled: !!farmId && !!planId && !!plotId,
    select: (data) => data.data,
  });
};

export const useHarvestSummaryByPlot = (farmId: string, planId: string, plotId: string) => {
  return useQuery({
    queryKey: HARVEST_KEYS.summaryByPlot(farmId, planId, plotId),
    queryFn: () => harvestService.getHarvestSummaryByPlot(farmId, planId, plotId),
    enabled: !!farmId && !!planId && !!plotId,
    select: (data) => data.data,
  });
};

// ── Harvests by farm ────────────────────────────────────────────
export const useHarvestsByFarm = (
  farmId: string,
  fromDate?: string,
  toDate?: string,
  page: number = 0,
  size: number = 10
) => {
  return useQuery({
    queryKey: HARVEST_KEYS.byFarm(farmId),
    queryFn: () =>
      harvestService.getHarvestsByFarm(farmId, fromDate, toDate, {
        page, size, sort: ['harvestDate,desc'],
      }),
    enabled: !!farmId,
    select: (data) => data.data,
  });
};

// ── Reports ─────────────────────────────────────────────────────
export const useSeasonSummary = (farmId: string, planId: string) => {
  return useQuery({
    queryKey: HARVEST_KEYS.seasonSummary(farmId, planId),
    queryFn: () => harvestService.getSeasonSummary(farmId, planId),
    enabled: !!farmId && !!planId,
    select: (data) => data.data,
  });
};

export const useMaterialCost = (farmId: string, planId: string) => {
  return useQuery({
    queryKey: HARVEST_KEYS.materialCost(farmId, planId),
    queryFn: () => harvestService.getMaterialCost(farmId, planId),
    enabled: !!farmId && !!planId,
    select: (data) => data.data,
  });
};

export const useLaborCost = (farmId: string, planId: string) => {
  return useQuery({
    queryKey: HARVEST_KEYS.laborCost(farmId, planId),
    queryFn: () => harvestService.getLaborCost(farmId, planId),
    enabled: !!farmId && !!planId,
    select: (data) => data.data,
  });
};

export const useCompareSeasons = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ farmId, planIds }: { farmId: string; planIds: string[] }) =>
      harvestService.compareSeasons(farmId, planIds),
    onSuccess: (_, { farmId }) => {
      queryClient.invalidateQueries({ queryKey: HARVEST_KEYS.seasonComparison(farmId) });
    },
  });
};
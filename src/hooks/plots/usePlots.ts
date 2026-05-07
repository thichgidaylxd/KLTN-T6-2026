import { useCallback, useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreatePlotInput, UpdatePlotInput, Plot } from '../../types/plot/plot';
import { plotService } from '../../services/plots/plotService';
import { dashboardService } from '../../services/dashboard/dashboardService';
import { useAuth } from '../auth/useAuth';

const PLOT_KEYS = {
  all: ['plots'] as const,
  byFarm: (farmId: string) => ['plots', farmId] as const,
  aggregate: (hubToken: string) => ['plots', 'aggregate', hubToken] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

const EMPTY_ARRAY: any[] = [];

export const usePlots = () => {
  const queryClient = useQueryClient();
  const { currentFarmId } = useAuth();
  const [activeFarmId, setActiveFarmId] = useState<string | null>(currentFarmId);
  const [activeHubToken, setActiveHubToken] = useState<string | null>(null);

  // Sync with Redux state
  useEffect(() => {
    if (currentFarmId) {
      setActiveFarmId(currentFarmId);
    }
  }, [currentFarmId]);

  const plotsQuery = useQuery({
    queryKey: activeFarmId ? PLOT_KEYS.byFarm(activeFarmId) : ['plots', 'inactive'],
    queryFn: async () => plotService.getPlots(),
    enabled: !!activeFarmId,
  });

  const aggregateQuery = useQuery({
    queryKey: activeHubToken ? PLOT_KEYS.aggregate(activeHubToken) : ['plots', 'aggregate', 'inactive'],
    queryFn: async () => dashboardService.fetchAggregateStats(activeHubToken as string),
    enabled: !!activeHubToken,
  });

  const createPlotMutation = useMutation({
    mutationFn: ({ plotData }: { farmId: string; plotData: CreatePlotInput }) => plotService.createPlot(plotData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PLOT_KEYS.all });
    },
  });

  const updatePlotMutation = useMutation({
    mutationFn: ({ plotId, plotData }: { farmId: string; plotId: string; plotData: UpdatePlotInput }) =>
      plotService.updatePlot(plotId, plotData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PLOT_KEYS.all });
    },
  });

  const deletePlotMutation = useMutation({
    mutationFn: ({ plotId }: { farmId: string; plotId: string }) => plotService.deletePlot(plotId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PLOT_KEYS.all });
    },
  });

  const loading =
    plotsQuery.isLoading ||
    plotsQuery.isFetching ||
    aggregateQuery.isLoading ||
    aggregateQuery.isFetching ||
    createPlotMutation.isPending ||
    updatePlotMutation.isPending ||
    deletePlotMutation.isPending;

  const error = useMemo(
    () =>
      plotsQuery.error ??
      aggregateQuery.error ??
      createPlotMutation.error ??
      updatePlotMutation.error ??
      deletePlotMutation.error ??
      null,
    [
      plotsQuery.error,
      aggregateQuery.error,
      createPlotMutation.error,
      updatePlotMutation.error,
      deletePlotMutation.error,
    ],
  );

  return {
    plots: plotsQuery.data ?? EMPTY_ARRAY,
    aggregateStats: aggregateQuery.data
      ? {
          totalPlots: aggregateQuery.data.totalPlots,
          totalArea: aggregateQuery.data.totalArea,
        }
      : { totalPlots: 0, totalArea: 0 },
    loading,
    error,
    fetchPlots: useCallback(
      (farmId: string) => {
        setActiveFarmId(farmId);
        return withUnwrap(queryClient.fetchQuery({ queryKey: PLOT_KEYS.byFarm(farmId), queryFn: () => plotService.getPlots() }));
      },
      [queryClient],
    ),
    createPlot: useCallback(
      (farmId: string, plotData: CreatePlotInput) =>
        withUnwrap(createPlotMutation.mutateAsync({ farmId, plotData })),
      [createPlotMutation],
    ),
    updatePlot: useCallback(
      (farmId: string, plotId: string, plotData: UpdatePlotInput) =>
        withUnwrap(updatePlotMutation.mutateAsync({ farmId, plotId, plotData })),
      [updatePlotMutation],
    ),
    deletePlot: useCallback(
      (farmId: string, plotId: string) => withUnwrap(deletePlotMutation.mutateAsync({ farmId, plotId })),
      [deletePlotMutation],
    ),
    clearError: useCallback(() => undefined, []),
    setAggregateStats: useCallback((_: { totalPlots: number; totalArea: number }) => undefined, []),
    setPlots: useCallback((plots: Plot[]) => {
      if (!activeFarmId) return;
      queryClient.setQueryData(PLOT_KEYS.byFarm(activeFarmId), plots);
    }, [activeFarmId, queryClient]),
    clearPlots: useCallback(() => {
      if (!activeFarmId) return;
      queryClient.removeQueries({ queryKey: PLOT_KEYS.byFarm(activeFarmId) });
    }, [activeFarmId, queryClient]),
    fetchAggregateStats: useCallback(
      (hubToken: string) => {
        setActiveHubToken(hubToken);
        return withUnwrap(
          queryClient.fetchQuery({
            queryKey: PLOT_KEYS.aggregate(hubToken),
            queryFn: () => dashboardService.fetchAggregateStats(hubToken),
          }),
        );
      },
      [queryClient],
    ),
  };
};

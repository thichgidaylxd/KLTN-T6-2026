import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Plot, CreatePlotRequest, UpdatePlotRequest } from '../../types/plot/plot';
import { plotService } from '../../services/plots/plotService';


const PLOT_KEYS = {
  all: ['plots'] as const,
  lists: () => [...PLOT_KEYS.all, 'list'] as const,
  list: (farmId?: string) => [...PLOT_KEYS.lists(), farmId || 'current'] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

// ── Hook: Danh sách plots ──
export function usePlots(farmId?: string) {
  const queryClient = useQueryClient();

  const plotsQuery = useQuery<Plot[]>({
    queryKey: PLOT_KEYS.list(farmId),
    queryFn: async () => {
      const response = await plotService.getPlots();
      return response.data ?? [];
    },
    // Không cache quá lâu cho dữ liệu thường xuyên thay đổi như Plot
    staleTime: 0,
  });

  const invalidate = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: PLOT_KEYS.all });
  }, [queryClient]);

  const createPlotMutation = useMutation({
    mutationFn: async (data: CreatePlotRequest) => {
      const response = await plotService.createPlot(data);
      return response.data;
    },
    onSuccess: async () => {
      await invalidate();
    },
    onError: () => {
      // Handled by component
    },
  });

  const updatePlotMutation = useMutation({
    mutationFn: async ({ plotId, data }: { plotId: string; data: UpdatePlotRequest }) => {
      const response = await plotService.updatePlot(plotId, data);
      return response.data;
    },
    onSuccess: async () => {
      await invalidate();
    },
    onError: () => {
      // Handled by component
    },
  });

  const deletePlotMutation = useMutation({
    mutationFn: async (plotId: string) => {
      const response = await plotService.deletePlot(plotId);
      return response.data;
    },
    onSuccess: async () => {
      await invalidate();
    },
    onError: () => {
      // Handled by component
    },
  });

  return {
    plots: plotsQuery.data ?? [],
    plotsLoading: plotsQuery.isLoading,
    error: plotsQuery.error,
    fetchPlots: useCallback(() => {
      void invalidate();
    }, [invalidate]),
    clearPlots: useCallback(() => {
      queryClient.setQueryData(PLOT_KEYS.all, []);
    }, [queryClient]),
    createPlot: useCallback((data: CreatePlotRequest) => withUnwrap(createPlotMutation.mutateAsync(data)), [
      createPlotMutation,
    ]),
    updatePlot: useCallback(
      (plotId: string, data: UpdatePlotRequest) =>
        withUnwrap(updatePlotMutation.mutateAsync({ plotId, data })),
      [updatePlotMutation],
    ),
    deletePlot: useCallback((id: string) => withUnwrap(deletePlotMutation.mutateAsync(id)), [deletePlotMutation]),
    refreshPlots: useCallback(() => {
      void invalidate();
    }, [invalidate]),
  };
}

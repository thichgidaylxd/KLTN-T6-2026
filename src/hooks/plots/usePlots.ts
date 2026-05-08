import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Plot, CreatePlotRequest, UpdatePlotRequest } from '../../types/plot/plot';
import { plotService } from '../../services/plots/plotService';
import { extractErrorMessage } from '../../utils/errorUtils';

const PLOT_KEYS = {
  list: ['plots', 'list'] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

// ── Hook: Danh sách plots ──
export function usePlots() {
  const queryClient = useQueryClient();

  const plotsQuery = useQuery<Plot[]>({
    queryKey: PLOT_KEYS.list,
    queryFn: async () => {
      const response = await plotService.getPlots();
      return response.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const createPlotMutation = useMutation({
    mutationFn: async (data: CreatePlotRequest) => {
      const response = await plotService.createPlot(data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plots'] });
      toast.success('Tạo lô đất thành công');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err));
    },
  });

  const updatePlotMutation = useMutation({
    mutationFn: async ({ plotId, data }: { plotId: string; data: UpdatePlotRequest }) => {
      const response = await plotService.updatePlot(plotId, data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plots'] });
      toast.success('Cập nhật lô đất thành công');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err));
    },
  });

  const deletePlotMutation = useMutation({
    mutationFn: async (plotId: string) => {
      const response = await plotService.deletePlot(plotId);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plots'] });
      toast.success('Xóa lô đất thành công');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err));
    },
  });

   return {
     plots: plotsQuery.data ?? [],
     plotsLoading: plotsQuery.isLoading || plotsQuery.isFetching,
     error: plotsQuery.error,
     fetchPlots: useCallback(() => {
       void queryClient.invalidateQueries({ queryKey: PLOT_KEYS.list });
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
       void queryClient.invalidateQueries({ queryKey: ['plots'] });
     }, [queryClient]),
   };
}

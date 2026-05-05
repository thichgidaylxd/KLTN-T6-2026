import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateSkuDto, Sku } from '../../types/sku/sku';
import { skuService } from '../../services/sku/skuService';

const SKU_KEYS = {
  byFarm: (farmId: string) => ['skus', farmId] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

export const useSkus = () => {
  const queryClient = useQueryClient();
  const [farmId, setFarmId] = useState<string | null>(null);

  const skusQuery = useQuery({
    queryKey: farmId ? SKU_KEYS.byFarm(farmId) : ['skus', 'inactive'],
    queryFn: async (): Promise<Sku[]> => skuService.getSkus(farmId as string),
    enabled: !!farmId,
  });

  const createSkuMutation = useMutation({
    mutationFn: async ({ farmId: targetFarmId, data }: { farmId: string; data: CreateSkuDto }) => {
      return skuService.createSku(targetFarmId, data);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: SKU_KEYS.byFarm(variables.farmId) });
    },
  });

  const deleteSkuMutation = useMutation({
    mutationFn: async ({ farmId: targetFarmId, sku }: { farmId: string; sku: string }) => {
      await skuService.deleteSku(targetFarmId, sku);
      return sku;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: SKU_KEYS.byFarm(variables.farmId) });
    },
  });

  const loading = skusQuery.isLoading || skusQuery.isFetching || createSkuMutation.isPending || deleteSkuMutation.isPending;
  const error = useMemo(() => skusQuery.error ?? createSkuMutation.error ?? deleteSkuMutation.error ?? null, [
    skusQuery.error,
    createSkuMutation.error,
    deleteSkuMutation.error,
  ]);

  return {
    skus: skusQuery.data ?? [],
    loading,
    error,
    fetchSkus: useCallback(
      (farmIdValue: string): Promise<Sku[]> => {
        setFarmId(farmIdValue);
        return withUnwrap(
          queryClient.fetchQuery({
            queryKey: SKU_KEYS.byFarm(farmIdValue),
            queryFn: async (): Promise<Sku[]> => skuService.getSkus(farmIdValue),
          }),
        );
      },
      [queryClient],
    ),
    createSku: useCallback(
      (farmIdValue: string, data: CreateSkuDto) => withUnwrap(createSkuMutation.mutateAsync({ farmId: farmIdValue, data })),
      [createSkuMutation],
    ),
    deleteSku: useCallback(
      (farmIdValue: string, sku: string) => withUnwrap(deleteSkuMutation.mutateAsync({ farmId: farmIdValue, sku })),
      [deleteSkuMutation],
    ),
  };
};

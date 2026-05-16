import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateWarehouseRequest } from '../../types/warehouse/warehouse';
import { warehouseService } from '../../services/warehouse/warehouseService';

const WAREHOUSE_KEYS = {
  byFarm: (farmId: string) => ['warehouses', farmId] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

const EMPTY_ARRAY: any[] = [];

export const useWarehouses = () => {
  const queryClient = useQueryClient();
  const [farmId, setFarmId] = useState<string | null>(null);

  const warehousesQuery = useQuery({
    queryKey: farmId ? WAREHOUSE_KEYS.byFarm(farmId) : ['warehouses', 'inactive'],
    queryFn: async () => (await warehouseService.getWarehouses(farmId as string)).data ?? [],
    enabled: !!farmId,
  });

  const createWarehouseMutation = useMutation({
    mutationFn: async ({ farmId: targetFarmId, data }: { farmId: string; data: CreateWarehouseRequest }) => {
      const res = await warehouseService.createWarehouse(targetFarmId, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: WAREHOUSE_KEYS.byFarm(variables.farmId) });
    },
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: async ({ farmId: targetFarmId, warehouseId, data }: { farmId: string; warehouseId: string; data: any }) => {
      const res = await warehouseService.updateWarehouse(targetFarmId, warehouseId, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: WAREHOUSE_KEYS.byFarm(variables.farmId) });
    },
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: async ({ farmId: targetFarmId, warehouseId }: { farmId: string; warehouseId: string }) => {
      await warehouseService.deleteWarehouse(targetFarmId, warehouseId);
      return warehouseId;
    },
    onSuccess: (deletedId, variables) => {
  
      queryClient.setQueryData(WAREHOUSE_KEYS.byFarm(variables.farmId), (oldData: any) => {
        if (!oldData) return [];
        // Nếu là mảng trực tiếp (kết quả từ queryFn)
        if (Array.isArray(oldData)) {
          return oldData.filter((wh: any) => wh.id !== deletedId);
        }
        // Nếu là object envelope
        if (oldData.data && Array.isArray(oldData.data)) {
          return {
            ...oldData,
            data: oldData.data.filter((wh: any) => wh.id !== deletedId)
          };
        }
        return [];
      });
    },
  });

  const loading = warehousesQuery.isLoading; // Chỉ hiển thị loading ở lần tải đầu tiên
  const submitting = createWarehouseMutation.isPending || updateWarehouseMutation.isPending || deleteWarehouseMutation.isPending;
  const error = useMemo(
    () => warehousesQuery.error ?? createWarehouseMutation.error ?? updateWarehouseMutation.error ?? deleteWarehouseMutation.error ?? null,
    [warehousesQuery.error, createWarehouseMutation.error, updateWarehouseMutation.error, deleteWarehouseMutation.error],
  );

  return {
    warehouses: warehousesQuery.data ?? EMPTY_ARRAY,
    loading,
    submitting,
    error,
    fetchWarehouses: useCallback(
      (farmIdValue: string) => {
        setFarmId(farmIdValue);
        // Sử dụng fetchQuery với staleTime: 0 để ép buộc lấy dữ liệu mới từ Server
        return withUnwrap(
          queryClient.fetchQuery({
            queryKey: WAREHOUSE_KEYS.byFarm(farmIdValue),
            queryFn: async () => (await warehouseService.getWarehouses(farmIdValue)).data ?? [],
            staleTime: 0, // Đảm bảo dữ liệu luôn được coi là cũ để fetch mới
          }),
        );
      },
      [queryClient],
    ),
    createWarehouse: useCallback(
      (farmIdValue: string, data: CreateWarehouseRequest) =>
        withUnwrap(createWarehouseMutation.mutateAsync({ farmId: farmIdValue, data })),
      [createWarehouseMutation],
    ),
    updateWarehouse: useCallback(
      (farmIdValue: string, warehouseId: string, data: any) =>
        withUnwrap(updateWarehouseMutation.mutateAsync({ farmId: farmIdValue, warehouseId, data })),
      [updateWarehouseMutation],
    ),
    deleteWarehouse: useCallback(
      (farmIdValue: string, warehouseId: string) =>
        withUnwrap(deleteWarehouseMutation.mutateAsync({ farmId: farmIdValue, warehouseId })),
      [deleteWarehouseMutation],
    ),
    clearError: useCallback(() => undefined, []),
  };
};

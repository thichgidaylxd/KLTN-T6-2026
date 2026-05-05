import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateWarehouseItemDto, WarehouseItem } from '../../types/warehouseItem/warehouseItem';
import { warehouseItemService } from '../../services/warehouseItem/warehouseItemService';

const ITEM_KEYS = {
  allByFarm: (farmId: string) => ['warehouse-items', farmId, 'all'] as const,
  byWarehouse: (farmId: string, warehouseId: string) => ['warehouse-items', farmId, warehouseId] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

export const useWarehouseItems = (farmId?: string | null, warehouseId?: string | null) => {
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: warehouseId && farmId
      ? ITEM_KEYS.byWarehouse(farmId, warehouseId)
      : farmId
        ? ITEM_KEYS.allByFarm(farmId)
        : ['warehouse-items', 'inactive'],
    queryFn: async (): Promise<WarehouseItem[]> => {
      if (!farmId) return [];
      if (warehouseId) {
        return warehouseItemService.getWarehouseItems(farmId, warehouseId);
      }
      
      // Nếu không có warehouseId, lấy tất cả vật tư của farm thông qua API chuyên dụng
      return warehouseItemService.getFarmWarehouseItems(farmId);
    },
    enabled: !!farmId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createItemMutation = useMutation({
    mutationFn: async ({
      fId,
      wId,
      itemData,
    }: {
      fId: string;
      wId: string;
      itemData: CreateWarehouseItemDto;
    }) => {
      return warehouseItemService.createWarehouseItem(fId, wId, itemData);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ITEM_KEYS.byWarehouse(variables.fId, variables.wId) });
      void queryClient.invalidateQueries({ queryKey: ITEM_KEYS.allByFarm(variables.fId) });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({
      fId,
      wId,
      itemId,
      itemData,
    }: {
      fId: string;
      wId: string;
      itemId: string;
      itemData: any;
    }) => {
      return warehouseItemService.updateWarehouseItem(fId, wId, itemId, itemData);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ITEM_KEYS.byWarehouse(variables.fId, variables.wId) });
      void queryClient.invalidateQueries({ queryKey: ITEM_KEYS.allByFarm(variables.fId) });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async ({
      fId,
      wId,
      itemId,
    }: {
      fId: string;
      wId: string;
      itemId: string;
    }) => {
      return warehouseItemService.deleteWarehouseItem(fId, wId, itemId);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ITEM_KEYS.byWarehouse(variables.fId, variables.wId) });
      void queryClient.invalidateQueries({ queryKey: ITEM_KEYS.allByFarm(variables.fId) });
    },
  });

  const deleteItemFromFarmMutation = useMutation({
    mutationFn: async ({
      fId,
      itemId,
    }: {
      fId: string;
      itemId: string;
    }) => {
      return warehouseItemService.deleteItemFromFarm(fId, itemId);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ITEM_KEYS.allByFarm(variables.fId) });
    },
  });

  const error = useMemo(() => 
    itemsQuery.error ?? 
    createItemMutation.error ?? 
    updateItemMutation.error ?? 
    deleteItemMutation.error ?? 
    deleteItemFromFarmMutation.error ?? 
    null, 
    [itemsQuery.error, createItemMutation.error, updateItemMutation.error, deleteItemMutation.error, deleteItemFromFarmMutation.error]
  );

  return {
    items: itemsQuery.data ?? [],
    loading: itemsQuery.isLoading || itemsQuery.isFetching || createItemMutation.isPending || updateItemMutation.isPending || deleteItemMutation.isPending || deleteItemFromFarmMutation.isPending,
    error,
    fetchItems: useCallback(
      (fId: string, wId: string): Promise<WarehouseItem[]> => {
        return withUnwrap(
          queryClient.fetchQuery({
            queryKey: ITEM_KEYS.byWarehouse(fId, wId),
            queryFn: async (): Promise<WarehouseItem[]> => {
              return warehouseItemService.getWarehouseItems(fId, wId);
            },
          }),
        );
      },
      [queryClient],
    ),
    fetchAllItems: useCallback(
      (fId: string): Promise<WarehouseItem[]> => {
        return withUnwrap(
          queryClient.fetchQuery({
            queryKey: ITEM_KEYS.allByFarm(fId),
            queryFn: async (): Promise<WarehouseItem[]> => {
              return warehouseItemService.getFarmWarehouseItems(fId);
            },
          }),
        );
      },
      [queryClient],
    ),
    createItem: useCallback(
      (fId: string, wId: string, itemData: CreateWarehouseItemDto) =>
        withUnwrap(createItemMutation.mutateAsync({ fId, wId, itemData })),
      [createItemMutation],
    ),
    updateItem: useCallback(
      (fId: string, wId: string, itemId: string, itemData: any) =>
        withUnwrap(updateItemMutation.mutateAsync({ fId, wId, itemId, itemData })),
      [updateItemMutation],
    ),
    deleteItem: useCallback(
      (fId: string, wId: string, itemId: string) =>
        withUnwrap(deleteItemMutation.mutateAsync({ fId, wId, itemId })),
      [deleteItemMutation],
    ),
    deleteItemFromFarm: useCallback(
      (fId: string, itemId: string) =>
        withUnwrap(deleteItemFromFarmMutation.mutateAsync({ fId, itemId })),
      [deleteItemFromFarmMutation],
    ),
  };
};

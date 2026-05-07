import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  WarehouseTransaction,
  PagedData,
  PageableParams,
} from '../../types/warehouseTransaction/warehouseTransaction';
import { warehouseTransactionService } from '../../services/warehouseTransaction/warehouseTransactionService';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const TRANSACTION_KEYS = {
  byItem: (warehouseItemId: string, page: number, size: number) =>
    ['warehouse-transactions', 'item', warehouseItemId, page, size] as const,
  byWarehouse: (farmId: string, warehouseId: string, page: number, size: number) =>
    ['warehouse-transactions', 'warehouse', farmId, warehouseId, page, size] as const,
  byFarm: (farmId: string, page: number, size: number) =>
    ['warehouse-transactions', 'farm', farmId, page, size] as const,
};

// ─── Hook: transactions by Warehouse Item ─────────────────────────────────────

export const useTransactionsByItem = (
  warehouseItemId?: string | null,
  initialPageable?: PageableParams,
) => {
  const [pageable, setPageable] = useState<PageableParams>({
    page: 0,
    size: 20,
    ...initialPageable,
  });

  const page = pageable.page ?? 0;
  const size = pageable.size ?? 20;

  const query = useQuery<PagedData<WarehouseTransaction>>({
    queryKey: warehouseItemId
      ? TRANSACTION_KEYS.byItem(warehouseItemId, page, size)
      : ['warehouse-transactions', 'item', 'inactive'],
    queryFn: () =>
      warehouseTransactionService.getTransactionsByItem(warehouseItemId!, pageable),
    enabled: !!warehouseItemId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    data: query.data ?? null,
    transactions: query.data?.content ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    pageable,
    setPageable,
    goToPage: useCallback((p: number) => setPageable(prev => ({ ...prev, page: p })), []),
    setPageSize: useCallback((s: number) => setPageable(prev => ({ ...prev, size: s, page: 0 })), []),
  };
};

// ─── Hook: transactions by Warehouse ─────────────────────────────────────────

export const useTransactionsByWarehouse = (
  farmId?: string | null,
  warehouseId?: string | null,
  initialPageable?: PageableParams,
) => {
  const [pageable, setPageable] = useState<PageableParams>({
    page: 0,
    size: 20,
    ...initialPageable,
  });

  const page = pageable.page ?? 0;
  const size = pageable.size ?? 20;

  const query = useQuery<PagedData<WarehouseTransaction>>({
    queryKey: farmId && warehouseId
      ? TRANSACTION_KEYS.byWarehouse(farmId, warehouseId, page, size)
      : ['warehouse-transactions', 'warehouse', 'inactive'],
    queryFn: () =>
      warehouseTransactionService.getTransactionsByWarehouse(farmId!, warehouseId!, pageable),
    enabled: !!farmId && !!warehouseId,
    staleTime: 1000 * 60 * 2,
  });

  return {
    data: query.data ?? null,
    transactions: query.data?.content ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    pageable,
    setPageable,
    goToPage: useCallback((p: number) => setPageable(prev => ({ ...prev, page: p })), []),
    setPageSize: useCallback((s: number) => setPageable(prev => ({ ...prev, size: s, page: 0 })), []),
  };
};

// ─── Hook: transactions by Farm ───────────────────────────────────────────────

export const useTransactionsByFarm = (
  farmId?: string | null,
  initialPageable?: PageableParams,
) => {
  const [pageable, setPageable] = useState<PageableParams>({
    page: 0,
    size: 20,
    ...initialPageable,
  });

  const page = pageable.page ?? 0;
  const size = pageable.size ?? 20;

  const queryClient = useQueryClient();

  const query = useQuery<PagedData<WarehouseTransaction>>({
    queryKey: farmId
      ? TRANSACTION_KEYS.byFarm(farmId, page, size)
      : ['warehouse-transactions', 'farm', 'inactive'],
    queryFn: () =>
      warehouseTransactionService.getTransactionsByFarm(farmId!, pageable),
    enabled: !!farmId,
    staleTime: 1000 * 60 * 2,
  });

  const refresh = useCallback(() => {
    if (farmId) {
      void queryClient.invalidateQueries({
        queryKey: ['warehouse-transactions', 'farm', farmId],
      });
    }
  }, [farmId, queryClient]);

  return {
    data: query.data ?? null,
    transactions: query.data?.content ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    pageable,
    setPageable,
    goToPage: useCallback((p: number) => setPageable(prev => ({ ...prev, page: p })), []),
    setPageSize: useCallback((s: number) => setPageable(prev => ({ ...prev, size: s, page: 0 })), []),
    refresh,
  };
};

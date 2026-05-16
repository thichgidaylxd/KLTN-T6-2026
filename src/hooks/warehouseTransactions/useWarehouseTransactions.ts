import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  WarehouseTransaction,
} from '../../types/warehouseTransaction/warehouseTransaction';
import { PagedData, PageableParams } from '../../types/common';
import { warehouseTransactionService } from '../../services/warehouseTransaction/warehouseTransactionService';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const TRANSACTION_KEYS = {
  byItem: (warehouseItemId: string, page: number, size: number, sortKey: string) =>
    ['warehouse-transactions', 'item', warehouseItemId, page, size, sortKey] as const,
  byWarehouse: (farmId: string, warehouseId: string, page: number, size: number, sortKey: string) =>
    ['warehouse-transactions', 'warehouse', farmId, warehouseId, page, size, sortKey] as const,
  byFarm: (farmId: string, page: number, size: number, sortKey: string) =>
    ['warehouse-transactions', 'farm', farmId, page, size, sortKey] as const,
};

// ─── Hook: transactions by Warehouse Item ─────────────────────────────────────

export const useTransactionsByItem = (
  warehouseItemId?: string | null,
  initialPageable?: PageableParams,
  options?: { enabled?: boolean },
) => {
  const [pageable, setPageable] = useState<PageableParams>({
    page: 0,
    size: 20,
    sort: ['createdAt,desc'],
    ...initialPageable,
  });

  const page = pageable.page ?? 0;
  const size = pageable.size ?? 20;
  const sort = pageable.sort ?? ['createdAt,desc'];
  const sortKey = sort.join('|');

  const queryClient = useQueryClient();

  const query = useQuery<PagedData<WarehouseTransaction>>({
    queryKey: warehouseItemId
      ? TRANSACTION_KEYS.byItem(warehouseItemId, page, size, sortKey)
      : ['warehouse-transactions', 'item', 'inactive'],
    queryFn: () =>
      warehouseTransactionService.getTransactionsByItem(warehouseItemId!, pageable),
    enabled: (options?.enabled ?? true) && !!warehouseItemId,
    staleTime: 0, 
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
    refresh: useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['warehouse-transactions'] });
    }, [queryClient]),
  };
};

// ─── Hook: transactions by Warehouse ─────────────────────────────────────────

export const useTransactionsByWarehouse = (
  farmId?: string | null,
  warehouseId?: string | null,
  initialPageable?: PageableParams,
  options?: { enabled?: boolean },
) => {
  const [pageable, setPageable] = useState<PageableParams>({
    page: 0,
    size: 20,
    sort: ['createdAt,desc'],
    ...initialPageable,
  });

  const page = pageable.page ?? 0;
  const size = pageable.size ?? 20;
  const sort = pageable.sort ?? ['createdAt,desc'];
  const sortKey = sort.join('|');

  const queryClient = useQueryClient();

  const query = useQuery<PagedData<WarehouseTransaction>>({
    queryKey: farmId && warehouseId
      ? TRANSACTION_KEYS.byWarehouse(farmId, warehouseId, page, size, sortKey)
      : ['warehouse-transactions', 'warehouse', 'inactive'],
    queryFn: () =>
      warehouseTransactionService.getTransactionsByWarehouse(farmId!, warehouseId!, pageable),
    enabled: (options?.enabled ?? true) && !!farmId && !!warehouseId,
    staleTime: 0,
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
    refresh: useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['warehouse-transactions'] });
    }, [queryClient]),
  };
};

// ─── Hook: transactions by Farm ───────────────────────────────────────────────

export const useTransactionsByFarm = (
  farmId?: string | null,
  initialPageable?: PageableParams,
  options?: { enabled?: boolean },
) => {
  const [pageable, setPageable] = useState<PageableParams>({
    page: 0,
    size: 20,
    sort: ['createdAt,desc'],
    ...initialPageable,
  });

  const page = pageable.page ?? 0;
  const size = pageable.size ?? 20;
  const sort = pageable.sort ?? ['createdAt,desc'];
  const sortKey = sort.join('|');

  const queryClient = useQueryClient();

  const query = useQuery<PagedData<WarehouseTransaction>>({
    queryKey: farmId
      ? TRANSACTION_KEYS.byFarm(farmId, page, size, sortKey)
      : ['warehouse-transactions', 'farm', 'inactive'],
    queryFn: () =>
      warehouseTransactionService.getTransactionsByFarm(farmId!, pageable),
    enabled: (options?.enabled ?? true) && !!farmId,
    staleTime: 0,
    refetchInterval: 30000, // Tự động cập nhật mỗi 30 giây để dòng thời gian hoạt động luôn mới
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
    loading: query.isLoading, // Chỉ hiển thị loading ở lần tải đầu tiên
    isFetching: query.isFetching,
    error: query.error,
    pageable,
    setPageable,
    goToPage: useCallback((p: number) => setPageable(prev => ({ ...prev, page: p })), []),
    setPageSize: useCallback((s: number) => setPageable(prev => ({ ...prev, size: s, page: 0 })), []),
    refresh,
  };
};

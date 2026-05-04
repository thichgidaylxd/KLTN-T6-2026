import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../config/axios';

export interface WarehouseLocation {
    id: string;
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    warehouse: {
        id: string;
        name: string;
        description?: string;
        address?: string;
        latitude?: number;
        longitude?: number;
    };
}

export interface CreateWarehouseLocationDto {
    code: string;
    name: string;
    description?: string;
    isActive?: boolean;
}

const LOCATION_KEYS = {
    byWarehouse: (farmId: string, warehouseId: string) =>
        ['warehouse-locations', farmId, warehouseId] as const,
    detail: (farmId: string, warehouseId: string, locationId: string) =>
        ['warehouse-location-detail', farmId, warehouseId, locationId] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
    Object.assign(promise, { unwrap: () => promise });

export const useWarehouseLocations = (farmId?: string | null, warehouseId?: string | null) => {
    const queryClient = useQueryClient();

    const locationsQuery = useQuery({
        queryKey:
            farmId && warehouseId
                ? LOCATION_KEYS.byWarehouse(farmId, warehouseId)
                : ['warehouse-locations', 'inactive'],
        queryFn: async (): Promise<WarehouseLocation[]> => {
            if (!farmId || !warehouseId) return [];
            const res = await axiosInstance.get(
                `/api/v1/farms/${farmId}/warehouses/${warehouseId}/locations`,
            );
            return res.data.data ?? [];
        },
        enabled: !!farmId && !!warehouseId,
        staleTime: 1000 * 60 * 5,
    });

    const createLocationMutation = useMutation({
        mutationFn: async ({
            fId,
            wId,
            data,
        }: {
            fId: string;
            wId: string;
            data: CreateWarehouseLocationDto;
        }) => {
            const res = await axiosInstance.post(
                `/api/v1/farms/${fId}/warehouses/${wId}/locations`,
                data,
            );
            return res.data.data as WarehouseLocation;
        },
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: LOCATION_KEYS.byWarehouse(variables.fId, variables.wId),
            });
        },
    });

    const error = useMemo(
        () => locationsQuery.error ?? createLocationMutation.error ?? null,
        [locationsQuery.error, createLocationMutation.error],
    );

    return {
        locations: locationsQuery.data ?? [],
        loading: locationsQuery.isLoading || locationsQuery.isFetching,
        submitting: createLocationMutation.isPending,
        error,
        fetchLocations: useCallback(
            (fId: string, wId: string) =>
                withUnwrap(
                    queryClient.fetchQuery({
                        queryKey: LOCATION_KEYS.byWarehouse(fId, wId),
                        queryFn: async (): Promise<WarehouseLocation[]> => {
                            const res = await axiosInstance.get(
                                `/api/v1/farms/${fId}/warehouses/${wId}/locations`,
                            );
                            return res.data.data ?? [];
                        },
                    }),
                ),
            [queryClient],
        ),
        createLocation: useCallback(
            (fId: string, wId: string, data: CreateWarehouseLocationDto) =>
                withUnwrap(createLocationMutation.mutateAsync({ fId, wId, data })),
            [createLocationMutation],
        ),
        getLocationDetail: useCallback(
            (fId: string, wId: string, locationId: string) =>
                withUnwrap(
                    queryClient.fetchQuery({
                        queryKey: LOCATION_KEYS.detail(fId, wId, locationId),
                        queryFn: async (): Promise<WarehouseLocation> => {
                            const res = await axiosInstance.get(
                                `/api/v1/farms/${fId}/warehouses/${wId}/locations/${locationId}`,
                            );
                            return res.data.data;
                        },
                    }),
                ),
            [queryClient],
        ),
    };
};
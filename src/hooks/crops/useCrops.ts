import { useCallback, useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateCropRequest, CreateCropTypeRequest } from '../../types/crop';
import { cropService } from '../../services/crop/cropService';
import { useAuth } from '../auth/useAuth';

const CROP_KEYS = {
  all: ['crops'] as const,
  crops: ['crops', 'list'] as const,
  farmCrops: (farmId: string) => ['crops', 'farm', farmId] as const,
  cropTypes: ['crops', 'types'] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

export const useCrops = (farmId?: string) => {
  const queryClient = useQueryClient();
  const { currentFarmId } = useAuth();
  const [activeFarmId, setActiveFarmId] = useState<string | null>(farmId || currentFarmId);

  useEffect(() => {
    if (currentFarmId && !farmId) {
      setActiveFarmId(currentFarmId);
    }
  }, [currentFarmId, farmId]);

  const cropsQuery = useQuery({
    queryKey: activeFarmId ? CROP_KEYS.farmCrops(activeFarmId) : CROP_KEYS.crops,
    queryFn: async () => {
      const response = activeFarmId 
        ? await cropService.getFarmCrops(activeFarmId)
        : await cropService.getCrops();
      return response.data ?? [];
    },
    enabled: !!activeFarmId || !farmId,
  });

  const systemCropsQuery = useQuery({
    queryKey: CROP_KEYS.crops,
    queryFn: async () => {
      const response = await cropService.getCrops();
      return response.data ?? [];
    },
  });

  const cropTypesQuery = useQuery({
    queryKey: CROP_KEYS.cropTypes,
    queryFn: async () => {
      const response = await cropService.getCropTypes();
      return response.data ?? [];
    },
    enabled: false,
  });

  const createCropMutation = useMutation({
    mutationFn: async (data: CreateCropRequest) => {
      const response = await cropService.createCrop(data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CROP_KEYS.crops });
    },
  });

  const createCropTypeMutation = useMutation({
    mutationFn: async (data: CreateCropTypeRequest) => {
      const response = await cropService.createCropType(data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CROP_KEYS.cropTypes });
    },
  });

  const deleteCropTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      await cropService.deleteCropType(id);
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CROP_KEYS.cropTypes });
    },
  });

  const loading = cropsQuery.isLoading || cropsQuery.isFetching || createCropMutation.isPending;
  const cropTypesLoading = cropTypesQuery.isLoading || cropTypesQuery.isFetching;
  const error = useMemo(
    () =>
      cropsQuery.error ??
      cropTypesQuery.error ??
      createCropMutation.error ??
      createCropTypeMutation.error ??
      deleteCropTypeMutation.error ??
      null,
    [
      cropsQuery.error,
      cropTypesQuery.error,
      createCropMutation.error,
      createCropTypeMutation.error,
      deleteCropTypeMutation.error,
    ],
  );

  return {
    crops: cropsQuery.data ?? [],
    systemCrops: systemCropsQuery.data ?? [],
    cropTypes: cropTypesQuery.data ?? [],
    loading,
    systemCropsLoading: systemCropsQuery.isLoading || systemCropsQuery.isFetching,
    cropTypesLoading,
    error,
    fetchCrops: useCallback(
      () => {
        setActiveFarmId(null);
        return withUnwrap(queryClient.fetchQuery({ queryKey: CROP_KEYS.crops, queryFn: async () => (await cropService.getCrops()).data ?? [] }));
      },
      [queryClient],
    ),
    fetchFarmCrops: useCallback(
      (id: string) => {
        setActiveFarmId(id);
        return withUnwrap(
          queryClient.fetchQuery({
            queryKey: CROP_KEYS.farmCrops(id),
            queryFn: async () => (await cropService.getFarmCrops(id)).data ?? [],
          }),
        );
      },
      [queryClient],
    ),
    fetchCropTypes: useCallback(
      () =>
        withUnwrap(
          queryClient.fetchQuery({
            queryKey: CROP_KEYS.cropTypes,
            queryFn: async () => (await cropService.getCropTypes()).data ?? [],
          }),
        ),
      [queryClient],
    ),
    createCrop: useCallback((data: CreateCropRequest) => withUnwrap(createCropMutation.mutateAsync(data)), [createCropMutation]),
    createCropType: useCallback(
      (data: CreateCropTypeRequest) => withUnwrap(createCropTypeMutation.mutateAsync(data)),
      [createCropTypeMutation],
    ),
    deleteCropType: useCallback((id: string) => withUnwrap(deleteCropTypeMutation.mutateAsync(id)), [deleteCropTypeMutation]),
    clearError: useCallback(() => undefined, []),
  };
};

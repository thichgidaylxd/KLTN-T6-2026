import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateCropRequest, CreateCropTypeRequest, CreateCropConditionRequest, CreateCropStageRequest, UpdateCropStageRequest, CreateDiseaseRequest } from '../../types/crop';
import { cropService } from '../../services/crop/cropService';
import { useAuth } from '../auth/useAuth';

const CROP_KEYS = {
  all: ['crops'] as const,
  system: ['crops', 'system'] as const,
  farmCrops: (farmId: string) => ['crops', 'farm', farmId] as const,
  cropTypes: ['crops', 'types'] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

export const useCrops = (farmId?: string) => {
  const queryClient = useQueryClient();
  const { currentFarmId } = useAuth();
  const activeFarmId = farmId || currentFarmId;

  // Query cho cây trồng hệ thống
  const systemCropsQuery = useQuery({
    queryKey: CROP_KEYS.system,
    queryFn: async () => {
      const response = await cropService.getCrops();
      const crops = response.data ?? [];
      return crops.map(c => ({ ...c, scope: c.scope || 'SYSTEM' }));
    },
    staleTime: 0,
  });

  // Query cho cây trồng của farm
  const farmCropsQuery = useQuery({
    queryKey: CROP_KEYS.farmCrops(activeFarmId || ''),
    queryFn: async () => {
      if (!activeFarmId) return [];
      const response = await cropService.getFarmCrops(activeFarmId);
      const crops = response.data ?? [];
      return crops.map(c => ({ ...c, scope: c.scope || 'FARM' }));
    },
    enabled: !!activeFarmId,
    staleTime: 0,
  });

  const cropTypesQuery = useQuery({
    queryKey: CROP_KEYS.cropTypes,
    queryFn: async () => {
      const response = await cropService.getCropTypes();
      return response.data ?? [];
    },
  });

  const createCropMutation = useMutation({
    mutationFn: (data: CreateCropRequest) => cropService.createCrop(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CROP_KEYS.system });
    },
  });

  const createCropTypeMutation = useMutation({
    mutationFn: (data: CreateCropTypeRequest) => cropService.createCropType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CROP_KEYS.cropTypes });
    },
  });

  const deleteCropTypeMutation = useMutation({
    mutationFn: (id: string) => cropService.deleteCropType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CROP_KEYS.cropTypes });
    },
  });

  const deleteCropMutation = useMutation({
    mutationFn: (id: string) => cropService.deleteCrop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CROP_KEYS.all });
    },
  });

  const createCropConditionMutation = useMutation({
    mutationFn: ({ cropId, request }: { cropId: string, request: CreateCropConditionRequest }) => cropService.createCropConditionByCrop(cropId, request),
    onSuccess: (_, { cropId }) => {
      queryClient.invalidateQueries({ queryKey: ['crops', cropId, 'condition'] });
    }
  });

  const deleteCropConditionMutation = useMutation({
    mutationFn: ({ cropId, conditionId }: { cropId: string, conditionId: string }) => cropService.deleteCropConditionByCrop(cropId, conditionId),
    onSuccess: (_, { cropId }) => {
      queryClient.invalidateQueries({ queryKey: ['crops', cropId, 'condition'] });
    }
  });

  const createCropStageMutation = useMutation({
    mutationFn: ({ cropId, request }: { cropId: string, request: CreateCropStageRequest }) => cropService.createCropStage(cropId, request),
    onSuccess: (_, { cropId }) => {
      queryClient.invalidateQueries({ queryKey: ['crops', cropId, 'stages'] });
    }
  });

  const updateCropStageMutation = useMutation({
    mutationFn: ({ cropId, stageId, request }: { cropId: string, stageId: string, request: UpdateCropStageRequest }) => cropService.updateCropStage(cropId, stageId, request),
    onSuccess: (_, { cropId }) => {
      queryClient.invalidateQueries({ queryKey: ['crops', cropId, 'stages'] });
    }
  });

  const deleteCropStageMutation = useMutation({
    mutationFn: ({ cropId, stageId }: { cropId: string, stageId: string }) => cropService.deleteCropStage(cropId, stageId),
    onSuccess: (_, { cropId }) => {
      queryClient.invalidateQueries({ queryKey: ['crops', cropId, 'stages'] });
    }
  });

  const createDiseaseMutation = useMutation({
    mutationFn: (request: CreateDiseaseRequest) => cropService.createDisease(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diseases'] });
    }
  });

  const updateDiseaseMutation = useMutation({
    mutationFn: ({ diseaseId, request }: { diseaseId: string, request: CreateDiseaseRequest }) => cropService.updateDisease(diseaseId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diseases'] });
    }
  });

  const deleteDiseaseMutation = useMutation({
    mutationFn: (diseaseId: string) => cropService.deleteDisease(diseaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diseases'] });
    }
  });

  const assignDiseaseToCropMutation = useMutation({
    mutationFn: ({ cropId, diseaseId, isPrimary }: { cropId: string, diseaseId: string, isPrimary?: boolean }) => cropService.assignDiseaseToCrop(cropId, diseaseId, isPrimary),
    onSuccess: (_, { cropId }) => {
      queryClient.invalidateQueries({ queryKey: ['crops', cropId, 'diseases'] });
    }
  });

  const removeDiseaseFromCropMutation = useMutation({
    mutationFn: ({ cropId, diseaseId }: { cropId: string, diseaseId: string }) => cropService.removeDiseaseFromCrop(cropId, diseaseId),
    onSuccess: (_, { cropId }) => {
      queryClient.invalidateQueries({ queryKey: ['crops', cropId, 'diseases'] });
    }
  });

  const loading = systemCropsQuery.isLoading || farmCropsQuery.isLoading || cropTypesQuery.isLoading;
  const cropTypesLoading = cropTypesQuery.isLoading;

  const error = useMemo(
    () =>
      systemCropsQuery.error ||
      farmCropsQuery.error ||
      cropTypesQuery.error ||
      createCropMutation.error ||
      createCropTypeMutation.error ||
      deleteCropTypeMutation.error ||
      deleteCropMutation.error,
    [
      systemCropsQuery.error,
      farmCropsQuery.error,
      cropTypesQuery.error,
      createCropMutation.error,
      createCropTypeMutation.error,
      deleteCropTypeMutation.error,
      deleteCropMutation.error,
    ],
  );

  // Use stable refetch functions
  const fetchSystemCrops = useCallback(() => {
    return systemCropsQuery.refetch();
  }, [systemCropsQuery.refetch]);

  const fetchFarmCrops = useCallback(() => {
    return farmCropsQuery.refetch();
  }, [farmCropsQuery.refetch]);

  const fetchCrops = useCallback(async () => {
    const results = await Promise.all([
      systemCropsQuery.refetch(),
      farmCropsQuery.refetch()
    ]);
    return results[0]; 
  }, [systemCropsQuery.refetch, farmCropsQuery.refetch]);

  const allCrops = useMemo(() => {
    const merged = [...(farmCropsQuery.data ?? []), ...(systemCropsQuery.data ?? [])];
    // Remove duplicates by ID
    const unique = Array.from(new Map(merged.map(c => [c.id, c])).values());
    return unique;
  }, [farmCropsQuery.data, systemCropsQuery.data]);

  return {
    crops: farmCropsQuery.data ?? [],
    systemCrops: systemCropsQuery.data ?? [],
    allCrops,
    cropTypes: cropTypesQuery.data ?? [],
    loading,
    systemCropsLoading: systemCropsQuery.isFetching,
    cropTypesLoading,
    error,
    fetchCrops,
    fetchSystemCrops,
    fetchFarmCrops,
    fetchCropTypes: useCallback(
      () =>
        withUnwrap(
          queryClient.fetchQuery({
            queryKey: CROP_KEYS.cropTypes,
            queryFn: async () => (await cropService.getCropTypes()).data ?? []
          }),
        ),
      [queryClient],
    ),
    createCrop: useCallback((data: CreateCropRequest) => withUnwrap(createCropMutation.mutateAsync(data)), [createCropMutation]),
    createCropCondition: useCallback((cropId: string, request: CreateCropConditionRequest) => withUnwrap(createCropConditionMutation.mutateAsync({ cropId, request })), [createCropConditionMutation]),
    deleteCropCondition: useCallback((cropId: string, conditionId: string) => withUnwrap(deleteCropConditionMutation.mutateAsync({ cropId, conditionId })), [deleteCropConditionMutation]),
    createCropStage: useCallback((cropId: string, request: CreateCropStageRequest) => withUnwrap(createCropStageMutation.mutateAsync({ cropId, request })), [createCropStageMutation]),
    updateCropStage: useCallback((cropId: string, stageId: string, request: UpdateCropStageRequest) => withUnwrap(updateCropStageMutation.mutateAsync({ cropId, stageId, request })), [updateCropStageMutation]),
    deleteCropStage: useCallback((cropId: string, stageId: string) => withUnwrap(deleteCropStageMutation.mutateAsync({ cropId, stageId })), [deleteCropStageMutation]),
    createDisease: useCallback((request: CreateDiseaseRequest) => withUnwrap(createDiseaseMutation.mutateAsync(request)), [createDiseaseMutation]),
    updateDisease: useCallback((diseaseId: string, request: CreateDiseaseRequest) => withUnwrap(updateDiseaseMutation.mutateAsync({ diseaseId, request })), [updateDiseaseMutation]),
    deleteDisease: useCallback((diseaseId: string) => withUnwrap(deleteDiseaseMutation.mutateAsync(diseaseId)), [deleteDiseaseMutation]),
    assignDiseaseToCrop: useCallback((cropId: string, diseaseId: string, isPrimary?: boolean) => withUnwrap(assignDiseaseToCropMutation.mutateAsync({ cropId, diseaseId, isPrimary })), [assignDiseaseToCropMutation]),
    removeDiseaseFromCrop: useCallback((cropId: string, diseaseId: string) => withUnwrap(removeDiseaseFromCropMutation.mutateAsync({ cropId, diseaseId })), [removeDiseaseFromCropMutation]),
    createCropType: useCallback(
      (data: CreateCropTypeRequest) => withUnwrap(createCropTypeMutation.mutateAsync(data)),
      [createCropTypeMutation],
    ),
    deleteCrop: useCallback((id: string) => withUnwrap(deleteCropMutation.mutateAsync(id)), [deleteCropMutation]),
    deleteCropType: useCallback((id: string) => withUnwrap(deleteCropTypeMutation.mutateAsync(id)), [deleteCropTypeMutation]),
    getCropById: useCallback(
      (cropId: string) =>
        withUnwrap(
          queryClient.fetchQuery({
            queryKey: ['crops', 'detail', cropId],
            queryFn: async () => (await cropService.getCropById(cropId)) ?? null,
          }),
        ),
      [queryClient],
    ),
    getFarmCropById: useCallback(
      (farmId: string, cropId: string) =>
        withUnwrap(
          queryClient.fetchQuery({
            queryKey: ['crops', 'farm', farmId, 'detail', cropId],
            queryFn: async () => (await cropService.getFarmCropById(farmId, cropId)) ?? null,
          }),
        ),
      [queryClient],
    ),
    getCropTypeById: useCallback(
      (cropTypeId: string) =>
        withUnwrap(
          queryClient.fetchQuery({
            queryKey: ['crop-types', 'detail', cropTypeId],
            queryFn: async () => (await cropService.getCropTypeById(cropTypeId)).data ?? null,
          }),
        ),
      [queryClient],
    ),
    getCropConditionByCrop: useCallback(
      (cropId: string) =>
        withUnwrap(
          queryClient.fetchQuery({
            queryKey: ['crops', cropId, 'condition'],
            queryFn: async () => (await cropService.getCropConditionByCrop(cropId)).data ?? null,
          }),
        ),
      [queryClient],
    ),
    getCropStageByCrop: useCallback(
      (cropId: string, page = 0, size = 100, sort: string[] = []) =>
        withUnwrap(
          queryClient.fetchQuery({
            queryKey: ['crops', cropId, 'stages', page, size, sort],
            queryFn: async () => (await cropService.getCropStageByCrop(cropId, page, size, sort)).data ?? null,
          }),
        ),
      [queryClient],
    ),
    getDiseasesByCrop: useCallback(
      (cropId: string) =>
        withUnwrap(
          queryClient.fetchQuery({
            queryKey: ['crops', cropId, 'diseases'],
            queryFn: async () => (await cropService.getDiseasesByCrop(cropId)).data ?? [],
          }),
        ),
      [queryClient],
    ),
    getAllDiseases: useCallback(
      async (page = 0, size = 100, sort?: string) =>
        (await cropService.getAllDiseases(page, size, sort)).data ?? null,
      [queryClient],
    ),
    clearError: useCallback(() => undefined, []),
  };
};

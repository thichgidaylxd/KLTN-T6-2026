import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { soilRecordService } from '../../services/soilRecord/soilRecordService';
import {
  CreateSoilRecordRequest,
  UpdateSoilRecordRequest,
  PresignedUploadRequest,
} from '../../types/soilRecord/soilRecord';

const SOIL_RECORD_KEYS = {
  all: ['soilRecords'] as const,
  farm: ['soilRecords', 'farm'] as const,
  plot: (plotId: string) => ['soilRecords', 'plot', plotId] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

export const useSoilRecords = (plotId?: string) => {
  const queryClient = useQueryClient();

  // Query farm-wide, chỉ chạy khi không có plotId
  const farmQuery = useQuery({
    queryKey: SOIL_RECORD_KEYS.farm,
    queryFn: async () => {
      const response = await soilRecordService.getAllSoilRecordsByFarm();
      return response.data ?? [];
    },
    enabled: !plotId,
    staleTime: 0,
  });

  // Query theo plot, chỉ chạy khi có plotId
  const plotQuery = useQuery({
    queryKey: SOIL_RECORD_KEYS.plot(plotId || ''),
    queryFn: async () => {
      if (!plotId) return [];
      const response = await soilRecordService.getAllSoilRecordsByPlot(plotId);
      return response.data ?? [];
    },
    enabled: !!plotId,
    staleTime: 0,
  });

  const activeQuery = plotId ? plotQuery : farmQuery;

  const createSoilRecordMutation = useMutation({
    mutationFn: ({ plotId, data }: { plotId: string; data: CreateSoilRecordRequest }) =>
      soilRecordService.createSoilRecord(plotId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOIL_RECORD_KEYS.all });
    },
  });

  const updateSoilRecordMutation = useMutation({
    mutationFn: ({
      plotId,
      soilRecordId,
      data,
    }: {
      plotId: string;
      soilRecordId: string;
      data: UpdateSoilRecordRequest;
    }) => soilRecordService.updateSoilRecord(plotId, soilRecordId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOIL_RECORD_KEYS.all });
    },
  });

  const deleteSoilRecordMutation = useMutation({
    mutationFn: ({ plotId, soilRecordId }: { plotId: string; soilRecordId: string }) =>
      soilRecordService.deleteSoilRecord(plotId, soilRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOIL_RECORD_KEYS.all });
    },
  });

  const getPresignedUrlMutation = useMutation({
    mutationFn: (data: PresignedUploadRequest) => soilRecordService.getPresignedUrl(data),
  });

  const loading = activeQuery.isLoading;

  const error = useMemo(
    () =>
      activeQuery.error ||
      createSoilRecordMutation.error ||
      updateSoilRecordMutation.error ||
      deleteSoilRecordMutation.error ||
      getPresignedUrlMutation.error,
    [
      activeQuery.error,
      createSoilRecordMutation.error,
      updateSoilRecordMutation.error,
      deleteSoilRecordMutation.error,
      getPresignedUrlMutation.error,
    ],
  );

  const fetchSoilRecords = useCallback(() => {
    return activeQuery.refetch();
  }, [activeQuery.refetch]);

  /**
   * Upload file lên R2 qua presigned URL flow.
   * Trả về fileUrl để lưu vào sourceFileUrl.
   */
  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      const response = await getPresignedUrlMutation.mutateAsync({
        fileName: file.name,
        contentType: file.type,
        folder: 'soil-records',
      });

      const { uploadUrl, fileUrl } = response.data;

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload thất bại: ${uploadRes.statusText}`);
      }

      return fileUrl;
    },
    [getPresignedUrlMutation],
  );

  return {
    soilRecords: activeQuery.data ?? [],
    loading,
    isFetching: activeQuery.isFetching,
    error,
    fetchSoilRecords,

    createSoilRecord: useCallback(
      (plotId: string, data: CreateSoilRecordRequest) =>
        withUnwrap(createSoilRecordMutation.mutateAsync({ plotId, data })),
      [createSoilRecordMutation],
    ),

    updateSoilRecord: useCallback(
      (plotId: string, soilRecordId: string, data: UpdateSoilRecordRequest) =>
        withUnwrap(updateSoilRecordMutation.mutateAsync({ plotId, soilRecordId, data })),
      [updateSoilRecordMutation],
    ),

    deleteSoilRecord: useCallback(
      (plotId: string, soilRecordId: string) =>
        withUnwrap(deleteSoilRecordMutation.mutateAsync({ plotId, soilRecordId })),
      [deleteSoilRecordMutation],
    ),

    uploadFile,

    clearError: useCallback(() => undefined, []),
  };
};
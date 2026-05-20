import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { diseaseReportService } from '@/services/diseaseReport/diseaseReportService';
import { CreateDiseaseReportRequest } from '@/types/diseaseReport/diseaseReport';

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

export const DISEASE_REPORT_KEYS = {
  all: ['disease-reports'] as const,
  list: (page: number, size: number, sort: string[]) => ['disease-reports', 'list', page, size, sort] as const,
};

export const useDiseaseReports = (page: number = 0, size: number = 10, sort: string[] = []) => {
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: DISEASE_REPORT_KEYS.list(page, size, sort),
    queryFn: async () => (await diseaseReportService.getDiseaseReports(page, size, sort)).data,
  });

  const createReportMutation = useMutation({
    mutationFn: (request: CreateDiseaseReportRequest) => diseaseReportService.createDiseaseReport(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISEASE_REPORT_KEYS.all });
    },
  });

  return {
    reports: reportsQuery.data?.content || [],
    pageData: reportsQuery.data,
    loading: reportsQuery.isLoading,
    error: reportsQuery.error || createReportMutation.error,
    refetch: reportsQuery.refetch,
    
    createReport: useCallback(
      (request: CreateDiseaseReportRequest) => withUnwrap(createReportMutation.mutateAsync(request)),
      [createReportMutation]
    ),
  };
};

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { qualityGradeService } from '@/services/qualityGrade/quanlityGradeService';


const QUALITY_GRADE_KEYS = {
  all: ['quality-grades'] as const,
};

export const useQualityGrades = () => {
  const qualityGradesQuery = useQuery({
    queryKey: QUALITY_GRADE_KEYS.all,
    queryFn: async () => {
      const response = await qualityGradeService.getQualityGrades();
      return response.data ?? [];
    },
    staleTime: 0,
  });

  return useMemo(
    () => ({
      qualityGrades: qualityGradesQuery.data ?? [],

      isLoading: qualityGradesQuery.isLoading,
      isFetching: qualityGradesQuery.isFetching,
      error: qualityGradesQuery.error,

      refetch: qualityGradesQuery.refetch,
    }),
    [qualityGradesQuery]
  );
};
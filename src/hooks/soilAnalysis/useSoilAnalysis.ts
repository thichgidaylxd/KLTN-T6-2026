import { useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';

import { soilAnalysisService } from '../../services/soilAnalysis/soilAnalysisService';

import {
  SubmitSoilAnalysisRequest,
} from '../../types/soilAnalysis/soilAnalysis';

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, {
    unwrap: () => promise,
  });

export const useSoilAnalysis = () => {

  // ─────────────────────────────────────────────
  // Submit analysis
  // ─────────────────────────────────────────────

  const submitAnalysisMutation = useMutation({
    mutationFn: (data: SubmitSoilAnalysisRequest) =>
      soilAnalysisService.submitAnalysis(data),
  });

  // ─────────────────────────────────────────────
  // Poll job
  // ─────────────────────────────────────────────

  const pollJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response =
        await soilAnalysisService.getJobStatus(jobId);

      return response.data;
    },
  });

  // ─────────────────────────────────────────────
  // Computed state
  // ─────────────────────────────────────────────

  const loading =
    submitAnalysisMutation.isPending ||
    pollJobMutation.isPending;

  const error = useMemo(
    () =>
      submitAnalysisMutation.error ||
      pollJobMutation.error,
    [
      submitAnalysisMutation.error,
      pollJobMutation.error,
    ],
  );

  // ─────────────────────────────────────────────
  // Exposed API
  // ─────────────────────────────────────────────

  return {

    loading,

    error,

    /**
     * Submit AI analysis
     * returns jobId
     */
    submitAnalysis: useCallback(
      async (data: SubmitSoilAnalysisRequest) => {

        const response =
          await submitAnalysisMutation.mutateAsync(data);

        return response.data.jobId;
      },
      [submitAnalysisMutation],
    ),

    /**
     * Poll analysis job
     */
    pollJob: useCallback(
      (jobId: string) =>
        withUnwrap(
          pollJobMutation.mutateAsync(jobId),
        ),
      [pollJobMutation],
    ),

    clearError: useCallback(
      () => undefined,
      [],
    ),
  };
};
import { useCallback, useState } from 'react';
import { SeasonPlan, StatusObject } from '../../types/seasonPlan';
import { seasonPlanPhaseService } from '../../services/seasonplan/seasonPlanPhaseService';
import { planStageStatusService, PlanStageStatusTransition, PlanStageStatusChange } from '../../services/seasonplan/planStageStatusService';
import { withUnwrap } from './seasonPlanShared';

interface UseSeasonPlanPhasesProps {
  updatePlansCache: (updater: (prev: SeasonPlan[]) => SeasonPlan[]) => void;
}

export const useSeasonPlanPhases = ({ updatePlansCache }: UseSeasonPlanPhasesProps) => {
  const [planStageStatuses, setPlanStageStatuses] = useState<StatusObject[]>([]);
  const [planStageStatusTransitions, setPlanStageStatusTransitions] = useState<PlanStageStatusTransition[]>([]);
  const [planStageStatusHistoriesByStage, setPlanStageStatusHistoriesByStage] = useState<Record<string, PlanStageStatusChange[]>>({});

  return {
    planStageStatuses,
    planStageStatusTransitions,
    planStageStatusHistoriesByStage,
    error: null,
    getPhaseDetail: useCallback(
      (planId: string, stageId: string) =>
        withUnwrap(
          seasonPlanPhaseService.getStageById(planId, stageId).then((phase) => {
            updatePlansCache((prev) =>
              prev.map((p) =>
                p.id === planId
                  ? {
                    ...p,
                    phases: (p.phases ?? []).map((ph) =>
                      ph.id === stageId
                        ? { ...ph, ...phase, tasks: ph.tasks } // Giữ lại danh sách task hiện có
                        : ph,
                    ),
                  }
                  : p,
              ),
            );
            return phase;
          }),
        ),
      [updatePlansCache],
    ),
    fetchStages: useCallback(
      (planId: string) =>
        withUnwrap(
          seasonPlanPhaseService.getStages(planId).then((phases) => {
            updatePlansCache((prev) => prev.map((p) => (p.id === planId ? { ...p, phases } : p)));
            return { planId, phases };
          }),
        ),
      [updatePlansCache],
    ),
    createPhase: useCallback(
      (planId: string, data: { name: string; startDate: string; endDate: string }) =>
        withUnwrap(
          seasonPlanPhaseService.createStage(planId, data).then((phase) => {
            updatePlansCache((prev) =>
              prev.map((p) => (p.id === planId ? { ...p, phases: [...(p.phases ?? []), phase] } : p)),
            );
            return { planId, phase };
          }),
        ),
      [updatePlansCache],
    ),
    deletePhase: useCallback(
      (planId: string, stageId: string) =>
        withUnwrap(
          seasonPlanPhaseService.deleteStage(planId, stageId).then(() => {
            updatePlansCache((prev) =>
              prev.map((p) =>
                p.id === planId ? { ...p, phases: (p.phases ?? []).filter((ph) => ph.id !== stageId) } : p,
              ),
            );
            return { planId, stageId };
          }),
        ),
      [updatePlansCache],
    ),
    updatePhase: useCallback(
      (planId: string, stageId: string, data: { name: string; startDate: string; endDate: string; version?: number }) =>
        withUnwrap(
          seasonPlanPhaseService.updateStage(planId, stageId, data).then((phase) => {
            updatePlansCache((prev) =>
              prev.map((p) =>
                p.id === planId
                  ? { ...p, phases: (p.phases ?? []).map((ph) => (ph.id === phase.id ? { ...ph, ...phase } : ph)) }
                  : p,
              ),
            );
            return phase;
          }),
        ),
      [updatePlansCache],
    ),
    updatePhaseTime: useCallback(
      (planId: string, stageId: string, data: { startDate: string; endDate: string; version?: number }) =>
        withUnwrap(
          seasonPlanPhaseService.updateStageTime(planId, stageId, data).then((phase) => {
            updatePlansCache((prev) =>
              prev.map((p) =>
                p.id === planId
                  ? { ...p, phases: (p.phases ?? []).map((ph) => (ph.id === phase.id ? { ...ph, ...phase } : ph)) }
                  : p,
              ),
            );
            return phase;
          }),
        ),
      [updatePlansCache],
    ),
    optimisticallyUpdatePhaseTime: useCallback(
      (payload: { planId: string; stageId: string; startDate: string; endDate: string }) => {
        updatePlansCache((prev) =>
          prev.map((p) =>
            p.id === payload.planId
              ? {
                ...p,
                phases: (p.phases ?? []).map((ph) =>
                  ph.id === payload.stageId
                    ? { ...ph, startDate: payload.startDate, endDate: payload.endDate }
                    : ph,
                ),
              }
              : p,
          ),
        );
      },
      [updatePlansCache],
    ),
    fetchPlanStageStatuses: useCallback(
      () =>
        withUnwrap(
          planStageStatusService.getPlanStageStatuses().then((statuses) => {
            setPlanStageStatuses(statuses);
            return statuses;
          }),
        ),
      [],
    ),
    fetchPlanStageStatusTransitions: useCallback(
      () =>
        withUnwrap(
          planStageStatusService.getPlanStageStatusTransitions().then((transitions) => {
            setPlanStageStatusTransitions(transitions);
            return transitions;
          }),
        ),
      [],
    ),
    fetchStageStatusHistories: useCallback(
      (planId: string, stageId: string) =>
        withUnwrap(
          planStageStatusService.getStageStatusHistories(planId, stageId).then((histories) => {
            setPlanStageStatusHistoriesByStage((prev) => ({ ...prev, [stageId]: histories }));
            return histories;
          }),
        ),
      [],
    ),
    updatePhaseStatus: useCallback(
      (planId: string, stageId: string, statusId: string) =>
        withUnwrap(
          planStageStatusService.updateStageStatus(planId, stageId, statusId).then((result) => {
            updatePlansCache((prev) =>
              prev.map((p) =>
                p.id === planId
                  ? {
                    ...p,
                    phases: (p.phases ?? []).map((ph) =>
                      ph.id === stageId ? { ...ph, status: result.toStatus } : ph,
                    ),
                  }
                  : p,
              ),
            );
            setPlanStageStatusHistoriesByStage((prev) => ({
              ...prev,
              [stageId]: [result, ...(prev[stageId] ?? [])],
            }));
            return result;
          }),
        ),
      [updatePlansCache],
    ),
    fetchAvailableStatuses: useCallback(
      (planId: string, stageId: string) =>
        withUnwrap(planStageStatusService.getAvailableStatuses(planId, stageId)),
      [],
    ),
  };
};


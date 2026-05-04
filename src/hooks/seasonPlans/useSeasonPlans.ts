import { useSeasonPlanPlans } from './useSeasonPlanPlans';
import { useSeasonPlanPhases } from './useSeasonPlanPhases';
import { useSeasonPlanTasks } from './useSeasonPlanTasks';

export const useSeasonPlans = () => {
  const plansPart = useSeasonPlanPlans();
  const phasePart = useSeasonPlanPhases({ updatePlansCache: plansPart.updatePlansCache });
  const taskPart = useSeasonPlanTasks({ updatePlansCache: plansPart.updatePlansCache });


  return {
    plans: plansPart.plans,
    loading: plansPart.loading,
    createLoading: plansPart.createLoading,
    error: plansPart.error,
    createError: plansPart.createError,
    deleteError: plansPart.deleteError,
    updatePlanTimeError: plansPart.updatePlanTimeError,
    fetchPlans: plansPart.fetchPlans,
    createPlan: plansPart.createPlan,
    updatePlan: plansPart.updatePlan,
    deletePlan: plansPart.deletePlan,
    updatePlanTime: plansPart.updatePlanTime,
    fetchPlanPlots: plansPart.fetchPlanPlots,
    addPlotsToPlan: plansPart.addPlotsToPlan,
    addPlanToState: plansPart.addPlanToState,
    fetchStages: phasePart.fetchStages,
    createPhase: phasePart.createPhase,
    deletePhase: phasePart.deletePhase,
    updatePhase: phasePart.updatePhase,
    updatePhaseTime: phasePart.updatePhaseTime,
    updatePhaseStatus: phasePart.updatePhaseStatus,
    fetchPlanStageStatuses: phasePart.fetchPlanStageStatuses,
    fetchPlanStageStatusTransitions: phasePart.fetchPlanStageStatusTransitions,
    fetchStageStatusHistories: phasePart.fetchStageStatusHistories,
    planStageStatuses: phasePart.planStageStatuses,
    planStageStatusTransitions: phasePart.planStageStatusTransitions,
    planStageStatusHistoriesByStage: phasePart.planStageStatusHistoriesByStage,
    optimisticallyUpdatePhaseTime: phasePart.optimisticallyUpdatePhaseTime,
    fetchTasks: taskPart.fetchTasks,
    createTask: taskPart.createTask,
    updateTask: taskPart.updateTask,
    updateTaskTime: taskPart.updateTaskTime,
    deleteTask: taskPart.deleteTask,
    optimisticallyUpdateTaskTime: taskPart.optimisticallyUpdateTaskTime,
    taskStatuses: taskPart.taskStatuses,
    taskStatusTransitions: taskPart.taskStatusTransitions,
    taskStatusHistoriesByTask: taskPart.taskStatusHistoriesByTask,
    fetchTaskStatuses: taskPart.fetchTaskStatuses,
    fetchTaskStatusTransitions: taskPart.fetchTaskStatusTransitions,
    fetchTaskStatusHistories: taskPart.fetchTaskStatusHistories,
    updateTaskStatus: taskPart.updateTaskStatus,
  };
};

import { useSeasonPlanPlans } from './useSeasonPlanPlans';
import { useSeasonPlanPhases } from './useSeasonPlanPhases';
import { useSeasonPlanTasks } from './useSeasonPlanTasks';

export const useSeasonPlans = (farmId?: string) => {
  const plansPart = useSeasonPlanPlans(farmId);
  const phasePart = useSeasonPlanPhases({ updatePlansCache: plansPart.updatePlansCache });
  const taskPart = useSeasonPlanTasks({ updatePlansCache: plansPart.updatePlansCache });


  return {
    plans: plansPart.plans,
    loading: plansPart.loading,
    isFetching: plansPart.isFetching,
    createLoading: plansPart.createLoading,
    error: plansPart.error,
    createError: plansPart.createError,
    deleteError: plansPart.deleteError,
    updatePlanTimeError: plansPart.updatePlanTimeError,
    fetchPlans: plansPart.fetchPlans,
    fetchPlan: plansPart.fetchPlan,
    createPlan: plansPart.createPlan,
    updatePlan: plansPart.updatePlan,
    deletePlan: plansPart.deletePlan,
    updatePlanTime: plansPart.updatePlanTime,
    fetchPlanPlots: plansPart.fetchPlanPlots,
    addPlotsToPlan: plansPart.addPlotsToPlan,
    deletePlotFromPlan: plansPart.deletePlotFromPlan,
    addPlanToState: plansPart.addPlanToState,
    getPhaseDetail: phasePart.getPhaseDetail,
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
    getTaskDetail: taskPart.getTaskDetail,
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
    fetchTaskAvailableStatuses: taskPart.fetchAvailableStatuses,
    fetchPhaseAvailableStatuses: phasePart.fetchAvailableStatuses,
    fetchTaskDependencies: taskPart.fetchTaskDependencies,
    addTaskDependency: taskPart.addTaskDependency,
    deleteTaskDependency: taskPart.deleteTaskDependency,
    updatePlansCache: plansPart.updatePlansCache,
  };
};

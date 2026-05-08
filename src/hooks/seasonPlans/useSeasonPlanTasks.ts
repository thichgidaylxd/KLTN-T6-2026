import { useCallback, useState } from 'react';
import { SeasonPlan } from '../../types/seasonPlan';
import type { TaskAssignee } from '../../types/seasonPlan/seasonPlan';
import { seasonPlanTaskService, CreateTaskRequest, UpdateTaskRequest } from '../../services/seasonplan/seasonPlanTaskService';
import { taskStatusService, TaskStatusTransition, TaskStatusChange, TaskStatusObject } from '../../services/seasonplan/taskStatusService';
import { withUnwrap } from './seasonPlanShared';

interface UseSeasonPlanTasksProps {
  updatePlansCache: (updater: (prev: SeasonPlan[]) => SeasonPlan[]) => void;
}

export const useSeasonPlanTasks = ({ updatePlansCache }: UseSeasonPlanTasksProps) => {
  const [taskStatuses, setTaskStatuses] = useState<TaskStatusObject[]>([]);
  const [taskStatusTransitions, setTaskStatusTransitions] = useState<TaskStatusTransition[]>([]);
  const [taskStatusHistoriesByTask, setTaskStatusHistoriesByTask] = useState<Record<string, TaskStatusChange[]>>({});
  const [taskAssigneesByTask, setTaskAssigneesByTask] = useState<Record<string, TaskAssignee[]>>({});

  return {
    taskStatuses,
    taskStatusTransitions,
    taskStatusHistoriesByTask,
    taskAssigneesByTask,
    error: null,
    fetchTasks: useCallback(
      (planId: string, stageId: string) =>
        withUnwrap(
          seasonPlanTaskService.getTasks(planId, stageId).then((tasks) => {
            updatePlansCache((prev) =>
              prev.map((p) =>
                p.id === planId
                  ? {
                    ...p,
                    phases: p.phases.map((ph) => (ph.id === stageId ? { ...ph, tasks } : ph)),
                  }
                  : p,
              ),
            );
            return { planId, stageId, tasks };
          }),
        ),
      [updatePlansCache],
    ),
    createTask: useCallback(
      (planId: string, stageId: string, data: CreateTaskRequest) =>
        withUnwrap(
          seasonPlanTaskService.createTask(planId, stageId, data).then((task) => {
            updatePlansCache((prev) =>
              prev.map((p) =>
                p.id === planId
                  ? {
                    ...p,
                    phases: p.phases.map((ph) =>
                      ph.id === stageId ? { ...ph, tasks: [...(ph.tasks ?? []), task] } : ph,
                    ),
                  }
                  : p,
              ),
            );
            return { planId, stageId, task };
          }),
        ),
      [updatePlansCache],
    ),
    updateTask: useCallback(
      (planId: string, stageId: string, taskId: string, data: UpdateTaskRequest) =>
        withUnwrap(
          seasonPlanTaskService.updateTask(planId, stageId, taskId, data).then((task) => {
            updatePlansCache((prev) =>
              prev.map((p) =>
                p.id === planId
                  ? {
                    ...p,
                    phases: p.phases.map((ph) =>
                      ph.id === stageId
                        ? {
                          ...ph,
                          tasks: (ph.tasks ?? []).map((t) => (t.id === task.id ? task : t)),
                        }
                        : ph,
                    ),
                  }
                  : p,
              ),
            );
            return { planId, stageId, task };
          }),
        ),
      [updatePlansCache],
    ),
    updateTaskTime: useCallback(
      (planId: string, stageId: string, taskId: string, data: { startDate: string; endDate: string; version: number }) =>
        withUnwrap(
          seasonPlanTaskService.updateTaskTime(planId, stageId, taskId, data).then((task) => {
            updatePlansCache((prev) =>
              prev.map((p) =>
                p.id === planId
                  ? {
                    ...p,
                    phases: p.phases.map((ph) =>
                      ph.id === stageId
                        ? {
                          ...ph,
                          tasks: (ph.tasks ?? []).map((t) => (t.id === task.id ? { ...t, ...task } : t)),
                        }
                        : ph,
                    ),
                  }
                  : p,
              ),
            );
            return { planId, stageId, task };
          }),
        ),
      [updatePlansCache],
    ),
    deleteTask: useCallback(
      (planId: string, stageId: string, taskId: string) =>
        withUnwrap(
          seasonPlanTaskService.deleteTask(planId, stageId, taskId).then(() => {
            updatePlansCache((prev) =>
              prev.map((p) =>
                p.id === planId
                  ? {
                      ...p,
                      phases: p.phases.map((ph) =>
                        ph.id === stageId
                          ? { ...ph, tasks: (ph.tasks ?? []).filter((t) => t.id !== taskId) }
                          : ph,
                      ),
                  }
                  : p,
              ),
            );
            return { planId, stageId, taskId };
          }),
        ),
      [updatePlansCache],
    ),
    optimisticallyUpdateTaskTime: useCallback(
      (payload: { planId: string; stageId: string; taskId: string; startDate: string; endDate: string }) => {
        updatePlansCache((prev) =>
          prev.map((p) =>
            p.id === payload.planId
              ? {
                  ...p,
                  phases: p.phases.map((ph) =>
                    ph.id === payload.stageId
                      ? {
                          ...ph,
                          tasks: (ph.tasks ?? []).map((t) =>
                            t.id === payload.taskId
                              ? { ...t, startDate: payload.startDate, endDate: payload.endDate }
                              : t,
                          ),
                      }
                      : ph,
                  ),
              }
              : p,
          ),
        );
      },
      [updatePlansCache],
    ),
    addTaskDependency: useCallback(
      (planId: string, stageId: string, taskId: string, dependsOnTaskId: string) =>
        withUnwrap(
          seasonPlanTaskService.addTaskDependency(planId, stageId, taskId, dependsOnTaskId).then((result) => {
            return result;
          }),
        ),
      [updatePlansCache],
    ),
    deleteTaskDependency: useCallback(
      (taskId: string, dependsOnTaskId: string) =>
        withUnwrap(
          seasonPlanTaskService.deleteTaskDependency(taskId, dependsOnTaskId).then((result) => {
            return result;
          }),
        ),
      [updatePlansCache],
    ),
    getTaskDependencies: useCallback(
      (taskId: string) =>
        withUnwrap(seasonPlanTaskService.getTaskDependencies(taskId)),
      [],
    ),
    fetchTaskStatuses: useCallback(
      () =>
        withUnwrap(
          taskStatusService.getTaskStatuses().then((statuses) => {
            setTaskStatuses(statuses);
            return statuses;
          }),
        ),
      [],
    ),
    fetchTaskStatusTransitions: useCallback(
      () =>
        withUnwrap(
          taskStatusService.getTaskStatusTransitions().then((transitions) => {
            setTaskStatusTransitions(transitions);
            return transitions;
          }),
        ),
      [],
    ),
    fetchTaskStatusHistories: useCallback(
      (planId: string, stageId: string, taskId: string) =>
        withUnwrap(
          taskStatusService.getTaskStatusHistories(planId, stageId, taskId).then((histories) => {
            setTaskStatusHistoriesByTask((prev) => ({ ...prev, [taskId]: histories }));
            return histories;
          }),
        ),
      [],
    ),
    updateTaskStatus: useCallback(
      (planId: string, stageId: string, taskId: string, statusId: string) =>
        withUnwrap(
          taskStatusService.updateTaskStatus(planId, stageId, taskId, statusId).then((result) => {
            updatePlansCache((prev) =>
              prev.map((p) =>
                p.id === planId
                  ? {
                    ...p,
                    phases: p.phases.map((ph) =>
                      ph.id === stageId
                        ? {
                          ...ph,
                          tasks: (ph.tasks ?? []).map((t) =>
                            t.id === taskId ? { ...t, status: result.toStatus } : t,
                          ),
                        }
                        : ph,
                    ),
                  }
                  : p,
              ),
            );
            setTaskStatusHistoriesByTask((prev) => ({
              ...prev,
              [taskId]: [result, ...(prev[taskId] ?? [])],
            }));
            return result;
          }),
        ),
      [updatePlansCache],
    ),
    fetchAvailableStatuses: useCallback(
      (planId: string, stageId: string, taskId: string) =>
        withUnwrap(taskStatusService.getAvailableStatuses(planId, stageId, taskId)),
      [],
    ),
    fetchTaskAssignees: useCallback(
      (planId: string, stageId: string, taskId: string) =>
        withUnwrap(
          seasonPlanTaskService.getTaskAssignees(planId, stageId, taskId).then((assignees) => {
            setTaskAssigneesByTask((prev) => ({ ...prev, [taskId]: assignees }));
            return assignees;
          })
        ),
      [],
    ),
    assignTaskAssignee: useCallback(
      (planId: string, stageId: string, taskId: string, userId: string) =>
        withUnwrap(
          seasonPlanTaskService.assignTask(planId, stageId, taskId, { userId }).then((result) => {
            setTaskAssigneesByTask((prev) => ({
              ...prev,
              [taskId]: [...(prev[taskId] ?? []), result],
            }));
            return result;
          })
        ),
      [],
    ),
    unassignTaskAssignee: useCallback(
      (planId: string, stageId: string, taskId: string, assigneeId: string, removalReason?: string) =>
        withUnwrap(
          seasonPlanTaskService.unassignTask(planId, stageId, taskId, assigneeId, { removalReason }).then((result) => {
            setTaskAssigneesByTask((prev) => ({
              ...prev,
              [taskId]: (prev[taskId] ?? []).map((a) => (a.id === assigneeId ? { ...a, removedBy: result.removedBy, removedAt: result.removedAt } : a)),
            }));
            return result;
          })
        ),
      [],
    ),
  };
};


import { axiosInstance } from '../../config/axios';
import {
  getTaskStatusHistoriesResponseSchema,
  getTaskStatusesResponseSchema,
  getTaskStatusTransitionsResponseSchema,
  updateTaskStatusResponseSchema,
} from '../../schemas/taskStatusSchemas';
import { getAvailableTaskStatusesResponseSchema } from '../../schemas/seasonPlanSchemas';
import { StatusObject } from '../../types/seasonPlan';

export interface TaskStatusObject extends StatusObject {
  isInitial?: boolean;
  isTerminal?: boolean;
}

export interface TaskStatusChange {
  fromStatus: TaskStatusObject;
  toStatus: TaskStatusObject;
  changedBy: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    status: string;
    isLocked: boolean;
    createdAt: string;
  };
  changedAt: string;
}

export interface TaskStatusTransition {
  farm?: {
    id: string;
    name: string;
  };
  fromStatus: TaskStatusObject;
  toStatus: TaskStatusObject;
  farmRole?: {
    id: string;
    name: string;
    description?: string;
  };
  createdAt: string;
}

export const taskStatusService = {
  async updateTaskStatus(planId: string, stageId: string, taskId: string, statusId: string): Promise<TaskStatusChange> {
    const response = await axiosInstance.put(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/status/${statusId}`
    );
    return updateTaskStatusResponseSchema.parse(response.data).data;
  },

  async getTaskStatusHistories(planId: string, stageId: string, taskId: string): Promise<TaskStatusChange[]> {
    const response = await axiosInstance.get(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/status-histories`
    );
    return getTaskStatusHistoriesResponseSchema.parse(response.data).data;
  },

  async getTaskStatuses(): Promise<TaskStatusObject[]> {
    const response = await axiosInstance.get('/api/v1/task-statuses');
    return getTaskStatusesResponseSchema.parse(response.data).data;
  },

  async getTaskStatusTransitions(): Promise<TaskStatusTransition[]> {
    const response = await axiosInstance.get('/api/v1/task-status-transitions');
    return getTaskStatusTransitionsResponseSchema.parse(response.data).data;
  },

  async getAvailableStatuses(planId: string, stageId: string, taskId: string): Promise<TaskStatusObject[]> {
    const response = await axiosInstance.get(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/available-statuses`
    );
    return getAvailableTaskStatusesResponseSchema.parse(response.data).data;
  },
};

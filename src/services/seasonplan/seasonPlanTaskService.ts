import { axiosInstance } from '../../config/axios';
import { Task } from '../../types/seasonPlan';
import {
  getTasksResponseSchema,
  createTaskResponseSchema,
} from '../../schemas/seasonPlanSchemas';

export interface CreateTaskRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  plotId?: string;
}

export interface UpdateTaskRequest {
  version?: number;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  plotId?: string;
  progressPercent?: number;
}

const mapToTask = (data: any): Task => ({
  ...data,
  description: data.description || '',
});

export const seasonPlanTaskService = {
  async getTasks(planId: string, stageId: string): Promise<Task[]> {
    const response = await axiosInstance.get(`/api/v1/plans/${planId}/stages/${stageId}/tasks`);
    const validated = getTasksResponseSchema.parse(response.data);
    return validated.data.map(mapToTask);
  },

  async createTask(planId: string, stageId: string, data: CreateTaskRequest): Promise<Task> {
    const response = await axiosInstance.post(`/api/v1/plans/${planId}/stages/${stageId}/tasks`, data);
    const validated = createTaskResponseSchema.parse(response.data);
    return mapToTask(validated.data);
  },

  async updateTask(planId: string, stageId: string, taskId: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await axiosInstance.patch(`/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}`, data);
    const validated = createTaskResponseSchema.parse(response.data);
    return mapToTask(validated.data);
  },

  async updateTaskTime(planId: string, stageId: string, taskId: string, data: { startDate: string; endDate: string; version?: number }): Promise<Task> {
    const response = await axiosInstance.put(`/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/time`, data);
    const validated = createTaskResponseSchema.parse(response.data);
    return mapToTask(validated.data);
  },

  async deleteTask(planId: string, stageId: string, taskId: string): Promise<void> {
    await axiosInstance.delete(`/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}`);
  },
};

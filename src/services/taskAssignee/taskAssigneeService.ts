import { axiosInstance } from '../../config/axios';
import {
  addTaskAssigneeResponseSchema,
  deleteTaskAssigneeResponseSchema,
  getTaskAssigneesResponseSchema,
} from '../../schemas/taskAssigneeSchemas';
import { AddTaskAssigneeRequest, TaskAssignee } from '../../types/taskAssignee';

export const taskAssigneeService = {
  async getTaskAssignees(planId: string, stageId: string, taskId: string): Promise<TaskAssignee[]> {
    const response = await axiosInstance.get(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/assignees`
    );
    const validated = getTaskAssigneesResponseSchema.parse(response.data);
    return validated.data;
  },

  async addTaskAssignee(
    planId: string,
    stageId: string,
    taskId: string,
    data: AddTaskAssigneeRequest
  ): Promise<TaskAssignee> {
    const response = await axiosInstance.post(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/assignees`,
      data
    );
    const validated = addTaskAssigneeResponseSchema.parse(response.data);
    return validated.data;
  },

  async deleteTaskAssignee(
    planId: string,
    stageId: string,
    taskId: string,
    assigneeId: string
  ): Promise<string> {
    const response = await axiosInstance.delete(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/assignees/${assigneeId}`
    );
    const validated = deleteTaskAssigneeResponseSchema.parse(response.data);
    return typeof validated === 'string' ? validated : validated.data;
  },
};

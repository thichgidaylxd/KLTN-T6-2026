import { axiosInstance } from '../../config/axios';
import type { TaskStatusHistory, TaskStatusTransition, TaskStatusObject } from '../../types/seasonPlan/seasonPlan';
import {
  updateTaskStatusResponseSchema,
  getTaskStatusesResponseSchema,
  getTaskStatusTransitionsResponseSchema,
  getTaskStatusHistoriesResponseSchema,
  getAvailableTaskStatusesResponseSchema,
} from '../../schemas/seasonPlanSchemas';

/**
 * Service Quản lý trạng thái Task (Task Status)
 * Đồng bộ với API spec
 */
export const taskStatusService = {
  /**
   * Cập nhật trạng thái Task
   * PUT /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/status/{taskStatusId}
   * Response: ApiResponse<TaskStatusHistory>
   */
  async updateTaskStatus(
    planId: string,
    stageId: string,
    taskId: string,
    taskStatusId: string,
  ): Promise<TaskStatusHistory> {
    const response = await axiosInstance.put(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/status/${taskStatusId}`,
    );
    const validated = updateTaskStatusResponseSchema.parse(response.data);
    return validated.data;
  },

  /**
   * Lấy danh sách tất cả Task Status
   * GET /api/v1/task-statuses
   * Response: ApiResponse<TaskStatusObject[]>
   */
  async getTaskStatuses(): Promise<TaskStatusObject[]> {
    const response = await axiosInstance.get('/api/v1/task-statuses');
    const validated = getTaskStatusesResponseSchema.parse(response.data);
    return validated.data;
  },

  /**
   * Lấy danh sách Task Status Transitions theo Farm
   * GET /api/v1/task-status-transitions
   * Response: ApiResponse<TaskStatusTransition[]>
   */
  async getTaskStatusTransitions(): Promise<TaskStatusTransition[]> {
    const response = await axiosInstance.get('/api/v1/task-status-transitions');
    const validated = getTaskStatusTransitionsResponseSchema.parse(response.data);
    return validated.data;
  },

  /**
   * Lấy lịch sử thay đổi trạng thái của Task
   * GET /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/status-histories
   * Response: ApiResponse<TaskStatusHistory[]>
   */
  async getTaskStatusHistories(
    planId: string,
    stageId: string,
    taskId: string,
  ): Promise<TaskStatusHistory[]> {
    const response = await axiosInstance.get(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/status-histories`,
    );
    const validated = getTaskStatusHistoriesResponseSchema.parse(response.data);
    return validated.data;
  },

  /**
   * Lấy danh sách trạng thái tiếp theo hợp lệ của Task
   * GET /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/available-statuses
   * Response: ApiResponse<TaskStatusObject[]>
   */
  async getAvailableTaskStatuses(
    planId: string,
    stageId: string,
    taskId: string,
  ): Promise<TaskStatusObject[]> {
    const response = await axiosInstance.get(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/available-statuses`,
    );
    const validated = getAvailableTaskStatusesResponseSchema.parse(response.data);
    return validated.data;
  },
};

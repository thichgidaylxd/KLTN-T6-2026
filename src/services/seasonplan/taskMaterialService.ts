import { axiosInstance } from '../../config/axios';
import { ApiResponse } from '../../types/auth';
import { TaskMaterial, AddTaskMaterialRequest } from '../../types/taskMaterial';

/**
 * Service Quản lý vật tư gắn với Task
 * Đồng bộ theo API Backend: /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/materials
 */
export const taskMaterialService = {
  /**
   * Lấy danh sách vật tư của Task
   */
  async getTaskMaterials(
    planId: string,
    stageId: string,
    taskId: string
  ): Promise<ApiResponse<TaskMaterial[]>> {
    const response = await axiosInstance.get<ApiResponse<TaskMaterial[]>>(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/materials`
    );
    return response.data;
  },

  /**
   * Thêm vật tư cho Task
   */
  async addTaskMaterial(
    planId: string,
    stageId: string,
    taskId: string,
    data: AddTaskMaterialRequest
  ): Promise<ApiResponse<TaskMaterial>> {
    const response = await axiosInstance.post<ApiResponse<TaskMaterial>>(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/materials`,
      data
    );
    return response.data;
  },

  /**
   * Xóa vật tư khỏi Task
   */
  async deleteTaskMaterial(
    planId: string,
    stageId: string,
    taskId: string,
    materialId: string
  ): Promise<ApiResponse<string>> {
    const response = await axiosInstance.delete<ApiResponse<string>>(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/materials/${materialId}`
    );
    return response.data;
  },
};

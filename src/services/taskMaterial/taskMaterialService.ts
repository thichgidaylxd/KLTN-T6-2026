import { axiosInstance } from '../../config/axios';
import { ApiResponse } from '../../types/auth';
import type { TaskMaterial, AddTaskMaterialRequest } from '../../types/taskMaterial/taskMaterial';

/**
 * Service Quản lý vật tư gắn với Task (Task Material)
 * Đồng bộ với API spec
 */
export const taskMaterialService = {
  /**
   * Lấy danh sách vật tư của Task
   * GET /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/materials
   * [PUBLIC] — Trả về danh sách TaskMaterial thuộc task
   */
  async getTaskMaterials(
    planId: string,
    stageId: string,
    taskId: string,
  ): Promise<ApiResponse<TaskMaterial[]>> {
    const response = await axiosInstance.get<ApiResponse<TaskMaterial[]>>(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/materials`,
    );
    return response.data;
  },

  /**
   * Thêm vật tư cho Task
   * POST /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/materials
   * Request body: AddTaskMaterialRequest { plannedQty, warehouseItemId }
   * Response: ApiResponse<TaskMaterial> (object được tạo)
   */
  async addTaskMaterial(
    planId: string,
    stageId: string,
    taskId: string,
    data: AddTaskMaterialRequest,
  ): Promise<ApiResponse<TaskMaterial>> {
    const response = await axiosInstance.post<ApiResponse<TaskMaterial>>(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/materials`,
      data,
    );
    return response.data;
  },

  /**
   * Xóa vật tư khỏi Task
   * DELETE /api/v1/plans/{planId}/stages/{stageId}/tasks/{taskId}/materials/{materialId}
   * Response: ApiResponse<string> (message)
   */
  async deleteTaskMaterial(
    planId: string,
    stageId: string,
    taskId: string,
    materialId: string,
  ): Promise<ApiResponse<string>> {
    const response = await axiosInstance.delete<ApiResponse<string>>(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/materials/${materialId}`,
    );
    return response.data;
  },
};

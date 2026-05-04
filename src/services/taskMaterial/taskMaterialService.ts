import { axiosInstance } from '../../config/axios';
import {
  getTaskMaterialsResponseSchema,
  addTaskMaterialResponseSchema,
  deleteTaskMaterialResponseSchema,
} from '../../schemas/taskMaterialSchemas';
import { AddTaskMaterialRequest, TaskMaterial } from '../../types/taskMaterial';

/**
 * Service Quản lý vật tư công việc (Task Material)
 */
export const taskMaterialService = {
  /**
   * Lấy danh sách vật tư của một công việc
   */
  async getTaskMaterials(planId: string, stageId: string, taskId: string): Promise<TaskMaterial[]> {
    const response = await axiosInstance.get(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/materials`
    );
    const validated = getTaskMaterialsResponseSchema.parse(response.data);
    return validated.data;
  },

  /**
   * Thêm vật tư vào công việc
   */
  async addTaskMaterial(
    planId: string,
    stageId: string,
    taskId: string,
    data: AddTaskMaterialRequest
  ): Promise<TaskMaterial> {
    const response = await axiosInstance.post(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/materials`,
      data
    );
    const validated = addTaskMaterialResponseSchema.parse(response.data);
    return validated.data;
  },

  /**
   * Xóa vật tư khỏi công việc
   */
  async deleteTaskMaterial(
    planId: string,
    stageId: string,
    taskId: string,
    materialId: string
  ): Promise<string> {
    const response = await axiosInstance.delete(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/materials/${materialId}`
    );
    const validated = deleteTaskMaterialResponseSchema.parse(response.data);
    return typeof validated === 'string' ? validated : validated.data;
  },
};

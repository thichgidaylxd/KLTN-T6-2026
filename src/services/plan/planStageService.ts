import { axiosInstance } from '../../config/axios';
import { Phase } from '../../types/seasonPlan';
import {
  getStagesResponseSchema,
  getStageResponseSchema,
  createStageResponseSchema,
  updateStageResponseSchema,
} from '../../schemas/seasonPlanSchemas';

/**
 * Service Quản lý giai đoạn sản xuất (Plan Stage)
 * Đồng bộ với API /api/v1/plans/{planId}/stages
 */
const mapToPhase = (data: any): Phase => ({
  ...data,
  duration: 0, // default if missing
  tasks: data.tasks ?? [], // default
  source: data.source || 'MANUAL',
});

export const planStageService = {
  /**
   * Lấy danh sách giai đoạn của kế hoạch
   * GET /api/v1/plans/{planId}/stages
   */
  async getStages(planId: string): Promise<Phase[]> {
    const response = await axiosInstance.get(`/api/v1/plans/${planId}/stages`);
    const validated = getStagesResponseSchema.parse(response.data);
    return validated.data.map(mapToPhase);
  },

  /**
   * Lấy chi tiết một giai đoạn
   * GET /api/v1/plans/{planId}/stages/{stageId}
   */
  async getStageById(planId: string, stageId: string): Promise<Phase> {
    const response = await axiosInstance.get(`/api/v1/plans/${planId}/stages/${stageId}`);
    const validated = getStageResponseSchema.parse(response.data);
    return mapToPhase(validated.data);
  },

  /**
   * Tạo giai đoạn kế hoạch mới
   * POST /api/v1/plans/{planId}/stages
   */
  async createStage(
    planId: string,
    data: { name: string; startDate: string; endDate: string }
  ): Promise<Phase> {
    const response = await axiosInstance.post(`/api/v1/plans/${planId}/stages`, data);
    const validated = createStageResponseSchema.parse(response.data);
    return mapToPhase(validated.data);
  },

  /**
   * Cập nhật thông tin giai đoạn (name, startDate, endDate)
   * PATCH /api/v1/plans/{planId}/stages/{stageId}
   */
  async updateStage(
    planId: string,
    stageId: string,
    data: { name?: string; startDate?: string; endDate?: string }
  ): Promise<Phase> {
    const response = await axiosInstance.patch(
      `/api/v1/plans/${planId}/stages/${stageId}`,
      data
    );
    const validated = updateStageResponseSchema.parse(response.data);
    return mapToPhase(validated.data);
  },

  /**
   * Cập nhật thời gian giai đoạn
   * PUT /api/v1/plans/{planId}/stages/{stageId}/time
   */
  async updateStageTime(
    planId: string,
    stageId: string,
    data: { startDate: string; endDate: string }
  ): Promise<Phase> {
    const response = await axiosInstance.put(
      `/api/v1/plans/${planId}/stages/${stageId}/time`,
      data
    );
    const validated = updateStageResponseSchema.parse(response.data);
    return mapToPhase(validated.data);
  },

  /**
   * Xóa giai đoạn kế hoạch
   * DELETE /api/v1/plans/{planId}/stages/{stageId}
   */
  async deleteStage(planId: string, stageId: string): Promise<void> {
    await axiosInstance.delete(`/api/v1/plans/${planId}/stages/${stageId}`);
  },
};

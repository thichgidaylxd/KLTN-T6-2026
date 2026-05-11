import { axiosInstance } from '../../config/axios';
import { SeasonPlan, CreateSeasonPlanRequest } from '../../types/seasonPlan/seasonPlan';
import {
  getPlansResponseSchema,
  createPlanResponseSchema,
  getPlanPlotsResponseSchema,
  addPlanPlotsResponseSchema,
} from '../../schemas/seasonPlanSchemas';

/**
 * Service Quản lý kế hoạch sản xuất (Season Plan)
 * Đồng bộ theo API Backend: /api/v1/plans
 */
export const seasonPlanService = {
  async getPlans(): Promise<SeasonPlan[]> {
    const response = await axiosInstance.get('/api/v1/plans');
    const validated = getPlansResponseSchema.parse(response.data);

    return validated.data.map(plan => ({
      ...plan,
      description: plan.note || '',
    })) as any as SeasonPlan[];
  },

  /**
   * Lấy chi tiết một kế hoạch
   */
  async getPlanById(planId: string): Promise<SeasonPlan> {
    const response = await axiosInstance.get(`/api/v1/plans/${planId}`);
    const validated = createPlanResponseSchema.parse(response.data);

    return {
      ...validated.data,
      description: validated.data.note || '',
    } as any as SeasonPlan;
  },

  /**
   * Tạo kế hoạch mới
   */
  async createPlan(data: CreateSeasonPlanRequest): Promise<SeasonPlan> {
    const payload = {
      name: data.name,
      cropId: data.cropId,
      startDate: data.startDate,
      endDate: data.endDate || data.startDate,
      note: data.note || '',
    };

    const response = await axiosInstance.post('/api/v1/plans', payload);
    const validated = createPlanResponseSchema.parse(response.data);

    return {
      ...validated.data,
      cropId: (validated.data as any).cropId || data.cropId,
      phases: [],
      description: validated.data.note || '',
    } as SeasonPlan;
  },

  /**
   * Cập nhật thông tin kế hoạch (PATCH /api/v1/plans/{planId})
   */
  async updatePlan(planId: string, data: Partial<SeasonPlan>): Promise<SeasonPlan> {
    const payload = {
      name: data.name,
      note: data.description || (data as any).note,
      startDate: data.startDate,
      endDate: data.endDate,
    };
    const response = await axiosInstance.patch(`/api/v1/plans/${planId}`, payload);
    const validated = createPlanResponseSchema.parse(response.data);
    return {
      ...validated.data,
      description: validated.data.note || '',
    } as any as SeasonPlan;
  },

  /**
   * Lấy danh sách lô đất của kế hoạch
   */
  async getPlanPlots(planId: string): Promise<{ plotId: string; plotName: string }[]> {
    const response = await axiosInstance.get(`/api/v1/plans/${planId}/plots`);
    const validated = getPlanPlotsResponseSchema.parse(response.data);
    return validated.data;
  },

  /**
   * Thêm lô đất vào kế hoạch
   */
  async addPlotsToPlan(planId: string, plotIds: string[]): Promise<{ planId: string; addedPlots: { plotId: string; plotName: string }[] }> {
    const response = await axiosInstance.post(`/api/v1/plans/${planId}/plots`, { plotIds });
    return addPlanPlotsResponseSchema.parse(response.data).data;
  },

  /**
   * Xóa lô đất khỏi kế hoạch
   */
  async removePlotFromPlan(planId: string, plotId: string): Promise<void> {
    await axiosInstance.delete(`/api/v1/plans/${planId}/plots/${plotId}`);
  },


  /**
   * Cập nhật thời gian kế hoạch (PUT /api/v1/plans/{planId}/time)
   */
  async updatePlanTime(planId: string, data: { startDate: string; endDate: string; version?: number }): Promise<SeasonPlan> {
    const response = await axiosInstance.put(`/api/v1/plans/${planId}/time`, data);
    const validated = createPlanResponseSchema.parse(response.data);
    return {
      ...validated.data,
      description: validated.data.note || '',
    } as any as SeasonPlan;
  },

  /**
   * Xóa kế hoạch
   */
  async deletePlan(planId: string): Promise<void> {
    await axiosInstance.delete(`/api/v1/plans/${planId}`);
  },
};

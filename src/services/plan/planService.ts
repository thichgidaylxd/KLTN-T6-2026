import { axiosInstance } from '../../config/axios';
import { ApiResponse } from '../../types/auth';
import {
  Plan,
  CreatePlanRequest,
  UpdatePlanTimeRequest,
  PlotInPlan,
  AddPlotsRequest,
  AddPlotsResponse,
} from '../../types/plan/plan';

/**
 * Service Quản lý kế hoạch sản xuất (Plan)
 * Đồng bộ với API spec
 */
export const planService = {
  /**
   * Lấy danh sách kế hoạch của farm
   * GET /api/v1/plans
   * [PUBLIC] — Trả về tất cả plans thuộc farm hiện tại (từ token)
   */
  async getPlans(): Promise<ApiResponse<Plan[]>> {
    const response = await axiosInstance.get<ApiResponse<Plan[]>>('/api/v1/plans');
    return response.data;
  },

  /**
   * Lấy chi tiết 1 kế hoạch
   * GET /api/v1/plans/{planId}
   * [PUBLIC]
   */
  async getPlanById(planId: string): Promise<ApiResponse<Plan>> {
    const response = await axiosInstance.get<ApiResponse<Plan>>(`/api/v1/plans/${planId}`);
    return response.data;
  },

  /**
   * Tạo kế hoạch mới
   * POST /api/v1/plans
   * Request body: CreatePlanRequest
   * Response: ApiResponse<Plan> (full plan với id, version, status=DRAFT, etc.)
   */
  async createPlan(data: CreatePlanRequest): Promise<ApiResponse<Plan>> {
    const response = await axiosInstance.post<ApiResponse<Plan>>('/api/v1/plans', data);
    return response.data;
  },

  /**
   * Cập nhật thời gian kế hoạch (startDate, endDate)
   * PUT /api/v1/plans/{planId}/time
   * Request body: UpdatePlanTimeRequest (version + dates)
   * Response: ApiResponse<Plan> (updated plan)
   */
  async updatePlanTime(
    planId: string,
    data: UpdatePlanTimeRequest,
  ): Promise<ApiResponse<Plan>> {
    const response = await axiosInstance.put<ApiResponse<Plan>>(
      `/api/v1/plans/${planId}/time`,
      data,
    );
    return response.data;
  },

  /**
   * Xóa kế hoạch (soft delete)
   * DELETE /api/v1/plans/{planId}
   * Response: ApiResponse<string> (message)
   */
  async deletePlan(planId: string): Promise<ApiResponse<string>> {
    const response = await axiosInstance.delete<ApiResponse<string>>(
      `/api/v1/plans/${planId}`,
    );
    return response.data;
  },

  /**
   * Lấy danh sách plots của kế hoạch
   * GET /api/v1/plans/{planId}/plots
   * Response: ApiResponse<PlotInPlan[]>
   */
  async getPlanPlots(planId: string): Promise<ApiResponse<PlotInPlan[]>> {
    const response = await axiosInstance.get<ApiResponse<PlotInPlan[]>>(
      `/api/v1/plans/${planId}/plots`,
    );
    return response.data;
  },

  /**
   * Thêm plots vào kế hoạch
   * POST /api/v1/plans/{planId}/plots
   * Request body: AddPlotsRequest { plotIds: string[] }
   * Response: ApiResponse<AddPlotsResponse>
   * Note: Plot đã tồn tại trong plan sẽ được bỏ qua (idempotent)
   */
  async addPlotsToPlan(
    planId: string,
    data: AddPlotsRequest,
  ): Promise<ApiResponse<AddPlotsResponse>> {
    const response = await axiosInstance.post<ApiResponse<AddPlotsResponse>>(
      `/api/v1/plans/${planId}/plots`,
      data,
    );
    return response.data;
  },
};

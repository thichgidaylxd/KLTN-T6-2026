import { axiosInstance } from '../../config/axios';
import { ApiResponse } from '../../types/auth';
import type { Plot, CreatePlotRequest, UpdatePlotRequest } from '../../types/plot/plot';

/**
 * Service Quản lý lô đất (Plot)
 * Đồng bộ với API spec
 */
export const plotService = {
  /**
   * Lấy danh sách lô đất của farm
   * GET /api/v1/plots
   * [PUBLIC] — Trả về tất cả plots thuộc farm hiện tại (từ token)
   */
  async getPlots(): Promise<ApiResponse<Plot[]>> {
    const response = await axiosInstance.get<ApiResponse<Plot[]>>('/api/v1/plots');
    return response.data;
  },

  /**
   * Tạo lô đất mới
   * POST /api/v1/plots
   * Request body: CreatePlotRequest
   * Response: ApiResponse<Plot> (full plot với id, version, areaHa, status=ACTIVE)
   */
  async createPlot(data: CreatePlotRequest): Promise<ApiResponse<Plot>> {
    const response = await axiosInstance.post<ApiResponse<Plot>>('/api/v1/plots', data);
    return response.data;
  },

  /**
   * Cập nhật lô đất
   * PATCH /api/v1/plots/{plotId}
   * Request body: UpdatePlotRequest (version + optional fields + clear flags)
   * Response: ApiResponse<Plot> (updated plot)
   */
  async updatePlot(
    plotId: string,
    data: UpdatePlotRequest,
  ): Promise<ApiResponse<Plot>> {
    const response = await axiosInstance.patch<ApiResponse<Plot>>(
      `/api/v1/plots/${plotId}`,
      data,
    );
    return response.data;
  },

  /**
   * Xóa lô đất (soft delete)
   * DELETE /api/v1/plots/{plotId}
   * Response: ApiResponse<string> (message)
   */
  async deletePlot(plotId: string): Promise<ApiResponse<string>> {
    const response = await axiosInstance.delete<ApiResponse<string>>(
      `/api/v1/plots/${plotId}`,
    );
    return response.data;
  },
};

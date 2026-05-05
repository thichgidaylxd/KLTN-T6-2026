import { AxiosRequestConfig } from 'axios';
import { axiosInstance } from '../../config/axios';
import { ApiResponse } from '../../types/auth';
import { Farm, CreateFarmRequest, UpdateFarmRequest } from '../../types/farm';

export const farmService = {
  async createFarm(data: CreateFarmRequest): Promise<ApiResponse<Farm>> {
    const response = await axiosInstance.post<ApiResponse<Farm>>(
      '/api/v1/farms',
      data
    );
    return response.data;
  },

  async getMyFarms(): Promise<ApiResponse<Farm[]>> {
    const response = await axiosInstance.get<ApiResponse<Farm[]>>(
      '/api/v1/farms'
    );
    return response.data;
  },

  /**
   * Lấy thông tin tổng quan farm (Dashboard summary)
   * GET /api/v1/farms/summary
   */
  async getFarmSummary(): Promise<ApiResponse<any[]>> {
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      '/api/v1/farms/summary'
    );
    return response.data;
  },

  async getFarmDetail(id: string): Promise<ApiResponse<Farm>> {
    const response = await axiosInstance.get<ApiResponse<Farm>>(
      `/api/v1/farms/${id}`
    );
    return response.data;
  },

  async selectFarm(farmId: string): Promise<ApiResponse<{ farmToken: string }>> {
    const response = await axiosInstance.post<ApiResponse<{ farmToken: string }>>(
      `/api/v1/farms/${farmId}/select`
    );
    return response.data;
  },

  async updateFarm(
    farmId: string,
    data: UpdateFarmRequest,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<Farm>> {
    const response = await axiosInstance.patch<ApiResponse<Farm>>(
      `/api/v1/farms/${farmId}`,
      data,
      config,
    );
    return response.data;
  },

  async deleteFarm(farmId: string): Promise<ApiResponse<any>> {
    const response = await axiosInstance.delete<ApiResponse<any>>(
      `/api/v1/farms/${farmId}`
    );
    // Nếu status là 204 (No Content), Axios response.data sẽ trống
    // Chúng ta cần trả về cấu trúc success để các hàm gọi ở trên không bị lỗi
    if (response.status === 204 || !response.data) {
      return {
        success: true,
        code: 204,
        message: 'Xóa thành công',
        data: null,
        timestamp: new Date().toISOString()
      };
    }
    return response.data;
  }
};


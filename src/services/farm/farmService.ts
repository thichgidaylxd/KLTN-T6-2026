import { AxiosRequestConfig } from 'axios';
import { axiosInstance } from '../../config/axios';
import { ApiResponse } from '../../types/auth';
import { Farm, CreateFarmRequest, UpdateFarmRequest, FarmSummary, SelectFarmResponseData } from '../../types/farm';
import { deleteFarmResponseSchema } from '../../schemas/farmSchemas';

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

  async getFarmSummary(): Promise<ApiResponse<FarmSummary[]>> {
    const response = await axiosInstance.get<ApiResponse<FarmSummary[]>>(
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

   async selectFarm(farmId: string): Promise<ApiResponse<SelectFarmResponseData>> {
     const response = await axiosInstance.post<ApiResponse<SelectFarmResponseData>>(
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

  async deleteFarm(farmId: string): Promise<ApiResponse<string>> {
    const response = await axiosInstance.delete<ApiResponse<string>>(
      `/api/v1/farms/${farmId}`
    );
    // Some backends return a raw string message instead of the envelope object.
    if (typeof response.data === 'string') {
      const envelope = {
        success: true,
        code: response.status ?? 200,
        message: response.data,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
      return deleteFarmResponseSchema.parse(envelope as any);
    }

    return deleteFarmResponseSchema.parse(response.data);
  }
};


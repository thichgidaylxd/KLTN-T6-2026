import { axiosInstance } from '../../config/axios';
import { ApiResponse } from '../../types/auth';
import { Warehouse, CreateWarehouseRequest } from '../../types/warehouse/warehouse';

export const warehouseService = {
  async getWarehouses(farmId: string): Promise<ApiResponse<Warehouse[]>> {
    const res = await axiosInstance.get(`/api/v1/farms/${farmId}/warehouses`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tải danh sách kho hàng');
    }
    return res.data;
  },

  async createWarehouse(farmId: string, data: CreateWarehouseRequest): Promise<ApiResponse<Warehouse>> {
    const res = await axiosInstance.post(`/api/v1/farms/${farmId}/warehouses`, data);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tạo kho hàng');
    }
    return res.data;
  },

  async deleteWarehouse(farmId: string, warehouseId: string): Promise<ApiResponse<string>> {
    const res = await axiosInstance.delete(`/api/v1/farms/${farmId}/warehouses/${warehouseId}`);

    return res.data;
  },
};

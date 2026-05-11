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

  async updateWarehouse(farmId: string, warehouseId: string, data: any): Promise<ApiResponse<Warehouse>> {
    const res = await axiosInstance.patch(`/api/v1/farms/${farmId}/warehouses/${warehouseId}`, data);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể cập nhật kho hàng');
    }
    return res.data;
  },

  async deleteWarehouse(farmId: string, warehouseId: string): Promise<ApiResponse<any>> {
    const res = await axiosInstance.delete(`/api/v1/farms/${farmId}/warehouses/${warehouseId}`);
    
    // Xử lý 204 No Content: Trả về cấu trúc thành công mặc định
    if (res.status === 204 || !res.data) {
      return {
        success: true,
        code: 204,
        message: 'Xóa thành công',
        data: null,
        timestamp: new Date().toISOString()
      };
    }
    return res.data;
  },

  async getWarehouseLocations(farmId: string, warehouseId: string): Promise<ApiResponse<any[]>> {
    const res = await axiosInstance.get(`/api/v1/farms/${farmId}/warehouses/${warehouseId}/locations`);
    return res.data;
  },

  async createWarehouseLocation(farmId: string, warehouseId: string, data: any): Promise<ApiResponse<any>> {
    const res = await axiosInstance.post(`/api/v1/farms/${farmId}/warehouses/${warehouseId}/locations`, data);
    return res.data;
  },

  async getWarehouseLocationById(farmId: string, warehouseId: string, locationId: string): Promise<ApiResponse<any>> {
    const res = await axiosInstance.get(`/api/v1/farms/${farmId}/warehouses/${warehouseId}/locations/${locationId}`);
    return res.data;
  },
};

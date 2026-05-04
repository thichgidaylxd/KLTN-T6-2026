import { axiosInstance } from '../../config/axios';
import { CreateSupplierDto, Supplier } from '../../types/supplier/supplier';

export const supplierService = {
  async getSuppliers(farmId: string): Promise<Supplier[]> {
    const response = await axiosInstance.get(`/api/v1/farms/${farmId}/suppliers`);
    return response.data.data ?? [];
  },

  async createSupplier(farmId: string, data: CreateSupplierDto): Promise<Supplier> {
    const response = await axiosInstance.post(`/api/v1/farms/${farmId}/suppliers`, data);
    return response.data.data;
  },

  async deleteSupplier(farmId: string, supplierId: string): Promise<void> {
    await axiosInstance.delete(`/api/v1/farms/${farmId}/suppliers/${supplierId}`);
  },
};


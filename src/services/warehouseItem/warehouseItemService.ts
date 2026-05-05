import { axiosInstance } from '../../config/axios';
import { CreateWarehouseItemDto, WarehouseItem } from '../../types/warehouseItem/warehouseItem';
import { Warehouse } from '../../types/warehouse/warehouse';
import {
  getWarehouseItemsResponseSchema,
  createWarehouseItemResponseSchema
} from '../../schemas/warehouseItemSchemas';
import { getWarehousesResponseSchema } from '../../schemas/warehouseSchemas';

export const warehouseItemService = {
  async getFarmWarehouses(farmId: string): Promise<Warehouse[]> {
    const response = await axiosInstance.get(`/api/v1/farms/${farmId}/warehouses`);
    return getWarehousesResponseSchema.parse(response.data).data;
  },

  async getWarehouseItems(farmId: string, warehouseId: string): Promise<WarehouseItem[]> {
    const response = await axiosInstance.get(`/api/v1/farms/${farmId}/warehouses/${warehouseId}/items`);
    return getWarehouseItemsResponseSchema.parse(response.data).data;
  },

  async getFarmWarehouseItems(farmId: string): Promise<WarehouseItem[]> {
    const response = await axiosInstance.get(`/api/v1/farms/${farmId}/warehouses/items`);
    return getWarehouseItemsResponseSchema.parse(response.data).data;
  },

  async createWarehouseItem(
    farmId: string,
    warehouseId: string,
    itemData: CreateWarehouseItemDto,
  ): Promise<WarehouseItem> {
    const response = await axiosInstance.post(`/api/v1/farms/${farmId}/warehouses/${warehouseId}/items`, itemData);
    return createWarehouseItemResponseSchema.parse(response.data).data;
  },

  async updateWarehouseItem(
    farmId: string,
    warehouseId: string,
    warehouseItemId: string,
    itemData: any,
  ): Promise<WarehouseItem> {
    const response = await axiosInstance.patch(`/api/v1/farms/${farmId}/warehouses/${warehouseId}/items/${warehouseItemId}`, itemData);
    return createWarehouseItemResponseSchema.parse(response.data).data;
  },

  async deleteWarehouseItem(
    farmId: string,
    warehouseId: string,
    warehouseItemId: string,
  ): Promise<void> {
    await axiosInstance.delete(`/api/v1/farms/${farmId}/warehouses/${warehouseId}/items/${warehouseItemId}`);
  },

  async deleteItemFromFarm(
    farmId: string,
    warehouseItemId: string,
  ): Promise<void> {
    await axiosInstance.delete(`/api/v1/farms/${farmId}/items/${warehouseItemId}`);
  },
};


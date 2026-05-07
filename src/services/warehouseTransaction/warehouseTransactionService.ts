import { axiosInstance } from '../../config/axios';
import {
  WarehouseTransaction,
  PagedData,
  PageableParams,
} from '../../types/warehouseTransaction/warehouseTransaction';

/**
 * Unwrap the standard { success, code, message, data, timestamp } envelope
 * and return just the `data` field.
 */
function unwrapData<T>(response: any): T {
  const body = response.data;
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data as T;
  }
  return body as T;
}

function buildPageableParams(params?: PageableParams) {
  if (!params) return {};
  const { page = 0, size = 20, sort } = params;
  const result: Record<string, any> = { page, size };
  if (sort && sort.length > 0) {
    result['sort'] = sort;
  }
  return result;
}

export const warehouseTransactionService = {
  /**
   * GET /api/v1/items/{warehouseItemId}/transactions
   * Danh sách giao dịch theo Warehouse Item
   */
  async getTransactionsByItem(
    warehouseItemId: string,
    pageable?: PageableParams,
  ): Promise<PagedData<WarehouseTransaction>> {
    const response = await axiosInstance.get(
      `/api/v1/items/${warehouseItemId}/transactions`,
      { params: buildPageableParams(pageable) },
    );
    return unwrapData<PagedData<WarehouseTransaction>>(response);
  },

  /**
   * GET /api/v1/farms/{farmId}/warehouses/{warehouseId}/transactions
   * Danh sách giao dịch theo Warehouse
   */
  async getTransactionsByWarehouse(
    farmId: string,
    warehouseId: string,
    pageable?: PageableParams,
  ): Promise<PagedData<WarehouseTransaction>> {
    const response = await axiosInstance.get(
      `/api/v1/farms/${farmId}/warehouses/${warehouseId}/transactions`,
      { params: buildPageableParams(pageable) },
    );
    return unwrapData<PagedData<WarehouseTransaction>>(response);
  },

  async getTransactionsByFarm(
    farmId: string,
    pageable?: PageableParams,
  ): Promise<PagedData<WarehouseTransaction>> {
    const response = await axiosInstance.get(
      `/api/v1/farms/${farmId}/transactions`,
      { params: buildPageableParams(pageable) },
    );
    return unwrapData<PagedData<WarehouseTransaction>>(response);
  },
};

import { axiosInstance } from '../../config/axios';
import { WarehouseTransaction } from '../../types/warehouseTransaction/warehouseTransaction';
import { PagedData, PageableParams } from '../../types/common';

/**
 * Unwrap the standard { success, code, message, data, timestamp } envelope
 * and return just the `data` field.
 */
interface ApiEnvelope<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

function unwrapData<T>(response: { data: ApiEnvelope<T> }): T {
  const body = response.data;
  if (!body || typeof body !== 'object' || !('success' in body) || !('data' in body)) {
    throw new Error('Warehouse transaction API response is not in expected envelope format');
  }
  if (!body.success) {
    throw new Error(body.message || 'Warehouse transaction API returned unsuccessful response');
  }
  return body.data;
}

function normalizeTransactionType(type: string): string {
  if (type === 'IMPORT_WAREHOUSE_ITEM_MANUAL' || type === 'IMPORT WAREHOUSE ITEM MANUAL') {
    return 'IMPORT_MANUAL';
  }
  return type;
}

function normalizePagedTransactions(
  data: PagedData<WarehouseTransaction>,
): PagedData<WarehouseTransaction> {
  return {
    ...data,
    content: data.content.map((tx) => ({
      ...tx,
      type: normalizeTransactionType(tx.type) as WarehouseTransaction['type'],
    })),
  };
}

function buildPageableParams(params: PageableParams) {
  const { page = 0, size = 20, sort = ['createdAt,desc'] } = params;
  const result: Record<string, any> = { page, size };
  result['sort'] = sort;
  return result;
}

export const warehouseTransactionService = {
  /**
   * GET /api/v1/items/{warehouseItemId}/transactions
   * Danh sách giao dịch theo Warehouse Item
   */
  async getTransactionsByItem(
    warehouseItemId: string,
    pageable: PageableParams,
  ): Promise<PagedData<WarehouseTransaction>> {
    const response = await axiosInstance.get(
      `/api/v1/items/${warehouseItemId}/transactions`,
      { params: buildPageableParams(pageable) },
    );
    return normalizePagedTransactions(unwrapData<PagedData<WarehouseTransaction>>(response));
  },

  /**
   * GET /api/v1/farms/{farmId}/warehouses/{warehouseId}/transactions
   * Danh sách giao dịch theo Warehouse
   */
  async getTransactionsByWarehouse(
    farmId: string,
    warehouseId: string,
    pageable: PageableParams,
  ): Promise<PagedData<WarehouseTransaction>> {
    const response = await axiosInstance.get(
      `/api/v1/farms/${farmId}/warehouses/${warehouseId}/transactions`,
      { params: buildPageableParams(pageable) },
    );
    return normalizePagedTransactions(unwrapData<PagedData<WarehouseTransaction>>(response));
  },

  async getTransactionsByFarm(
    farmId: string,
    pageable: PageableParams,
  ): Promise<PagedData<WarehouseTransaction>> {
    const response = await axiosInstance.get(
      `/api/v1/farms/${farmId}/transactions`,
      { params: buildPageableParams(pageable) },
    );
    return normalizePagedTransactions(unwrapData<PagedData<WarehouseTransaction>>(response));
  },
};

export interface WarehouseItem {
  id: string;
  name: string;
  stock: number;
  warehouse: {
    id: string;
    name: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  unit: {
    id: string;
    code: string;
    name: string;
  };
  supplier: {
    code: string;
    name: string;
    createdAt: string;
  };
  sku: {
    sku: string;
    description: string;
    createdAt: string;
  };
  createdBy: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    status: string;
    isLocked: boolean;
    createdAt: string;
  };
  createdAt: string;
  unitPrice: number;
  minStockQty: number;
}

export interface CreateWarehouseItemDto {
  toLocationId: string;
  unitId: string;
  name: string;
  stock: number;
  sku: string;
  unitPrice: number;
  supplierId: string;
  minStockQty: number;
}

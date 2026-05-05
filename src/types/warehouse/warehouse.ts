export interface Warehouse {
  id: string;
  version?: number;
  name: string;
  description?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CreateWarehouseRequest {
  name: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export interface UpdateWarehouseRequest extends Partial<CreateWarehouseRequest> {
  version: number; // Bắt buộc truyền version
}

export interface WarehouseLocation {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  warehouse: Warehouse;
}

export interface CreateWarehouseLocationRequest {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

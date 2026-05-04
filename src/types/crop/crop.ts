/**
 * Types cho module Quản lý danh mục cây trồng (PB10)
 * Đồng bộ theo API Backend thực tế
 */

// Loại cây trồng - là một entity riêng từ API GET /api/v1/crop-type
export interface CropType {
  id: string;
  name: string;
  description?: string;
}

// Lô đất đang sử dụng (dùng trong danh sách Cây trồng nội bộ)
export interface GrowthStage {
  id?: string;
  name: string;
  durationDays: number;
  description?: string;
}

export interface SoilCondition {
  phMin: number;
  phMax: number;
  nMin: number;
  nMax: number;
  pMin: number;
  pMax: number;
  kMin: number;
  kMax: number;
}

export interface Disease {
  id?: string;
  name: string;
  symptoms: string;
  images?: string[];
  treatment: string;
}

// Response shape từ API POST /api/v1/crop và GET (khi có)
export interface Crop {
  id: string;
  version?: number;
  name: string;
  cropType: CropType;
  scope: string;           // 'SYSTEM' | 'FARM'
  clonedFromId?: string;
  imageUrl?: string;
  description?: string;
  // Các mở rộng phía sau (khi BE cung cấp thêm API)
  stages?: GrowthStage[];
  soil?: SoilCondition;
  diseases?: Disease[];
  inUse?: boolean;
}

// Payload cho POST /api/v1/crop
export interface CreateCropRequest {
  name: string;
  cropTypeId: string;
  description?: string;
  imageUrl?: string;
}

// Payload cho POST /api/v1/crop-type
export interface CreateCropTypeRequest {
  name: string;
  description?: string;
}

// UpdateCropRequest (dùng khi BE cung cấp endpoint update)
export interface UpdateCropRequest extends Partial<CreateCropRequest> {
  version?: number;
}

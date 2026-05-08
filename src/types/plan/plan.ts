/**
 * Types cho Plan API (Quản lý kế hoạch sản xuất)
 * Đồng bộ với API spec
 */

export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Plan {
  id: string;
  version: number;
  farmId: string;
  clonedFromId?: string | null;
  name: string;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  status: PlanStatus;
  note?: string;
  createdById: string;
  createdAt: string;  // ISO 8601
  deletedAt?: string | null; // soft delete
}

export interface CreatePlanRequest {
  cropId: string;
  name: string;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  note?: string;
}

export interface UpdatePlanTimeRequest {
  version: number;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
}

export interface PlotInPlan {
  plotId: string;
  version: number;
  plotName: string;
}

export interface AddPlotsRequest {
  plotIds: string[];  // array of UUIDs
}

export interface AddPlotsResponse {
  planId: string;
  addedPlots: PlotInPlan[];
}

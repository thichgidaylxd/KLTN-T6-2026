// ─── Request types ────────────────────────────────────────────────────────────

export interface WarehouseEntryRequest {
  warehouseId: string;           // chọn kho nhận sản phẩm
  warehouseLocationId: string;   // chọn vị trí trong kho
  warehouseItemId?: string;      // optional — nếu đã có item cùng loại từ trước
  productName?: string;          // tên sản phẩm — required nếu warehouseItemId null
  qty: number;
}

export interface CreateHarvestRequest {
  planId: string;
  planStageId?: string;
  plotId?: string;
  harvestDate: string;
  quantity: number;
  unitId: string;
  qualityGradeId?: string;
  unitPrice?: number;
  harvestedBy?: string;
  earlyHarvest: boolean;
  earlyHarvestReason?: string;
  partial: boolean;
  warehouseEntries: WarehouseEntryRequest[];
  notes?: string;
}

export interface UpdateHarvestRequest {
  harvestDate?: string;
  quantity?: number;
  unitPrice?: number;
  qualityGradeId?: string;
  harvestedBy?: string;
  earlyHarvest?: boolean;
  earlyHarvestReason?: string;
  partial?: boolean;
  notes?: string;
}

export interface HarvestFilterRequest {
  planStageId?: string;
  plotId?: string;
  fromDate?: string;
  toDate?: string;
  qualityGradeId?: string;
  earlyHarvest?: boolean;
  partial?: boolean;
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface WarehouseEntryResponse {
  transactionId: string;
  warehouseItemId: string;
  warehouseItemName: string;
  warehouseId: string;
  warehouseName: string;
  locationId: string;
  locationName: string;
  qty: number;
}

export interface HarvestResponse {
  id: string;
  planId: string;
  planName: string;
  planStageId?: string;
  planStageName?: string;
  farmId: string;
  plotId?: string;
  plotName?: string;
  harvestDate: string;
  batchNumber: number;
  quantity: number;
  unitId: string;
  unitCode: string;
  unitName: string;
  qualityGradeId?: string;
  qualityGradeCode?: string;
  qualityGradeName?: string;
  unitPrice?: number;
  estimatedRevenue?: number;
  harvestedBy?: string;
  harvestedByName?: string;
  earlyHarvest: boolean;
  earlyHarvestReason?: string;
  partial: boolean;
  warehouseEntries: WarehouseEntryResponse[];
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface HarvestSummaryResponse {
  planId: string;
  planName: string;
  farmId: string;
  plotId?: string;
  plotName?: string;
  totalBatches: number;
  totalQuantity: number;
  unitId?: string;
  unitCode?: string;
  totalRevenue?: number;
  firstHarvestDate?: string;
  lastHarvestDate?: string;
  hasEarlyHarvest: boolean;
  hasPartialHarvest: boolean;
}

export interface MaterialCostItem {
  warehouseItemId: string;
  warehouseItemName: string;
  unitCode: string;
  plannedQty: number;
  usedQty: number;
  unitPrice: number;
  totalCost: number;
  deviation: number;
}

export interface MaterialCostDetail {
  planId: string;
  planName: string;
  totalMaterialCost: number;
  items: MaterialCostItem[];
}

export interface LaborCostItem {
  employeeId: string;
  employeeName: string;
  workDays: number;
  overtimeDays: number;
  totalWage: number;
}

export interface LaborCostDetail {
  planId: string;
  planName: string;
  totalLaborCost: number;
  totalWorkDays: number;
  items: LaborCostItem[];
}

export interface SeasonSummaryResponse {
  planId: string;
  planName: string;
  farmId: string;
  farmName: string;
  cropName: string;
  planStatus: string;
  startDate: string;
  endDate?: string;
  durationDays: string;
  harvestBatches: number;
  totalHarvestQuantity: number;
  unitCode?: string;
  totalRevenue: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalWorkDays: number;
  totalCost: number;
  grossProfit: number;
  profitMarginPercent: number;
  isProfitable: boolean;
  materialCostDetail: MaterialCostDetail;
  laborCostDetail: LaborCostDetail;
  harvestDetail?: HarvestSummaryResponse;
}

export interface SeasonSnapshotResponse {
  planId: string;
  planName: string;
  cropName: string;
  planStatus: string;
  startDate: string;
  endDate?: string;
  totalRevenue: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalCost: number;
  grossProfit: number;
  profitMarginPercent: number;
  isProfitable: boolean;
  totalHarvestQuantity: number;
  unitCode?: string;
  harvestBatches: number;
  totalWorkDays: number;
}

export interface SeasonComparisonResponse {
  farmId: string;
  farmName: string;
  seasons: SeasonSnapshotResponse[];
}
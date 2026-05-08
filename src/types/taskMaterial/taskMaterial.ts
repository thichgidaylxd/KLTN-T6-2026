export interface TaskMaterialStatus {
  id: string;
  code: string;
  name: string;
  color: string;
  isInitial?: boolean;
  isTerminal?: boolean;
}

export interface TaskMaterialTask {
  id: string;
  name: string;
  version: number;
  startDate: string;
  actualStartDate?: string | null;
  endDate: string;
  actualEndDate?: string | null;
  status: TaskMaterialStatus;
}

export interface TaskMaterialWarehouseItem {
  id: string;
  name: string;
  sku?: {
    sku: string;
    description?: string | null;
    createdAt?: string;
  } | null;
  unit?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface TaskMaterial {
  id: string;
  plannedQty: number;
  task: TaskMaterialTask;
  warehouseItem: TaskMaterialWarehouseItem;
}

export interface AddTaskMaterialRequest {
  plannedQty: number;
  warehouseItemId: string;
}

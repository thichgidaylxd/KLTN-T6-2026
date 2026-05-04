export interface TaskMaterialStatus {
  id: string;
  code: string;
  name: string;
  color: string;
  isInitial?: boolean;
  isTerminal?: boolean;
}

export interface TaskMaterial {
  id: string;
  plannedQty: number;
  task: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: TaskMaterialStatus;
  };
  warehouseItem: {
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
  };
}

export interface AddTaskMaterialRequest {
  plannedQty: number;
  warehouseItemId: string;
}

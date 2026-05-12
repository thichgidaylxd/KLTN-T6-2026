
// ─── Warehouse Transaction Types ─────────────────────────────────────────────

export type TransactionType =
  | 'IMPORT_MANUAL'
  | 'EXPORT_MANUAL'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUST_INCREASE'
  | 'ADJUST_DECREASE'
  | 'HARVEST_IN'
  | 'WORKLOG_OUT';

export interface TransactionWarehouseItem {
  id: string;
  name: string;
  unitPrice?: number;
  sku?: {
    sku: string;
    description: string;
    createdAt: string;
  };
  unit: {
    id: string;
    code: string;
    name: string;
  };
}

export interface TransactionLocation {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface TransactionPerformedBy {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  isLocked: boolean;
  createdAt: string;
}

export interface WarehouseTransaction {
  id: string;
  warehouseItem: TransactionWarehouseItem;
  fromLocation: TransactionLocation;
  toLocation: TransactionLocation;
  type: TransactionType;
  qtyChange: number;
  refTransferId: string | null;
  refWorkLogId: string | null;
  refTaskId: string | null;
  refHavestId: string | null;
  performedBy: TransactionPerformedBy;
  notes: string;
  createdAt: string;
}

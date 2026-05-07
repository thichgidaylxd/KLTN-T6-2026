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
  sku?: {
    sku: string;
    description?: string | null;
    createdAt: string;
  } | null;
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
  description?: string | null;
  isActive: boolean;
}

export interface TransactionPerformedBy {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  isLocked: boolean;
  createdAt: string;
}

export interface WarehouseTransaction {
  id: string;
  warehouseItem: TransactionWarehouseItem;
  fromLocation?: TransactionLocation | null;
  toLocation?: TransactionLocation | null;
  type: TransactionType;
  qtyChange: number;
  refTransferId?: string | null;
  refWorkLogId?: string | null;
  refTaskId?: string | null;
  refHavestId?: string | null;
  performedBy?: TransactionPerformedBy | null;
  notes?: string | null;
  createdAt: string;
}

/** Generic Spring-style paginated response wrapper */
export interface PagedData<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PageableParams {
  page?: number;
  size?: number;
  sort?: string[];
}

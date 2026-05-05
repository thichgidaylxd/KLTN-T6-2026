import { TaskStatusObject } from '../seasonPlan/seasonPlan';

export interface WorkLogMaterial {
  warehouseItemId: string;
  warehouseItemName?: string;
  fromLocationId?: string;
  usedQty: number;
  unitCode?: string;
  deviationReason?: string | null;
}

export interface WorkLog {
  id: string;
  type: 'NORMAL' | 'OVERTIME';
  isOverTime?: boolean | null;
  notes?: string | null;
  workDate: string;
  employee?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    status: string;
    isLocked: boolean;
    createdAt: string;
  } | null;
  task?: {
    id: string;
    name: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    status: TaskStatusObject;
    progressPercent: number;
  } | null;
  // Flat fields support
  employeeId?: string | null;
  employeeName?: string | null;
  taskId?: string | null;
  taskName?: string | null;
  farm?: {
    farmId?: string | null;
    farmName?: string | null;
    description?: string | null;
    ownerId?: string | null;
    ownerFullName?: string | null;
    ownerAvatarUrl?: string | null;
    myRole?: string | null;
    owner?: boolean;
  } | null;
}

export interface WorkLogDetail extends WorkLog {
  shiftName?: string | null;
  lockedAt?: string | null;
  createdAt?: string | null;
  materials?: WorkLogMaterial[] | null;
  overtime?: boolean | null;
}


export interface WorkLogSummary {
  employeeId: string;
  employeeName: string;
  totalWorkDays: number;
  totalOvertimeDays: number;
  totalWage: number;
}


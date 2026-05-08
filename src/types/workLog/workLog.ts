import { TaskStatusObject } from '../seasonPlan/seasonPlan';

export interface WorkLogMaterial {
  warehouseItemId: string;
  warehouseItemName?: string;
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
  task?: {
    id: string;
    version: number;
    planStageId: string;
    farmId: string;
    farmName?: string;
    plotId: string;
    status: TaskStatusObject;
    name: string;
    description?: string | null;
    startDate: string;
    actualStartDate?: string | null;
    endDate: string;
    actualEndDate?: string | null;
    progressPercent: number;
    acceptedAt?: string | null;
    completedAt?: string | null;
    createdBy?: string;
    createdAt?: string;
  } | null;
  farm?: {
    farmId: string;
    farmName: string;
    description?: string | null;
    ownerId: string;
    ownerFullName: string;
    ownerAvatarUrl?: string | null;
    myRole: string;
    owner: boolean;
  } | null;
  employee?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    status: string;
    isLocked: boolean;
    createdAt: string;
  } | null;
  // Flat fields support (for detail or legacy)
  employeeId?: string | null;
  employeeName?: string | null;
  taskId?: string | null;
  taskName?: string | null;
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

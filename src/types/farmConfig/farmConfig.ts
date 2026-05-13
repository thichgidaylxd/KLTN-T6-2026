// ─── Farm Config ─────────────────────────────────────────────────────────────

export interface FarmConfig {
  farmId: string;
  version: number;
  timezone: string;
  locale: string;
  currency: string;
  allowCropClone: boolean;
  taskOverdueNotifyDays: number;
}

export interface UpdateFarmConfigRequest {
  version: number;
  timezone?: string;
  locale?: string;
  currency?: string;
  allowCropClone?: boolean;
  taskOverdueNotifyDays?: number;
}

// ─── Work Shift ───────────────────────────────────────────────────────────────

export interface WorkShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  coefficient: number;
  isActive: boolean;
}

export interface CreateWorkShiftRequest {
  name: string;
  startTime: string;
  endTime: string;
  coefficient: number;
}

export interface UpdateWorkShiftRequest {
  name?: string;
  startTime?: string;
  endTime?: string;
  coefficient?: number;
  isActive?: boolean;
}

// ─── Wage Config ──────────────────────────────────────────────────────────────

export interface WageConfig {
  id: string;
  userId: string;
  userFullName: string;
  dailyRate: number;
  otMultiplier: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface CreateWageConfigRequest {
  userId: string;
  dailyRate: number;
  otMultiplier: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}
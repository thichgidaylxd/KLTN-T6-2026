import type { TaskMaterial } from '../taskMaterial';

export interface StatusObject {
  id: string;
  code: string;
  name: string;
  color: string;
  isInitial?: boolean;
  isTerminal?: boolean;
}

/** Trạng thái công việc (Task Status) — có thêm cờ isInitial / isTerminal từ API */
export interface TaskStatusObject extends StatusObject {
  isInitial?: boolean;
  isTerminal?: boolean;
}

export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'READY_TO_HARVEST' | 'HARVESTING' | 'COMPLETED' | 'CANCELLED' | 'UNASSIGNED' | 'ASSIGNED' | 'OVERDUE';

export interface PhaseConfig {
  name: string;
  duration: number; // in days
  description?: string;
  color?: string;
}

export interface Task {
  id: string;
  version?: number;
  planStageId: string;
  farmId?: string;
  plotId: string | null;
  name: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  actualStartDate?: string | null; // YYYY-MM-DD — thực tế bắt đầu
  actualEndDate?: string | null;   // YYYY-MM-DD — thực tế kết thúc
  status: TaskStatusObject;
  progressPercent: number;
  acceptedAt?: string;
  completedAt?: string;
  createdBy?: string;
  createdAt?: string;
  // Local/Extended fields for resource management
  assignedMembers?: string[];
  materials?: TaskMaterial[];
}

export interface Phase {
  plotId: string | undefined;
  id: string;
  version?: number;
  planId: string;
  name: string;
  source: 'TEMPLATE' | 'MANUAL' | 'CUSTOM';
  orderIndex: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  actualStartDate?: string | null; // YYYY-MM-DD — thực tế bắt đầu
  actualEndDate?: string | null;   // YYYY-MM-DD — thực tế kết thúc
  aiSuggestionCache?: string;
  status: StatusObject;
  duration: number; // in days, added for utility compatibility
  color?: string; // UI color
  description?: string; // Not in API snippet but useful
  tasks: Task[]; // Usually fetched separately but managed together in UI
}



export interface SeasonPlan {
  id: string;
  version?: number;
  farmId: string;
  clonedFromId?: string | null;
  name: string;
  startDate: string;
  endDate: string;
  cropId?: string;
  status: PlanStatus | StatusObject;
  note?: string;
  description?: string; // Local alias for note
  createdById?: string;
  createdAt?: string;
  deletedAt?: string | null;
  // Relationships
  phases: Phase[];
  plots?: PlanPlot[]; // Plots are sub-resources
}

export interface PlanPlot {
  plotId: string;
  plotName: string;
}

export interface CreateSeasonPlanRequest {
  name: string;
  cropId: string;
  startDate: string;
  endDate?: string;
  note?: string;
}

export interface UpdateSeasonPlanRequest {
  version?: number;
  name?: string;
  cropId?: string;
  startDate?: string;
  endDate?: string;
  note?: string;
  status?: PlanStatus;
}


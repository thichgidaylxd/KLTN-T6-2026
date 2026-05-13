import type { TaskMaterial } from '../taskMaterial';

export interface StatusObject {
  id: string;
  code: string;
  name: string;
  color: string;
  isInitial?: boolean;
  isTerminal?: boolean;
}

/** User object trong status history */
export interface UserObject {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  isLocked: boolean;
  createdAt: string;
}

/** Farm Role object */
export interface FarmRoleObject {
  id: string;
  name: string;
  description?: string | null;
}

/** Lịch sử thay đổi trạng thái của Plan Stage */
export interface PlanStageStatusHistory {
  fromStatus: StatusObject;
  toStatus: StatusObject;
  changedBy: UserObject;
  changedAt: string;
}

/** Transition giữa các trạng thái (có farmRole filter) */
export interface PlanStageStatusTransition {
  id: string;
  fromStatus: StatusObject;
  toStatus: StatusObject;
  farmRole: FarmRoleObject;
  createdAt: string;
}

/** Trạng thái công việc (Task Status) — có thêm cờ isInitial / isTerminal từ API */
export interface TaskStatusObject extends StatusObject {
  isInitial?: boolean;
  isTerminal?: boolean;
}

/** Lịch sử thay đổi trạng thái của Task */
export interface TaskStatusHistory {
  fromStatus: StatusObject;
  toStatus: StatusObject;
  changedBy: UserObject;
  changedAt: string;
}

/** Farm object (simplified) */
export interface FarmObject {
  id: string;
  name: string;
}

/** Transition giữa các trạng thái Task (theo farm) */
export interface TaskStatusTransition {
  id: string;
  farm?: FarmObject;
  fromStatus: StatusObject;
  toStatus: StatusObject;
  farmRole: FarmRoleObject;
  createdAt: string;
}

export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'READY_TO_HARVEST' | 'HARVESTING' | 'COMPLETED' | 'CANCELLED' | 'UNASSIGNED' | 'ASSIGNED' | 'OVERDUE';

export interface PhaseConfig {
  name: string;
  duration: number; // in days
  description?: string | null;
  color?: string;
}

export interface Task {
  id: string;
  version?: number;
  planStageId: string;
  farmId?: string | null;
  farmName?: string | null;
  plotId?: string | null;
  name: string;
  description?: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  actualStartDate?: string | null; // YYYY-MM-DD — thực tế bắt đầu
  actualEndDate?: string | null;   // YYYY-MM-DD — thực tế kết thúc
  status: TaskStatusObject;
  progressPercent: number;
  acceptedAt?: string | null;
  completedAt?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  dependencies?: any[]; // Quan hệ phụ thuộc
  // Local/Extended fields for resource management
  assignedMembers?: string[];
  materials?: TaskMaterial[];
}

export interface Phase {
  id: string;
  version?: number;
  planId: string;
  name: string;
  source?: 'TEMPLATE' | 'MANUAL' | 'CUSTOM';
  orderIndex?: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  actualStartDate?: string | null; // YYYY-MM-DD — thực tế bắt đầu
  actualEndDate?: string | null;   // YYYY-MM-DD — thực tế kết thúc
  aiSuggestionCache?: string | null;
  status: StatusObject;
  plotId?: string | null;
  duration?: number;
  color?: string; // UI color
  description?: string | null; // Not in API snippet but useful
  tasks?: Task[]; // Optional — tasks fetched separately
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

// Task Dependency responses
export interface TaskDependencyCreateResponse {
  task: Task;
  dependsOnTask: Task;
}

export interface TaskDependenciesResponse {
  task: Task;
  dependsOnTasks: Task[];
}

// Task Assignee
export interface TaskAssignee {
  id: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    status: string;
    isLocked: boolean;
    createdAt: string;
  };
  assigneeBy: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    status: string;
    isLocked: boolean;
    createdAt: string;
  };
  assigneeAt: string;
  removedBy?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    status: string;
    isLocked: boolean;
    createdAt: string;
  } | null;
  removedAt?: string | null;
}

export interface CreateTaskAssigneeRequest {
  userId: string;
}

export interface RemoveTaskAssigneeRequest {
  removalReason?: string;
}

export interface TaskAssigneeWithTask extends TaskAssignee {
  task: Task;
}

export interface PagedData<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

export interface PageableParams {
  page: number;
  size: number;
  sort?: string[];
}

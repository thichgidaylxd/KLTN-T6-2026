import { axiosInstance } from '../../config/axios';
import { Task } from '../../types/seasonPlan';
import type { TaskDependencyCreateResponse, TaskDependenciesResponse, TaskAssignee, TaskAssigneeWithTask } from '../../types/seasonPlan/seasonPlan';
import { PagedData, PageableParams } from '../../types/common';
import {
  getTasksResponseSchema,
  createTaskResponseSchema,
  createTaskDependencyResponseSchema,
  getTaskDependenciesResponseSchema,
  deleteTaskDependencyResponseSchema,
  getTaskAssigneesResponseSchema,
  createTaskAssigneeResponseSchema,
  removeTaskAssigneeResponseSchema,
} from '../../schemas/seasonPlanSchemas';

export interface CreateTaskRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  plotId?: string;
}

export interface UpdateTaskRequest {
  version: number; // Bắt buộc truyền version
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  plotId?: string;
  progressPercent?: number;
}

const mapToTask = (data: any): Task => ({
  ...data,
  description: data.description || '',
});

/** Chuẩn hóa một phần tử phụ thuộc thành ID string */
function extractIdFromItem(item: unknown): string | null {
  if (typeof item === 'string' && item) return item;
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>;
    const v =
      (typeof o.dependsOnTaskId === 'string' && o.dependsOnTaskId) ||
      (typeof o.dependencyTaskId === 'string' && o.dependencyTaskId) ||
      (typeof o.taskId === 'string' && o.taskId) ||
      (typeof o.id === 'string' && o.id);
    if (typeof v === 'string' && v) return v;
  }
  return null;
}

/** Chuẩn hóa danh sách ID công việc phụ thuộc (đi ra) từ GET /api/v1/tasks/{id}/dependencies.
 *  Hỗ trợ cả hai dạng response:
 *  - Mảng trực tiếp: [id, ...] hoặc [{dependsOnTaskId,...}, ...]
 *  - Envelope mới:   { task: {...}, dependsOnTasks: [...] }
 */
function parseDependencyIds(raw: unknown): string[] {
  // Envelope mới: { task, dependsOnTasks }
  if (raw && !Array.isArray(raw) && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.dependsOnTasks)) {
      return obj.dependsOnTasks
        .map(extractIdFromItem)
        .filter((id): id is string => id !== null);
    }
  }
  // Dạng cũ: mảng
  if (Array.isArray(raw)) {
    return raw
      .map(extractIdFromItem)
      .filter((id): id is string => id !== null);
  }
  return [];
}

async function fetchTaskDependencyIds(taskId: string): Promise<string[]> {
  try {
    const res = await axiosInstance.get(`/api/v1/tasks/${taskId}/dependencies`);
    return parseDependencyIds(res.data?.data);
  } catch {
    return [];
  }
}

async function deleteTaskDependencyEdge(taskId: string, dependsOnTaskId: string): Promise<string> {
  const response = await axiosInstance.delete(`/api/v1/tasks/${taskId}/dependencies/${dependsOnTaskId}`);
  const validated = deleteTaskDependencyResponseSchema.parse(response.data);
  return validated.data;
}

export const seasonPlanTaskService = {
  async getTasks(planId: string, stageId: string): Promise<Task[]> {
    const response = await axiosInstance.get(`/api/v1/plans/${planId}/stages/${stageId}/tasks`);
    const validated = getTasksResponseSchema.parse(response.data);
    return validated.data.map(mapToTask);
  },

  async getTaskById(planId: string, stageId: string, taskId: string): Promise<Task> {
    const response = await axiosInstance.get(`/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}`);
    const validated = createTaskResponseSchema.parse(response.data);
    return mapToTask(validated.data);
  },

  async createTask(planId: string, stageId: string, data: CreateTaskRequest): Promise<Task> {
    const response = await axiosInstance.post(`/api/v1/plans/${planId}/stages/${stageId}/tasks`, data);
    const validated = createTaskResponseSchema.parse(response.data);
    return mapToTask(validated.data);
  },

  async updateTask(planId: string, stageId: string, taskId: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await axiosInstance.patch(`/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}`, data);
    const validated = createTaskResponseSchema.parse(response.data);
    return mapToTask(validated.data);
  },

  async updateTaskTime(planId: string, stageId: string, taskId: string, data: { startDate: string; endDate: string; version: number }): Promise<Task> {
    const response = await axiosInstance.put(`/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/time`, data);
    const validated = createTaskResponseSchema.parse(response.data);
    return mapToTask(validated.data);
  },

  async deleteTask(planId: string, stageId: string, taskId: string): Promise<void> {
    // Gỡ phụ thuộc trước khi xóa task (backend thường từ chối nếu còn edges trong bảng dependency).
    const outgoing = await fetchTaskDependencyIds(taskId);
    for (const depId of outgoing) {
      try {
        await deleteTaskDependencyEdge(taskId, depId);
      } catch {
        /* endpoint có thể khác phiên bản — tiếp tục */
      }
    }

    let siblings: Task[] = [];
    try {
      siblings = await seasonPlanTaskService.getTasks(planId, stageId);
    } catch {
      siblings = [];
    }
    for (const t of siblings) {
      if (t.id === taskId) continue;
      const deps = await fetchTaskDependencyIds(t.id);
      if (!deps.includes(taskId)) continue;
      try {
        await deleteTaskDependencyEdge(t.id, taskId);
      } catch {
        /* */
      }
    }

    await axiosInstance.delete(`/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}`);
  },

  /** Thiết lập quan hệ phụ thuộc: taskId phụ thuộc vào dependsOnTaskId */
  async addTaskDependency(planId: string, stageId: string, taskId: string, dependsOnTaskId: string): Promise<TaskDependencyCreateResponse> {
    const response = await axiosInstance.post(`/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/dependencies`, {
      dependsOnTaskId
    });
    const validated = createTaskDependencyResponseSchema.parse(response.data);
    return validated.data;
  },

  /** Xóa quan hệ phụ thuộc giữa hai công việc */
  async deleteTaskDependency(taskId: string, dependsOnTaskId: string): Promise<string> {
    return deleteTaskDependencyEdge(taskId, dependsOnTaskId);
  },

  /** Lấy danh sách dependency của một Task (full objects) */
  async getTaskDependencies(taskId: string): Promise<TaskDependenciesResponse> {
    const response = await axiosInstance.get(`/api/v1/tasks/${taskId}/dependencies`);
    const validated = getTaskDependenciesResponseSchema.parse(response.data);
    return validated.data;
  },

  async getAssignedTasks(userId: string, params?: PageableParams): Promise<PagedData<Task>> {
    const response = await axiosInstance.get('/api/v1/tasks/assigned', { 
      params: { ...params, userId } 
    });
    return response.data.data;
  },

  async getTodayTasks(userId: string): Promise<Task[]> {
    const response = await axiosInstance.get('/api/v1/tasks/assigned/today', { 
      params: { userId } 
    });
    return response.data.data;
  },

  async getTasksByDate(userId: string, date: string, params?: PageableParams): Promise<PagedData<Task>> {
    const response = await axiosInstance.get('/api/v1/tasks/assigned/by-date', {
      params: { ...params, userId, date },
    });
    return response.data.data;
  },

  // ── Task Assignee ──
  async getTaskAssignees(planId: string, stageId: string, taskId: string): Promise<TaskAssignee[]> {
    const response = await axiosInstance.get(`/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/assignees`);
    const validated = getTaskAssigneesResponseSchema.parse(response.data);
    return validated.data;
  },

  async assignTask(
    planId: string,
    stageId: string,
    taskId: string,
    data: { userId: string }
  ): Promise<TaskAssigneeWithTask> {
    const response = await axiosInstance.post(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/assignees`,
      data
    );
    const validated = createTaskAssigneeResponseSchema.parse(response.data);
    return validated.data;
  },

  async unassignTask(
    planId: string,
    stageId: string,
    taskId: string,
    assigneeId: string,
    data?: { removalReason?: string }
  ): Promise<TaskAssignee> {
    const response = await axiosInstance.delete(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/assignees/${assigneeId}`,
      { data }
    );
    const validated = removeTaskAssigneeResponseSchema.parse(response.data);
    return validated.data;
  },
};

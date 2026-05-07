import { axiosInstance } from '../../config/axios';
import {
  WorkLog,
  WorkLogDetail,
  WorkLogSummary
} from '../../types/workLog/workLog';

/**
 * Helper: lấy .data từ API response, không dùng Zod parse
 * để tránh crash âm thầm khi backend thay đổi schema nhỏ.
 */
function unwrapData<T>(response: any): T {
  const body = response.data;
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data as T;
  }
  return body as T;
}

export const workLogService = {
  async getTaskWorkLogs(taskId: string): Promise<WorkLog[]> {
    const response = await axiosInstance.get(`/api/v1/tasks/${taskId}/worklogs`);
    return unwrapData<WorkLog[]>(response);
  },

  async getFarmWorkLogs(from?: string, to?: string): Promise<WorkLog[]> {
    const response = await axiosInstance.get('/api/v1/worklogs', {
      params: { from, to }
    });
    return unwrapData<WorkLog[]>(response);
  },

  async getWorkLogSummary(from: string, to: string): Promise<WorkLogSummary[]> {
    const response = await axiosInstance.get('/api/v1/worklogs/summary', {
      params: { from, to }
    });
    return unwrapData<WorkLogSummary[]>(response);
  },

  async getEmployeeWorkLogs(employeeId: string, from?: string, to?: string): Promise<WorkLog[]> {
    const response = await axiosInstance.get(`/api/v1/worklogs/employee/${employeeId}`, {
      params: { from, to }
    });
    return unwrapData<WorkLog[]>(response);
  },

  async getWorkLogDetail(taskId: string, workLogId: string): Promise<WorkLogDetail> {
    const response = await axiosInstance.get(`/api/v1/tasks/${taskId}/worklogs/${workLogId}`);
    return unwrapData<WorkLogDetail>(response);
  },

  // Lấy chi tiết worklog không cần taskId (dùng khi taskId null)
  async getWorkLogDetailById(workLogId: string): Promise<WorkLogDetail> {
    const response = await axiosInstance.get(`/api/v1/worklogs/${workLogId}`);
    return unwrapData<WorkLogDetail>(response);
  },

  async deleteWorkLog(taskId: string, workLogId: string): Promise<void> {
    await axiosInstance.delete(`/api/v1/tasks/${taskId}/worklogs/${workLogId}`);
  }
};

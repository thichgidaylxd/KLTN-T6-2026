import { axiosInstance } from '../../config/axios';
import { 
  WorkLog, 
  WorkLogDetail, 
  WorkLogSummary
} from '../../types/workLog/workLog';
import {
  getWorkLogsResponseSchema,
  getWorkLogDetailResponseSchema,
  getWorkLogSummaryResponseSchema
} from '../../schemas/workLogSchemas';

export const workLogService = {
  async getTaskWorkLogs(taskId: string): Promise<WorkLog[]> {
    const response = await axiosInstance.get(`/api/v1/tasks/${taskId}/worklogs`);
    return getWorkLogsResponseSchema.parse(response.data).data;
  },


  async getFarmWorkLogs(from?: string, to?: string): Promise<WorkLog[]> {
    const response = await axiosInstance.get('/api/v1/worklogs', {
      params: { from, to }
    });
    return getWorkLogsResponseSchema.parse(response.data).data;
  },

  async getWorkLogSummary(from: string, to: string): Promise<WorkLogSummary[]> {
    const response = await axiosInstance.get('/api/v1/worklogs/summary', {
      params: { from, to }
    });
    return getWorkLogSummaryResponseSchema.parse(response.data).data;
  },

  async getEmployeeWorkLogs(employeeId: string, from?: string, to?: string): Promise<WorkLog[]> {
    const response = await axiosInstance.get(`/api/v1/worklogs/employee/${employeeId}`, {
      params: { from, to }
    });
    return getWorkLogsResponseSchema.parse(response.data).data;
  },

  async getWorkLogDetail(taskId: string, workLogId: string): Promise<WorkLogDetail> {
    const response = await axiosInstance.get(`/api/v1/tasks/${taskId}/worklogs/${workLogId}`);
    return getWorkLogDetailResponseSchema.parse(response.data).data;
  },

  async deleteWorkLog(taskId: string, workLogId: string): Promise<void> {
    await axiosInstance.delete(`/api/v1/tasks/${taskId}/worklogs/${workLogId}`);
  }
};

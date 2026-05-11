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

/**
 * Convert date sang format yyyy/MM/dd
 *
 * Hỗ trợ:
 * - dd/MM/yyyy
 * - yyyy-MM-dd
 * - yyyy/MM/dd
 * - ISO string
 */
function formatApiDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;

  // yyyy-MM-dd -> giữ nguyên
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // dd/MM/yyyy -> convert sang yyyy-MM-dd
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [dd, mm, yyyy] = dateStr.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }

  // ISO string
  const isoPart = dateStr.split('T')[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(isoPart)) {
    return isoPart;
  }

  return dateStr;
}
export const workLogService = {
  async getTaskWorkLogs(
    planId: string,
    stageId: string,
    taskId: string
  ): Promise<WorkLog[]> {
    const response = await axiosInstance.get(
      `/api/v1/plans/${planId}/stages/${stageId}/tasks/${taskId}/worklogs`
    );

    return unwrapData<WorkLog[]>(response);
  },

  async getFarmWorkLogs(
    from?: string,
    to?: string
  ): Promise<WorkLog[]> {
    const response = await axiosInstance.get('/api/v1/worklogs', {
      params: {
        from: formatApiDate(from),
        to: formatApiDate(to)
      }
    });

    return unwrapData<WorkLog[]>(response);
  },

  async getPlanWorkLogs(
    planId: string,
    from?: string,
    to?: string
  ): Promise<WorkLog[]> {
    const response = await axiosInstance.get(
      `/api/v1/plans/${planId}/worklogs`,
      {
        params: {
          from: formatApiDate(from),
          to: formatApiDate(to)
        }
      }
    );

    return unwrapData<WorkLog[]>(response);
  },

  async getWorkLogSummary(
    from: string,
    to: string
  ): Promise<WorkLogSummary[]> {
    const response = await axiosInstance.get(
      '/api/v1/worklogs/summary',
      {
        params: {
          from: formatApiDate(from),
          to: formatApiDate(to)
        }
      }
    );

    return unwrapData<WorkLogSummary[]>(response);
  },

  async getEmployeeWorkLogs(
    employeeId: string,
    from?: string,
    to?: string
  ): Promise<WorkLog[]> {
    const response = await axiosInstance.get(
      `/api/v1/worklogs/employee/${employeeId}`,
      {
        params: {
          from: formatApiDate(from),
          to: formatApiDate(to)
        }
      }
    );

    return unwrapData<WorkLog[]>(response);
  },

  async getWorkLogDetail(
    workLogId: string
  ): Promise<WorkLogDetail> {
    const response = await axiosInstance.get(
      `/api/v1/worklogs/${workLogId}`
    );

    return unwrapData<WorkLogDetail>(response);
  },

  async lockWorkLog(
    workLogId: string
  ): Promise<WorkLogDetail> {
    const response = await axiosInstance.patch(
      `/api/v1/worklogs/${workLogId}/lock`
    );

    return unwrapData<WorkLogDetail>(response);
  },

  async unlockWorkLog(
    workLogId: string
  ): Promise<WorkLogDetail> {
    const response = await axiosInstance.patch(
      `/api/v1/worklogs/${workLogId}/unlock`
    );

    return unwrapData<WorkLogDetail>(response);
  },

  // Legacy support for detail by taskId (deprecated)
  async getWorkLogDetailLegacy(
    _taskId: string,
    workLogId: string
  ): Promise<WorkLogDetail> {
    return this.getWorkLogDetail(workLogId);
  }
};
import { axiosInstance } from '../../config/axios';
import { PagedData, PageableParams } from '../../types/common';
import { WorkSession } from '../../types/workLog/session';

/**
 * Unwrap the standard { success, code, message, data, timestamp } envelope
 * and return just the `data` field.
 */
interface ApiEnvelope<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

function unwrapData<T>(response: { data: ApiEnvelope<T> }): T {
  const body = response.data;
  if (!body || typeof body !== 'object' || !('success' in body) || !('data' in body)) {
    throw new Error('Session API response is not in expected envelope format');
  }
  if (!body.success) {
    throw new Error(body.message || 'Session API returned unsuccessful response');
  }
  return body.data;
}

function buildPageableParams(params: PageableParams) {
  const { page = 0, size = 10, sort = ['checkedInAt,DESC'] } = params;
  const result: Record<string, any> = { page, size };
  
  if (sort && sort.length > 0) {
    // Nếu chỉ có 1 tham số sort, gửi dưới dạng chuỗi đơn để tránh Axios thêm dấu []
    // Đồng thời đảm bảo hướng sắp xếp là viết hoa
    result['sort'] = sort.map(s => {
      const [field, dir] = s.split(',');
      return `${field},${dir.toUpperCase()}`;
    });
    
    if (result['sort'].length === 1) {
      result['sort'] = result['sort'][0];
    }
  }
  
  return result;
}

export const sessionService = {
  /**
   * GET /api/v1/sessions/open
   * Xem tất cả session đang mở trong farm (dành cho cấp trên)
   */
  async getOpenSessions(pageable: PageableParams): Promise<PagedData<WorkSession>> {
    const response = await axiosInstance.get('/api/v1/sessions/open', {
      params: buildPageableParams(pageable),
    });
    return unwrapData<PagedData<WorkSession>>(response);
  },

  /**
   * PATCH /api/v1/sessions/{id}/force-close
   * Đóng phiên làm việc cưỡng chế (Quản lý)
   */
  async forceCloseSession(id: string, reason: string): Promise<void> {
    const response = await axiosInstance.patch(`/api/v1/sessions/${id}/force-close`, {
      reason
    });
    return unwrapData<void>(response);
  },
};

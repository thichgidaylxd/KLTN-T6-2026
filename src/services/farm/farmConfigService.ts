import { axiosInstance } from '@/config/axios';
import { ApiResponse } from '@/types/auth';
import type {
  FarmConfig,
  UpdateFarmConfigRequest,
  WorkShift,
  CreateWorkShiftRequest,
  WageConfig,
  CreateWageConfigRequest,
} from '@/types/farmConfig';

// Helper: đính kèm X-Farm-Token vào mỗi request cần farm context
// axiosInstance hiện chỉ gắn accessToken; farm token phải gắn thủ công.
const farmHeaders = () => {
  const farmToken = sessionStorage.getItem('accessToken'); // farm token được lưu vào accessToken sau khi selectFarm
  // Nếu project lưu farm token riêng, đổi key cho phù hợp:
  // const farmToken = sessionStorage.getItem('farmToken');
  return farmToken ? { 'X-Farm-Token': farmToken } : {};
};

// ─── Farm Config ─────────────────────────────────────────────────────────────

export const farmConfigService = {
  getConfig(farmId: string): Promise<ApiResponse<FarmConfig>> {
    return axiosInstance
      .get<ApiResponse<FarmConfig>>(`/api/v1/farms/${farmId}/config`, { headers: farmHeaders() })
      .then((r) => r.data);
  },

  updateConfig(farmId: string, data: UpdateFarmConfigRequest): Promise<ApiResponse<FarmConfig>> {
    return axiosInstance
      .patch<ApiResponse<FarmConfig>>(`/api/v1/farms/${farmId}/config`, data, { headers: farmHeaders() })
      .then((r) => r.data);
  },
};

// ─── Work Shift ───────────────────────────────────────────────────────────────

export const workShiftService = {
  getAll(farmId: string): Promise<ApiResponse<WorkShift[]>> {
    return axiosInstance
      .get<ApiResponse<WorkShift[]>>(`/api/v1/farms/${farmId}/work-shifts`, { headers: farmHeaders() })
      .then((r) => r.data);
  },

  create(farmId: string, data: CreateWorkShiftRequest): Promise<ApiResponse<WorkShift>> {
    return axiosInstance
      .post<ApiResponse<WorkShift>>(`/api/v1/farms/${farmId}/work-shifts`, data, { headers: farmHeaders() })
      .then((r) => r.data);
  },

  delete(farmId: string, shiftId: string): Promise<ApiResponse<void>> {
    return axiosInstance
      .delete<ApiResponse<void>>(`/api/v1/farms/${farmId}/work-shifts/${shiftId}`, { headers: farmHeaders() })
      .then((r) => r.data);
  },
};

// ─── Wage Config ──────────────────────────────────────────────────────────────

export const wageConfigService = {
  getAll(farmId: string): Promise<ApiResponse<WageConfig[]>> {
    return axiosInstance
      .get<ApiResponse<WageConfig[]>>(`/api/v1/farms/${farmId}/wage-configs`, { headers: farmHeaders() })
      .then((r) => r.data);
  },

  create(farmId: string, data: CreateWageConfigRequest): Promise<ApiResponse<WageConfig>> {
    return axiosInstance
      .post<ApiResponse<WageConfig>>(`/api/v1/farms/${farmId}/wage-configs`, data, { headers: farmHeaders() })
      .then((r) => r.data);
  },

  delete(farmId: string, wageId: string): Promise<ApiResponse<void>> {
    return axiosInstance
      .delete<ApiResponse<void>>(`/api/v1/farms/${farmId}/wage-configs/${wageId}`, { headers: farmHeaders() })
      .then((r) => r.data);
  },
};
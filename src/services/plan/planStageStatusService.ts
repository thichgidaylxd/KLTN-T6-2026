import { axiosInstance } from '../../config/axios';
import {
  getPlanStageStatusHistoriesResponseSchema,
  getPlanStageStatusesResponseSchema,
  getPlanStageStatusTransitionsResponseSchema,
  updatePlanStageStatusResponseSchema,
} from '../../schemas/planStageStatusSchemas';
import { StatusObject } from '../../types/seasonPlan';

export interface PlanStageStatusChange {
  fromStatus: StatusObject;
  toStatus: StatusObject;
  changedBy: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    status: string;
    isLocked: boolean;
    createdAt: string;
  };
  changedAt: string;
}

export interface PlanStageStatusTransition {
  id: string;
  fromStatus: StatusObject;
  toStatus: StatusObject;
  farmRole: {
    id: string;
    name: string;
    description: string;
  };
  createdAt: string;
}

export const planStageStatusService = {
  /**
   * Cập nhật trạng thái của giai đoạn kế hoạch
   * PUT /api/v1/plans/{planId}/stages/{stageId}/status/{statusId}
   */
  async updateStageStatus(planId: string, stageId: string, statusId: string): Promise<PlanStageStatusChange> {
    const response = await axiosInstance.put(
      `/api/v1/plans/${planId}/stages/${stageId}/status/${statusId}`
    );
    return updatePlanStageStatusResponseSchema.parse(response.data).data;
  },

  /**
   * Lấy lịch sử thay đổi trạng thái của giai đoạn
   * GET /api/v1/plans/{planId}/stages/{stageId}/status-histories
   */
  async getStageStatusHistories(planId: string, stageId: string): Promise<PlanStageStatusChange[]> {
    const response = await axiosInstance.get(
      `/api/v1/plans/${planId}/stages/${stageId}/status-histories`
    );
    return getPlanStageStatusHistoriesResponseSchema.parse(response.data).data;
  },

  /**
   * Lấy tất cả các trạng thái có thể của giai đoạn
   * GET /api/v1/plan-stage-statuses
   */
  async getPlanStageStatuses(): Promise<StatusObject[]> {
    const response = await axiosInstance.get('/api/v1/plan-stage-statuses');
    return getPlanStageStatusesResponseSchema.parse(response.data).data;
  },

  /**
   * Lấy các quy tắc chuyển đổi trạng thái
   * GET /api/v1/plan-stage-status-transitions
   */
  async getPlanStageStatusTransitions(): Promise<PlanStageStatusTransition[]> {
    const response = await axiosInstance.get('/api/v1/plan-stage-status-transitions');
    return getPlanStageStatusTransitionsResponseSchema.parse(response.data).data;
  },
  
  /**
   * Lấy các trạng thái kế tiếp khả dụng cho giai đoạn hiện tại
   * GET /api/v1/plans/{planId}/stages/{stageId}/available-statuses
   */
  async getAvailableStatuses(planId: string, stageId: string): Promise<StatusObject[]> {
    const response = await axiosInstance.get(
      `/api/v1/plans/${planId}/stages/${stageId}/available-statuses`
    );
    return getPlanStageStatusesResponseSchema.parse(response.data).data;
  },
};

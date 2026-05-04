import { axiosInstance } from '../../config/axios';
import { Phase } from '../../types/seasonPlan';
import {
  getStagesResponseSchema,
  createStageResponseSchema,
} from '../../schemas/seasonPlanSchemas';

const mapToPhase = (data: any): Phase => ({
  ...data,
  duration: 0, // default if missing
  tasks: [], // default
  source: data.source || 'MANUAL',
});

export const seasonPlanPhaseService = {
  async getStages(planId: string): Promise<Phase[]> {
    const response = await axiosInstance.get(`/api/v1/plans/${planId}/stages`);
    const validated = getStagesResponseSchema.parse(response.data);
    return validated.data.map(mapToPhase);
  },

  async createStage(planId: string, data: { name: string; startDate: string; endDate: string }): Promise<Phase> {
    const response = await axiosInstance.post(`/api/v1/plans/${planId}/stages`, data);
    const validated = createStageResponseSchema.parse(response.data);
    return mapToPhase(validated.data);
  },

  async updateStage(
    planId: string,
    stageId: string,
    data: { name: string; startDate: string; endDate: string; version?: number }
  ): Promise<Phase> {
    const response = await axiosInstance.patch(`/api/v1/plans/${planId}/stages/${stageId}`, data);
    const validated = createStageResponseSchema.parse(response.data);
    return mapToPhase(validated.data);
  },

  async updateStageTime(planId: string, stageId: string, data: { startDate: string; endDate: string; version?: number }): Promise<Phase> {
    const response = await axiosInstance.put(`/api/v1/plans/${planId}/stages/${stageId}/time`, data);
    const validated = createStageResponseSchema.parse(response.data);
    return mapToPhase(validated.data);
  },

  async deleteStage(planId: string, stageId: string): Promise<void> {
    await axiosInstance.delete(`/api/v1/plans/${planId}/stages/${stageId}`);
  },
};

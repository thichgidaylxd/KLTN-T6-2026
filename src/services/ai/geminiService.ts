// src/services/ai/geminiService.ts
import { axiosInstance } from '@/config/axios';
import { ApiResponse } from '@/types/auth';
import { TaskSuggestion } from '@/types/ai';

const farmHeaders = () => {
  const farmToken = sessionStorage.getItem('accessToken');
  return farmToken ? { 'X-Farm-Token': farmToken } : {};
};

export const geminiService = {
  // ── Generic (cropType + stage string) ─────────────────────────────────────
  suggestTasks(cropType: string, stage: string): Promise<ApiResponse<TaskSuggestion[]>> {
    return axiosInstance
      .get('/api/v1/ai/suggest-tasks', {
        params: { cropType, stage },
        headers: farmHeaders(),
      })
      .then(res => res.data);
  },

  // ── Context-aware: dùng planId + planStageId thực tế từ DB ───────────────
  suggestTasksByStage(
    planId: string,
    planStageId: string,
  ): Promise<ApiResponse<TaskSuggestion[]>> {
    return axiosInstance
      .get(`/api/v1/ai/plans/${planId}/stages/${planStageId}/suggest-tasks`, {
        headers: farmHeaders(),
      })
      .then(res => res.data);
  },

  chatWithAi(message: string, cropType: string, stage: string) {
    return axiosInstance
      .post(
        '/api/v1/ai/chat',
        { message, cropType, stage },
        { headers: farmHeaders() },
      )
      .then(res => res.data);
  },
};
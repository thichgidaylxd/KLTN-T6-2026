// src/hooks/ai/useTaskSuggestionsByStage.ts
import { useState, useCallback } from 'react';
import { geminiService } from '@/services/ai/geminiService';
import { TaskSuggestion } from '@/types/ai';

interface State {
  data: TaskSuggestion[] | null;
  loading: boolean;
  error: string | null;
}

/**
 * Lazy hook — không tự gọi API.
 * Chỉ fetch khi gọi `fetch()`.
 * Dùng cho nút "Xem gợi ý" để tránh gọi AI khi render.
 */
export function useTaskSuggestionsByStage(planId: string, planStageId: string) {
  const [state, setState] = useState<State>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (!planId || !planStageId) return;
    setState({ data: null, loading: true, error: null });
    try {
      const res = await geminiService.suggestTasksByStage(planId, planStageId);
      setState({ data: res.data ?? [], loading: false, error: null });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.message ??
        'Không thể lấy gợi ý từ AI';
      setState({ data: null, loading: false, error: msg });
    }
  }, [planId, planStageId]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, fetch, reset };
}
import { useQuery } from '@tanstack/react-query';
import { geminiService } from '@/services/ai/geminiService';

export const geminiKeys = {
  suggestions: (cropType: string, stage: string) =>
    ['gemini-suggestions', cropType, stage] as const,
};

export function useTaskSuggestions(cropType: string, stage: string) {
  return useQuery({
    queryKey: geminiKeys.suggestions(cropType, stage),
    queryFn: () => geminiService.suggestTasks(cropType, stage),
    select: (res) => res.data,
    enabled: !!cropType && !!stage,
  });
}


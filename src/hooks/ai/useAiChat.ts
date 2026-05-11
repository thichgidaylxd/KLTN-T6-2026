import { useMutation } from '@tanstack/react-query';
import { geminiService } from '@/services/ai/geminiService';

export function useAiChat() {
  return useMutation({
    mutationFn: (data: {
      message: string;
      cropType: string;
      stage: string;
    }) => geminiService.chatWithAi(
      data.message,
      data.cropType,
      data.stage
    ),
  });
}
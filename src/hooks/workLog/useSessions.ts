import { useQuery } from '@tanstack/react-query';
import { sessionService } from '../../services/workLog/sessionService';
import { PageableParams } from '../../types/common';

export const SESSION_KEYS = {
  all: ['sessions'] as const,
  open: (params: PageableParams) => ['sessions', 'open', params] as const,
};

export const useOpenSessions = (params: PageableParams, enabled = true) => {
  return useQuery({
    queryKey: SESSION_KEYS.open(params),
    queryFn: () => sessionService.getOpenSessions(params),
    enabled: enabled,
    staleTime: 5000,
    retry: false,
    refetchOnMount: true,
  });
};

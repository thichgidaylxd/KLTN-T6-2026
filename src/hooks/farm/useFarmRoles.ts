import { useQuery } from '@tanstack/react-query';
import { farmInvitationService } from '@/services/farm/farmInvitationService';

const FARM_ROLE_KEY = ['farmRoles'] as const;

export function useFarmRoles() {
  const rolesQuery = useQuery({
    queryKey: FARM_ROLE_KEY,
    queryFn: () => farmInvitationService.getFarmRoles(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    roles: rolesQuery.data ?? [],
    loading: rolesQuery.isLoading,
    error: rolesQuery.error,
  };
}
